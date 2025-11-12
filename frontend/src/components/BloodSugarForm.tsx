import React, { useState } from "react";
import type { FormEvent } from "react";
import api from "../services/apiService";

interface BloodSugarReading {
  value: number;
  unit: "mg/dl" | "mmol/L";
  datetime: string;
  food_notes?: string;
  activity_notes?: string;
  symptoms?: string;
}

interface BloodSugarFormProps {
  onSaved?: (reading: BloodSugarReading) => void;
  defaultValues?: Partial<BloodSugarReading>;
}

/**
 * BloodSugarForm
 * Props:
 *  - onSaved: callback(reading) after successful save
 *  - defaultValues: optional for edit
 */
const BloodSugarForm: React.FC<BloodSugarFormProps> = ({
  onSaved,
  defaultValues = {},
}) => {
  const [value, setValue] = useState<string>(
    defaultValues.value?.toString() || ""
  );
  const [unit, setUnit] = useState<"mg/dl" | "mmol/L">(
    defaultValues.unit || "mg/dl"
  );
  const [datetime, setDatetime] = useState<string>(
    defaultValues.datetime || new Date().toISOString().slice(0, 16)
  );
  const [food, setFood] = useState<string>(defaultValues.food_notes || "");
  const [activity, setActivity] = useState<string>(
    defaultValues.activity_notes || ""
  );
  const [symptoms, setSymptoms] = useState<string>(
    defaultValues.symptoms || ""
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (!value) {
      setError("Please enter a blood sugar value.");
      return;
    }
    setLoading(true);
    try {
      const payload: BloodSugarReading = {
        value: parseFloat(value),
        unit,
        datetime,
        food_notes: food,
        activity_notes: activity,
        symptoms,
      };
      const res = await api.createReading(payload);
      if (onSaved) onSaved(res);
      setValue("");
      setFood("");
      setActivity("");
      setSymptoms("");
    } catch (err) {
      console.error(err);
      setError("Failed to save reading.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="card" onSubmit={handleSubmit}>
      <h4>Enter Blood Sugar</h4>
      <div>
        <label>Value</label>
        <br />
        <input
          type="number"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          required
        />
      </div>
      <div>
        <label>Unit</label>
        <br />
        <select
          value={unit}
          onChange={(e) => setUnit(e.target.value as "mg/dl" | "mmol/L")}
        >
          <option value="mg/dl">mg/dl</option>
          <option value="mmol/L">mmol/L</option>
        </select>
      </div>
      <div>
        <label>Date & Time</label>
        <br />
        <input
          type="datetime-local"
          value={datetime}
          onChange={(e) => setDatetime(e.target.value)}
          required
        />
      </div>
      <div>
        <label>Event - Food (comma separated)</label>
        <br />
        <input
          type="text"
          value={food}
          onChange={(e) => setFood(e.target.value)}
          placeholder="e.g. pasta, bread"
        />
      </div>
      <div>
        <label>Event - Activity (comma separated)</label>
        <br />
        <input
          type="text"
          value={activity}
          onChange={(e) => setActivity(e.target.value)}
          placeholder="e.g. exercise, stress"
        />
      </div>
      <div>
        <label>Symptoms / Notes</label>
        <br />
        <textarea
          value={symptoms}
          onChange={(e) => setSymptoms(e.target.value)}
          rows={2}
        />
      </div>
      {error && <div style={{ color: "red" }}>{error}</div>}
      <div style={{ marginTop: 8 }}>
        <button className="btn btn-primary" disabled={loading}>
          {loading ? "Saving..." : "Save Reading"}
        </button>
      </div>
    </form>
  );
};

export default BloodSugarForm;
