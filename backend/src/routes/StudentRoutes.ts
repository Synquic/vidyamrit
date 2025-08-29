import { Router } from 'express';
import { authMiddleware } from '../middlewares/authMiddleware';
import { roleMiddleware } from '../middlewares/roleMiddleware';
import { UserRole } from '../configs/roles';
import { createStudent, getStudents, getStudent, updateStudent, deleteStudent } from '../controllers/studentController';

const studentRouter = Router();

// Students are database records, no auth required for them
studentRouter.post('/',authMiddleware, roleMiddleware(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.MENTOR), createStudent); // Create a student record
studentRouter.get('/',authMiddleware, roleMiddleware(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.MENTOR), getStudents);    // Get all students (with optional schoolId filter)
studentRouter.get('/:id',authMiddleware, roleMiddleware(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.MENTOR), getStudent);  // Get a single student by MongoDB _id
studentRouter.put('/:id',authMiddleware, roleMiddleware(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.MENTOR), updateStudent); // Update student by MongoDB _id
studentRouter.delete('/:id',authMiddleware, roleMiddleware(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN), deleteStudent); // Delete student by MongoDB _id

export default studentRouter;
