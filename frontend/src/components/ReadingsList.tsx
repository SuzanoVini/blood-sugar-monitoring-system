import React, { useEffect, useState } from "react";
import api from "../services/apiService";

interface Reading {
  reading_id: string | number;
  datetime: string;
  value: number;
  unit?: string;
  category?: string;
  food_notes?: string;
  activity_notes?: string;
  notes?: string;
  symptoms?: string;
}

interface ReadingsListProps {
  refreshSignal: any; // Can be narrowed to number/string/boolean if known
}

/**
 * ReadingsList - displays readings, allow update/delete.
 * Props:
 *  - refreshSignal: any value change indicates reload
 */
const ReadingsList: React.FC<ReadingsListProps> = ({ refreshSignal }) => {
  const [readings, setReadings] = useState<Reading[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const load = async () => {
    setLoading(true);
    try {
      const res: Reading[] = await api.getReadings();
      setReadings(res);
    } catch (err) {
      console.error("Failed to load readings", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [refreshSignal]);

  const handleDelete = async (id: string | number) => {
    if (!window.confirm("Delete this reading?")) return;
    try {
      await api.deleteReading(id);
      setReadings((r) => r.filter((x) => x.reading_id !== id));
    } catch (err) {
      console.error(err);
      alert("Delete failed.");
    }
  };

  if (loading) return <div className="card">Loading readings...</div>;

  return (
    <div className="card">
      <h4>Readings</h4>
      <table className="table">
        <thead>
          <tr>
            <th>DateTime</th>
            <th>Value</th>
            <th>Category</th>
            <th>Food</th>
            <th>Activity</th>
            <th>Notes</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {readings.length === 0 && (
            <tr>
              <td colSpan={7}>No readings yet.</td>
            </tr>
          )}
          {readings.map((r) => (
            <tr key={r.reading_id}>
              <td>{new Date(r.datetime).toLocaleString()}</td>
              <td>
                {r.value} {r.unit || "mg/dl"}
              </td>
              <td>{r.category}</td>
              <td>{r.food_notes}</td>
              <td>{r.activity_notes}</td>
              <td>{r.notes || r.symptoms}</td>
              <td>
                <button
                  className="btn"
                  onClick={() => handleDelete(r.reading_id)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ReadingsList;
