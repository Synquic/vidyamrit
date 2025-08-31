import mongoose, { Document } from 'mongoose';
import { UserRole } from '../configs/roles';

export interface IUser extends Document {
    uid: string;
    name: string;
    email: string;
    phoneNo: string;
    role: UserRole;
    schoolId?: mongoose.Types.ObjectId | null;
    createdAt: Date;
    updatedAt: Date;
}

const UserSchema = new mongoose.Schema({
    uid: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phoneNo: { type: String, required: true},
    role: { type: String, enum: Object.values(UserRole), required: true },
    schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: false },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', UserSchema);
export default User;
