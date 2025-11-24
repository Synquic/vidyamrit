# Cohort Generation System - Comprehensive Analysis

## Overview
The cohort generation system automatically creates optimal student groups (cohorts) based on assessment levels, program-specific data, and configurable strategies. It processes students across all active programs and groups them by level for efficient teaching.

---

## Architecture

### 1. **Frontend (PWA)**
- **Location**: `pwa/src/pages/dashboard/ManageCohorts.tsx`
- **Service**: `pwa/src/services/cohorts.ts`
- **UI Components**: Generation dialog with strategy selection and capacity limits

### 2. **Backend (API)**
- **Controller**: `backend/src/controllers/cohortController.ts`
- **Algorithm**: `backend/src/lib/CohortGenerationAlgo.ts`
- **Model**: `backend/src/models/CohortModel.ts`

---

## Data Flow

### Step 1: User Initiates Generation
```
User clicks "Generate Optimal Cohorts" 
  ↓
Frontend: ManageCohorts.tsx
  - Validates school selection
  - Validates active programs exist
  - Validates students awaiting assignment
  - Collects strategy (high-first/low-first)
  - Collects capacity limit (default: 5)
  ↓
API Call: POST /api/cohorts/generate-optimal
  Body: { schoolId, strategy, capacityLimit }
```

### Step 2: Backend Processing
```
cohortController.generateOptimalCohorts()
  ↓
1. Validates inputs (schoolId, strategy, capacityLimit)
2. Checks user permissions (TUTOR can only generate for their school)
3. Fetches all active programs
4. Fetches all students from school
5. Fetches all tutors for school
6. Identifies students already in active cohorts (excludes them)
  ↓
For each active program:
  ↓
  a. Filter students with assessment data for this program
  b. Filter out students already in active cohorts
  c. Group students by their level (from knowledgeLevel)
  d. Convert to LevelInput format for algorithm
  e. Call generateCohortPlan() algorithm
  f. Create cohorts based on algorithm output
  g. Assign tutors in round-robin fashion
  h. Update student records with cohort information
  ↓
Return results with created cohorts and pending students
```

---

## Algorithm Details

### Core Algorithm: `CohortGenerationAlgo.ts`

#### **Function: `createCohorts(studentCount, ideal=20, minSize=5, maxSize=30)`**

**Purpose**: Creates optimal cohort sizes for a single level of students.

**Algorithm Steps**:
1. **Fill with ideal-size cohorts**: Create as many cohorts of size 20 as possible
2. **Handle remainder**:
   - If remainder < 5 (minSize): Distribute into existing cohorts (up to maxSize=30)
   - If remainder >= 5: Create a new cohort with remainder
3. **Rebalance**: If any cohort < minSize, redistribute evenly

**Example**:
- 37 students → [20, 17] (one full cohort + one with remainder)
- 18 students → [18] (single cohort, below ideal but valid)
- 53 students → [20, 20, 13] (two ideal + one remainder)

#### **Function: `generateCohortPlan(levels, strategy, maxActiveCohorts=5)`**

**Purpose**: Generates cohort plans for multiple levels with capacity constraints.

**Parameters**:
- `levels`: Array of `{ level: number, students: number }`
- `strategy`: `'high-first'` or `'low-first'`
- `maxActiveCohorts`: Maximum number of active cohorts to create (default: 5)

**Algorithm Steps**:
1. **Sort levels** based on strategy:
   - `high-first`: Sort descending (Level 10, 9, 8...)
   - `low-first`: Sort ascending (Level 1, 2, 3...)
2. **Generate all cohort plans** for each level
3. **Apply capacity limit**:
   - If total cohorts <= maxActiveCohorts: All are active
   - Otherwise: Fill up to capacity, rest go to pending

**Output**:
```typescript
{
  activeCohorts: CohortPlan[],      // Cohorts that will be created
  pendingStudents: Array<{          // Students waiting for assignment
    level: number | string;
    students: number;
  }>,
  totalCohorts: number,
  activeCohortsCount: number
}
```

---

## Key Features

### 1. **Program-Based Processing**
- Processes **each active program separately**
- Students are grouped by their level **per program**
- Example: A student can be in "Hindi Level 2" cohort and "Mathematics Level 6" cohort

### 2. **Level-Based Grouping**
- **Strict separation**: Students in different levels are NEVER in the same cohort
- Uses `knowledgeLevel` array to determine student's level for each program
- Gets the **most recent assessment** for each program

### 3. **Strategy Options**

#### **Low-First Strategy** (Default)
- Prioritizes lower-level students first
- Example: Level 1, 2, 3 cohorts created before Level 8, 9, 10
- **Use case**: Focus on foundational learning

#### **High-First Strategy**
- Prioritizes higher-level students first
- Example: Level 10, 9, 8 cohorts created before Level 1, 2, 3
- **Use case**: Focus on advanced students

### 4. **Capacity Management**
- **Capacity Limit**: Maximum number of active cohorts to create (default: 5)
- If more cohorts needed: Remaining students marked as "pending"
- Prevents overwhelming tutors with too many cohorts

### 5. **Tutor Assignment**
- **Round-robin distribution**: Tutors assigned in rotation
- Ensures balanced workload across all tutors
- Example: 3 tutors, 5 cohorts → Tutor1, Tutor2, Tutor3, Tutor1, Tutor2

### 6. **Student Exclusion**
- **Excludes students already in active cohorts**
- Checks `student.cohort` array for entries without `dateLeaved`
- Prevents duplicate assignments

---

## Data Structures

### Student Knowledge Level (New Structure)
```typescript
knowledgeLevel: [
  {
    program: ObjectId,        // Reference to Program
    programName: string,       // e.g., "Hindi baseline"
    subject: string,           // e.g., "Hindi"
    level: number,             // e.g., 2
    date: Date                 // Assessment date
  }
]
```

### Cohort Model
```typescript
{
  name: string,                // e.g., "HINDI Level 2 - Cohort 1"
  schoolId: ObjectId,
  tutorId: ObjectId,
  programId: ObjectId,         // Reference to Program
  currentLevel: number,        // Level the cohort is working on
  status: 'active' | 'pending' | 'completed' | 'archived',
  students: ObjectId[],        // Array of student IDs
  timeTracking: {
    cohortStartDate: Date,
    currentLevelStartDate: Date,
    attendanceDays: number,
    expectedDaysForCurrentLevel: number,
    totalExpectedDays: number
  }
}
```

---

## Generation Process Flow

### Example Scenario:
**School**: Test School
**Programs**: Hindi, Mathematics
**Students**: 50 total
**Tutors**: 2 tutors
**Strategy**: Low-First
**Capacity**: 5 cohorts

### Step-by-Step:

1. **Fetch Data**:
   - Get all active programs (Hindi, Mathematics)
   - Get all students from school
   - Get all tutors (Tutor1, Tutor2)
   - Identify students already in cohorts (exclude them)

2. **Process Hindi Program**:
   - Filter students with Hindi assessment
   - Group by level:
     - Level 1: 8 students
     - Level 2: 15 students
     - Level 3: 12 students
   - Generate plans:
     - Level 1: [8] → 1 cohort
     - Level 2: [15] → 1 cohort
     - Level 3: [12] → 1 cohort
   - Total: 3 cohorts needed
   - Create cohorts:
     - "HINDI Level 1 - Cohort 1" (Tutor1, 8 students)
     - "HINDI Level 2 - Cohort 2" (Tutor2, 15 students)
     - "HINDI Level 3 - Cohort 3" (Tutor1, 12 students)

3. **Process Mathematics Program**:
   - Filter students with Mathematics assessment
   - Group by level:
     - Level 2: 10 students
     - Level 5: 20 students
     - Level 6: 18 students
   - Generate plans:
     - Level 2: [10] → 1 cohort
     - Level 5: [20] → 1 cohort
     - Level 6: [18] → 1 cohort
   - Total: 3 cohorts needed
   - Create cohorts:
     - "MATHEMATICS Level 2 - Cohort 4" (Tutor2, 10 students)
     - "MATHEMATICS Level 5 - Cohort 5" (Tutor1, 20 students)
     - "MATHEMATICS Level 6 - Cohort 6" (Tutor2, 18 students)

4. **Result**:
   - 6 cohorts created
   - 35 students assigned
   - 0 pending (within capacity limit of 5, but algorithm creates all if possible)

---

## Algorithm Constraints

### Cohort Size Rules:
- **Ideal Size**: 20 students
- **Minimum Size**: 5 students
- **Maximum Size**: 30 students
- **Rebalancing**: If cohort < 5, redistribute evenly

### Capacity Rules:
- **Default Capacity**: 5 active cohorts
- **Configurable**: 1-50 cohorts
- **Pending Students**: If capacity exceeded, remaining students wait

### Level Separation:
- **Strict**: Students in different levels NEVER in same cohort
- **Program-Specific**: Each program has separate level groups

---

## API Endpoints

### POST `/api/cohorts/generate-optimal`
**Request Body**:
```json
{
  "schoolId": "string",
  "strategy": "low-first" | "high-first",
  "capacityLimit": 5
}
```

**Response**:
```json
{
  "message": "Successfully generated X cohorts...",
  "cohorts": Cohort[],
  "studentsAssigned": 35,
  "pendingStudents": [
    {
      "program": "Hindi baseline",
      "level": 4,
      "students": 15
    }
  ],
  "totalPendingStudents": 15,
  "strategy": "low-first",
  "capacityLimit": 5,
  "programsProcessed": 2,
  "programResults": [
    {
      "programName": "Hindi baseline",
      "programSubject": "Hindi",
      "cohortsCreated": 3,
      "studentsAssigned": 20,
      "pendingStudents": 5
    }
  ]
}
```

---

## Frontend Integration

### UI Components:
1. **Generation Button**: Triggers cohort generation
2. **Strategy Selector**: Choose high-first or low-first
3. **Capacity Input**: Set maximum active cohorts (1-50)
4. **Status Display**: Shows students awaiting assignment
5. **Results Display**: Shows created cohorts and pending students

### State Management:
- Uses React Query for data fetching
- Invalidates queries after generation
- Shows toast notifications for success/error

---

## Edge Cases & Validations

### Validations:
1. ✅ School ID required
2. ✅ Strategy must be 'high-first' or 'low-first'
3. ✅ Capacity limit: 1-50
4. ✅ At least one active program required
5. ✅ At least one tutor required
6. ✅ Students must have assessment data
7. ✅ Permission check (TUTOR can only generate for their school)

### Edge Cases Handled:
1. **No students**: Returns error
2. **No tutors**: Returns error
3. **No active programs**: Returns error
4. **All students already in cohorts**: Skips generation
5. **Students without assessment**: Excluded from generation
6. **Empty cohorts**: Warns but continues
7. **Capacity exceeded**: Creates pending students list

---

## Student Data Structure Support

### New Structure (Currently Supported):
- Uses `knowledgeLevel` with `program`, `subject`, `level`, `date`
- Matches students to programs by `program` ObjectId
- Gets latest level per program
- **Code Location**: `cohortController.ts` lines 470-518

### Old Structure (NOT Currently Supported):
- The generation currently **only supports new structure**
- Students with old structure (just `level` and `date` without `program`/`subject`) are **excluded**
- **Impact**: Students with old data structure won't be included in cohort generation
- **Potential Enhancement**: Could be updated to support old structure using Assessment model (similar to how reports page handles it)

---

## Key Files Reference

### Frontend:
- `pwa/src/pages/dashboard/ManageCohorts.tsx` - Main UI component
- `pwa/src/services/cohorts.ts` - API service layer

### Backend:
- `backend/src/controllers/cohortController.ts` - Main controller (line 360-680)
- `backend/src/lib/CohortGenerationAlgo.ts` - Core algorithm
- `backend/src/models/CohortModel.ts` - Data model
- `backend/src/routes/CohortRoutes.ts` - Route definitions

---

## Current Limitations

### 1. **Old Data Structure Not Supported**
- Cohort generation only works with new `knowledgeLevel` structure
- Students with old structure (just `level` and `date`) are excluded
- **Impact**: These students won't be assigned to cohorts automatically
- **Workaround**: Manually create cohorts or migrate data

### 2. **Single Program Per Subject Assumption**
- Assumes one program per subject
- If multiple programs exist for same subject, all are processed separately
- Students could potentially be in multiple cohorts for same subject (different programs)

### 3. **No Level Progression Tracking**
- Generation uses current level only
- Doesn't consider level progression history
- Doesn't predict when students might level up

---

## Potential Enhancements

### 1. **Support Old Data Structure**
```typescript
// In cohortController.ts, add fallback logic:
// If student has old structure, fetch from Assessment model
// Group by subject from Assessment records
// Match to programs by subject name
```

### 2. **Smart Capacity Management**
- Consider tutor workload when assigning
- Balance cohort sizes across tutors
- Predict future capacity needs

### 3. **Level Progression Prediction**
- Track student progress rates
- Predict when students might level up
- Pre-allocate capacity for expected promotions

### 4. **Multi-Program Conflict Detection**
- Detect if student is in multiple cohorts for same subject
- Prevent duplicate assignments
- Suggest consolidation

---

## Summary

The cohort generation system is a sophisticated algorithm that:
1. ✅ Processes students program-by-program
2. ✅ Groups by assessment level (strict separation)
3. ✅ Creates optimal cohort sizes (5-30 students, ideal 20)
4. ✅ Respects capacity limits
5. ✅ Supports strategy-based prioritization
6. ✅ Assigns tutors in round-robin fashion
7. ✅ Excludes students already in active cohorts
8. ✅ Tracks pending students when capacity exceeded
9. ✅ Updates student records with cohort assignments
10. ✅ Provides detailed results and statistics

The system is production-ready and handles edge cases gracefully.

