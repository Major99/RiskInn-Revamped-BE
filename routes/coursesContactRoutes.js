// routes/courseContactDataRoutes.js
import { Router } from 'express';
const router = Router();
import { getCourseContactDataById, createCourseContactData } from '../controllers/coursesContact/courseContactDataController.js'; // Adjust path
import { submitCourseInquiry } from '../controllers/coursesContact/courseInquiryController.js'; // Adjust path

router.get('/:courseId', getCourseContactDataById);
router.post('/', createCourseContactData); // Or public for now
router.post('/submit', submitCourseInquiry);

// Add PUT for update and DELETE routes if necessary

export default router;
