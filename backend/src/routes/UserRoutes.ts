import { Router } from 'express';
import { getCurrentUser } from '../controllers/userController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { registerUser } from '../controllers/userController';

const userRouter = Router();

// Common user routes (profile, auth)
userRouter.get('/me', authMiddleware, getCurrentUser);
userRouter.post('/register', authMiddleware, registerUser); // we register user in our db with firebase uid
// login- handled by firebase.

export default userRouter;
    