import { getCollections } from "./_lib/db.js";
import { ok } from "./_lib/response.js";

const YEAR_START = new Date("2026-01-01T00:00:00Z");
const YEAR_END = new Date("2026-12-31T00:00:00Z");

function dayOfYear(d) {
  const diff = d - YEAR_START;
  return Math.floor(diff / 86400000) + 1;
}

function todayKey() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

export const handler = async () => {
  const { users, completions } = await getCollections();

  // Per-user count of days where all 4 sections are complete.
  const perUserDays = await completions.aggregate([
    {
      $group: {
        _id: { userId: "$userId", dateKey: "$dateKey" },
        sections: { $addToSet: "$section" },
      },
    },
    { $match: { "sections.3": { $exists: true } } },
    {
      $group: {
        _id: "$_id.userId",
        daysComplete: { $sum: 1 },
      },
    },
  ]).toArray();

  const daysByUser = new Map(perUserDays.map((u) => [u._id.toString(), u.daysComplete]));

  // Users who completed all 4 sections of TODAY.
  const dateKey = todayKey();
  const caughtUpToday = await completions.aggregate([
    { $match: { dateKey } },
    { $group: { _id: "$userId", sections: { $addToSet: "$section" } } },
    { $match: { "sections.3": { $exists: true } } },
    { $count: "n" },
  ]).toArray();
  const usersCaughtUp = caughtUpToday[0]?.n || 0;

  const totalUsers = await users.countDocuments();
  const allUsers = await users
    .find({}, { projection: { displayName: 1, email: 1 } })
    .toArray();

  const today = new Date();
  const clampedToday = today < YEAR_START ? YEAR_START : today > YEAR_END ? YEAR_END : today;
  const todayDOY = dayOfYear(clampedToday);

  const communityProgress = totalUsers > 0 ? usersCaughtUp / totalUsers : 0;

  const leaderboard = allUsers
    .map((u) => ({
      userId: u._id.toString(),
      displayName: u.displayName || u.email.split("@")[0],
      daysComplete: daysByUser.get(u._id.toString()) || 0,
    }))
    .sort((a, b) => b.daysComplete - a.daysComplete)
    .slice(0, 20);

  return ok({
    totalUsers,
    todayDOY,
    totalDaysInYear: 365,
    yearProgress: todayDOY / 365,
    communityProgress,
    usersCaughtUp,
    leaderboard,
  });
};
