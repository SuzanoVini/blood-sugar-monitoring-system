import React, { useEffect, useState } from "react";
import api from "../services/apiService";

interface AISuggestionsProps {
  refreshSignal: any;
}

interface AISuggestion {
  trigger: string;
  message: string;
  percent: number; // 0–100 expected
}

const Bar: React.FC<{ value: number }> = ({ value }) => {
  const pct = Math.max(0, Math.min(100, value));
  const hue = 140 - Math.round((pct / 100) * 140); // green->red
  return (
    <div className="ai-bar" aria-label={`confidence ${pct}%`}>
      <div
        className="ai-bar-fill"
        style={{
          width: `${pct}%`,
          background: `linear-gradient(90deg, hsl(${hue} 80% 45%), hsl(${Math.max(
            hue - 20,
            0
          )} 90% 50%))`,
        }}
      />
    </div>
  );
};

const AISuggestions: React.FC<AISuggestionsProps> = ({ refreshSignal }) => {
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateStatus, setGenerateStatus] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const suggestionsFromApi = await api.getPatientSuggestions();
      setSuggestions(
        suggestionsFromApi.map((s: any) => {
          const match = s.based_on_pattern.match(/\((\d+)\/(\d+)\s+times\)/);
          const percent = match ? (parseInt(match[1], 10) / parseInt(match[2], 10)) * 100 : 0;
          return {
            trigger: s.based_on_pattern,
            message: s.content,
            percent: percent,
          };
        })
      );
    } catch (err: any) {
      console.error(err);
      setSuggestions([]);
      setError("We couldn't load your suggestions right now.");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setGenerateStatus("Generating new suggestions...");
    try {
      const result = await api.generatePatientSuggestions();
      setGenerateStatus(result.message);
      await load(); // Refresh the suggestions list
    } catch (err: any) {
      setGenerateStatus(err.message || "Failed to generate suggestions.");
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    load();
  }, [refreshSignal]);
  
  return (
    <section className="card ai-card" aria-busy={loading || isGenerating}>
      <div className="card-hd">
        <div className="ai-header-left">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden
          >
            <path
              d="M12 3l1.8 4.4L18 9l-4.2 1.6L12 15l-1.8-4.4L6 9l4.2-1.6L12 3z"
              stroke="currentColor"
              strokeWidth="1.6"
            />
          </svg>
          <h4>AI Suggestions</h4>
        </div>
        <div>
          <button className="btn ghost" onClick={handleGenerate} disabled={isGenerating}>
            {isGenerating ? "Generating..." : "Generate"}
          </button>
          <button className="btn ghost" onClick={load} title="Refresh" disabled={loading}>
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      <div className="card-bd">
        {generateStatus && <p>{generateStatus}</p>}
        {loading && <p>Loading suggestions...</p>}
        {error && <p className="text-error">{error}</p>}
        {!loading && !error && suggestions.length === 0 && (
          <p>No suggestions available at this time. Click 'Generate' to create new suggestions based on your readings.</p>
        )}
        {!loading && !error && suggestions.length > 0 && (
          <ul>
            {suggestions.map((s) => (
              <li key={s.trigger}>
                <div className="ai-suggestion-content">
                  <p>{s.message}</p>
                  <small>{s.trigger}</small>
                </div>
                <Bar value={s.percent} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
};

export default AISuggestions;
