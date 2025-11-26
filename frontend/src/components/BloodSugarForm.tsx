import React, { useState, useEffect, type FormEvent } from "react";
import api from "../services/apiService";

interface BloodSugarReading {
  reading_id?: string | number;
  value: number;
  unit: "mg/dl" | "mmol/L";
  datetime: string;
  food_notes?: string;
  activity_notes?: string;
  symptoms?: string;
  notes?: string;
}
interface BloodSugarFormProps {
  onSaved?: (reading: any) => void;
  readingToEdit?: Partial<BloodSugarReading>;
  isEditMode: boolean;
}

const BloodSugarForm: React.FC<BloodSugarFormProps> = ({
  onSaved,
  readingToEdit = {},
  isEditMode,
}) => {
  const getLocalISOString = (date: Date) => {
    const offset = date.getTimezoneOffset() * 60000; // offset in milliseconds
    return new Date(date.getTime() - offset).toISOString().slice(0, 16);
  };

  const [value, setValue] = useState(readingToEdit.value?.toString() || "");
  const [unit, setUnit] = useState<"mg/dl" | "mmol/L">(
    readingToEdit.unit || "mg/dl"
  );
  const [datetime, setDatetime] = useState(
    readingToEdit.datetime ? getLocalISOString(new Date(readingToEdit.datetime)) : getLocalISOString(new Date())
  );
  const [food, setFood] = useState(readingToEdit.food_notes || "");
  const [activity, setActivity] = useState(readingToEdit.activity_notes || "");
  const [symptoms, setSymptoms] = useState(readingToEdit.symptoms || readingToEdit.notes || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isEditMode && readingToEdit) {
      setValue(readingToEdit.value?.toString() || "");
      setUnit(readingToEdit.unit || "mg/dl");
      setDatetime(readingToEdit.datetime ? getLocalISOString(new Date(readingToEdit.datetime)) : getLocalISOString(new Date()));
      setFood(readingToEdit.food_notes || "");
      setActivity(readingToEdit.activity_notes || "");
      setSymptoms(readingToEdit.symptoms || readingToEdit.notes || "");
    }
  }, [isEditMode, readingToEdit]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (!value) {
      setError("Please enter a blood sugar value.");
      return;
    }
    const selectedDateTime = new Date(datetime);
    const now = new Date();
    if (selectedDateTime > now) {
      setError("Date and time cannot be in the future.");
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

      let res;
      if (isEditMode) {
        if (!readingToEdit.reading_id) {
          throw new Error("Reading ID is missing for update.");
        }
        res = await api.updateReading(readingToEdit.reading_id, payload);
      } else {
        res = await api.createReading(payload);
      }

      console.log("Reading saved successfully:", res);
      onSaved?.(res);
      if (!isEditMode) {
        setValue("");
        setFood("");
        setActivity("");
        setSymptoms("");
      }
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
        <h4>{isEditMode ? "Edit Blood Sugar Reading" : "Enter Blood Sugar"}</h4>
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
                max={getLocalISOString(new Date())} // Prevent future dates via picker
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
            {loading ? "Saving..." : (isEditMode ? "Update Reading" : "Save Reading")}
          </button>
        </div>
      </div>
    </form>
  );
};

export default BloodSugarForm;
