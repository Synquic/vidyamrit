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
  testPromotionType: "automatic" | "manual";
  groupFormat: "common" | "class_wise";
  programs: mongoose.Types.ObjectId[];
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
      required: false,
    },
    testPromotionType: {
      type: String,
      enum: ["automatic", "manual"],
      default: "automatic",
    },
    groupFormat: {
      type: String,
      enum: ["common", "class_wise"],
      default: "common",
    },
    programs: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Program",
    }],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

const School = mongoose.model<ISchool>("School", SchoolSchema);
export default School;
