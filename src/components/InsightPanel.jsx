import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext.jsx";
import "./InsightPanel.css";

function fmtKey(d) {
  return d.toISOString().slice(0, 10);
}

function fmtTime(iso) {
  const d = new Date(iso);
  return d.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export default function InsightPanel({ date, onPromptSignup }) {
  const { user, token } = useAuth();
  const [content, setContent] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load current user's recent insights
  useEffect(() => {
    if (!user) {
      setInsights([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetch(`/api/insights-list?userId=${user._id}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((d) => { if (!cancelled) setInsights(d.insights); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [user]);

  async function submit(e) {
    e.preventDefault();
    if (!content.trim()) return;
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/insights-create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: content.trim(), dateKey: fmtKey(date) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to post");
      setInsights((prev) => [data.insight, ...prev]);
      setContent("");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (!user) {
    return (
      <section className="insights">
        <div className="insights-header">
          <h2>Your insights</h2>
        </div>
        <div className="insights-empty">
          <p>Sign in to share what God is teaching you.</p>
          <button className="btn-primary" onClick={onPromptSignup}>Sign up</button>
        </div>
      </section>
    );
  }

  return (
    <section className="insights">
      <div className="insights-header">
        <h2>Your insights</h2>
        <span className="insights-meta">{insights.length} posted</span>
      </div>

      <form onSubmit={submit} className="insights-form">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What stood out to you in today's reading?"
          rows={3}
          maxLength={2000}
        />
        {error && <div className="form-error">{error}</div>}
        <div className="insights-actions">
          <span className="insights-hint">{content.length}/2000</span>
          <button className="btn-primary" type="submit" disabled={busy || !content.trim()}>
            {busy ? "Posting…" : "Post insight"}
          </button>
        </div>
      </form>

      {loading ? (
        <p className="insights-status">Loading…</p>
      ) : insights.length === 0 ? (
        <p className="insights-status">No insights yet — share your first one above.</p>
      ) : (
        <ul className="insights-list">
          {insights.slice(0, 5).map((i) => (
            <li key={i._id} className="insight-item">
              <div className="insight-content">{i.content}</div>
              <div className="insight-meta">
                {i.dateKey && <span>{i.dateKey}</span>}
                <span>{fmtTime(i.createdAt)}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
