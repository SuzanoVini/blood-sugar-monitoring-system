import React, { useEffect, useState } from "react";
import analyzePatterns, {
  type Suggestion,
  type AnalyzeResult,
} from "../utils/aiAlgorithm";
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

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const readings = await api.getReadings();
      const aiResult: AnalyzeResult = analyzePatterns(readings, {
        minOccurrences: 3,
        minPercent: 0.4,
      });
      setSuggestions(
        aiResult.suggestions.map((s: Suggestion) => ({
          trigger: s.trigger,
          message: s.message,
          percent: s.percent,
        }))
      );
    } catch (err: any) {
      console.error(err);
      setSuggestions([]);
      setError("We couldn't analyze your data right now.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [refreshSignal]);

  return (
    <section className="card ai-card" aria-busy={loading}>
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
        <button className="btn ghost" onClick={load} title="Refresh">
          Refresh
        </button>
      </div>

      <div className="card-bd">
        {/* keep your loading/empty/list markup here unchanged */}
        ...
      </div>
    </section>
  );
};

export default AISuggestions;
