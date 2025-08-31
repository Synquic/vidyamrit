import mongoose, { Document } from 'mongoose';

export interface IUser extends Document {
    roll_no: string;
    name: string;
    age: number;
    gender: string;
    class: string;
    caste: string;
    schoolId?: mongoose.Types.ObjectId | null;
    contactInfo: IGuardianInfo[];
    knowledgeLevel: IKnowledgeLevel[];
    cohort: ICohort[];
    createdAt: Date;
    updatedAt: Date;
}

export interface IGuardianInfo {
    name: string;
    relation: string;
    occupation: string;
    phone_no: string;
}

export interface IKnowledgeLevel {
    level: number;
    date: Date;
}

export interface ICohort {
    cohortId: mongoose.Types.ObjectId;
    dateJoined: Date;
    dateLeaved?: Date;
}

const StudentSchema = new mongoose.Schema({
    roll_no: { type: String, required: true },
    name: { type: String, required: true },
    age: { type: Number, required: true },
    gender: { type: String, required: true },
    class: { type: String, required: true },
    caste: { type: String, required: true },
    schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: false },
    contactInfo: [{
        name: { type: String, required: true },
        relation: { type: String, required: true },
        occupation: { type: String, required: false },
        phone_no: { type: String, required: false }
    }],
    knowledgeLevel: [{
        level: { type: Number, required: true },
        date: { type: Date, required: true }
    }],
    cohort: [{
        cohortId: { type: mongoose.Schema.Types.ObjectId, ref: 'Cohort', required: true },
        dateJoined: { type: Date, required: true },
        dateLeaved: { type: Date, required: false }
    }],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const Student = mongoose.model<IUser>('Student', StudentSchema);
export default Student;
