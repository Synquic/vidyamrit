import mongoose, { Document } from 'mongoose';

export interface ISchool extends Document {
    name: string;
    address: string;
    udise_code: string;
    type: 'government' | 'private';
    level: 'primary' | 'middle';
    city: string;
    state: string;
    pinCode: string;
    establishedYear: number;
    school_admin: string;
    contact_details: Array<{
        designation: string;
        name: string;
        email: string;
        phone_no: string;
    }>;
    evaluationChecklist?: {
        minEligibleStudents?: {
            eligibleCount?: number;
            meetsCriteria?: boolean;
            notes?: string;
        };
        dedicatedRoom?: {
            images?: string[];
            notes?: string;
            submittedAt?: Date;
        };
        supportDocuments?: {
            documents?: { name: string; url: string }[];
            submittedAt?: Date;
        };
        ngoHistory?: Array<{ image?: string; text?: string; date?: Date }>;
        infrastructureAdequacy?: {
            rating?: number;
            notes?: string;
        };
        systemOutput?: 'include' | 'followup' | 'reject';
        status?: 'active' | 'inactive' | 'rejected' | 'followup';
    };
    createdAt: Date;
    updatedAt: Date;
}

const SchoolSchema = new mongoose.Schema({
    name: { type: String, required: true },
    address: { type: String, required: true },
    udise_code: { type: String, required: true, unique: true },
    type: { type: String, enum: ['government', 'private'], required: true },
    level: { type: String, enum: ['primary', 'middle'], required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pinCode: { type: String, required: true },
    establishedYear: { type: Number, required: true },
    school_admin: { type: String, required: true },
    contact_details: [{
        designation: { type: String, required: true },
        name: { type: String, required: true },
        email: { type: String, required: true },
        phone_no: { type: String, required: true }
    }],
    evaluationChecklist: {
        minEligibleStudents: {
            eligibleCount: { type: Number },
            meetsCriteria: { type: Boolean },
            notes: { type: String }
        },
        dedicatedRoom: {
            images: [{ type: String }],
            notes: { type: String },
            submittedAt: { type: Date }
        },
        supportDocuments: {
            documents: [{ name: { type: String }, url: { type: String } }],
            submittedAt: { type: Date }
        },
        ngoHistory: [{ image: { type: String }, text: { type: String }, date: { type: Date } }],
        infrastructureAdequacy: {
            rating: { type: Number },
            notes: { type: String }
        },
        systemOutput: { type: String, enum: ['include', 'followup', 'reject'], default: 'followup' },
        status: { type: String, enum: ['active', 'inactive', 'rejected', 'followup'], default: 'followup' }
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, {
    timestamps: true
});

const School = mongoose.model<ISchool>('School', SchoolSchema);
export default School;
