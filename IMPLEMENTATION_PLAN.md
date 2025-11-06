# 📋 Cohort Generation & UI Consolidation - Implementation Plan

## 🎯 Overview
This implementation addresses cohort generation improvements, tracking issues, and UI consolidation as per requirements.

---

## ✅ Task Breakdown

### **Phase 1: Backend - Cohort Tracking & Generation (Tasks 1-5)**

#### **Task 1: Fix Cohort Deletion Tracking** 
**Problem**: When a cohort is deleted, students' cohort records are not updated, making them unavailable for new cohort assignment.

**Solution**: 
- Update `deleteCohort` controller to set `dateLeaved` on all affected students
- Ensure `getStudentCohortStatus` only counts students with active cohorts (no `dateLeaved`)

**Files to modify**:
- `backend/src/controllers/cohortController.ts` - `deleteCohort` function
- `backend/src/controllers/studentController.ts` - `getStudentCohortStatus` function

---

#### **Task 2: Enhanced Cohort Generation Algorithm**
**Problem**: Current algorithm doesn't support strategy selection (high vs low performers first) or configurable capacity constraints.

**Requirements from req-td.md**:
- Support two strategies:
  - **Strategy A**: Teach high-performing students first (levels 8-9), then focus on others
  - **Strategy B**: Teach low-performing students first (levels 1-2), build from bottom
- **Capacity Constraint**: Configurable maximum active cohorts (default: 5, user can set any number)
- When more cohorts are generated than the capacity limit, first N cohorts become "active", rest students go to "pending"

**Solution**:
- Update `CohortGenerationAlgo.ts` to support:
  - Strategy parameter (`'high-first' | 'low-first'`)
  - **Configurable** capacity limit parameter (default: 5, but user can set any number)
  - Return both active cohorts and pending students
- Update `generateOptimalCohorts` controller to:
  - Accept strategy and **configurable** capacity parameters (from request body)
  - Mark first N cohorts as "active" (where N = capacity limit)
  - Track remaining students as "pending"
  - Don't delete existing cohorts (preserve history)

**Files to modify**:
- `backend/src/lib/CohortGenerationAlgo.ts` - Add strategy support
- `backend/src/controllers/cohortController.ts` - Update `generateOptimalCohorts`

---

#### **Task 3: Pending Students List**
**Problem**: Students not in first N cohorts (based on configurable capacity) need to be tracked separately.

**Solution**:
- Students not assigned to active cohorts (beyond the capacity limit) should be:
  - Tracked in a separate list/query
  - Available for cohort creation after first batch completes
  - Shown in UI as "pending cohort assignment"
- Capacity is configurable, so pending count depends on user-defined limit

**Files to modify**:
- `backend/src/controllers/studentController.ts` - Add pending students query
- `backend/src/controllers/cohortController.ts` - Track pending in generation

---

#### **Task 4: Cohort Status Field**
**Problem**: No way to distinguish between active and pending/inactive cohorts.

**Solution**:
- Add `status` field to `CohortModel`:
  ```typescript
  status: {
    type: String,
    enum: ['active', 'pending', 'completed', 'archived'],
    default: 'active'
  }
  ```

**Files to modify**:
- `backend/src/models/CohortModel.ts` - Add status field

---

#### **Task 5: Update Cohort Status API**
**Problem**: `getStudentCohortStatus` may not correctly identify students available for assignment.

**Solution**:
- Ensure query checks:
  - Students have assessments
  - Students have NO active cohort membership (`dateLeaved` is null/undefined OR doesn't exist)
  - Consider cohort deletion scenarios

**Files to modify**:
- `backend/src/controllers/studentController.ts` - `getStudentCohortStatus`

---

### **Phase 2: Frontend - UI Consolidation (Tasks 6-7, 10)**

#### **Task 6: Consolidate Attendance Pages**
**Problem**: Separate files for `TutorAttendance.tsx` and `CohortAttendance.tsx` make UI ambiguous.

**Solution**:
- Create single `AttendanceManagement.tsx` page with:
  - **Tab 1**: Overview (current TutorAttendance functionality)
    - List all cohorts with attendance summary
    - Quick stats
    - Date selector
  - **Tab 2**: Cohort Detail (current CohortAttendance functionality)
    - Accessible via route `/attendance/cohort/:cohortId`
    - Detailed student attendance marking
- Remove separate folder structure

**Files to create**:
- `pwa/src/pages/dashboard/AttendanceManagement.tsx`

**Files to remove/modify**:
- Consolidate `pwa/src/pages/dashboard/attendance/TutorAttendance.tsx`
- Keep `CohortAttendance.tsx` as detail view component (or integrate into main page)

---

#### **Task 7: Consolidate Progress Pages**
**Problem**: Separate progress pages create confusion.

**Solution**:
- Create single `ProgressManagement.tsx` page:
  - Main view: Overview (current TutorProgress functionality)
  - Detail view: `/progress/cohort/:cohortId` (current CohortProgress functionality)

**Files to create**:
- `pwa/src/pages/dashboard/ProgressManagement.tsx`

**Files to remove/modify**:
- Consolidate `pwa/src/pages/dashboard/progress/TutorProgress.tsx`

---

#### **Task 10: Update Routes**
**Solution**:
- Update `pwa/src/routes/router.tsx` to use consolidated pages
- Keep detail routes for individual cohort views

---

### **Phase 3: Frontend - Cohort Generation UI (Tasks 8-9)**

#### **Task 8: Strategy Selection & Capacity Configuration UI**
**Solution**:
- Add configuration section in `ManageCohorts.tsx`:
  - **Strategy Selection**: Radio buttons "Teach High Performers First" vs "Teach Low Performers First"
  - **Capacity Limit Input**: Number input field (default: 5, but user can set any value)
    - Min: 1, Max: reasonable limit (e.g., 20)
    - Help text explaining what this means
  - Display pending students count based on selected capacity

**Files to modify**:
- `pwa/src/pages/dashboard/ManageCohorts.tsx`

---

#### **Task 9: Pending Students Display**
**Solution**:
- Add section in `ManageCohorts.tsx` showing:
  - List of pending students (with levels)
  - "Generate Next Batch" button (for when active cohorts complete)
  - Status indicator

**Files to modify**:
- `pwa/src/pages/dashboard/ManageCohorts.tsx`

---

## 🔄 Implementation Flow

### **Step 1: Backend Foundation**
1. ✅ Fix cohort deletion tracking
2. ✅ Add cohort status field to model
3. ✅ Update cohort generation algorithm with strategy support
4. ✅ Update APIs to handle pending students

### **Step 2: Frontend UI**
1. ✅ Consolidate attendance pages
2. ✅ Consolidate progress pages  
3. ✅ Update routes
4. ✅ Add strategy selection UI
5. ✅ Add pending students display

---

## 📝 Key Design Decisions

### **Cohort Generation Strategy**
- **High-First Strategy**: Sort students by level (descending), create cohorts starting from highest levels
  - Rationale: Fast-track advanced students, they need less time
- **Low-First Strategy**: Sort students by level (ascending), create cohorts starting from lowest levels
  - Rationale: Prioritize students who need more support

### **Capacity Management**
- User configures maximum active cohorts (default: 5, but dynamic/configurable)
- First N cohorts generated → Status: `'active'` (where N = user-defined capacity limit)
- Remaining students → Tracked separately as "pending"
- After active cohorts complete → Reassess pending students and generate next batch

### **Cohort Deletion**
- When cohort deleted → Set `dateLeaved` on all students in that cohort
- Students become available for new cohort assignment

---

## 🧪 Testing Checklist

- [ ] Delete cohort → Students become available for assignment
- [ ] Generate cohorts with high-first strategy → Highest levels in first cohorts
- [ ] Generate cohorts with low-first strategy → Lowest levels in first cohorts
- [ ] Set capacity limit to 3 → First 3 cohorts are active, rest students are pending
- [ ] Set capacity limit to 10 → First 10 cohorts are active, rest students are pending
- [ ] Capacity limit is configurable via UI input field
- [ ] Attendance page shows all cohorts in overview
- [ ] Progress page shows all cohorts in overview
- [ ] Cohort detail pages work correctly

---

## ⚠️ Important Notes

1. **Backward Compatibility**: Existing cohorts without status should default to 'active'
2. **Student Cohort Array**: Keep historical records, only check active memberships (no dateLeaved)
3. **Capacity Limit**: **Configurable/dynamic** - User sets the limit via UI input (default: 5, but can be any number)
4. **Pending Students**: These should be clearly distinguished in UI from students without assessments
5. **Capacity Input Validation**: Ensure capacity limit is positive integer, reasonable max (e.g., 1-20)

---

**Ready for review? Please confirm:**
- ✅ Task breakdown looks correct
- ✅ Strategy approach (high-first vs low-first) is acceptable
- ✅ Capacity limit of 5 cohorts is correct
- ✅ UI consolidation approach is good
- ✅ Proceed with implementation starting from frontend

