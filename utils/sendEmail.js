// utils/sendEmail.js
const nodemailer = require('nodemailer');

/**
 * Sends an email using nodemailer.
 * @param {object} options - Email options.
 * @param {string} options.email - Recipient's email address.
 * @param {string} options.subject - Subject of the email.
 * @param {string} [options.message] - Plain text content of the email (used if html is not provided).
 * @param {string} [options.html] - HTML content of the email.
 */
const sendEmail = async (options) => {
  // 1) Create a transporter
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: process.env.EMAIL_PORT == 465, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    // For Gmail, ensure "less secure app" access is enabled or use an App Password.
    // For production, services like SendGrid, Mailgun, or AWS SES are recommended.
  });

  // 2) Define the email options
  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME || 'RiskInn'}" <${process.env.EMAIL_FROM_ADDRESS || 'noreply@riskinn.com'}>`, // Recommended: Use a name and address
    to: options.email,
    subject: options.subject,
  };

  // Add text or HTML content
  if (options.html) {
    mailOptions.html = options.html;
    // Optionally, provide a plain text version as well for clients that don't support HTML
    // If options.message is also provided, it can serve as the text version.
    // Otherwise, you might want to generate a text version from HTML or have a default.
    if (options.message) {
      mailOptions.text = options.message;
    } else {
      // Basic text version (consider a library to convert HTML to text for better results)
      // mailOptions.text = options.html.replace(/<[^>]*>?/gm, ''); // Simple tag stripping
    }
  } else if (options.message) {
    mailOptions.text = options.message; // Fallback to plain text if HTML is not provided
  } else {
    console.error('Email options must include either "message" (text) or "html" content.');
    // Optionally throw an error or handle this case as appropriate
    // throw new Error('Email content (text or html) is required.');
    return; // Or handle error appropriately
  }


  // 3) Actually send the email
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully! Message ID:', info.messageId);
  } catch (error) {
    console.error('Error sending email:', error);
    // Depending on your error handling strategy, you might want to throw the error
    // or return a status to the calling function.
    // For now, just logging, as in your original.
    // throw new Error('There was an error sending the email. Try again later.');
  }
};

module.exports = sendEmail;
