import mongoose, { Schema, Document } from "mongoose";

export type GroupLevel = "A" | "B" | "C" | "D" | "E";
export type Subject = "hindi" | "math" | "english";

export interface IGroup extends Document {
  _id: string;
  name: string;
  level: GroupLevel;
  subject: Subject;
  school: mongoose.Types.ObjectId;
  mentor?: mongoose.Types.ObjectId;
  students: mongoose.Types.ObjectId[];
  description?: string;
  minLevel: number; // Minimum assessment level for this group
  maxLevel: number; // Maximum assessment level for this group
  capacity: number; // Maximum number of students
  autoAssignment: boolean; // Whether to auto-assign students based on assessment levels
  createdAt: Date;
  updatedAt: Date;
}

const GroupSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    level: {
      type: String,
      enum: ["A", "B", "C", "D", "E"],
      required: true,
    },
    subject: {
      type: String,
      enum: ["hindi", "math", "english"],
      required: true,
    },
    school: {
      type: Schema.Types.ObjectId,
      ref: "School",
      required: true,
    },
    mentor: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    students: [
      {
        type: Schema.Types.ObjectId,
        ref: "Student",
      },
    ],
    description: {
      type: String,
      trim: true,
    },
    minLevel: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    maxLevel: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    capacity: {
      type: Number,
      required: true,
      min: 1,
      default: 30,
    },
    autoAssignment: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
GroupSchema.index({ school: 1, subject: 1, level: 1 });
GroupSchema.index({ school: 1, mentor: 1 });
GroupSchema.index({ students: 1 });

// Validation: minLevel should be <= maxLevel
GroupSchema.pre("save", function (next) {
  if (this.minLevel > this.maxLevel) {
    next(new Error("Minimum level cannot be greater than maximum level"));
  }
  next();
});

// Virtual for student count
GroupSchema.virtual("studentCount").get(function () {
  return this.students ? this.students.length : 0;
});

// Virtual for available spots
GroupSchema.virtual("availableSpots").get(function () {
  return this.capacity - (this.students ? this.students.length : 0);
});

export default mongoose.model<IGroup>("Group", GroupSchema);
