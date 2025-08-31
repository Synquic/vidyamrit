import mongoose, { Document } from 'mongoose';

export interface IQuestionSet extends Document {
    subject: string;
    version: number;
    levels: Array<{
        level: number;
        title: string;
        instructions: string;
        questions: Array<{
            question: string;
            options?: string[];
            correct_answer?: string;
        }>;
    }>;
    createdAt: Date;
    updatedAt: Date;
}

const QuestionSetSchema = new mongoose.Schema({
    subject: { type: String, required: true },
    version: { type: Number, required: true},
    levels: [
        {
            level: { type: Number, required: true },
            title: { type: String, required: true },
            instructions: { type: String, required: true },
            questions: [
                {
                    question: { type: String, required: true },
                    options: [{ type: String }],
                    correct_answer: { type: String }
                }
            ]
        }
    ],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const QuestionSet = mongoose.model<IQuestionSet>('QuestionSet', QuestionSetSchema);
export default QuestionSet;
