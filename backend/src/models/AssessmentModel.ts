import mongoose, { Document } from 'mongoose';
import { IUser } from './UserModel';
import { ISchool } from './SchoolModel';
import { IUser as IStudent } from './StudentModel';

export interface IAssessment extends Document {
    student: mongoose.Types.ObjectId | IStudent; // Reference to the student
    school: mongoose.Types.ObjectId | ISchool; // Reference to the school
    mentor: mongoose.Types.ObjectId | IUser; // Reference to the mentor
    subject: 'hindi' | 'math' | 'english'; // Subject of the assessment
    level: number; // Knowledge level determined by the assessment
    date: Date; // Date of the assessment
}


const AssessmentSchema = new mongoose.Schema({
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    school: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
    mentor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    subject: { type: String, enum: ['hindi', 'math', 'english'], required: true },
    level: { type: Number, required: true },
    date: { type: Date, default: Date.now },
});

const Assessment = mongoose.model<IAssessment>('Assessment', AssessmentSchema);
export default Assessment;