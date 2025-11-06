import mongoose, { Document } from "mongoose";

export interface ISchool extends Document {
  name: string;
  type: "government" | "private";
  udise_code: string;
  address: string;
  level: "primary" | "middle";
  city: string;
  state: string;
  establishedYear: number;
  pinCode: string;
  pointOfContact: string;
  phone: string;
  block?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SchoolSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    type: { type: String, enum: ["government", "private"], required: true },
    udise_code: { type: String, required: true, unique: true },
    address: { type: String, required: true },
    level: { type: String, enum: ["primary", "middle"], required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    establishedYear: { type: Number, required: true },
    pinCode: { type: String, required: true },
    pointOfContact: { type: String, required: true },
    phone: { type: String, required: true },
    block: {
      type: String,
      enum: [
        "Indore Urban 1",
        "Indore Urban 2",
        "Indore Rural",
        "Sanwer",
        "Mhow",
        "Depalpur",
      ],
      required: false,
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

const School = mongoose.model<ISchool>("School", SchoolSchema);
export default School;
