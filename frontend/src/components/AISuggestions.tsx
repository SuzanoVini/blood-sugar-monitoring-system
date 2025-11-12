import React, { useEffect, useState } from "react";
import analyzePatterns from "../utils/aiAlgorithm";
import type { Suggestion } from "../utils/aiAlgorithm";
import type { AnalyzeResult } from "../utils/aiAlgorithm";
import api from "../services/apiService";

interface AISuggestionsProps {
  refreshSignal: any;
}

interface AISuggestion {
  trigger: string;
  message: string;
  percent: number;
}

const AISuggestions: React.FC<AISuggestionsProps> = ({ refreshSignal }) => {
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const load = async () => {
    setLoading(true);
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
    } catch (err) {
      console.error(err);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [refreshSignal]);

  return (
    <div className="card">
      <h4>AI Suggestions</h4>
      {loading ? (
        <div>Analyzing...</div>
      ) : suggestions.length === 0 ? (
        <div>No suggestions yet.</div>
      ) : (
        <ul>
          {suggestions.map((s, i) => (
            <li key={i}>
              <strong>{s.trigger}</strong>: {s.message} —{" "}
              <small>({s.percent}% of abnormal readings)</small>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AISuggestions;
