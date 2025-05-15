const CourseInquiry = require('../../models/CourseInquiry'); // Adjust path as needed
const CourseContactData = require('../../models/CourseContactData'); // To verify courseContactPageId
const sendEmail = require('../../utils/sendEmail'); // Make sure this path is correct
// const createBrochureEmailHtml = require("../../utils/emailHtml/createBrochureEmailHtml");

const createBrochureEmailHtml = (userName, courseName, brochureLink, logoUrl = 'https://www.riskinn.com/images/risk-inn-logo.jpeg') => {
    const currentYear = new Date().getFullYear();
    // Basic inline styling for broader email client compatibility
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Course Brochure - ${courseName}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'; margin: 0; padding: 0; background-color: #f0f4f8; color: #333333; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
        .email-wrapper { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #e2e8f0; }
        .email-header { background-color: #00906D; padding: 25px 30px; text-align: center; }
        .email-header img { max-width: 120px; margin-bottom: 10px; }
        .email-header h1 { color: #ffffff; font-size: 24px; margin: 0; font-weight: 600; }
        .email-body { padding: 30px; font-size: 15px; line-height: 1.65; }
        .email-body h2 { color: #007a5c; font-size: 20px; margin-top: 0; margin-bottom: 15px; font-weight: 600;}
        .email-body p { margin-bottom: 15px; }
        .email-body strong { color: #2d3748; }
        .button-container { text-align: center; margin: 25px 0; }
        .button {
        background-color: #00906D; color: #ffffff !important; padding: 12px 25px; text-decoration: none !important;
        border-radius: 5px; font-weight: bold; display: inline-block; font-size: 16px;
        border: none; cursor: pointer; transition: background-color 0.2s ease-in-out;
        }
        .button:hover { background-color: #007a5c; }
        .email-footer { text-align: center; padding: 20px 30px; background-color: #f7fafc; border-top: 1px solid #e2e8f0; font-size: 12px; color: #718096; }
        .email-footer a { color: #00906D; text-decoration: none; }
        .email-footer a:hover { text-decoration: underline; }
        .highlight { color: #00906D; font-weight: bold; }
    </style>
    </head>
    <body>
    <div class="email-wrapper">
        <div class="email-header">
        ${logoUrl ? `<a href="https://www.riskinn.com" target="_blank"><img src="${logoUrl}" alt="Risk Inn Logo"></a>` : ''}
        <h1>Thank You for Your Inquiry!</h1>
        </div>
        <div class="email-body">
        <h2>Hello ${userName || 'Valued Inquirer'},</h2>
        <p>Thank you for reaching out to Risk Inn and showing interest in our course: <strong class="highlight">${courseName}</strong>.</p>
        <p>We're delighted to provide you with more information. You can download the course brochure by clicking the button below:</p>
        ${brochureLink ? `
        <div class="button-container">
            <a href="${brochureLink}" target="_blank" class="button">Download Brochure</a>
        </div>
        ` : '<p><em>Brochure details will be sent shortly in a separate communication.</em></p>'}
        <p>Our team will also be in touch soon to discuss your learning goals and answer any further questions you might have.</p>
        <p>In the meantime, feel free to explore more about Risk Inn and our offerings on our <a href="https://www.riskinn.com" target="_blank" style="color: #00906D; text-decoration: none;">website</a>.</p>
        <p>We look forward to helping you achieve your career aspirations!</p>
        <p>Best regards,<br>The Risk Inn Team</p>
        </div>
        <div class="email-footer">
        &copy; ${currentYear} Risk Inn Pvt. Ltd. All rights reserved.<br>
        <a href="https://www.riskinn.com/privacy-policy" target="_blank">Privacy Policy</a> | <a href="https://www.riskinn.com/contact" target="_blank">Contact Us</a>
        </div>
    </div>
    </body>
    </html>`;
};


const submitCourseInquiry = async (req, res) => {
    try {
        const {
            courseContactPageId,
            formId,
            submittedData, // This is the array directly from the frontend
            userId,
        } = req.body;

        // --- Validation ---
        if (!courseContactPageId || !formId || !Array.isArray(submittedData) || submittedData.length === 0) {
            return res.status(400).json({ message: 'Missing required fields: courseContactPageId, formId, or submittedData.' });
        }

        // Optional: Verify that the courseContactPageId (courseId) exists
        const coursePageExists = await CourseContactData.findOne({ courseId: courseContactPageId });
        if (!coursePageExists) {
            return res.status(404).json({ message: `Course page with ID '${courseContactPageId}' not found.` });
        }

        const coursePageData = await CourseContactData.findOne({ courseId: courseContactPageId });
        if (!coursePageData) {
            return res.status(404).json({ message: `Course page with ID '${courseContactPageId}' not found.` });
        }

        for (const item of submittedData) {
            if (item.fieldName === undefined || item.fieldLabel === undefined || item.fieldValue === undefined) {
                console.error('Invalid item in submittedData:', item);
                return res.status(400).json({
                    message: 'Each item in submittedData must have fieldName, fieldLabel, and fieldValue.'
                });
            }
        }


        const newInquiry = new CourseInquiry({
            courseContactPageId,
            formId,
            submittedData: submittedData, // Use the validated submittedData directly
            userId: userId || null,
            metaData: {
                ipAddress: req.ip,
                userAgent: req.headers['user-agent']
            }
        });

        const savedInquiry = await newInquiry.save();
        // --- Send Brochure Email ---
        let userEmail = '';
        let userName = '';

        // Extract email and name from submittedData
        const emailField = submittedData.find(field => field.fieldName?.toLowerCase() === 'email');
        if (emailField) {
            userEmail = emailField.fieldValue;
        }

        const nameField = submittedData.find(field => field.fieldName?.toLowerCase() === 'fullname' || field.fieldName?.toLowerCase() === 'name');
        if (nameField) {
            userName = nameField.fieldValue;
        }

        if (userEmail && coursePageData.brochureUrl) {
            const emailHtml = createBrochureEmailHtml(
                userName,
                coursePageData.courseTitle,
                coursePageData.brochureUrl
            );
            try {
                await sendEmail({
                    email: userEmail,
                    subject: `Your Brochure for ${coursePageData.courseTitle} from Risk Inn`,
                    // message: `Thank you for your inquiry... Download brochure: ${coursePageData.brochureUrl}`, // Plain text fallback
                    html: emailHtml, // Send HTML email
                });
                console.log(`Brochure email sent to ${userEmail} for course ${coursePageData.courseTitle}`);
            } catch (emailError) {
                // Log email error but don't fail the main API response for it
                console.error('Failed to send brochure email:', emailError);
            }
        } else {
            if (!userEmail) {
                console.warn('User email not found in submitted form data. Cannot send brochure email.');
            }
            if (userEmail && !coursePageData.brochureUrl) {
                console.warn(`Brochure URL not found for course ${coursePageData.courseId}. Cannot send brochure email.`);
            }
        }
        // --- End Send Brochure Email ---

        res.status(201).json({ message: 'Inquiry submitted successfully. If applicable, a brochure has been sent to your email.', data: savedInquiry });

    } catch (error) {
        console.error('Error submitting course inquiry:', error);
        if (error.name === 'ValidationError') {
            // Log the detailed validation errors
            console.error('Mongoose Validation Errors:', JSON.stringify(error.errors, null, 2));
            return res.status(400).json({ message: 'Validation Error', errors: error.errors });
        }
        res.status(500).json({ message: 'Server error while submitting inquiry.', error: error.message });
    }
};


module.exports = {
    submitCourseInquiry,
    // Add other inquiry management functions if needed (e.g., getInquiries)
};
