/**
 * Email Service Module
 * Handles sending email notifications via SendGrid
 * Aligned with SRS ALT-FR and SDD EmailService specifications
 */

const sgMail = require('@sendgrid/mail');

/**
 * Sends an alert email to multiple recipients with retry logic
 * @param {string[]} recipients - Array of recipient email addresses
 * @param {string} subject - Email subject line
 * @param {string} html - HTML content of the email
 * @param {Function} callback - Callback function with signature (error, result)
 */
function sendAlertEmail(recipients, subject, html, callback) {
  // Validate environment variables
  const apiKey = process.env.SENDGRID_API_KEY;
  const senderEmail = process.env.SENDGRID_SENDER_EMAIL;

  if (!apiKey) {
    return callback(new Error('SENDGRID_API_KEY environment variable is not set'), null);
  }

  if (!senderEmail) {
    return callback(new Error('SENDGRID_SENDER_EMAIL environment variable is not set'), null);
  }

  // Configure SendGrid with API key
  sgMail.setApiKey(apiKey);

  // Prepare email message
  const msg = {
    to: recipients,
    from: senderEmail,
    subject: subject,
    html: html
  };

  // Retry logic: up to 2 retries on 5xx errors
  const maxRetries = 2;

  /**
   * Attempts to send email with retry logic
   * @param {number} attempt - Current attempt number (0-indexed)
   */
  function attemptSend(attempt) {
    sgMail.send(msg)
      .then(() => {
        // Success - invoke callback with no error
        callback(null, { success: true, attempt: attempt + 1 });
      })
      .catch((error) => {
        // Check if error is a 5xx server error
        const statusCode = error.code || (error.response && error.response.statusCode);
        const is5xxError = statusCode >= 500 && statusCode < 600;

        // If not a 5xx error or this was the last retry, fail permanently
        if (!is5xxError || attempt === maxRetries) {
          return callback(
            new Error(`Failed to send email after ${attempt + 1} attempt(s): ${error.message}`),
            null
          );
        }

        // Wait before retrying (exponential backoff: 1s, 2s)
        const delayMs = Math.pow(2, attempt) * 1000;
        setTimeout(() => {
          attemptSend(attempt + 1);
        }, delayMs);
      });
  }

  // Start first attempt
  attemptSend(0);
}

module.exports = {
  sendAlertEmail
};
