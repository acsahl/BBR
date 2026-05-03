import { useEffect, useState } from "react";
import UserInsightsModal from "./UserInsightsModal.jsx";
import "./Leaderboard.css";

export default function Leaderboard({ refreshKey }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [openUserId, setOpenUserId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/leaderboard")
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((d) => { if (!cancelled) setData(d); })
      .catch((e) => { if (!cancelled) setError(String(e)); });
    return () => { cancelled = true; };
  }, [refreshKey]);

  if (error) return <div className="lb-error">Couldn't load leaderboard.</div>;
  if (!data) return <div className="lb-loading">Loading leaderboard…</div>;

  const yearPct = Math.round(data.yearProgress * 100);
  const commPct = Math.round(data.communityProgress * 100);

  return (
    <>
      <section className="lb">
        <div className="lb-header">
          <h2>Community</h2>
          <span className="lb-meta">{data.totalUsers} reader{data.totalUsers === 1 ? "" : "s"}</span>
        </div>

        <div className="lb-bars">
          <ProgressBar
            label="Year progress"
            sub={`Day ${data.todayDOY} of ${data.totalDaysInYear}`}
            pct={yearPct}
            color="var(--ink)"
          />
          <ProgressBar
            label="Caught up to today"
            sub={`${data.usersCaughtUp} of ${data.totalUsers} readers completed today's reading`}
            pct={commPct}
            color="var(--accent)"
          />
        </div>

        {data.leaderboard.length > 0 && (
          <div className="lb-list">
            <h3>Top readers</h3>
            <ol>
              {data.leaderboard.map((u, i) => (
                <li
                  key={u.userId}
                  className="lb-row is-clickable"
                  onClick={() => setOpenUserId(u.userId)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setOpenUserId(u.userId);
                    }
                  }}
                >
                  <span className="lb-rank">{i + 1}</span>
                  <span className="lb-name">{u.displayName}</span>
                  <span className="lb-days">{u.daysComplete} days ›</span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </section>

      <UserInsightsModal userId={openUserId} onClose={() => setOpenUserId(null)} />
    </>
  );
}

function ProgressBar({ label, sub, pct, color }) {
  return (
    <div className="bar">
      <div className="bar-top">
        <span className="bar-label">{label}</span>
        <span className="bar-pct">{pct}%</span>
      </div>
      <div className="bar-track">
        <div className="bar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <div className="bar-sub">{sub}</div>
    </div>
  );
}
