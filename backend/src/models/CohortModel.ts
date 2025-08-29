import mongoose, { Document } from 'mongoose';

export interface ICohort extends Document {
    name: string;
    schoolId: mongoose.Types.ObjectId;
    mentorId: mongoose.Types.ObjectId;
    students: Array<{
        _id: string;
    }>;
    createdAt: Date;
    updatedAt: Date;
}

const CohortSchema = new mongoose.Schema({
    name: { type: String, required: true },
    schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
    mentorId: { type: String, required: true },
    students: [
        {
            uid: { type: String, required: true }
        }
    ],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const Cohort = mongoose.model<ICohort>('Cohort', CohortSchema);
export default Cohort;
