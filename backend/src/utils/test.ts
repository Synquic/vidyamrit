import { auth } from "../configs/firebaseAdmin";
import { connectDB } from '../configs/db';
import { UserRole } from '../configs/roles';
import User from "../models/UserModel";
import logger from "./logger";
import dotenv from 'dotenv';

dotenv.config();

async function bootstrap() {
    logger.info("Starting Super Admin bootstrap...");
    let firebaseUser = null;

    try {
        // Connect to MongoDB first
        await connectDB();
        
        // Create Firebase user
        firebaseUser = await auth.createUser({
            email: "superadmin@gmail.com",
            password: "SuperSecret123!",
        });
        logger.info(`Firebase user created: ${firebaseUser.uid}`);

        // Create MongoDB user without transactions since we're using local MongoDB
        const user = new User({
            uid: firebaseUser.uid,
            name: "Super Admin",
            email: firebaseUser.email,
            role: UserRole.SUPER_ADMIN,
            schoolId: null,
        });

        await user.save();
        logger.info(`MongoDB user saved: ${user.uid}`);
        console.log("✅ Super Admin created:", firebaseUser.uid);
        process.exit(0);

    } catch (error) {
        logger.error("Bootstrap process failed:", error);

        // If Firebase user was created but MongoDB failed, clean up Firebase
        if (firebaseUser) {
            try {
                await auth.deleteUser(firebaseUser.uid);
                logger.info(`Cleaned up: Firebase user ${firebaseUser.uid} deleted due to error`);
            } catch (deleteErr) {
                logger.error("Failed to delete Firebase user during cleanup:", deleteErr);
            }
        }

        process.exit(1);
    }
}

bootstrap();
