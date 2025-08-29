import { Router } from 'express';
import { getAssessments, getAssessment, createAssessment } from '../controllers/assessmentController';
import { roleMiddleware } from '../middlewares/roleMiddleware';
import { UserRole } from '../configs/roles';

const assessmentRouter = Router();

// Get all assessments
assessmentRouter.get('/', roleMiddleware(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.MENTOR), getAssessments);

// Get single assessment
assessmentRouter.get('/:id', roleMiddleware(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.MENTOR), getAssessment);

// Create assessment
assessmentRouter.post('/', roleMiddleware(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.MENTOR), createAssessment);

export default assessmentRouter;
