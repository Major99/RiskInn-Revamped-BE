// controllers/courseContactDataController.js
const CourseContactData = require('../../models/CourseContactData'); // Adjust path as needed

/**
 * @desc    Get course contact data by its unique courseId
 * @route   GET /api/course-contact/:courseId
 * @access  Public
 */
const getCourseContactDataById = async (req, res) => {
    try {
        const courseId = req.params.courseId;
        if (!courseId) {
            return res.status(400).json({ message: 'Course ID is required.' });
        }

        // Find the course contact data by the custom courseId field
        const courseData = await CourseContactData.findOne({ courseId: courseId });

        if (!courseData) {
            return res.status(404).json({ message: 'Course contact data not found.' });
        }

        res.status(200).json(courseData);
    } catch (error) {
        console.error('Error fetching course contact data:', error);
        res.status(500).json({ message: 'Server error while fetching course contact data.', error: error.message });
    }
};

/**
 * @desc    Create new course contact page data (Optional - for admin or seeding)
 * @route   POST /api/course-contact
 * @access  Private/Admin
 */
const createCourseContactData = async (req, res) => {
    try {
        // Destructure all expected fields from req.body
        // This should match the structure of your CourseContactDataSchema
        const {
            courseId,
            pageTitle,
            courseTitle,
            mentorInfo,
            bannerTags,
            completionAwards,
            programOverview,
            whoShouldExplore,
            keyHighlights,
            detailedCurriculum,
            instructor,
            contactInfo,
            contactFormSchema // This is the schema for the form on *this* course's contact page
        } = req.body;

        // Basic validation (add more as needed with a library like Joi or express-validator)
        if (!courseId || !pageTitle || !courseTitle || !programOverview) {
            return res.status(400).json({ message: 'Missing required fields (courseId, pageTitle, courseTitle, programOverview).' });
        }

        // Check if courseId already exists to prevent duplicates
        const existingCourse = await CourseContactData.findOne({ courseId: courseId });
        if (existingCourse) {
            return res.status(400).json({ message: `Course contact data with ID '${courseId}' already exists.` });
        }

        const newCourseContactData = new CourseContactData({
            courseId,
            pageTitle,
            courseTitle,
            mentorInfo,
            bannerTags,
            completionAwards,
            programOverview,
            whoShouldExplore,
            keyHighlights,
            detailedCurriculum,
            instructor,
            contactInfo,
            contactFormSchema
        });

        const savedData = await newCourseContactData.save();
        res.status(201).json({ message: 'Course contact data created successfully.', data: savedData });

    } catch (error) {
        console.error('Error creating course contact data:', error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: 'Validation Error', errors: error.errors });
        }
        res.status(500).json({ message: 'Server error while creating course contact data.', error: error.message });
    }
};


module.exports = {
    getCourseContactDataById,
    createCourseContactData,
    // Add other controller functions like update, delete if needed
};
