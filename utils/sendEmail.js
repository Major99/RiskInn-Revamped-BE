// utils/sendEmail.js
const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // 1) Create a transporter (service that will send email like 'gmail', 'sendgrid')
  // Example using SMTP:
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: process.env.EMAIL_PORT == 465, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    // Activate in gmail "less secure app" option or use App Password if using Gmail + 2FA
    // For production, consider transactional email services (SendGrid, Mailgun, AWS SES)
  });

  // 2) Define the email options
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: options.email,
    subject: options.subject,
    text: options.message, // Plain text body
    // html: options.html // You can also send HTML content
  };

  // 3) Actually send the email
  try {
    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully!');
  } catch (error) {
    console.error('Error sending email:', error);
    // Depending on your error handling strategy, you might want to throw the error
    // throw new Error('There was an error sending the email. Try again later.');
  }
};

module.exports = sendEmail;