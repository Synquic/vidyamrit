import { Router, RequestHandler } from 'express';
import { authMiddleware } from '../middlewares/authMiddleware';
import { roleMiddleware } from '../middlewares/roleMiddleware';
import { UserRole } from '../configs/roles';
import { createMentor, getMentors, getMentor, updateMentor, deleteMentor } from '../controllers/mentorController';

// Cast handlers to standard express RequestHandler type
const handlers = {
    createMentor: createMentor as unknown as RequestHandler,
    getMentors: getMentors as unknown as RequestHandler,
    getMentor: getMentor as unknown as RequestHandler,
    updateMentor: updateMentor as unknown as RequestHandler,
    deleteMentor: deleteMentor as unknown as RequestHandler
};

const mentorRouter = Router();

mentorRouter.post('/', roleMiddleware(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN), handlers.createMentor);
mentorRouter.get('/', roleMiddleware(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.MENTOR), handlers.getMentors);
mentorRouter.get('/:uid', roleMiddleware(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.MENTOR), handlers.getMentor);
mentorRouter.put('/:uid', roleMiddleware(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN), handlers.updateMentor);
mentorRouter.delete('/:uid', roleMiddleware(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN), handlers.deleteMentor);

export default mentorRouter;
