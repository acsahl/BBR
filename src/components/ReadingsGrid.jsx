import ReadingCard from "./ReadingCard.jsx";
import "./ReadingsGrid.css";

const SECTION_ORDER = ["psalms", "pentateuch", "chronicles", "gospels"];

const ACCENTS = {
  psalms: { bg: "#2563ff", fg: "#ffffff", icon: "♪" },
  pentateuch: { bg: "#0a0e1a", fg: "#ffffff", icon: "✦" },
  chronicles: { bg: "#e0e9ff", fg: "#0a0e1a", icon: "◆" },
  gospels: { bg: "#ffffff", fg: "#0a0e1a", icon: "✝" },
};

function fmtKey(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function ReadingsGrid({ plan, date, isComplete, onToggle }) {
  const key = fmtKey(date);
  const day = plan?.readings?.[key];
  const labels = plan?._meta?.sectionLabels || {};

  if (!day) {
    return (
      <div className="grid-empty">
        <p>No readings for {key}. The plan covers 2026.</p>
      </div>
    );
  }

  return (
    <div className="readings-grid">
      {SECTION_ORDER.map((sec) => (
        <ReadingCard
          key={sec}
          section={sec}
          label={labels[sec]}
          passage={day[sec]}
          accent={ACCENTS[sec]}
          complete={isComplete(key, sec)}
          onToggle={() => onToggle(key, sec)}
        />
      ))}
    </div>
  );
}
