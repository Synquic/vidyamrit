import mongoose, { Document, Schema } from "mongoose";

// Enhanced School Information Model for comprehensive institutional data
export interface IEnhancedSchoolInfo extends Document {
  schoolId: mongoose.Types.ObjectId;

  // Basic Information (extending existing school data)
  institutionalDetails: {
    establishedYear: number;
    schoolType:
      | "government"
      | "private"
      | "aided"
      | "international"
      | "boarding"
      | "day_school"
      | "residential";
    educationBoard: string[];
    accreditation: Array<{
      agency: string;
      accreditationNumber: string;
      validFrom: Date;
      validUntil: Date;
      status: "active" | "expired" | "under_review";
      certificateUrl?: string;
    }>;
    affiliations: Array<{
      organization: string;
      affiliationNumber: string;
      type: "academic" | "sports" | "cultural" | "research";
      validFrom: Date;
      validUntil?: Date;
    }>;
    recognitions: Array<{
      title: string;
      awardedBy: string;
      dateReceived: Date;
      category:
        | "academic"
        | "infrastructure"
        | "innovation"
        | "community_service"
        | "sports";
      description: string;
    }>;
  };

  // Infrastructure and Facilities
  infrastructure: {
    landArea: {
      total: number; // in square meters
      built: number;
      playground: number;
      garden: number;
      parking: number;
    };
    buildings: Array<{
      name: string;
      type:
        | "academic"
        | "administrative"
        | "residential"
        | "recreational"
        | "service";
      floors: number;
      rooms: Array<{
        roomNumber: string;
        type:
          | "classroom"
          | "laboratory"
          | "library"
          | "office"
          | "auditorium"
          | "cafeteria"
          | "dormitory"
          | "storage";
        capacity: number;
        area: number;
        facilities: string[];
        condition: "excellent" | "good" | "fair" | "needs_repair";
        lastMaintenance: Date;
        nextMaintenance: Date;
      }>;
      constructionYear: number;
      lastRenovation?: Date;
      condition: "excellent" | "good" | "fair" | "needs_renovation";
      safetyFeatures: string[];
    }>;
    utilities: {
      electricity: {
        mainSupply: boolean;
        backupGenerator: boolean;
        solarPower: boolean;
        capacity: string;
        monthlyConsumption: number;
        lastBillAmount: number;
      };
      water: {
        municipalSupply: boolean;
        borewell: boolean;
        rainwaterHarvesting: boolean;
        waterTreatmentPlant: boolean;
        dailyConsumption: number;
        qualityTestDate: Date;
        qualityStatus: "excellent" | "good" | "acceptable" | "needs_treatment";
      };
      internet: {
        provider: string;
        bandwidth: string;
        wifiCoverage: number; // percentage
        deviceCount: number;
        monthlyBill: number;
      };
      waste: {
        segregationSystem: boolean;
        compostingUnit: boolean;
        recyclingProgram: boolean;
        wasteDisposalMethod: string;
        monthlyWasteGenerated: number;
      };
    };
  };

  // Academic Facilities
  academicFacilities: {
    classrooms: {
      total: number;
      smartClassrooms: number;
      airconditioned: number;
      averageCapacity: number;
      equipmentStatus: "excellent" | "good" | "fair" | "needs_upgrade";
    };
    laboratories: Array<{
      type:
        | "physics"
        | "chemistry"
        | "biology"
        | "computer"
        | "language"
        | "mathematics"
        | "art"
        | "music";
      count: number;
      capacity: number;
      equipment: Array<{
        name: string;
        quantity: number;
        condition: "working" | "needs_repair" | "obsolete";
        lastService: Date;
      }>;
      safetyMeasures: string[];
      utilizationRate: number; // percentage
    }>;
    library: {
      totalBooks: number;
      digitalResources: number;
      seatingCapacity: number;
      operatingHours: string;
      sections: Array<{
        name: string;
        bookCount: number;
        subjects: string[];
      }>;
      services: string[];
      monthlyFootfall: number;
    };
    auditorium: {
      capacity: number;
      acousticSystems: string[];
      lightingSystems: string[];
      stageFacilities: string[];
      utilizationRate: number;
      maintenanceSchedule: Array<{
        component: string;
        lastMaintenance: Date;
        nextMaintenance: Date;
      }>;
    };
  };

  // Sports and Recreation
  sportsRecreation: {
    playgrounds: Array<{
      name: string;
      type:
        | "football"
        | "cricket"
        | "basketball"
        | "volleyball"
        | "tennis"
        | "badminton"
        | "athletics"
        | "multipurpose";
      area: number;
      surface: string;
      condition: "excellent" | "good" | "fair" | "needs_repair";
      lighting: boolean;
      seatingCapacity?: number;
      lastMaintenance: Date;
    }>;
    gymnasium: {
      area: number;
      equipment: Array<{
        name: string;
        quantity: number;
        condition: "working" | "needs_repair" | "replacement_due";
        purchaseDate: Date;
      }>;
      capacity: number;
      operatingHours: string;
      monthlyUsage: number;
    };
    swimmingPool: {
      exists: boolean;
      length?: number;
      width?: number;
      depth?: number;
      type?: "indoor" | "outdoor";
      waterTreatment: string[];
      maintenanceSchedule?: Array<{
        activity: string;
        frequency: string;
        lastDone: Date;
        nextDue: Date;
      }>;
    };
  };

  // Transportation
  transportation: {
    fleetSize: number;
    buses: Array<{
      vehicleNumber: string;
      capacity: number;
      routeNumber: string;
      driverName: string;
      driverLicense: string;
      insuranceExpiry: Date;
      fitnessExpiry: Date;
      lastService: Date;
      condition: "excellent" | "good" | "fair" | "needs_repair";
      safetyFeatures: string[];
      gpsTracking: boolean;
    }>;
    routes: Array<{
      routeNumber: string;
      routeName: string;
      distance: number;
      stops: Array<{
        stopName: string;
        timing: string;
        studentsCount: number;
      }>;
      fare: number;
      averageTime: number;
    }>;
  };

  // Hostel/Residential Facilities
  hostelFacilities: {
    exists: boolean;
    boys?: {
      capacity: number;
      currentOccupancy: number;
      wardens: number;
      facilities: string[];
      roomTypes: Array<{
        type: "single" | "double" | "triple" | "dormitory";
        count: number;
        rent: number;
      }>;
      mess: {
        capacity: number;
        mealTypes: string[];
        monthlyCharges: number;
        menuVariety: number;
      };
    };
    girls?: {
      capacity: number;
      currentOccupancy: number;
      wardens: number;
      facilities: string[];
      roomTypes: Array<{
        type: "single" | "double" | "triple" | "dormitory";
        count: number;
        rent: number;
      }>;
      mess: {
        capacity: number;
        mealTypes: string[];
        monthlyCharges: number;
        menuVariety: number;
      };
    };
  };

  // Medical Facilities
  medicalFacilities: {
    infirmary: {
      exists: boolean;
      rooms?: number;
      beds?: number;
      equipment: string[];
      staffDetails: Array<{
        name: string;
        qualification: string;
        specialization: string;
        experience: number;
        availability: string;
      }>;
    };
    pharmacy: {
      exists: boolean;
      stockValue?: number;
      commonMedicines: string[];
      emergencyMedicines: string[];
    };
    ambulance: {
      exists: boolean;
      vehicleNumber?: string;
      equipment: string[];
      driverContact: string;
      hospitalTieups: Array<{
        hospitalName: string;
        distance: number;
        specializations: string[];
        emergencyContact: string;
      }>;
    };
  };

  // Security and Safety
  securitySafety: {
    securityPersonnel: {
      guards: number;
      shifts: number;
      trainingLevel: "basic" | "intermediate" | "advanced";
      lastTraining: Date;
    };
    surveillanceSystem: {
      cctv: {
        cameras: number;
        coverage: number; // percentage
        recordingDays: number;
        nightVision: boolean;
      };
      accessControl: {
        biometric: boolean;
        cardAccess: boolean;
        visitorManagement: boolean;
        parentalAccess: string;
      };
    };
    safetyMeasures: {
      fireExtinguishers: number;
      smokeDetectors: number;
      fireDrills: {
        frequency: string;
        lastConducted: Date;
        averageEvacuationTime: number;
      };
      firstAidKits: number;
      emergencyExits: number;
      disasterPreparedness: {
        earthquakeDrill: boolean;
        floodPreparedness: boolean;
        medicalEmergencyPlan: boolean;
      };
    };
  };

  // Financial Information
  financialInfo: {
    annualBudget: number;
    feeStructure: Array<{
      class: string;
      tuitionFee: number;
      developmentFee: number;
      examFee: number;
      transportFee?: number;
      hostelFee?: number;
      miscellaneous: number;
      total: number;
    }>;
    revenue: {
      tuitionFees: number;
      donations: number;
      grants: number;
      otherIncome: number;
      totalRevenue: number;
    };
    expenses: {
      salaries: number;
      infrastructure: number;
      utilities: number;
      maintenance: number;
      academics: number;
      others: number;
      totalExpenses: number;
    };
    scholarships: Array<{
      name: string;
      eligibilityCriteria: string;
      amount: number;
      beneficiariesCount: number;
      funding: "government" | "private" | "school";
    }>;
  };

  // Environmental Initiatives
  environmentalInitiatives: {
    greenBuilding: {
      certified: boolean;
      rating?: string;
      features: string[];
    };
    sustainabilityPrograms: Array<{
      name: string;
      type: "energy" | "water" | "waste" | "green_cover" | "awareness";
      startDate: Date;
      impact: string;
      studentsInvolved: number;
    }>;
    energyEfficiency: {
      solarCapacity?: number;
      energySaving: number; // percentage
      greenTransportation: boolean;
      energyAuditDate?: Date;
    };
  };

  // Compliance and Legal
  compliance: {
    licenses: Array<{
      type: string;
      licenseNumber: string;
      issuingAuthority: string;
      issueDate: Date;
      expiryDate: Date;
      status: "active" | "expired" | "under_renewal";
    }>;
    inspections: Array<{
      type: "fire_safety" | "building" | "health" | "education" | "transport";
      inspectionDate: Date;
      inspectorName: string;
      result: "passed" | "passed_with_conditions" | "failed";
      recommendations: string[];
      nextInspection: Date;
    }>;
    insurance: Array<{
      type: "building" | "students" | "staff" | "vehicle" | "public_liability";
      provider: string;
      policyNumber: string;
      coverage: number;
      premium: number;
      startDate: Date;
      endDate: Date;
    }>;
  };

  // Technology Infrastructure
  technologyInfrastructure: {
    computers: {
      desktops: number;
      laptops: number;
      tablets: number;
      projectors: number;
      smartBoards: number;
      printers: number;
      averageAge: number; // in years
      maintenanceContract: boolean;
    };
    software: Array<{
      name: string;
      type: "educational" | "administrative" | "security" | "utility";
      licenses: number;
      version: string;
      lastUpdate: Date;
      supportContract: boolean;
    }>;
    networkInfrastructure: {
      serverCapacity: string;
      backupSystems: boolean;
      cybersecurityMeasures: string[];
      dataBackupFrequency: string;
      lastSecurityAudit: Date;
    };
  };

  // Vendor and Service Provider Information
  vendors: Array<{
    name: string;
    serviceType:
      | "cleaning"
      | "security"
      | "transport"
      | "maintenance"
      | "catering"
      | "it_support"
      | "medical";
    contactPerson: string;
    phoneNumber: string;
    email: string;
    contractStartDate: Date;
    contractEndDate: Date;
    monthlyCharges: number;
    performanceRating: number;
    lastReview: Date;
  }>;

  // Maintenance and Service Records
  maintenanceRecords: Array<{
    category:
      | "building"
      | "electrical"
      | "plumbing"
      | "equipment"
      | "grounds"
      | "transport";
    item: string;
    maintenanceType: "routine" | "preventive" | "corrective" | "emergency";
    scheduledDate: Date;
    completedDate?: Date;
    cost: number;
    vendor: string;
    description: string;
    status: "scheduled" | "in_progress" | "completed" | "cancelled";
    nextScheduled?: Date;
  }>;

  // Data Management
  lastUpdated: Date;
  updatedBy: mongoose.Types.ObjectId;
  dataCompleteness: number; // percentage
  verificationStatus: "pending" | "verified" | "needs_update";
  verifiedBy?: mongoose.Types.ObjectId;
  verificationDate?: Date;
  documentsAttached: Array<{
    category: string;
    fileName: string;
    fileUrl: string;
    uploadDate: Date;
    expiryDate?: Date;
  }>;
}

const EnhancedSchoolInfoSchema = new Schema<IEnhancedSchoolInfo>(
  {
    schoolId: {
      type: Schema.Types.ObjectId,
      ref: "School",
      required: true,
      unique: true,
      index: true,
    },
    institutionalDetails: {
      establishedYear: Number,
      schoolType: {
        type: String,
        enum: [
          "government",
          "private",
          "aided",
          "international",
          "boarding",
          "day_school",
          "residential",
        ],
      },
      educationBoard: [String],
      accreditation: [
        {
          agency: String,
          accreditationNumber: String,
          validFrom: Date,
          validUntil: Date,
          status: { type: String, enum: ["active", "expired", "under_review"] },
          certificateUrl: String,
        },
      ],
      affiliations: [
        {
          organization: String,
          affiliationNumber: String,
          type: {
            type: String,
            enum: ["academic", "sports", "cultural", "research"],
          },
          validFrom: Date,
          validUntil: Date,
        },
      ],
      recognitions: [
        {
          title: String,
          awardedBy: String,
          dateReceived: Date,
          category: {
            type: String,
            enum: [
              "academic",
              "infrastructure",
              "innovation",
              "community_service",
              "sports",
            ],
          },
          description: String,
        },
      ],
    },
    infrastructure: {
      landArea: {
        total: Number,
        built: Number,
        playground: Number,
        garden: Number,
        parking: Number,
      },
      buildings: [
        {
          name: String,
          type: {
            type: String,
            enum: [
              "academic",
              "administrative",
              "residential",
              "recreational",
              "service",
            ],
          },
          floors: Number,
          rooms: [
            {
              roomNumber: String,
              type: {
                type: String,
                enum: [
                  "classroom",
                  "laboratory",
                  "library",
                  "office",
                  "auditorium",
                  "cafeteria",
                  "dormitory",
                  "storage",
                ],
              },
              capacity: Number,
              area: Number,
              facilities: [String],
              condition: {
                type: String,
                enum: ["excellent", "good", "fair", "needs_repair"],
              },
              lastMaintenance: Date,
              nextMaintenance: Date,
            },
          ],
          constructionYear: Number,
          lastRenovation: Date,
          condition: {
            type: String,
            enum: ["excellent", "good", "fair", "needs_renovation"],
          },
          safetyFeatures: [String],
        },
      ],
      utilities: {
        electricity: {
          mainSupply: Boolean,
          backupGenerator: Boolean,
          solarPower: Boolean,
          capacity: String,
          monthlyConsumption: Number,
          lastBillAmount: Number,
        },
        water: {
          municipalSupply: Boolean,
          borewell: Boolean,
          rainwaterHarvesting: Boolean,
          waterTreatmentPlant: Boolean,
          dailyConsumption: Number,
          qualityTestDate: Date,
          qualityStatus: {
            type: String,
            enum: ["excellent", "good", "acceptable", "needs_treatment"],
          },
        },
        internet: {
          provider: String,
          bandwidth: String,
          wifiCoverage: Number,
          deviceCount: Number,
          monthlyBill: Number,
        },
        waste: {
          segregationSystem: Boolean,
          compostingUnit: Boolean,
          recyclingProgram: Boolean,
          wasteDisposalMethod: String,
          monthlyWasteGenerated: Number,
        },
      },
    },
    academicFacilities: {
      classrooms: {
        total: Number,
        smartClassrooms: Number,
        airconditioned: Number,
        averageCapacity: Number,
        equipmentStatus: {
          type: String,
          enum: ["excellent", "good", "fair", "needs_upgrade"],
        },
      },
      laboratories: [
        {
          type: {
            type: String,
            enum: [
              "physics",
              "chemistry",
              "biology",
              "computer",
              "language",
              "mathematics",
              "art",
              "music",
            ],
          },
          count: Number,
          capacity: Number,
          equipment: [
            {
              name: String,
              quantity: Number,
              condition: {
                type: String,
                enum: ["working", "needs_repair", "obsolete"],
              },
              lastService: Date,
            },
          ],
          safetyMeasures: [String],
          utilizationRate: Number,
        },
      ],
      library: {
        totalBooks: Number,
        digitalResources: Number,
        seatingCapacity: Number,
        operatingHours: String,
        sections: [
          {
            name: String,
            bookCount: Number,
            subjects: [String],
          },
        ],
        services: [String],
        monthlyFootfall: Number,
      },
      auditorium: {
        capacity: Number,
        acousticSystems: [String],
        lightingSystems: [String],
        stageFacilities: [String],
        utilizationRate: Number,
        maintenanceSchedule: [
          {
            component: String,
            lastMaintenance: Date,
            nextMaintenance: Date,
          },
        ],
      },
    },
    sportsRecreation: {
      playgrounds: [
        {
          name: String,
          type: {
            type: String,
            enum: [
              "football",
              "cricket",
              "basketball",
              "volleyball",
              "tennis",
              "badminton",
              "athletics",
              "multipurpose",
            ],
          },
          area: Number,
          surface: String,
          condition: {
            type: String,
            enum: ["excellent", "good", "fair", "needs_repair"],
          },
          lighting: Boolean,
          seatingCapacity: Number,
          lastMaintenance: Date,
        },
      ],
      gymnasium: {
        area: Number,
        equipment: [
          {
            name: String,
            quantity: Number,
            condition: {
              type: String,
              enum: ["working", "needs_repair", "replacement_due"],
            },
            purchaseDate: Date,
          },
        ],
        capacity: Number,
        operatingHours: String,
        monthlyUsage: Number,
      },
      swimmingPool: {
        exists: Boolean,
        length: Number,
        width: Number,
        depth: Number,
        type: { type: String, enum: ["indoor", "outdoor"] },
        waterTreatment: [String],
        maintenanceSchedule: [
          {
            activity: String,
            frequency: String,
            lastDone: Date,
            nextDue: Date,
          },
        ],
      },
    },
    transportation: {
      fleetSize: Number,
      buses: [
        {
          vehicleNumber: String,
          capacity: Number,
          routeNumber: String,
          driverName: String,
          driverLicense: String,
          insuranceExpiry: Date,
          fitnessExpiry: Date,
          lastService: Date,
          condition: {
            type: String,
            enum: ["excellent", "good", "fair", "needs_repair"],
          },
          safetyFeatures: [String],
          gpsTracking: Boolean,
        },
      ],
      routes: [
        {
          routeNumber: String,
          routeName: String,
          distance: Number,
          stops: [
            {
              stopName: String,
              timing: String,
              studentsCount: Number,
            },
          ],
          fare: Number,
          averageTime: Number,
        },
      ],
    },
    hostelFacilities: {
      exists: Boolean,
      boys: {
        capacity: Number,
        currentOccupancy: Number,
        wardens: Number,
        facilities: [String],
        roomTypes: [
          {
            type: {
              type: String,
              enum: ["single", "double", "triple", "dormitory"],
            },
            count: Number,
            rent: Number,
          },
        ],
        mess: {
          capacity: Number,
          mealTypes: [String],
          monthlyCharges: Number,
          menuVariety: Number,
        },
      },
      girls: {
        capacity: Number,
        currentOccupancy: Number,
        wardens: Number,
        facilities: [String],
        roomTypes: [
          {
            type: {
              type: String,
              enum: ["single", "double", "triple", "dormitory"],
            },
            count: Number,
            rent: Number,
          },
        ],
        mess: {
          capacity: Number,
          mealTypes: [String],
          monthlyCharges: Number,
          menuVariety: Number,
        },
      },
    },
    medicalFacilities: {
      infirmary: {
        exists: Boolean,
        rooms: Number,
        beds: Number,
        equipment: [String],
        staffDetails: [
          {
            name: String,
            qualification: String,
            specialization: String,
            experience: Number,
            availability: String,
          },
        ],
      },
      pharmacy: {
        exists: Boolean,
        stockValue: Number,
        commonMedicines: [String],
        emergencyMedicines: [String],
      },
      ambulance: {
        exists: Boolean,
        vehicleNumber: String,
        equipment: [String],
        driverContact: String,
        hospitalTieups: [
          {
            hospitalName: String,
            distance: Number,
            specializations: [String],
            emergencyContact: String,
          },
        ],
      },
    },
    securitySafety: {
      securityPersonnel: {
        guards: Number,
        shifts: Number,
        trainingLevel: {
          type: String,
          enum: ["basic", "intermediate", "advanced"],
        },
        lastTraining: Date,
      },
      surveillanceSystem: {
        cctv: {
          cameras: Number,
          coverage: Number,
          recordingDays: Number,
          nightVision: Boolean,
        },
        accessControl: {
          biometric: Boolean,
          cardAccess: Boolean,
          visitorManagement: Boolean,
          parentalAccess: String,
        },
      },
      safetyMeasures: {
        fireExtinguishers: Number,
        smokeDetectors: Number,
        fireDrills: {
          frequency: String,
          lastConducted: Date,
          averageEvacuationTime: Number,
        },
        firstAidKits: Number,
        emergencyExits: Number,
        disasterPreparedness: {
          earthquakeDrill: Boolean,
          floodPreparedness: Boolean,
          medicalEmergencyPlan: Boolean,
        },
      },
    },
    financialInfo: {
      annualBudget: Number,
      feeStructure: [
        {
          class: String,
          tuitionFee: Number,
          developmentFee: Number,
          examFee: Number,
          transportFee: Number,
          hostelFee: Number,
          miscellaneous: Number,
          total: Number,
        },
      ],
      revenue: {
        tuitionFees: Number,
        donations: Number,
        grants: Number,
        otherIncome: Number,
        totalRevenue: Number,
      },
      expenses: {
        salaries: Number,
        infrastructure: Number,
        utilities: Number,
        maintenance: Number,
        academics: Number,
        others: Number,
        totalExpenses: Number,
      },
      scholarships: [
        {
          name: String,
          eligibilityCriteria: String,
          amount: Number,
          beneficiariesCount: Number,
          funding: { type: String, enum: ["government", "private", "school"] },
        },
      ],
    },
    environmentalInitiatives: {
      greenBuilding: {
        certified: Boolean,
        rating: String,
        features: [String],
      },
      sustainabilityPrograms: [
        {
          name: String,
          type: {
            type: String,
            enum: ["energy", "water", "waste", "green_cover", "awareness"],
          },
          startDate: Date,
          impact: String,
          studentsInvolved: Number,
        },
      ],
      energyEfficiency: {
        solarCapacity: Number,
        energySaving: Number,
        greenTransportation: Boolean,
        energyAuditDate: Date,
      },
    },
    compliance: {
      licenses: [
        {
          type: String,
          licenseNumber: String,
          issuingAuthority: String,
          issueDate: Date,
          expiryDate: Date,
          status: {
            type: String,
            enum: ["active", "expired", "under_renewal"],
          },
        },
      ],
      inspections: [
        {
          type: {
            type: String,
            enum: [
              "fire_safety",
              "building",
              "health",
              "education",
              "transport",
            ],
          },
          inspectionDate: Date,
          inspectorName: String,
          result: {
            type: String,
            enum: ["passed", "passed_with_conditions", "failed"],
          },
          recommendations: [String],
          nextInspection: Date,
        },
      ],
      insurance: [
        {
          type: {
            type: String,
            enum: [
              "building",
              "students",
              "staff",
              "vehicle",
              "public_liability",
            ],
          },
          provider: String,
          policyNumber: String,
          coverage: Number,
          premium: Number,
          startDate: Date,
          endDate: Date,
        },
      ],
    },
    technologyInfrastructure: {
      computers: {
        desktops: Number,
        laptops: Number,
        tablets: Number,
        projectors: Number,
        smartBoards: Number,
        printers: Number,
        averageAge: Number,
        maintenanceContract: Boolean,
      },
      software: [
        {
          name: String,
          type: {
            type: String,
            enum: ["educational", "administrative", "security", "utility"],
          },
          licenses: Number,
          version: String,
          lastUpdate: Date,
          supportContract: Boolean,
        },
      ],
      networkInfrastructure: {
        serverCapacity: String,
        backupSystems: Boolean,
        cybersecurityMeasures: [String],
        dataBackupFrequency: String,
        lastSecurityAudit: Date,
      },
    },
    vendors: [
      {
        name: String,
        serviceType: {
          type: String,
          enum: [
            "cleaning",
            "security",
            "transport",
            "maintenance",
            "catering",
            "it_support",
            "medical",
          ],
        },
        contactPerson: String,
        phoneNumber: String,
        email: String,
        contractStartDate: Date,
        contractEndDate: Date,
        monthlyCharges: Number,
        performanceRating: Number,
        lastReview: Date,
      },
    ],
    maintenanceRecords: [
      {
        category: {
          type: String,
          enum: [
            "building",
            "electrical",
            "plumbing",
            "equipment",
            "grounds",
            "transport",
          ],
        },
        item: String,
        maintenanceType: {
          type: String,
          enum: ["routine", "preventive", "corrective", "emergency"],
        },
        scheduledDate: Date,
        completedDate: Date,
        cost: Number,
        vendor: String,
        description: String,
        status: {
          type: String,
          enum: ["scheduled", "in_progress", "completed", "cancelled"],
        },
        nextScheduled: Date,
      },
    ],
    lastUpdated: { type: Date, default: Date.now },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    dataCompleteness: { type: Number, min: 0, max: 100, default: 0 },
    verificationStatus: {
      type: String,
      enum: ["pending", "verified", "needs_update"],
      default: "pending",
    },
    verifiedBy: { type: Schema.Types.ObjectId, ref: "User" },
    verificationDate: Date,
    documentsAttached: [
      {
        category: String,
        fileName: String,
        fileUrl: String,
        uploadDate: Date,
        expiryDate: Date,
      },
    ],
  },
  {
    timestamps: true,
    collection: "enhanced_school_info",
  }
);

// Indexes for performance
EnhancedSchoolInfoSchema.index({ schoolId: 1 });
EnhancedSchoolInfoSchema.index({ verificationStatus: 1 });
EnhancedSchoolInfoSchema.index({ "compliance.licenses.expiryDate": 1 });
EnhancedSchoolInfoSchema.index({
  "maintenanceRecords.status": 1,
  "maintenanceRecords.scheduledDate": 1,
});

// Instance methods
EnhancedSchoolInfoSchema.methods.calculateDataCompleteness = function () {
  const sections = [
    "institutionalDetails",
    "infrastructure",
    "academicFacilities",
    "sportsRecreation",
    "transportation",
    "medicalFacilities",
    "securitySafety",
    "financialInfo",
    "environmentalInitiatives",
    "compliance",
    "technologyInfrastructure",
  ];

  let completedSections = 0;
  sections.forEach((section) => {
    if (this[section] && Object.keys(this[section]).length > 0) {
      completedSections++;
    }
  });

  this.dataCompleteness = (completedSections / sections.length) * 100;
  return this.dataCompleteness;
};

EnhancedSchoolInfoSchema.methods.getMaintenanceAlerts = function () {
  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  return this.maintenanceRecords.filter(
    (record) =>
      record.status === "scheduled" &&
      new Date(record.scheduledDate) <= thirtyDaysFromNow
  );
};

EnhancedSchoolInfoSchema.methods.getExpiringDocuments = function () {
  const now = new Date();
  const ninetyDaysFromNow = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

  const expiringLicenses = this.compliance.licenses.filter(
    (license) =>
      license.expiryDate && new Date(license.expiryDate) <= ninetyDaysFromNow
  );

  const expiringInsurance = this.compliance.insurance.filter(
    (insurance) => new Date(insurance.endDate) <= ninetyDaysFromNow
  );

  const expiringDocuments = this.documentsAttached.filter(
    (doc) => doc.expiryDate && new Date(doc.expiryDate) <= ninetyDaysFromNow
  );

  return {
    licenses: expiringLicenses,
    insurance: expiringInsurance,
    documents: expiringDocuments,
  };
};

EnhancedSchoolInfoSchema.methods.getFacilityUtilization = function () {
  const utilization = {
    classrooms: this.academicFacilities?.classrooms?.total || 0,
    laboratories:
      this.academicFacilities?.laboratories?.reduce(
        (sum, lab) => sum + (lab.utilizationRate || 0),
        0
      ) / (this.academicFacilities?.laboratories?.length || 1),
    auditorium: this.academicFacilities?.auditorium?.utilizationRate || 0,
    gymnasium: this.sportsRecreation?.gymnasium?.monthlyUsage || 0,
    library: this.academicFacilities?.library?.monthlyFootfall || 0,
    transport: this.transportation?.fleetSize || 0,
  };

  return utilization;
};

EnhancedSchoolInfoSchema.methods.generateComplianceReport = function () {
  const now = new Date();

  const activeLicenses = this.compliance.licenses.filter(
    (license) =>
      license.status === "active" && new Date(license.expiryDate) > now
  );

  const passedInspections = this.compliance.inspections.filter(
    (inspection) =>
      inspection.result === "passed" ||
      inspection.result === "passed_with_conditions"
  );

  const activeInsurance = this.compliance.insurance.filter(
    (insurance) => new Date(insurance.endDate) > now
  );

  return {
    complianceScore:
      ((activeLicenses.length +
        passedInspections.length +
        activeInsurance.length) /
        (this.compliance.licenses.length +
          this.compliance.inspections.length +
          this.compliance.insurance.length)) *
      100,
    activeLicenses: activeLicenses.length,
    totalLicenses: this.compliance.licenses.length,
    passedInspections: passedInspections.length,
    totalInspections: this.compliance.inspections.length,
    activeInsurance: activeInsurance.length,
    totalInsurance: this.compliance.insurance.length,
    expiringItems: this.getExpiringDocuments(),
  };
};

export const EnhancedSchoolInfo = mongoose.model<IEnhancedSchoolInfo>(
  "EnhancedSchoolInfo",
  EnhancedSchoolInfoSchema
);
