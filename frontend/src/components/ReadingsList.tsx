import React, { useEffect, useState } from "react";
import api from "../services/apiService";
import Modal from "./Modal";
import BloodSugarForm from "./BloodSugarForm";

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
  refreshSignal: any;
}

const ReadingsList: React.FC<ReadingsListProps> = ({ refreshSignal }) => {
  const [readings, setReadings] = useState<Reading[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReading, setEditingReading] = useState<Reading | null>(null);

  const load = async () => {
    console.log("ReadingsList: Loading readings...");
    setLoading(true);
    try {
      const res: Reading[] = await api.getReadings();
      console.log("ReadingsList: Loaded", res.length, "readings");
      setReadings(res);
    } catch (err) {
      console.error("Failed to load readings", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log("ReadingsList: refreshSignal changed to", refreshSignal);
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

  const handleEditClick = (reading: Reading) => {
    setEditingReading(reading);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingReading(null);
  };

  const handleReadingSaved = () => {
    handleModalClose();
    load(); // Reload the list to show the updated reading
  };

  if (loading)
    return (
      <div className="bg-white p-4 rounded-xl shadow-lg mb-4">
        Loading readings...
      </div>
    );

  return (
    <>
      <Modal isOpen={isModalOpen} onClose={handleModalClose} title="Edit Reading">
        {editingReading && (
          <BloodSugarForm
            isEditMode={true}
            readingToEdit={editingReading}
            onSaved={handleReadingSaved}
          />
        )}
      </Modal>

      <div className="bg-white p-4 rounded-xl shadow-lg mb-4 overflow-x-auto">
        <h4 className="text-lg font-semibold text-blue-600 mb-2">Readings</h4>
        <table className="w-full table-auto border-collapse">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-3 py-2 text-left">DateTime</th>
              <th className="px-3 py-2 text-left">Value</th>
              <th className="px-3 py-2 text-left">Category</th>
              <th className="px-3 py-2 text-left">Food</th>
              <th className="px-3 py-2 text-left">Activity</th>
              <th className="px-3 py-2 text-left">Notes</th>
              <th className="px-3 py-2 text-left"></th>
            </tr>
          </thead>
          <tbody>
            {readings.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-3">
                  No readings yet.
                </td>
              </tr>
            )}
            {readings.map((r) => (
              <tr
                key={r.reading_id}
                className="hover:bg-gray-50 transition rounded"
              >
                <td className="px-3 py-2">
                  {new Date(r.datetime).toLocaleString()}
                </td>
                <td className="px-3 py-2">
                  {r.value} {r.unit || "mg/dl"}
                </td>
                <td className="px-3 py-2">{r.category}</td>
                <td className="px-3 py-2">{r.food_notes}</td>
                <td className="px-3 py-2">{r.activity_notes}</td>
                <td className="px-3 py-2">{r.notes || r.symptoms}</td>
                <td className="px-3 py-2" style={{ display: 'flex', gap: '5px' }}>
                  <button
                    className="bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded transition"
                    onClick={() => handleEditClick(r)}
                  >
                    Edit
                  </button>
                  <button
                    className="bg-gray-400 hover:bg-gray-500 text-white px-2 py-1 rounded transition"
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
    </>
  );
};

export default ReadingsList;
