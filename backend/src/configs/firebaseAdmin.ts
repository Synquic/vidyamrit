import { cert, initializeApp, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import dotenv from 'dotenv';
import logger from '../utils/logger';

dotenv.config();

// Resolve path relative to backend root directory
const serviceAccountPath: string = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_PATH 
    ? join(process.cwd(), process.env.FIREBASE_SERVICE_ACCOUNT_KEY_PATH)
    : join(__dirname, '../../firebaseServiceAccountKey.json');

if (!existsSync(serviceAccountPath)) {
    logger.error(`Service account file not found at path: ${serviceAccountPath}`);
    throw new Error(`Service account file not found at path: ${serviceAccountPath}`);
}

const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, "utf-8"));

let app: App;
try {
    app = initializeApp({
        credential: cert(serviceAccount),
    });
    logger.info("Firebase initialized successfully.");
} catch (error) {
    logger.error(`Firebase initialization failed: ${error}`);
    throw error;
}

const auth: Auth = getAuth(app);

export const verifyToken = async (token: string): Promise<any> => {
    return auth.verifyIdToken(token);
};

export { auth };