import { cert, initializeApp, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import dotenv from 'dotenv';
import logger from '../utils/logger';

dotenv.config();

let serviceAccount: any;

// Priority 1: Try reading from environment variable (JSON string or base64-encoded JSON)
if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    try {
        let keyValue = process.env.FIREBASE_SERVICE_ACCOUNT_KEY.trim();
        
        // Try to decode as base64 first (safer for .env files)
        try {
            const decoded = Buffer.from(keyValue, 'base64').toString('utf-8');
            // If base64 decode succeeds and looks like JSON, use it
            if (decoded.trim().startsWith('{')) {
                serviceAccount = JSON.parse(decoded);
                logger.info("Firebase service account loaded from base64-encoded environment variable.");
            } else {
                // Not base64, try as plain JSON
                throw new Error('Not base64');
            }
        } catch (base64Error) {
            // Not base64, try parsing as plain JSON string
            // Remove surrounding quotes if present (dotenv might add them)
            if ((keyValue.startsWith('"') && keyValue.endsWith('"')) || 
                (keyValue.startsWith("'") && keyValue.endsWith("'"))) {
                keyValue = keyValue.slice(1, -1);
            }
            serviceAccount = JSON.parse(keyValue);
            logger.info("Firebase service account loaded from environment variable.");
        }
    } catch (error) {
        logger.error(`Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY from environment: ${error}`);
        logger.error(`Value preview (first 100 chars): ${process.env.FIREBASE_SERVICE_ACCOUNT_KEY?.substring(0, 100)}`);
        throw new Error(`Invalid FIREBASE_SERVICE_ACCOUNT_KEY in environment variable. Use base64-encoded JSON or properly escaped JSON string.`);
    }
}
// Priority 2: Try reading from file path
else if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY_PATH) {
    const serviceAccountPath = join(process.cwd(), process.env.FIREBASE_SERVICE_ACCOUNT_KEY_PATH);
    if (!existsSync(serviceAccountPath)) {
        logger.error(`Service account file not found at path: ${serviceAccountPath}`);
        throw new Error(`Service account file not found at path: ${serviceAccountPath}`);
    }
    serviceAccount = JSON.parse(readFileSync(serviceAccountPath, "utf-8"));
    logger.info(`Firebase service account loaded from file: ${serviceAccountPath}`);
}
// Priority 3: Fallback to default path
else {
    const serviceAccountPath = join(__dirname, '../../firebaseServiceAccountKey.json');
    if (!existsSync(serviceAccountPath)) {
        logger.error(`Service account file not found at path: ${serviceAccountPath}`);
        throw new Error(`Service account file not found at path: ${serviceAccountPath}. Please set FIREBASE_SERVICE_ACCOUNT_KEY or FIREBASE_SERVICE_ACCOUNT_KEY_PATH`);
    }
    serviceAccount = JSON.parse(readFileSync(serviceAccountPath, "utf-8"));
    logger.info(`Firebase service account loaded from default path: ${serviceAccountPath}`);
}

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