import React, { useState, type FormEvent } from "react";
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

const BloodSugarForm: React.FC<BloodSugarFormProps> = ({
  onSaved,
  defaultValues = {},
}) => {
  const [value, setValue] = useState(defaultValues.value?.toString() || "");
  const [unit, setUnit] = useState<"mg/dl" | "mmol/L">(
    defaultValues.unit || "mg/dl"
  );
  const [datetime, setDatetime] = useState(
    defaultValues.datetime || new Date().toISOString().slice(0, 16)
  );
  const [food, setFood] = useState(defaultValues.food_notes || "");
  const [activity, setActivity] = useState(defaultValues.activity_notes || "");
  const [symptoms, setSymptoms] = useState(defaultValues.symptoms || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (!value) {
      setError("Please enter a blood sugar value.");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        value: parseFloat(value),
        unit,
        dateTime: datetime,
        foodNotes: food,
        activityNotes: activity,
        symptoms,
      };
      const res = await api.createReading(payload);
      console.log("Reading saved successfully:", res);
      onSaved?.(res);
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
      <div className="card-hd">
        <h4>Enter Blood Sugar</h4>
      </div>

      <div className="card-bd">
        {/* Value + Unit inline */}
        <div className="field-row">
          <div className="input-group">
            <label>Value</label>
            <div className="with-addon">
              <input
                type="number"
                className="input"
                placeholder="e.g. 110"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                required
              />
              <div className="addon">
                <select
                  className="select addon-select"
                  value={unit}
                  onChange={(e) =>
                    setUnit(e.target.value as "mg/dl" | "mmol/L")
                  }
                >
                  <option value="mg/dl">mg/dl</option>
                  <option value="mmol/L">mmol/L</option>
                </select>
              </div>
            </div>
            <div className="help">Use the selector to switch units.</div>
          </div>

          <div className="input-group">
            <label>Date & Time</label>
            <div className="with-addon">
              <input
                type="datetime-local"
                className="input"
                value={datetime}
                onChange={(e) => setDatetime(e.target.value)}
                required
              />
              <div className="addon addon-icon" aria-hidden>
                🕑
              </div>
            </div>
            <div className="help">When was the reading taken?</div>
          </div>
        </div>

        {/* Food / Activity */}
        <div className="field-row">
          <div className="input-group">
            <label>Food</label>
            <input
              type="text"
              className="input"
              value={food}
              onChange={(e) => setFood(e.target.value)}
              placeholder="e.g. pasta, bread"
            />
            <div className="help">Comma separated items.</div>
          </div>

          <div className="input-group">
            <label>Activity</label>
            <input
              type="text"
              className="input"
              value={activity}
              onChange={(e) => setActivity(e.target.value)}
              placeholder="e.g. exercise, stress"
            />
            <div className="help">Comma separated activities.</div>
          </div>
        </div>

        {/* Notes */}
        <div className="input-group">
          <label>Symptoms / Notes</label>
          <textarea
            className="textarea"
            rows={3}
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
            placeholder="Any symptoms or context to note?"
          />
        </div>

        {error && <div className="form-error">{error}</div>}

        <div className="btn-row">
          <button type="submit" className="btn" disabled={loading}>
            {loading ? "Saving..." : "Save Reading"}
          </button>
        </div>
      </div>
    </form>
  );
};

export default BloodSugarForm;
