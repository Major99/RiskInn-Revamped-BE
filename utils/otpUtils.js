// utils/otpUtils.js
const otpGenerator = require('otp-generator');

const generateOTP = () => {
  const otpLength = parseInt(process.env.OTP_LENGTH || '6', 10);
  // Generate a numeric OTP
  const otp = otpGenerator.generate(otpLength, {
    upperCaseAlphabets: false,
    lowerCaseAlphabets: false,
    specialChars: false,
    digits: true,
  });
  return otp;
};

const calculateExpiry = () => {
    const expiryMinutes = parseInt(process.env.OTP_EXPIRES_IN_MINUTES || '10', 10);
    return new Date(Date.now() + expiryMinutes * 60 * 1000); // OTP expires in X minutes
};

module.exports = {
  generateOTP,
  calculateExpiry,
};