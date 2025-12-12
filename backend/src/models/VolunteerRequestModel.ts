import mongoose, { Document } from "mongoose";

export interface IVolunteerRequest extends Document {
  name: string;
  email: string;
  phoneNumber: string;
  city: string;
  state: string;
  pincode: string;
  education: string;
  experience?: string;
  motivation?: string;
  status: "pending" | "approved" | "rejected";
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const VolunteerRequestSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    education: { type: String, required: true },
    experience: { type: String, required: false },
    motivation: { type: String, required: false },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    reviewedAt: { type: Date, required: false },
    rejectionReason: { type: String, required: false },
  },
  {
    timestamps: true,
  }
);

const VolunteerRequest = mongoose.model<IVolunteerRequest>(
  "VolunteerRequest",
  VolunteerRequestSchema
);
export default VolunteerRequest;


