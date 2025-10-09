import mongoose, { Document, Schema } from "mongoose";

// Analytics Dashboard Model for comprehensive data insights
export interface IAnalyticsDashboard extends Document {
  schoolId: mongoose.Types.ObjectId;
  dashboardType:
    | "school_overview"
    | "student_performance"
    | "teacher_effectiveness"
    | "attendance_analytics"
    | "behavioral_insights"
    | "academic_trends";
  dateRange: {
    startDate: Date;
    endDate: Date;
    period: "daily" | "weekly" | "monthly" | "quarterly" | "yearly" | "custom";
  };

  // Student Performance Analytics
  studentPerformance: {
    totalStudents: number;
    activeStudents: number;
    averageGPA: number;
    gradeDistribution: Array<{
      grade: string;
      count: number;
      percentage: number;
    }>;
    performanceTrends: Array<{
      date: Date;
      averageScore: number;
      passRate: number;
      improvementRate: number;
    }>;
    topPerformers: Array<{
      studentId: mongoose.Types.ObjectId;
      name: string;
      gpa: number;
      trend: "improving" | "stable" | "declining";
    }>;
    atRiskStudents: Array<{
      studentId: mongoose.Types.ObjectId;
      name: string;
      riskFactors: string[];
      riskLevel: "low" | "medium" | "high" | "critical";
      interventionSuggestions: string[];
    }>;
    subjectWisePerformance: Array<{
      subject: string;
      averageScore: number;
      passRate: number;
      trend: "improving" | "stable" | "declining";
      weakAreas: string[];
      recommendations: string[];
    }>;
  };

  // Attendance Analytics
  attendanceAnalytics: {
    overallAttendanceRate: number;
    attendanceTrends: Array<{
      date: Date;
      attendanceRate: number;
      totalStudents: number;
      presentStudents: number;
      absentStudents: number;
      lateArrivals: number;
    }>;
    classWiseAttendance: Array<{
      className: string;
      attendanceRate: number;
      averageDailyAttendance: number;
      chronicallyAbsent: number;
    }>;
    attendancePatterns: {
      dailyPatterns: Array<{
        dayOfWeek: string;
        averageAttendance: number;
      }>;
      monthlyPatterns: Array<{
        month: string;
        averageAttendance: number;
      }>;
      seasonalTrends: Array<{
        season: string;
        averageAttendance: number;
        factors: string[];
      }>;
    };
    absenteeismAnalysis: {
      frequentAbsentees: Array<{
        studentId: mongoose.Types.ObjectId;
        name: string;
        absentDays: number;
        absenteeRate: number;
        reasons: string[];
      }>;
      absenteeismTriggers: string[];
      interventionSuccess: Array<{
        intervention: string;
        beforeRate: number;
        afterRate: number;
        improvement: number;
      }>;
    };
  };

  // Teacher Effectiveness Analytics
  teacherEffectiveness: {
    teacherPerformance: Array<{
      teacherId: mongoose.Types.ObjectId;
      name: string;
      subjects: string[];
      studentOutcomes: {
        averageGPA: number;
        passRate: number;
        improvementRate: number;
        studentSatisfaction: number;
      };
      classManagement: {
        attendanceRate: number;
        behavioralIncidents: number;
        engagementLevel: number;
      };
      professionalDevelopment: {
        certifications: number;
        trainingsCompleted: number;
        skillRating: number;
      };
      effectiveness:
        | "excellent"
        | "good"
        | "satisfactory"
        | "needs_improvement";
      recommendations: string[];
    }>;
    subjectExpertise: Array<{
      subject: string;
      expertsCount: number;
      averageExperience: number;
      studentOutcomes: number;
      trainingNeeds: string[];
    }>;
    professionalGrowth: Array<{
      metric: string;
      currentValue: number;
      targetValue: number;
      progress: number;
      timeline: string;
    }>;
  };

  // Behavioral Insights
  behavioralInsights: {
    overallBehaviorScore: number;
    behaviorTrends: Array<{
      date: Date;
      positiveIncidents: number;
      negativeIncidents: number;
      behaviorScore: number;
    }>;
    incidentAnalysis: {
      totalIncidents: number;
      incidentTypes: Array<{
        type: string;
        count: number;
        severity: string;
        trend: "increasing" | "stable" | "decreasing";
      }>;
      commonTriggers: string[];
      interventionEffectiveness: Array<{
        intervention: string;
        successRate: number;
        averageResolutionTime: number;
      }>;
    };
    studentBehaviorProfiles: Array<{
      studentId: mongoose.Types.ObjectId;
      name: string;
      behaviorRating: number;
      improvements: string[];
      concerns: string[];
      recommendedSupport: string[];
    }>;
    environmentalFactors: Array<{
      factor: string;
      impact: number;
      correlation: number;
      recommendations: string[];
    }>;
  };

  // Academic Trends and Predictions
  academicTrends: {
    yearOverYearComparison: Array<{
      metric: string;
      currentYear: number;
      previousYear: number;
      changePercentage: number;
      trend: "improving" | "stable" | "declining";
    }>;
    seasonalPatterns: Array<{
      period: string;
      expectedPerformance: number;
      actualPerformance: number;
      variance: number;
      factors: string[];
    }>;
    predictiveInsights: Array<{
      prediction: string;
      confidence: number;
      timeframe: string;
      factors: string[];
      recommendations: string[];
    }>;
    curriculumEffectiveness: Array<{
      subject: string;
      curriculum: string;
      effectiveness: number;
      studentFeedback: number;
      learningOutcomes: Array<{
        outcome: string;
        achievement: number;
        benchmark: number;
      }>;
    }>;
  };

  // Resource Utilization
  resourceUtilization: {
    facilityUsage: Array<{
      facility: string;
      utilizationRate: number;
      peakHours: string[];
      maintenanceNeeds: string[];
    }>;
    technologyAdoption: Array<{
      tool: string;
      adoptionRate: number;
      effectiveness: number;
      userSatisfaction: number;
      trainingNeeds: string[];
    }>;
    budgetAllocation: Array<{
      category: string;
      allocated: number;
      spent: number;
      efficiency: number;
      roi: number;
    }>;
  };

  // Key Performance Indicators
  kpis: Array<{
    name: string;
    category: string;
    currentValue: number;
    targetValue: number;
    previousValue: number;
    trend: "improving" | "stable" | "declining";
    status: "excellent" | "good" | "warning" | "critical";
    actionRequired: boolean;
    recommendations: string[];
  }>;

  // Automated Insights and Recommendations
  insights: Array<{
    type: "alert" | "opportunity" | "recommendation" | "achievement";
    priority: "low" | "medium" | "high" | "critical";
    title: string;
    description: string;
    dataPoints: Array<{
      metric: string;
      value: number;
      context: string;
    }>;
    suggestedActions: Array<{
      action: string;
      impact: string;
      effort: "low" | "medium" | "high";
      timeline: string;
    }>;
    category: string;
    confidence: number;
    stakeholders: string[];
  }>;

  // Report Metadata
  generatedAt: Date;
  generatedBy: mongoose.Types.ObjectId;
  lastUpdated: Date;
  refreshFrequency: "realtime" | "hourly" | "daily" | "weekly";
  dataQuality: {
    completeness: number;
    accuracy: number;
    timeliness: number;
    issues: string[];
  };

  // Export and Sharing
  sharing: {
    isPublic: boolean;
    sharedWith: Array<{
      userId: mongoose.Types.ObjectId;
      role: string;
      permissions: string[];
    }>;
    exportFormats: string[];
    scheduledReports: Array<{
      frequency: string;
      recipients: string[];
      format: string;
      nextDelivery: Date;
    }>;
  };
}

const AnalyticsDashboardSchema = new Schema<IAnalyticsDashboard>(
  {
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: "School",
      required: true,
      index: true,
    },
    dashboardType: {
      type: String,
      enum: [
        "school_overview",
        "student_performance",
        "teacher_effectiveness",
        "attendance_analytics",
        "behavioral_insights",
        "academic_trends",
      ],
      required: true,
    },
    dateRange: {
      startDate: { type: Date, required: true },
      endDate: { type: Date, required: true },
      period: {
        type: String,
        enum: ["daily", "weekly", "monthly", "quarterly", "yearly", "custom"],
        required: true,
      },
    },
    studentPerformance: {
      totalStudents: { type: Number, default: 0 },
      activeStudents: { type: Number, default: 0 },
      averageGPA: { type: Number, default: 0 },
      gradeDistribution: [
        {
          grade: String,
          count: Number,
          percentage: Number,
        },
      ],
      performanceTrends: [
        {
          date: Date,
          averageScore: Number,
          passRate: Number,
          improvementRate: Number,
        },
      ],
      topPerformers: [
        {
          studentId: { type: Schema.Types.ObjectId, ref: "Student" },
          name: String,
          gpa: Number,
          trend: { type: String, enum: ["improving", "stable", "declining"] },
        },
      ],
      atRiskStudents: [
        {
          studentId: { type: Schema.Types.ObjectId, ref: "Student" },
          name: String,
          riskFactors: [String],
          riskLevel: {
            type: String,
            enum: ["low", "medium", "high", "critical"],
          },
          interventionSuggestions: [String],
        },
      ],
      subjectWisePerformance: [
        {
          subject: String,
          averageScore: Number,
          passRate: Number,
          trend: { type: String, enum: ["improving", "stable", "declining"] },
          weakAreas: [String],
          recommendations: [String],
        },
      ],
    },
    attendanceAnalytics: {
      overallAttendanceRate: { type: Number, default: 0 },
      attendanceTrends: [
        {
          date: Date,
          attendanceRate: Number,
          totalStudents: Number,
          presentStudents: Number,
          absentStudents: Number,
          lateArrivals: Number,
        },
      ],
      classWiseAttendance: [
        {
          className: String,
          attendanceRate: Number,
          averageDailyAttendance: Number,
          chronicallyAbsent: Number,
        },
      ],
      attendancePatterns: {
        dailyPatterns: [
          {
            dayOfWeek: String,
            averageAttendance: Number,
          },
        ],
        monthlyPatterns: [
          {
            month: String,
            averageAttendance: Number,
          },
        ],
        seasonalTrends: [
          {
            season: String,
            averageAttendance: Number,
            factors: [String],
          },
        ],
      },
      absenteeismAnalysis: {
        frequentAbsentees: [
          {
            studentId: { type: Schema.Types.ObjectId, ref: "Student" },
            name: String,
            absentDays: Number,
            absenteeRate: Number,
            reasons: [String],
          },
        ],
        absenteeismTriggers: [String],
        interventionSuccess: [
          {
            intervention: String,
            beforeRate: Number,
            afterRate: Number,
            improvement: Number,
          },
        ],
      },
    },
    teacherEffectiveness: {
      teacherPerformance: [
        {
          teacherId: { type: Schema.Types.ObjectId, ref: "User" },
          name: String,
          subjects: [String],
          studentOutcomes: {
            averageGPA: Number,
            passRate: Number,
            improvementRate: Number,
            studentSatisfaction: Number,
          },
          classManagement: {
            attendanceRate: Number,
            behavioralIncidents: Number,
            engagementLevel: Number,
          },
          professionalDevelopment: {
            certifications: Number,
            trainingsCompleted: Number,
            skillRating: Number,
          },
          effectiveness: {
            type: String,
            enum: ["excellent", "good", "satisfactory", "needs_improvement"],
          },
          recommendations: [String],
        },
      ],
      subjectExpertise: [
        {
          subject: String,
          expertsCount: Number,
          averageExperience: Number,
          studentOutcomes: Number,
          trainingNeeds: [String],
        },
      ],
      professionalGrowth: [
        {
          metric: String,
          currentValue: Number,
          targetValue: Number,
          progress: Number,
          timeline: String,
        },
      ],
    },
    behavioralInsights: {
      overallBehaviorScore: { type: Number, default: 0 },
      behaviorTrends: [
        {
          date: Date,
          positiveIncidents: Number,
          negativeIncidents: Number,
          behaviorScore: Number,
        },
      ],
      incidentAnalysis: {
        totalIncidents: Number,
        incidentTypes: [
          {
            type: String,
            count: Number,
            severity: String,
            trend: {
              type: String,
              enum: ["increasing", "stable", "decreasing"],
            },
          },
        ],
        commonTriggers: [String],
        interventionEffectiveness: [
          {
            intervention: String,
            successRate: Number,
            averageResolutionTime: Number,
          },
        ],
      },
      studentBehaviorProfiles: [
        {
          studentId: { type: Schema.Types.ObjectId, ref: "Student" },
          name: String,
          behaviorRating: Number,
          improvements: [String],
          concerns: [String],
          recommendedSupport: [String],
        },
      ],
      environmentalFactors: [
        {
          factor: String,
          impact: Number,
          correlation: Number,
          recommendations: [String],
        },
      ],
    },
    academicTrends: {
      yearOverYearComparison: [
        {
          metric: String,
          currentYear: Number,
          previousYear: Number,
          changePercentage: Number,
          trend: { type: String, enum: ["improving", "stable", "declining"] },
        },
      ],
      seasonalPatterns: [
        {
          period: String,
          expectedPerformance: Number,
          actualPerformance: Number,
          variance: Number,
          factors: [String],
        },
      ],
      predictiveInsights: [
        {
          prediction: String,
          confidence: Number,
          timeframe: String,
          factors: [String],
          recommendations: [String],
        },
      ],
      curriculumEffectiveness: [
        {
          subject: String,
          curriculum: String,
          effectiveness: Number,
          studentFeedback: Number,
          learningOutcomes: [
            {
              outcome: String,
              achievement: Number,
              benchmark: Number,
            },
          ],
        },
      ],
    },
    resourceUtilization: {
      facilityUsage: [
        {
          facility: String,
          utilizationRate: Number,
          peakHours: [String],
          maintenanceNeeds: [String],
        },
      ],
      technologyAdoption: [
        {
          tool: String,
          adoptionRate: Number,
          effectiveness: Number,
          userSatisfaction: Number,
          trainingNeeds: [String],
        },
      ],
      budgetAllocation: [
        {
          category: String,
          allocated: Number,
          spent: Number,
          efficiency: Number,
          roi: Number,
        },
      ],
    },
    kpis: [
      {
        name: String,
        category: String,
        currentValue: Number,
        targetValue: Number,
        previousValue: Number,
        trend: { type: String, enum: ["improving", "stable", "declining"] },
        status: {
          type: String,
          enum: ["excellent", "good", "warning", "critical"],
        },
        actionRequired: Boolean,
        recommendations: [String],
      },
    ],
    insights: [
      {
        type: {
          type: String,
          enum: ["alert", "opportunity", "recommendation", "achievement"],
        },
        priority: { type: String, enum: ["low", "medium", "high", "critical"] },
        title: String,
        description: String,
        dataPoints: [
          {
            metric: String,
            value: Number,
            context: String,
          },
        ],
        suggestedActions: [
          {
            action: String,
            impact: String,
            effort: { type: String, enum: ["low", "medium", "high"] },
            timeline: String,
          },
        ],
        category: String,
        confidence: Number,
        stakeholders: [String],
      },
    ],
    generatedAt: { type: Date, default: Date.now },
    generatedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    lastUpdated: { type: Date, default: Date.now },
    refreshFrequency: {
      type: String,
      enum: ["realtime", "hourly", "daily", "weekly"],
      default: "daily",
    },
    dataQuality: {
      completeness: { type: Number, min: 0, max: 100 },
      accuracy: { type: Number, min: 0, max: 100 },
      timeliness: { type: Number, min: 0, max: 100 },
      issues: [String],
    },
    sharing: {
      isPublic: { type: Boolean, default: false },
      sharedWith: [
        {
          userId: { type: Schema.Types.ObjectId, ref: "User" },
          role: String,
          permissions: [String],
        },
      ],
      exportFormats: [String],
      scheduledReports: [
        {
          frequency: String,
          recipients: [String],
          format: String,
          nextDelivery: Date,
        },
      ],
    },
  },
  {
    timestamps: true,
    collection: "analytics_dashboards",
  }
);

// Indexes for performance
AnalyticsDashboardSchema.index({
  schoolId: 1,
  dashboardType: 1,
  "dateRange.startDate": 1,
});
AnalyticsDashboardSchema.index({ generatedAt: -1 });
AnalyticsDashboardSchema.index({ "kpis.status": 1 });
AnalyticsDashboardSchema.index({ "insights.priority": 1, "insights.type": 1 });

// Instance methods
AnalyticsDashboardSchema.methods.calculateDataQuality = function () {
  // Calculate data quality metrics
  let completeness = 0;
  let accuracy = 100; // Assume 100% accuracy unless issues found
  let timeliness = 100;

  const now = new Date();
  const dataAge =
    (now.getTime() - this.lastUpdated.getTime()) / (1000 * 60 * 60); // hours

  // Calculate timeliness based on refresh frequency
  switch (this.refreshFrequency) {
    case "realtime":
      timeliness = dataAge > 1 ? Math.max(0, 100 - (dataAge - 1) * 10) : 100;
      break;
    case "hourly":
      timeliness = dataAge > 1 ? Math.max(0, 100 - (dataAge - 1) * 5) : 100;
      break;
    case "daily":
      timeliness = dataAge > 24 ? Math.max(0, 100 - (dataAge - 24) * 2) : 100;
      break;
    case "weekly":
      timeliness =
        dataAge > 168 ? Math.max(0, 100 - (dataAge - 168) * 0.5) : 100;
      break;
  }

  // Calculate completeness based on available data
  const sections = [
    "studentPerformance",
    "attendanceAnalytics",
    "teacherEffectiveness",
    "behavioralInsights",
  ];
  let sectionsWithData = 0;

  sections.forEach((section) => {
    if (this[section] && Object.keys(this[section]).length > 0) {
      sectionsWithData++;
    }
  });

  completeness = (sectionsWithData / sections.length) * 100;

  this.dataQuality = {
    completeness,
    accuracy,
    timeliness,
    issues: this.dataQuality?.issues || [],
  };

  return this.dataQuality;
};

AnalyticsDashboardSchema.methods.generateInsights = function () {
  const insights = [];

  // Critical attendance alert
  if (this.attendanceAnalytics?.overallAttendanceRate < 70) {
    insights.push({
      type: "alert",
      priority: "critical",
      title: "Critical Attendance Rate",
      description: `Overall attendance rate is ${this.attendanceAnalytics.overallAttendanceRate}%, well below acceptable levels.`,
      category: "attendance",
      confidence: 95,
      stakeholders: ["principal", "teachers", "parents"],
      suggestedActions: [
        {
          action: "Implement attendance intervention program",
          impact: "Could improve attendance by 15-20%",
          effort: "medium",
          timeline: "2-4 weeks",
        },
      ],
    });
  }

  // Performance opportunity
  if (this.studentPerformance?.averageGPA > 3.5) {
    insights.push({
      type: "opportunity",
      priority: "medium",
      title: "High Performance School",
      description: `School maintains excellent academic performance with ${this.studentPerformance.averageGPA} average GPA.`,
      category: "academic",
      confidence: 90,
      stakeholders: ["principal", "teachers"],
      suggestedActions: [
        {
          action: "Share best practices with other schools",
          impact: "System-wide improvement",
          effort: "low",
          timeline: "1-2 weeks",
        },
      ],
    });
  }

  // At-risk students alert
  const atRiskCount = this.studentPerformance?.atRiskStudents?.length || 0;
  if (atRiskCount > 0) {
    insights.push({
      type: "recommendation",
      priority: atRiskCount > 10 ? "high" : "medium",
      title: `${atRiskCount} Students Need Intervention`,
      description: `${atRiskCount} students have been identified as at-risk and require targeted support.`,
      category: "student_support",
      confidence: 85,
      stakeholders: ["counselors", "teachers", "parents"],
      suggestedActions: [
        {
          action: "Develop individualized intervention plans",
          impact: "Prevent academic failure",
          effort: "high",
          timeline: "1-2 weeks",
        },
      ],
    });
  }

  this.insights = insights;
  return insights;
};

AnalyticsDashboardSchema.methods.exportData = function (format: string) {
  const exportData = {
    metadata: {
      schoolId: this.schoolId,
      dashboardType: this.dashboardType,
      dateRange: this.dateRange,
      generatedAt: this.generatedAt,
      lastUpdated: this.lastUpdated,
    },
    kpis: this.kpis,
    insights: this.insights,
    studentPerformance: this.studentPerformance,
    attendanceAnalytics: this.attendanceAnalytics,
    teacherEffectiveness: this.teacherEffectiveness,
    behavioralInsights: this.behavioralInsights,
    academicTrends: this.academicTrends,
  };

  switch (format.toLowerCase()) {
    case "json":
      return JSON.stringify(exportData, null, 2);
    case "csv":
      // Convert to CSV format (simplified)
      return this.convertToCSV(exportData);
    default:
      return exportData;
  }
};

AnalyticsDashboardSchema.methods.convertToCSV = function (data: any) {
  // Simplified CSV conversion for KPIs
  const csvRows = ["Metric,Current Value,Target Value,Status,Trend"];

  data.kpis?.forEach((kpi: any) => {
    csvRows.push(
      `${kpi.name},${kpi.currentValue},${kpi.targetValue},${kpi.status},${kpi.trend}`
    );
  });

  return csvRows.join("\n");
};

// Static methods
AnalyticsDashboardSchema.statics.generateDashboard = async function (
  schoolId: string,
  type: string,
  dateRange: any,
  userId: string
) {
  // This method would orchestrate data collection from various sources
  // and generate a comprehensive analytics dashboard

  const dashboard = new this({
    schoolId,
    dashboardType: type,
    dateRange,
    generatedBy: userId,
    studentPerformance: {},
    attendanceAnalytics: {},
    teacherEffectiveness: {},
    behavioralInsights: {},
    academicTrends: {},
    resourceUtilization: {},
    kpis: [],
    insights: [],
  });

  // Calculate data quality
  dashboard.calculateDataQuality();

  // Generate insights
  dashboard.generateInsights();

  return dashboard;
};

export const AnalyticsDashboard = mongoose.model<IAnalyticsDashboard>(
  "AnalyticsDashboard",
  AnalyticsDashboardSchema
);
