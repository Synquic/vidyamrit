import { User } from "./auth";

export enum StudentStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  GRADUATED = "graduated",
  TRANSFERRED = "transferred",
  DROPPED_OUT = "dropped_out",
}

export enum LearningStyle {
  VISUAL = "visual",
  AUDITORY = "auditory",
  KINESTHETIC = "kinesthetic",
  READING_WRITING = "reading_writing",
  MULTIMODAL = "multimodal",
}

export enum AcademicLevel {
  BELOW_GRADE = "below_grade",
  AT_GRADE = "at_grade",
  ABOVE_GRADE = "above_grade",
  ADVANCED = "advanced",
}

export interface ParentGuardianInfo {
  name: string;
  relationship: string;
  primaryContact: boolean;
  phoneNumber: string;
  email?: string;
  occupation?: string;
  workAddress?: string;
  emergencyContact: boolean;
  communicationPreference: "phone" | "email" | "sms" | "whatsapp";
  preferredLanguage: string;
}

export interface FamilyBackground {
  socioEconomicStatus:
    | "low"
    | "lower_middle"
    | "middle"
    | "upper_middle"
    | "high";
  householdSize: number;
  primaryLanguageAtHome: string;
  otherLanguagesSpoken: string[];
  educationLevelOfParents: {
    father: string;
    mother: string;
  };
  specialCircumstances?: string;
}

export interface LearningPreferences {
  learningStyle: LearningStyle;
  preferredLanguage: string;
  studyTimePreference: string;
  groupVsIndividual: string;
  motivationFactors: string[];
  challenges: string[];
  strengths: string[];
  interests: string[];
  careerAspirations: string[];
}

export interface HealthInformation {
  allergies: string[];
  medicalConditions: string[];
  medications: Array<{
    name: string;
    dosage: string;
    frequency: string;
    prescribedBy: string;
  }>;
  vaccinations: Array<{
    vaccine: string;
    dateAdministered: Date;
    nextDue?: Date;
  }>;
  emergencyMedicalInfo?: string;
  doctorContact?: {
    name: string;
    phoneNumber: string;
    address: string;
  };
}

export interface SpecialNeedsSupport {
  identifiedNeeds: string[];
  accommodations: string[];
  supportServices: string[];
  iepExists: boolean;
  lastAssessmentDate?: Date;
}

export interface SubjectRecord {
  subject: string;
  teacher: User;
  grades: Array<{
    type: string;
    score: number;
    maxScore: number;
    date: Date;
    comments?: string;
  }>;
  attendance: {
    totalClasses: number;
    attendedClasses: number;
    lateArrivals: number;
  };
  currentGrade: string;
  passStatus: "pass" | "fail" | "pending";
}

export interface AcademicRecord {
  _id: string;
  academicYear: string;
  level: AcademicLevel;
  subjects: SubjectRecord[];
  overallGPA: number;
  attendancePercentage: number;
  promotionStatus: "promoted" | "retained" | "conditional" | "pending";
  achievements: string[];
  concerns: string[];
  teacherComments: string;
}

export interface AssessmentHistory {
  _id: string;
  assessmentType:
    | "baseline"
    | "progress"
    | "diagnostic"
    | "summative"
    | "standardized";
  subject: string;
  skillsAssessed: string[];
  scores: Array<{
    skill: string;
    score: number;
    maxScore: number;
    proficiencyLevel: "below_basic" | "basic" | "proficient" | "advanced";
  }>;
  overallScore: number;
  percentile?: number;
  date: Date;
  conductedBy: User;
  recommendations: string[];
  notes: string;
}

export interface BehavioralRecord {
  _id: string;
  date: Date;
  type: "positive" | "negative";
  category: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  reportedBy: User;
  actionTaken?: string;
  followUpRequired: boolean;
  followUpDate?: Date;
  resolved: boolean;
  parentNotified: boolean;
}

export interface CommunicationLog {
  _id: string;
  date: Date;
  type: "phone_call" | "email" | "meeting" | "home_visit" | "note";
  participants: string[];
  subject: string;
  summary: string;
  actionItems: Array<{
    task: string;
    assignedTo: string;
    dueDate: Date;
    completed: boolean;
  }>;
  followUpRequired: boolean;
  nextFollowUpDate?: Date;
  priority: "low" | "medium" | "high";
}

export interface ExtracurricularActivity {
  _id: string;
  activityName: string;
  category: string;
  mentor?: User;
  startDate: Date;
  endDate?: Date;
  participationLevel: "member" | "leader" | "captain" | "organizer";
  achievements: string[];
  skillsDeveloped: string[];
  timeCommitment: string;
  status: "active" | "completed" | "discontinued";
}

export interface InterventionProgress {
  date: Date;
  notes: string;
  effectiveness: number;
}

export interface Intervention {
  _id: string;
  type: "academic" | "behavioral" | "social" | "emotional" | "health";
  description: string;
  targetSkills: string[];
  provider: User;
  startDate: Date;
  endDate?: Date;
  frequency: string;
  duration: string;
  progress: InterventionProgress[];
  status: "planned" | "active" | "paused" | "completed" | "discontinued";
  outcome?: string;
  effectiveness?: number;
}

export interface Goal {
  goal: string;
  targetDate: Date;
  priority: "low" | "medium" | "high";
  progress: number;
  milestones: Array<{
    description: string;
    targetDate: Date;
    completed: boolean;
    completedDate?: Date;
  }>;
  status: "not_started" | "in_progress" | "completed" | "paused";
}

export interface AcademicGoals {
  shortTerm: Goal[];
  longTerm: Goal[];
}

export interface PersonalDevelopmentGoals {
  social: Goal[];
  emotional: Goal[];
  behavioral: Goal[];
  physical: Goal[];
}

export interface PerformanceMetrics {
  academicTrend: "improving" | "stable" | "declining";
  attendanceTrend: "improving" | "stable" | "declining";
  behaviorTrend: "improving" | "stable" | "declining";
  engagementLevel: "low" | "medium" | "high";
  riskFactors: string[];
  strengths: string[];
  recommendations: string[];
  lastAnalyzed: Date;
}

export interface PrivacySettings {
  shareAcademicInfo: boolean;
  shareBehavioralInfo: boolean;
  shareHealthInfo: boolean;
  shareContactInfo: boolean;
  allowPhotography: boolean;
  allowSocialMedia: boolean;
  emergencyContactConsent: boolean;
}

export interface TransferRecord {
  fromSchool: string;
  toSchool: string;
  transferDate: Date;
  reason: string;
  academicRecords: string;
  documents: string[];
}

export interface EnhancedStudentProfile {
  _id: string;
  studentId: {
    _id: string;
    name: string;
    email: string;
    phoneNo: string;
    class: string;
    school: string;
  };
  admissionNumber: string;
  admissionDate: Date;
  status: StudentStatus;
  currentLevel: AcademicLevel;
  previousEducation?: {
    schoolName: string;
    board: string;
    yearCompleted: number;
    percentage: number;
    subjects: string[];
  };
  parentsGuardians: ParentGuardianInfo[];
  familyBackground?: FamilyBackground;
  learningPreferences: LearningPreferences;
  healthInformation: HealthInformation;
  specialNeedsSupport?: SpecialNeedsSupport;
  academicRecords: AcademicRecord[];
  assessmentHistory: AssessmentHistory[];
  extracurricularActivities: ExtracurricularActivity[];
  behavioralRecords: BehavioralRecord[];
  communicationLogs: CommunicationLog[];
  transferHistory: TransferRecord[];
  academicGoals: AcademicGoals;
  personalDevelopmentGoals: PersonalDevelopmentGoals;
  performanceMetrics: PerformanceMetrics;
  interventions: Intervention[];
  privacySettings: PrivacySettings;
  lastUpdatedBy: User;
  createdAt: Date;
  updatedAt: Date;
}
