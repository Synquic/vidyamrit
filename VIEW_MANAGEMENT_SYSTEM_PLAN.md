# View Management System - Implementation Plan

## 📋 Executive Summary

This document outlines the plan to create a comprehensive **View Management System** that allows different stakeholders (Principals, Directors, Education Ministers, etc.) to access customized views of the Vidyamrit platform data through email/password authentication.

---

## 🔍 Current System Analysis

### Existing Infrastructure
- **Authentication**: Firebase-based authentication with MongoDB user storage
- **User Roles**: `super_admin`, `tutor`, `volunteer`
- **Data Models**: School, Student, Tutor, Cohort, Program, Assessment, Attendance
- **Geographic Hierarchy**: School → Block → State (district not explicitly stored)
- **Frontend**: React with TypeScript, TanStack Query, Shadcn UI
- **Backend**: Node.js/Express with MongoDB/Mongoose

### Key Data Points Available
1. **Schools**: Total, active, with assessments
2. **Tutors**: Total engaged
3. **Students**: Total, active, dropped (archived)
4. **Cohorts**: Total created
5. **Assessments**: Total done
6. **Progress**: Tracked at student, cohort, school, block, state, program levels
7. **Attendance**: Tracked at student, cohort, school levels

---

## 🎯 System Requirements

### Core Features
1. **View Creation Interface**: Allow super_admin to create custom views
2. **Stakeholder Authentication**: Email/password login for view-specific users
3. **Customizable Data Views**: Select which metrics/sections to display
4. **Role-Based Access**: Different views for different stakeholder types
5. **Data Aggregation**: Real-time calculation of metrics based on selected filters

### Stakeholder Types
- Principal
- Director
- Education Minister
- Block Coordinator
- District Coordinator
- State Coordinator
- Custom roles (extensible)

---

## 🏗️ Proposed Architecture

### 1. Database Schema

#### New Model: `View` (ViewModel.ts)
```typescript
interface IView extends Document {
  name: string;                    // e.g., "Principal Dashboard - School XYZ"
  description?: string;
  stakeholderType: string;        // "principal", "director", "education_minister", etc.
  createdBy: ObjectId;            // Reference to User (super_admin)
  
  // View Configuration
  config: {
    // Data Sections to Show
    sections: {
      schools?: {
        enabled: boolean;
        showTotal: boolean;
        showActive: boolean;
        showWithAssessments: boolean;
        filters?: {
          block?: string[];
          state?: string[];
          type?: ("government" | "private")[];
        };
      };
      tutors?: {
        enabled: boolean;
        showTotal: boolean;
        filters?: {
          schoolId?: ObjectId[];
        };
      };
      students?: {
        enabled: boolean;
        showTotal: boolean;
        showActive: boolean;
        showDropped: boolean;
        filters?: {
          schoolId?: ObjectId[];
          block?: string[];
          state?: string[];
        };
      };
      cohorts?: {
        enabled: boolean;
        showTotal: boolean;
        filters?: {
          schoolId?: ObjectId[];
          programId?: ObjectId[];
        };
      };
      assessments?: {
        enabled: boolean;
        showTotal: boolean;
        filters?: {
          schoolId?: ObjectId[];
          programId?: ObjectId[];
          dateRange?: { start: Date; end: Date };
        };
      };
      progress?: {
        enabled: boolean;
        views: ("group" | "student" | "school" | "block" | "district" | "state" | "cohort" | "program")[];
        filters?: {
          schoolId?: ObjectId[];
          programId?: ObjectId[];
          block?: string[];
          state?: string[];
        };
      };
      attendance?: {
        enabled: boolean;
        views: ("student" | "cohort" | "school" | "block" | "state")[];
        filters?: {
          schoolId?: ObjectId[];
          cohortId?: ObjectId[];
          dateRange?: { start: Date; end: Date };
        };
      };
    };
    
    // Access Control
    access: {
      allowedSchools?: ObjectId[];  // If empty, all schools
      allowedBlocks?: string[];      // If empty, all blocks
      allowedStates?: string[];      // If empty, all states
    };
  };
  
  // Associated User Account
  viewUser: {
    email: string;
    password: string;              // Hashed
    uid: string;                   // Firebase UID
    isActive: boolean;
  };
  
  createdAt: Date;
  updatedAt: Date;
}
```

#### New User Role: `VIEW_USER`
- Add to `UserRole` enum: `VIEW_USER = "view_user"`
- These users can only access their assigned view
- Cannot access regular dashboard features

---

### 2. Backend Implementation

#### New Routes (`ViewRoutes.ts`)
```
POST   /api/views                    - Create new view
GET    /api/views                    - List all views (super_admin only)
GET    /api/views/:id                - Get view details
PUT    /api/views/:id                - Update view configuration
DELETE /api/views/:id                - Delete view
GET    /api/views/:id/data           - Get aggregated data for view
POST   /api/views/:id/activate       - Activate/deactivate view user
```

#### New Controller (`viewController.ts`)
- `createView`: Create view + Firebase user + MongoDB user
- `getViews`: List views with pagination
- `getView`: Get single view
- `updateView`: Update view configuration
- `deleteView`: Delete view + cleanup Firebase user
- `getViewData`: Aggregate and return data based on view config
- `activateView`: Enable/disable view user access

#### New Service (`viewDataService.ts`)
Data aggregation functions:
- `aggregateSchoolMetrics(filters)`: Total, active, with assessments
- `aggregateTutorMetrics(filters)`: Total engaged
- `aggregateStudentMetrics(filters)`: Total, active, dropped
- `aggregateCohortMetrics(filters)`: Total created
- `aggregateAssessmentMetrics(filters)`: Total done
- `aggregateProgressData(viewType, filters)`: Progress by group/student/school/block/state/cohort/program
- `aggregateAttendanceData(viewType, filters)`: Attendance by student/cohort/school/block/state

---

### 3. Frontend Implementation

#### New Pages

**1. View Management Page** (`ManageViews.tsx`)
- List all created views
- "Create View" button
- Edit/Delete actions
- Activate/Deactivate toggle

**2. Create/Edit View Page** (`CreateView.tsx` / `EditView.tsx`)
- Form with sections:
  - **Basic Info**: Name, Description, Stakeholder Type
  - **Data Sections**: Checkboxes for each section (Schools, Tutors, Students, etc.)
  - **Section Configuration**: For each enabled section, show:
    - Which metrics to display
    - Filter options (school, block, state, program, date range)
  - **Access Control**: Which schools/blocks/states this view can access
  - **User Account**: Email, Password (auto-generated or manual)

**3. View Dashboard** (`ViewDashboard.tsx`)
- Custom dashboard for view users
- Displays only enabled sections
- Data cards/charts based on configuration
- Responsive layout
- Export functionality (optional)

#### New Components

**1. ViewSectionSelector** (`ViewSectionSelector.tsx`)
- Checkbox list of available sections
- Expandable configuration for each section

**2. ViewDataCard** (`ViewDataCard.tsx`)
- Reusable card component for displaying metrics
- Supports different chart types (bar, line, pie)

**3. ViewFilters** (`ViewFilters.tsx`)
- Filter component for date ranges, schools, blocks, etc.

---

## 📊 Data Aggregation Logic

### Metrics Calculation

#### Schools
```typescript
- Total Schools: Count all schools matching filters
- Active Schools: Schools with at least one active cohort
- Schools with Assessments: Schools with at least one assessment record
```

#### Tutors
```typescript
- Total Tutors: Count tutors (role = "tutor") matching filters
- Engaged Tutors: Tutors assigned to at least one active cohort
```

#### Students
```typescript
- Total Students: Count all students matching filters
- Active Students: Students where isArchived = false
- Dropped Students: Students where isArchived = true
```

#### Cohorts
```typescript
- Total Cohorts: Count all cohorts matching filters
- Active Cohorts: Cohorts with status = "active"
```

#### Assessments
```typescript
- Total Assessments: Count all assessment records matching filters
- By Program: Group by program
- By Date Range: Filter by date
```

#### Progress Tracking
```typescript
- Group-wise: Aggregate by cohort groups
- Student-wise: Individual student progress
- School-wise: Aggregate by school
- Block-wise: Aggregate by school.block
- State-wise: Aggregate by school.state
- Cohort-wise: Aggregate by cohort
- Program-wise: Aggregate by program
```

#### Attendance Tracking
```typescript
- Student-wise: Individual attendance records
- Cohort-wise: Aggregate by cohort
- School-wise: Aggregate by school
- Block-wise: Aggregate by school.block
- State-wise: Aggregate by school.state
```

---

## 🔐 Security Considerations

1. **View User Isolation**: View users can only access their assigned view
2. **Data Filtering**: Enforce access control filters at API level
3. **Password Security**: Use Firebase password requirements
4. **View Creation**: Only super_admin can create views
5. **Audit Logging**: Log view access and data queries

---

## 🗂️ File Structure

### Backend
```
backend/src/
├── models/
│   └── ViewModel.ts              (NEW)
├── controllers/
│   ├── viewController.ts         (NEW)
│   └── viewDataController.ts     (NEW)
├── services/
│   └── viewDataService.ts        (NEW)
├── routes/
│   └── ViewRoutes.ts             (NEW)
└── configs/
    └── roles.ts                  (UPDATE - add VIEW_USER)
```

### Frontend
```
pwa/src/
├── pages/dashboard/
│   ├── ManageViews.tsx           (NEW)
│   ├── CreateView.tsx            (NEW)
│   └── ViewDashboard.tsx         (NEW)
├── components/views/
│   ├── ViewSectionSelector.tsx   (NEW)
│   ├── ViewDataCard.tsx          (NEW)
│   └── ViewFilters.tsx           (NEW)
├── services/
│   └── views.ts                  (NEW)
└── routes/
    └── router.tsx                (UPDATE - add view routes)
```

---

## 📝 Implementation Phases

### Phase 1: Foundation (Week 1)
- [ ] Create ViewModel schema
- [ ] Add VIEW_USER role
- [ ] Create view CRUD endpoints
- [ ] Create view management page (list views)

### Phase 2: View Creation (Week 2)
- [ ] Create view creation form
- [ ] Implement section selection
- [ ] Implement filter configuration
- [ ] Implement user account creation

### Phase 3: Data Aggregation (Week 3)
- [ ] Implement data aggregation service
- [ ] Create API endpoints for view data
- [ ] Test all metric calculations

### Phase 4: View Dashboard (Week 4)
- [ ] Create view dashboard page
- [ ] Implement data cards/components
- [ ] Implement responsive layout
- [ ] Add export functionality (optional)

### Phase 5: Testing & Refinement (Week 5)
- [ ] End-to-end testing
- [ ] Performance optimization
- [ ] Security audit
- [ ] Documentation

---

## 🎨 UI/UX Considerations

1. **View Creation Form**: 
   - Step-by-step wizard or single-page form
   - Clear section organization
   - Preview of what will be shown

2. **View Dashboard**:
   - Clean, professional layout
   - Card-based metrics display
   - Charts for visual representation
   - Mobile-responsive

3. **Navigation**:
   - View users see only their dashboard
   - No access to sidebar navigation
   - Simple header with logout

---

## 🔄 Future Enhancements

1. **Export Functionality**: PDF/Excel export of view data
2. **Scheduled Reports**: Email reports on schedule
3. **Custom Charts**: Allow users to customize chart types
4. **Comparison Views**: Compare metrics across time periods
5. **Alerts**: Set up alerts for threshold breaches
6. **Multi-language Support**: Support for regional languages

---

## ❓ Questions for Approval

1. **Stakeholder Types**: Should we have predefined stakeholder types or allow custom types?
2. **Password Management**: Should passwords be auto-generated or user-defined?
3. **View Sharing**: Can one view be shared with multiple users, or one-to-one?
4. **Data Refresh**: Real-time or cached data? Cache duration?
5. **Export Format**: PDF, Excel, or both?
6. **Mobile App**: Do we need a mobile app for view users?

---

## 📋 Next Steps

1. **Review & Approval**: Get approval on this plan
2. **Database Migration**: Create ViewModel schema
3. **Backend Development**: Start with Phase 1
4. **Frontend Development**: Start with view management page
5. **Testing**: Continuous testing throughout development

---

**Prepared by**: AI Assistant  
**Date**: 2024  
**Status**: Awaiting Approval

