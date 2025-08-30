import { Request, Response } from 'express';
import { auth } from '../configs/firebaseAdmin';
import User from '../models/UserModel';
import { UserRole } from '../configs/roles';

export const createSchoolAdmin = async (req: Request, res: Response) => {
    let firebaseUser = null;

    try {
    const { name, email, password, schoolId, phoneNo } = req.body;

        if (!schoolId) {
            return res.status(400).json({ error: "School ID is required" });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: "User already exists" });
        }

        // Create Firebase user
        firebaseUser = await auth.createUser({
            email,
            password,
            displayName: name,
        });
        
        try {
            // Create MongoDB user
            const user = new User({
                uid: firebaseUser.uid,
                name,
                email: firebaseUser.email,
                role: UserRole.SCHOOL_ADMIN,
                schoolId,
                phoneNo,
            });

            await user.save();

            res.status(201).json({
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                schoolId: user.schoolId,
                phoneNo: user.phoneNo,
            });
        } catch (mongoError) {
            // If MongoDB save fails, clean up Firebase user
            if (firebaseUser) {
                try {
                    await auth.deleteUser(firebaseUser.uid);
                    console.log(`Cleaned up: Firebase user ${firebaseUser.uid} deleted due to MongoDB error`);
                } catch (deleteErr) {
                    console.error("Failed to delete Firebase user during cleanup:", deleteErr);
                }
        }
            throw mongoError;
        }
    } catch (error: any) {
        console.error('Error in school admin creation:', error);
        if (error?.code === 'auth/email-already-exists') {
            return res.status(400).json({ error: "Email already exists in Firebase" });
        }
        res.status(500).json({ error: "Failed to create school admin" });
    }
};

export const getSchoolAdmins = async (req: Request, res: Response) => {
    try {
        const schoolAdmins = await User.find({ role: UserRole.SCHOOL_ADMIN })
            .select('-__v')
            .populate('schoolId', 'name');

        res.json(schoolAdmins);
    } catch (error) {
        console.error('Error fetching school admins:', error);
        res.status(500).json({ error: "Failed to fetch school admins" });
    }
};

export const getSchoolAdmin = async (req: Request, res: Response) => {
    try {
        const { uid } = req.params;

        const schoolAdmin = await User.findOne({ 
            uid, 
            role: UserRole.SCHOOL_ADMIN 
        })
        .select('-__v')
        .populate('schoolId', 'name');

        if (!schoolAdmin) {
            return res.status(404).json({ error: "School admin not found" });
        }

        res.json(schoolAdmin);
    } catch (error) {
        console.error('Error fetching school admin:', error);
        res.status(500).json({ error: "Failed to fetch school admin" });
    }
};

export const updateSchoolAdmin = async (req: Request, res: Response) => {
    try {
        const { uid } = req.params;
    const { name, email, schoolId, phoneNo } = req.body;

        // Find the school admin first
        const schoolAdmin = await User.findOne({ uid, role: UserRole.SCHOOL_ADMIN });
        if (!schoolAdmin) {
            return res.status(404).json({ error: "School admin not found" });
        }

        // Update in Firebase first
        const updateData: { displayName?: string; email?: string } = {};
        if (name) updateData.displayName = name;
        if (email) updateData.email = email;

        if (Object.keys(updateData).length > 0) {
            await auth.updateUser(uid, updateData);
        }

        // Then update in MongoDB
        const updatedUser = await User.findOneAndUpdate(
            { uid },
            { 
                ...(name && { name }),
                ...(email && { email }),
                ...(schoolId && { schoolId }),
                ...(phoneNo && { phoneNo })
            },
            { new: true }
        ).populate('schoolId', 'name');

        if (!updatedUser) {
            // This shouldn't happen as we checked existence before
            throw new Error("User not found after update");
        }

        res.json({
            id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            role: updatedUser.role,
            schoolId: updatedUser.schoolId,
            phoneNo: updatedUser.phoneNo,
        });

    } catch (error: any) {
        console.error('Error updating school admin:', error);
        
        // Handle specific Firebase errors
        if (error?.code === 'auth/email-already-exists') {
            return res.status(400).json({ error: "Email already exists" });
        }
        if (error?.code === 'auth/user-not-found') {
            return res.status(404).json({ error: "User not found in Firebase" });
        }
        
        res.status(500).json({ error: "Failed to update school admin" });
    }
};

export const deleteSchoolAdmin = async (req: Request, res: Response) => {
    try {
        const { uid } = req.params;

        // Delete from MongoDB first
        const deletedUser = await User.findOneAndDelete({ uid });
        if (!deletedUser) {
            return res.status(404).json({ error: "School admin not found" });
        }

        // Then delete from Firebase
        await auth.deleteUser(uid);

        res.json({ message: "School admin deleted successfully" });
    } catch (error) {
        console.error('Error deleting school admin:', error);
        res.status(500).json({ error: "Failed to delete school admin" });
    }
};
