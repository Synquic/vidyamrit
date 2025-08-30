import { Router } from 'express';
import {
    getQuestionSets,
    getQuestionSet,
    createQuestionSet,
    updateQuestionSet,
    deleteQuestionSet
} from '../controllers/assessmentQuestionSetController';
import { roleMiddleware } from '../middlewares/roleMiddleware';
import { UserRole } from '../configs/roles';

const questionSetRouter = Router();

// Anyone can view question sets
questionSetRouter.get('/', getQuestionSets);
questionSetRouter.get('/:id', getQuestionSet);

// Only super admin and school admin can create/update/delete
questionSetRouter.post('/', roleMiddleware(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN), createQuestionSet);
questionSetRouter.put('/:id', roleMiddleware(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN), updateQuestionSet);
questionSetRouter.delete('/:id', roleMiddleware(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN), deleteQuestionSet);

export default questionSetRouter;
