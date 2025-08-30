import { Response } from 'express';
import { auth } from '../configs/firebaseAdmin';
import User from '../models/UserModel';
import { UserRole } from '../configs/roles';
import { AuthRequest } from '../types/auth';

import { Request } from 'express';
import { CreateUserRequest, UpdateUserRequest, UserParams } from '../types/requests';

export const createMentor = async (
    req: Request<{}, {}, CreateUserRequest>,
    res: Response
) => {
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
                role: UserRole.MENTOR,
                schoolId,
                phoneNo,
            });

            await user.save();

            const populatedUser = await user.populate('schoolId', 'name');

            res.status(201).json({
                id: populatedUser._id,
                name: populatedUser.name,
                email: populatedUser.email,
                phoneNo: populatedUser.phoneNo,
                role: populatedUser.role,
                schoolId: populatedUser.schoolId
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
        console.error('Error in mentor creation:', error);
        if (error?.code === 'auth/email-already-exists') {
            return res.status(400).json({ error: "Email already exists in Firebase" });
        }
        res.status(500).json({ error: "Failed to create mentor" });
    }
};

export const getMentors = async (
    req: AuthRequest<{}, {}, {}>,
    res: Response
) => {
    try {
        const { schoolId } = req.query;
        const filter: any = { role: UserRole.MENTOR };
        
        // If schoolId is provided and user is not super admin, filter by school
        if (schoolId && req.user && req.user.role !== UserRole.SUPER_ADMIN) {
            filter.schoolId = schoolId;
        }

        const mentors = await User.find(filter)
            .select('-__v')
            .populate('schoolId', 'name');

        res.json(mentors);
    } catch (error) {
        console.error('Error fetching mentors:', error);
        res.status(500).json({ error: "Failed to fetch mentors" });
    }
};

export const getMentor = async (
    req: AuthRequest<UserParams>,
    res: Response
) => {
    try {
        const { uid } = req.params;
        const { role, schoolId: userSchoolId } = req.user || {};

        const query: any = { 
            uid, 
            role: UserRole.MENTOR 
        };

        // If not super admin, only allow fetching mentors from same school
        if (role !== UserRole.SUPER_ADMIN) {
            query.schoolId = userSchoolId;
        }

        const mentor = await User.findOne(query)
            .select('-__v')
            .populate('schoolId', 'name');

        if (!mentor) {
            return res.status(404).json({ error: "Mentor not found" });
        }

        res.json(mentor);
    } catch (error) {
        console.error('Error fetching mentor:', error);
        res.status(500).json({ error: "Failed to fetch mentor" });
    }
};

export const updateMentor = async (
    req: AuthRequest<UserParams, {}, UpdateUserRequest>,
    res: Response
) => {
    try {
        const { uid } = req.params;
        const { name, email, schoolId, phoneNo } = req.body;
        const { role, schoolId: userSchoolId } = req.user || {};

        // Find the mentor first
        const query: any = { uid, role: UserRole.MENTOR };
        if (role !== UserRole.SUPER_ADMIN) {
            query.schoolId = userSchoolId;
        }

        const mentor = await User.findOne(query);
        if (!mentor) {
            return res.status(404).json({ error: "Mentor not found" });
        }

        // Update in Firebase first
        const updateData: { displayName?: string; email?: string } = {};
        if (name) updateData.displayName = name;
        if (email) updateData.email = email;

        if (Object.keys(updateData).length > 0) {
            await auth.updateUser(mentor.uid, updateData);
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
            throw new Error("User not found after update");
        }

        res.json({
            id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            phoneNo: updatedUser.phoneNo,
            role: updatedUser.role,
            schoolId: updatedUser.schoolId
        });

    } catch (error: any) {
        console.error('Error updating mentor:', error);
        if (error?.code === 'auth/email-already-exists') {
            return res.status(400).json({ error: "Email already exists" });
        }
        res.status(500).json({ error: "Failed to update mentor" });
    }
};

export const deleteMentor = async (
    req: AuthRequest<UserParams>,
    res: Response
) => {
    try {
        const { uid } = req.params;
        const { role, schoolId: userSchoolId } = req.user || {};

        const query: any = { uid, role: UserRole.MENTOR };
        if (role !== UserRole.SUPER_ADMIN) {
            query.schoolId = userSchoolId;
        }

        // Delete from MongoDB first
        const deletedUser = await User.findOneAndDelete(query);
        if (!deletedUser) {
            return res.status(404).json({ error: "Mentor not found" });
        }

        // Then delete from Firebase
        await auth.deleteUser(deletedUser.uid);

        res.json({ message: "Mentor deleted successfully" });
    } catch (error) {
        console.error('Error deleting mentor:', error);
        res.status(500).json({ error: "Failed to delete mentor" });
    }
};
