import mongoose, { Document } from "mongoose";

export type StakeholderType =
  | "principal"
  | "director"
  | "education_minister"
  | "block_coordinator"
  | "district_coordinator"
  | "state_coordinator"
  | "custom";

export interface IViewConfig {
  sections: {
    schools?: {
      enabled: boolean;
      showTotal?: boolean;
      showActive?: boolean;
      showWithAssessments?: boolean;
      filters?: {
        block?: string[];
        state?: string[];
        type?: ("government" | "private")[];
      };
    };
    tutors?: {
      enabled: boolean;
      showTotal?: boolean;
      filters?: {
        schoolId?: mongoose.Types.ObjectId[];
      };
    };
    students?: {
      enabled: boolean;
      showTotal?: boolean;
      showActive?: boolean;
      showDropped?: boolean;
      filters?: {
        schoolId?: mongoose.Types.ObjectId[];
        block?: string[];
        state?: string[];
      };
    };
    cohorts?: {
      enabled: boolean;
      showTotal?: boolean;
      filters?: {
        schoolId?: mongoose.Types.ObjectId[];
        programId?: mongoose.Types.ObjectId[];
      };
    };
    assessments?: {
      enabled: boolean;
      showTotal?: boolean;
      filters?: {
        schoolId?: mongoose.Types.ObjectId[];
        programId?: mongoose.Types.ObjectId[];
        dateRange?: { start: Date; end: Date };
      };
    };
    progress?: {
      enabled: boolean;
      views?: (
        | "group"
        | "student"
        | "school"
        | "block"
        | "district"
        | "state"
        | "cohort"
        | "program"
      )[];
      filters?: {
        schoolId?: mongoose.Types.ObjectId[];
        programId?: mongoose.Types.ObjectId[];
        block?: string[];
        state?: string[];
      };
    };
    attendance?: {
      enabled: boolean;
      views?: ("student" | "cohort" | "school" | "block" | "state")[];
      filters?: {
        schoolId?: mongoose.Types.ObjectId[];
        cohortId?: mongoose.Types.ObjectId[];
        dateRange?: { start: Date; end: Date };
      };
    };
  };
  access: {
    allowedSchools?: mongoose.Types.ObjectId[];
    allowedBlocks?: string[];
    allowedStates?: string[];
  };
}

export interface IView extends Document {
  name: string;
  description?: string;
  stakeholderType: StakeholderType;
  customStakeholderType?: string; // If stakeholderType is "custom"
  createdBy: mongoose.Types.ObjectId;
  config: IViewConfig;
  viewUser: {
    email: string;
    password: string; // Hashed password (not stored, only Firebase)
    uid: string; // Firebase UID
    isActive: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

const ViewConfigSchema = new mongoose.Schema(
  {
    sections: {
      schools: {
        enabled: { type: Boolean, default: false },
        showTotal: { type: Boolean, default: true },
        showActive: { type: Boolean, default: true },
        showWithAssessments: { type: Boolean, default: true },
        filters: {
          block: [{ type: String }],
          state: [{ type: String }],
          type: [{ type: String, enum: ["government", "private"] }],
        },
      },
      tutors: {
        enabled: { type: Boolean, default: false },
        showTotal: { type: Boolean, default: true },
        filters: {
          schoolId: [{ type: mongoose.Schema.Types.ObjectId, ref: "School" }],
        },
      },
      students: {
        enabled: { type: Boolean, default: false },
        showTotal: { type: Boolean, default: true },
        showActive: { type: Boolean, default: true },
        showDropped: { type: Boolean, default: true },
        filters: {
          schoolId: [{ type: mongoose.Schema.Types.ObjectId, ref: "School" }],
          block: [{ type: String }],
          state: [{ type: String }],
        },
      },
      cohorts: {
        enabled: { type: Boolean, default: false },
        showTotal: { type: Boolean, default: true },
        filters: {
          schoolId: [{ type: mongoose.Schema.Types.ObjectId, ref: "School" }],
          programId: [
            { type: mongoose.Schema.Types.ObjectId, ref: "Program" },
          ],
        },
      },
      assessments: {
        enabled: { type: Boolean, default: false },
        showTotal: { type: Boolean, default: true },
        filters: {
          schoolId: [{ type: mongoose.Schema.Types.ObjectId, ref: "School" }],
          programId: [
            { type: mongoose.Schema.Types.ObjectId, ref: "Program" },
          ],
          dateRange: {
            start: { type: Date },
            end: { type: Date },
          },
        },
      },
      progress: {
        enabled: { type: Boolean, default: false },
        views: [
          {
            type: String,
            enum: [
              "group",
              "student",
              "school",
              "block",
              "district",
              "state",
              "cohort",
              "program",
            ],
          },
        ],
        filters: {
          schoolId: [{ type: mongoose.Schema.Types.ObjectId, ref: "School" }],
          programId: [
            { type: mongoose.Schema.Types.ObjectId, ref: "Program" },
          ],
          block: [{ type: String }],
          state: [{ type: String }],
        },
      },
      attendance: {
        enabled: { type: Boolean, default: false },
        views: [
          {
            type: String,
            enum: ["student", "cohort", "school", "block", "state"],
          },
        ],
        filters: {
          schoolId: [{ type: mongoose.Schema.Types.ObjectId, ref: "School" }],
          cohortId: [
            { type: mongoose.Schema.Types.ObjectId, ref: "Cohort" },
          ],
          dateRange: {
            start: { type: Date },
            end: { type: Date },
          },
        },
      },
    },
    access: {
      allowedSchools: [
        { type: mongoose.Schema.Types.ObjectId, ref: "School" },
      ],
      allowedBlocks: [{ type: String }],
      allowedStates: [{ type: String }],
    },
  },
  { _id: false }
);

const ViewSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: false },
    stakeholderType: {
      type: String,
      enum: [
        "principal",
        "director",
        "education_minister",
        "block_coordinator",
        "district_coordinator",
        "state_coordinator",
        "custom",
      ],
      required: true,
    },
    customStakeholderType: { type: String, required: false },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    config: { type: ViewConfigSchema, required: true },
    viewUser: {
      email: { type: String, required: true, unique: true },
      password: { type: String, required: false }, // Not stored, only for Firebase
      uid: { type: String, required: true, unique: true },
      isActive: { type: Boolean, default: true },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
ViewSchema.index({ createdBy: 1 });
ViewSchema.index({ "viewUser.email": 1 });
ViewSchema.index({ "viewUser.uid": 1 });
ViewSchema.index({ stakeholderType: 1 });

const View = mongoose.model<IView>("View", ViewSchema);
export default View;

