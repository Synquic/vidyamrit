import mongoose, { Document } from "mongoose";
import { IUser } from "./UserModel";
import { ISchool } from "./SchoolModel";
import { IStudent } from "./StudentModel";

export interface IAssessment extends Document {
  student: mongoose.Types.ObjectId | IStudent; // Reference to the student
  school: mongoose.Types.ObjectId | ISchool; // Reference to the school
  mentor: mongoose.Types.ObjectId | IUser; // Reference to the mentor
  subject: string; // Subject of the assessment - flexible to support any subject
  level: number; // Knowledge level determined by the assessment
  date: Date; // Date of the assessment
}

const AssessmentSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
    required: true,
  },
  school: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "School",
    required: true,
  },
  mentor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  subject: {
    type: String,
    required: true,
    trim: true, // Automatically trim whitespace
    lowercase: true, // Store subjects in lowercase for consistency
  },
  level: { type: Number, required: true },
  date: { type: Date, default: Date.now },
});

const Assessment = mongoose.model<IAssessment>("Assessment", AssessmentSchema);
export default Assessment;
