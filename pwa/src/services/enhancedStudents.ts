import { authAxios, apiUrl } from "./index";
import {
  EnhancedStudentProfile,
  StudentStatus,
  LearningStyle,
  AcademicLevel,
  AcademicRecord,
  AssessmentHistory,
  BehavioralRecord,
  CommunicationLog,
  ExtracurricularActivity,
  Intervention,
  AcademicGoals,
  PersonalDevelopmentGoals,
  ParentGuardianInfo,
  Goal,
} from "../types/enhancedStudent";

export interface CreateEnhancedStudentProfileData {
  studentId: string;
  admissionNumber: string;
  admissionDate: string;
  previousEducation?: {
    schoolName: string;
    board: string;
    yearCompleted: number;
    percentage: number;
    subjects: string[];
  };
  parentsGuardians: Array<{
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
  }>;
  familyBackground?: {
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
  };
  learningPreferences?: {
    learningStyle: LearningStyle;
    preferredLanguage: string;
    studyTimePreference: string;
    groupVsIndividual: string;
    motivationFactors: string[];
    challenges: string[];
    strengths: string[];
    interests: string[];
    careerAspirations: string[];
  };
  healthInformation?: {
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
      dateAdministered: string;
      nextDue?: string;
    }>;
    emergencyMedicalInfo?: string;
    doctorContact?: {
      name: string;
      phoneNumber: string;
      address: string;
    };
  };
  specialNeedsSupport?: {
    identifiedNeeds: string[];
    accommodations: string[];
    supportServices: string[];
    iepExists: boolean;
    lastAssessmentDate?: string;
  };
  academicGoals?: AcademicGoals;
  personalDevelopmentGoals?: PersonalDevelopmentGoals;
  privacySettings?: {
    shareAcademicInfo: boolean;
    shareBehavioralInfo: boolean;
    shareHealthInfo: boolean;
    shareContactInfo: boolean;
    allowPhotography: boolean;
    allowSocialMedia: boolean;
    emergencyContactConsent: boolean;
  };
}

export interface EnhancedStudentProfileFilters {
  schoolId?: string;
  status?: StudentStatus;
  currentLevel?: AcademicLevel;
  learningStyle?: LearningStyle;
  academicTrend?: string;
  engagementLevel?: string;
  hasSpecialNeeds?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface StudentStatistics {
  totalStudents: number;
  activeStudents: number;
  inactiveStudents: number;
  studentsWithSpecialNeeds: number;
  highEngagementStudents: number;
  mediumEngagementStudents: number;
  lowEngagementStudents: number;
  improvingTrend: number;
  decliningTrend: number;
  learningStyleDistribution: Array<{
    _id: LearningStyle;
    count: number;
  }>;
  academicLevelDistribution: Array<{
    _id: AcademicLevel;
    count: number;
  }>;
}

export interface StudentReport {
  type: "comprehensive" | "academic" | "behavioral";
  generatedOn: string;
  studentInfo: {
    name: string;
    admissionNumber: string;
    currentLevel: AcademicLevel;
    status: StudentStatus;
  };
  summary: string;
  sections: Array<{
    title: string;
    content: Record<string, unknown>;
  }>;
  recommendations: string[];
}

export interface UpcomingGoals {
  academic: Array<{
    goal: string;
    targetDate: string;
    priority: string;
    progress: number;
  }>;
  personal: Array<{
    goal: string;
    targetDate: string;
    priority: string;
    progress: number;
  }>;
}

export interface AttendanceOverview {
  period: string;
  totalDays: number;
  presentDays: number;
  absentDays: number;
  lateArrivals: number;
  attendancePercentage: number;
  monthlyBreakdown: Array<{
    month: string;
    percentage: number;
  }>;
}

export interface BehavioralSummary {
  period: string;
  positiveIncidents: number;
  negativeIncidents: number;
  interventionsActive: number;
  behaviorTrend: "improving" | "stable" | "declining";
  recentIncidents: Array<{
    date: string;
    type: "positive" | "negative";
    description: string;
    severity: string;
  }>;
}

class EnhancedStudentService {
  private baseUrl = `${apiUrl}/enhanced-students`;

  // Create enhanced student profile
  async createEnhancedStudentProfile(
    data: CreateEnhancedStudentProfileData
  ): Promise<EnhancedStudentProfile> {
    const response = await authAxios.post(this.baseUrl, data);
    return response.data.profile;
  }

  // Get enhanced student profiles with filtering
  async getEnhancedStudentProfiles(
    filters: EnhancedStudentProfileFilters = {}
  ) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    const response = await authAxios.get(
      `${this.baseUrl}?${params.toString()}`
    );
    return response.data;
  }

  // Get enhanced student profile by ID
  async getEnhancedStudentProfileById(
    id: string
  ): Promise<EnhancedStudentProfile> {
    const response = await authAxios.get(`${this.baseUrl}/${id}`);
    return response.data.profile;
  }

  // Update enhanced student profile
  async updateEnhancedStudentProfile(
    id: string,
    updates: Partial<EnhancedStudentProfile>
  ): Promise<EnhancedStudentProfile> {
    const response = await authAxios.put(`${this.baseUrl}/${id}`, updates);
    return response.data.profile;
  }

  // Delete enhanced student profile
  async deleteEnhancedStudentProfile(id: string): Promise<void> {
    await authAxios.delete(`${this.baseUrl}/${id}`);
  }

  // Academic Records Management
  async addAcademicRecord(
    id: string,
    recordData: Omit<AcademicRecord, "_id">
  ): Promise<EnhancedStudentProfile> {
    const response = await authAxios.post(
      `${this.baseUrl}/${id}/academic-records`,
      recordData
    );
    return response.data.profile;
  }

  // Assessment Management
  async addAssessmentRecord(
    id: string,
    assessmentData: Omit<AssessmentHistory, "_id" | "conductedBy">
  ): Promise<EnhancedStudentProfile> {
    const response = await authAxios.post(
      `${this.baseUrl}/${id}/assessments`,
      assessmentData
    );
    return response.data.profile;
  }

  // Behavioral Records Management
  async addBehavioralRecord(
    id: string,
    behaviorData: Omit<BehavioralRecord, "_id" | "reportedBy" | "date">
  ): Promise<EnhancedStudentProfile> {
    const response = await authAxios.post(
      `${this.baseUrl}/${id}/behavioral-records`,
      behaviorData
    );
    return response.data.profile;
  }

  async getBehavioralSummary(
    id: string,
    period?: string
  ): Promise<BehavioralSummary> {
    const params = period ? `?period=${period}` : "";
    const response = await authAxios.get(
      `${this.baseUrl}/${id}/behavioral-summary${params}`
    );
    return response.data.behavioralSummary;
  }

  // Communication Management
  async addCommunicationLog(
    id: string,
    communicationData: Omit<CommunicationLog, "_id" | "date">
  ): Promise<EnhancedStudentProfile> {
    const response = await authAxios.post(
      `${this.baseUrl}/${id}/communication-logs`,
      communicationData
    );
    return response.data.profile;
  }

  // Extracurricular Activities Management
  async addExtracurricularActivity(
    id: string,
    activityData: Omit<ExtracurricularActivity, "_id">
  ): Promise<EnhancedStudentProfile> {
    const response = await authAxios.post(
      `${this.baseUrl}/${id}/extracurricular-activities`,
      activityData
    );
    return response.data.profile;
  }

  // Intervention Management
  async addIntervention(
    id: string,
    interventionData: Omit<Intervention, "_id" | "provider" | "progress">
  ): Promise<EnhancedStudentProfile> {
    const response = await authAxios.post(
      `${this.baseUrl}/${id}/interventions`,
      interventionData
    );
    return response.data.profile;
  }

  async updateInterventionProgress(
    id: string,
    interventionId: string,
    progressData: {
      notes: string;
      effectiveness: number;
    }
  ): Promise<EnhancedStudentProfile> {
    const response = await authAxios.put(
      `${this.baseUrl}/${id}/interventions/${interventionId}/progress`,
      progressData
    );
    return response.data.profile;
  }

  // Goals Management
  async updateAcademicGoals(
    id: string,
    goals: AcademicGoals
  ): Promise<EnhancedStudentProfile> {
    const response = await authAxios.put(
      `${this.baseUrl}/${id}/academic-goals`,
      goals
    );
    return response.data.profile;
  }

  async getUpcomingGoals(id: string): Promise<UpcomingGoals> {
    const response = await authAxios.get(
      `${this.baseUrl}/${id}/upcoming-goals`
    );
    return response.data.upcomingGoals;
  }

  // Performance and Analytics
  async updatePerformanceMetrics(id: string): Promise<EnhancedStudentProfile> {
    const response = await authAxios.put(
      `${this.baseUrl}/${id}/performance-metrics`
    );
    return response.data.profile;
  }

  async getAttendanceOverview(
    id: string,
    period?: string
  ): Promise<AttendanceOverview> {
    const params = period ? `?period=${period}` : "";
    const response = await authAxios.get(
      `${this.baseUrl}/${id}/attendance-overview${params}`
    );
    return response.data.attendanceOverview;
  }

  // Statistics and Reporting
  async getStudentStatistics(
    schoolId?: string,
    dateFrom?: string,
    dateTo?: string
  ): Promise<StudentStatistics> {
    const params = new URLSearchParams();
    if (schoolId) params.append("schoolId", schoolId);
    if (dateFrom) params.append("dateFrom", dateFrom);
    if (dateTo) params.append("dateTo", dateTo);

    const response = await authAxios.get(
      `${this.baseUrl}/statistics?${params.toString()}`
    );
    return response.data;
  }

  async generateStudentReport(
    id: string,
    type: "comprehensive" | "academic" | "behavioral" = "comprehensive"
  ): Promise<StudentReport> {
    const response = await authAxios.get(
      `${this.baseUrl}/${id}/report?type=${type}`
    );
    return response.data.report;
  }

  // Helper methods for UI components
  async getStudentProfileSummary(id: string) {
    const profile = await this.getEnhancedStudentProfileById(id);
    return {
      basicInfo: {
        name: profile.studentId.name,
        admissionNumber: profile.admissionNumber,
        currentLevel: profile.currentLevel,
        status: profile.status,
        joiningDate: profile.admissionDate,
      },
      contactInfo: {
        primaryContact: profile.parentsGuardians.find(
          (p: ParentGuardianInfo) => p.primaryContact
        ),
        emergencyContact: profile.parentsGuardians.find(
          (p: ParentGuardianInfo) => p.emergencyContact
        ),
      },
      academicOverview: {
        currentGPA: profile.getCurrentGPA(),
        attendanceRate: profile.getAttendanceOverview().attendancePercentage,
        behaviorTrend: profile.performanceMetrics.behaviorTrend,
        engagementLevel: profile.performanceMetrics.engagementLevel,
      },
      recentActivity: {
        lastAssessment:
          profile.assessmentHistory[profile.assessmentHistory.length - 1],
        recentBehavior: profile.getBehavioralSummary(),
        upcomingGoals: await this.getUpcomingGoals(id),
      },
    };
  }

  async searchStudents(
    query: string,
    filters: EnhancedStudentProfileFilters = {}
  ) {
    const searchFilters = {
      ...filters,
      limit: 50,
    };

    const result = await this.getEnhancedStudentProfiles(searchFilters);

    // Client-side filtering by name (could be moved to backend)
    if (query) {
      result.profiles = result.profiles.filter(
        (profile: EnhancedStudentProfile) =>
          profile.studentId.name.toLowerCase().includes(query.toLowerCase()) ||
          profile.admissionNumber.toLowerCase().includes(query.toLowerCase())
      );
    }

    return result;
  }

  // Utility methods for form validation and data formatting
  validateEnhancedProfileData(
    data: CreateEnhancedStudentProfileData
  ): string[] {
    const errors: string[] = [];

    if (!data.studentId) errors.push("Student ID is required");
    if (!data.admissionNumber) errors.push("Admission number is required");
    if (!data.admissionDate) errors.push("Admission date is required");

    if (data.parentsGuardians && data.parentsGuardians.length > 0) {
      const primaryContacts = data.parentsGuardians.filter(
        (p) => p.primaryContact
      );
      if (primaryContacts.length === 0) {
        errors.push("At least one primary contact is required");
      }
      if (primaryContacts.length > 1) {
        errors.push("Only one primary contact is allowed");
      }

      data.parentsGuardians.forEach((parent, index) => {
        if (!parent.name)
          errors.push(`Parent/Guardian ${index + 1}: Name is required`);
        if (!parent.phoneNumber)
          errors.push(`Parent/Guardian ${index + 1}: Phone number is required`);
        if (!parent.relationship)
          errors.push(`Parent/Guardian ${index + 1}: Relationship is required`);
      });
    }

    return errors;
  }

  formatStudentDataForDisplay(profile: EnhancedStudentProfile) {
    return {
      ...profile,
      formattedAdmissionDate: new Date(
        profile.admissionDate
      ).toLocaleDateString(),
      primaryContact: profile.parentsGuardians.find(
        (p: ParentGuardianInfo) => p.primaryContact
      ),
      emergencyContact: profile.parentsGuardians.find(
        (p: ParentGuardianInfo) => p.emergencyContact
      ),
      hasSpecialNeeds:
        profile.specialNeedsSupport?.identifiedNeeds?.length > 0 &&
        !profile.specialNeedsSupport.identifiedNeeds.includes("none"),
      recentAssessments: profile.assessmentHistory.slice(-3),
      activeInterventions: profile.interventions.filter(
        (i: Intervention) => i.status === "active"
      ),
      upcomingGoalDeadlines: [
        ...profile.academicGoals.shortTerm.filter(
          (g: Goal) =>
            new Date(g.targetDate) > new Date() &&
            new Date(g.targetDate) <=
              new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        ),
        ...profile.personalDevelopmentGoals.social.filter(
          (g: Goal) =>
            new Date(g.targetDate) > new Date() &&
            new Date(g.targetDate) <=
              new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        ),
      ],
    };
  }
}

const enhancedStudentService = new EnhancedStudentService();
export default enhancedStudentService;
