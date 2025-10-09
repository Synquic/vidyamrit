import mongoose, { Document } from "mongoose";

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
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "School",
    required: true,
  },
  mentorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    validate: {
      validator: async function (value: mongoose.Types.ObjectId) {
        const User = mongoose.model("User");
        const user = await User.findById(value);
        return (
          user && ["mentor", "school_admin", "super_admin"].includes(user.role)
        );
      },
      message:
        "mentorId must reference a user with role MENTOR, SCHOOL_ADMIN, or SUPER_ADMIN",
    },
  },
  students: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
  ],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const Cohort = mongoose.model<ICohort>("Cohort", CohortSchema);
export default Cohort;
