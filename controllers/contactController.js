const asyncHandler = require('express-async-handler');

const submitContactForm = asyncHandler(async (req, res) => {
    const { name, email, phone, inquiryType, subject, message } = req.body;

    if (!name || !email || !message) {
        res.status(400); // Bad Request
        throw new Error('Name, Email, and Message are required fields.');
    }

    console.log('--- Contact Form Submission Received ---');
    console.log('Name:', name);
    console.log('Email:', email);
    console.log('Phone:', phone || 'Not provided');
    console.log('Inquiry Type:', inquiryType || 'Not specified');
    console.log('Subject:', subject || 'Not provided');
    console.log('Message:', message);
    console.log('---------------------------------------');


    try {
        const submissionData = {
            name,
            email,
            phone,
            inquiryType,
            subject,
            message,
            // Optional: Add IP address if needed (req.ip or from headers)
            // ipAddress: req.ip,
            // Optional: Link to user if logged in (requires protect middleware on route)
            // submittedBy: req.user?._id || undefined,
        };

        const createdSubmission = await ContactSubmission.create(submissionData);
        console.log('Contact submission saved to DB:', createdSubmission._id);

    } catch (dbError) {
        console.error('Error saving contact submission to database:', dbError);
        res.status(500);
        throw new Error('Failed to process your request due to a server issue.');
    }


    res.status(200).json({ success: true, message: 'Message received successfully! We will get back to you soon.' });
});

module.exports = {
    submitContactForm,
};