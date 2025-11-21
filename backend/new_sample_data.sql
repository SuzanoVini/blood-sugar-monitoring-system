-- New Sample Data for Patient ID 1
-- This data is designed to trigger AI suggestions.

-- Please clear the old sample data for Patient ID 1 before inserting this data.
-- You can use the following command:
-- DELETE FROM Sugar_Reading WHERE Patient_ID = 1;

-- Abnormal Reading 1
INSERT INTO Sugar_Reading (Patient_ID, DateTime, Value, Unit, Food_Notes, Activity_Notes, Event, Symptoms, Notes, Category)
VALUES (1, '2025-09-15 19:00:00', 210.2, 'mg/dL', 'Heavy dinner, pasta', 'No exercise', 'Argument with spouse', 'Headache, blurry vision', 'High reading after stressful evening', 'Abnormal');

-- Abnormal Reading 2
INSERT INTO Sugar_Reading (Patient_ID, DateTime, Value, Unit, Food_Notes, Activity_Notes, Event, Symptoms, Notes, Category)
VALUES (1, '2025-09-20 21:00:00', 225.0, 'mg/dL', 'Pizza, beer', 'Late night movie', 'Lack of sleep', 'Fatigue, thirst', 'Very high after pizza and little sleep', 'Abnormal');

-- Abnormal Reading 3
INSERT INTO Sugar_Reading (Patient_ID, DateTime, Value, Unit, Food_Notes, Activity_Notes, Event, Symptoms, Notes, Category)
VALUES (1, '2025-09-25 18:30:00', 205.5, 'mg/dL', 'Pasta with cream sauce', 'No physical activity', 'Difficult work meeting', 'Irritability, hunger', 'High again after stressful day', 'Abnormal');

-- Abnormal Reading 4
INSERT INTO Sugar_Reading (Patient_ID, DateTime, Value, Unit, Food_Notes, Activity_Notes, Event, Symptoms, Notes, Category)
VALUES (1, '2025-09-30 20:00:00', 230.1, 'mg/dL', 'Leftover pizza', 'Stayed up late', 'Insomnia', 'Dizziness, dry mouth', 'Another high reading, felt unwell', 'Abnormal');

-- Abnormal Reading 5 (with pasta and stress)
INSERT INTO Sugar_Reading (Patient_ID, DateTime, Value, Unit, Food_Notes, Activity_Notes, Event, Symptoms, Notes, Category)
VALUES (1, '2025-10-02 19:30:00', 215.0, 'mg/dL', 'Pasta salad', 'No exercise', 'Work stress', 'Headache', 'High after pasta and a stressful day', 'Abnormal');

-- Abnormal Reading 6 (with pizza and stress)
INSERT INTO Sugar_Reading (Patient_ID, DateTime, Value, Unit, Food_Notes, Activity_Notes, Event, Symptoms, Notes, Category)
VALUES (1, '2025-10-04 20:00:00', 220.0, 'mg/dL', 'Pizza', 'Watching TV', 'Family stress', 'Thirst', 'High after pizza again', 'Abnormal');
