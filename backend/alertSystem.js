// backend/alertSystem.js
const socketManager = require('./socketManager');

function checkAbnormalReadings(db, patientId) {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const query = `
        SELECT COUNT(*) as abnormalCount
        FROM Sugar_Reading
        WHERE Patient_ID = ?
        AND Category = 'Abnormal'
        AND DateTime >= ?
    `;

    db.query(query, [patientId, sevenDaysAgo], (err, results) => {
        if (err) {
            console.error('Error checking abnormal readings:', err);
            return;
        }

        const abnormalCount = results[0].abnormalCount;

        if (abnormalCount > 3) {
            // Fetch patient and specialist details
            const userQuery = `
                SELECT
                    p.Name as patientName,
                    s.Name as specialistName,
                    s.User_ID as specialistId
                FROM Patient pt
                JOIN User p ON pt.Patient_ID = p.User_ID
                LEFT JOIN specialist_patient_assignment spa ON pt.Patient_ID = spa.Patient_ID
                LEFT JOIN Specialist sp ON spa.Specialist_ID = sp.Specialist_ID
                LEFT JOIN User s ON sp.Specialist_ID = s.User_ID
                WHERE pt.Patient_ID = ?
            `;

            db.query(userQuery, [patientId], (err, userResults) => {
                if (err) {
                    console.error('Error fetching patient and specialist details:', err);
                    return;
                }

                if (userResults.length > 0) {
                    const { patientName, specialistName, specialistId } = userResults[0];
                    const message = `Patient ${patientName} has had ${abnormalCount} abnormal blood sugar readings in the last 7 days.`;
                    const timestamp = new Date().toISOString();

                    const notificationData = {
                        id: `${timestamp}-${Math.random()}`,
                        type: 'alert',
                        title: 'High Frequency of Abnormal Readings',
                        message: message,
                        timestamp: timestamp
                    };

                    // Emit a socket event to the patient and specialist
                    socketManager.sendNotificationToUser(patientId, notificationData);
                    if (specialistId) {
                        socketManager.sendNotificationToUser(specialistId, notificationData);
                    }

                    console.log(`Alert notification sent to patient ${patientId} and specialist ${specialistId}`);
                }
            });
        }
    });
}

module.exports = {
    checkAbnormalReadings
};
