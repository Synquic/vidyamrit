/**
 * Test Script for Attendance-Based Level Progress Tracking
 * 
 * This script simulates taking attendance over multiple days to test:
 * 1. Weeks calculation from attendance dates
 * 2. Level progress tracking
 * 3. Assessment readiness detection
 * 4. Progress bar updates
 * 
 * Usage:
 *   tsx src/scripts/testAttendanceProgress.ts
 * 
 * Make sure you have:
 * - A test school in the database
 * - A test tutor user
 * - A test program with levels (e.g., Level 1: 2 weeks)
 * - Students assigned to a cohort
 */

import mongoose from 'mongoose';
import Cohort from '../models/CohortModel';
import Student from '../models/StudentModel';
import User from '../models/UserModel';
import Program from '../models/ProgramModel';
import School from '../models/SchoolModel';
import { calculateLevelProgress, getCurrentLevelAttendanceDates, calculateWeeksFromAttendance } from '../lib/cohortProgressHelper';
import { connectDB } from '../configs/db';

// Configuration
const TEST_CONFIG = {
  // Update these with actual IDs from your database
  SCHOOL_ID: '', // Will be set during setup
  TUTOR_ID: '', // Will be set during setup
  PROGRAM_ID: '', // Will be set during setup
  COHORT_ID: '', // Will be set during setup
};

// Helper function to create test data
async function setupTestData() {
  console.log('\n📋 Setting up test data...\n');

  // Find or create test school
  let school = await School.findOne({ name: 'Test School - Attendance Progress' });
  if (!school) {
    school = await School.create({
      name: 'Test School - Attendance Progress',
      address: '123 Test Street',
      phone: '1234567890',
      pointOfContact: 'Test Contact',
      pinCode: '123456',
      establishedYear: 2020,
      state: 'Test State',
      city: 'Test City',
      level: 'primary',
      udise_code: `TEST${Date.now()}`, // Unique code using timestamp
      type: 'government',
    });
    console.log('✅ Created test school:', school._id);
  } else {
    console.log('✅ Found existing test school:', school._id);
  }
  TEST_CONFIG.SCHOOL_ID = school._id.toString();

  // Find or create test tutor
  let tutor = await User.findOne({ email: 'test-tutor@attendance.com' });
  if (!tutor) {
    const UserRole = require('../configs/roles').UserRole;
    tutor = await User.create({
      uid: `test-tutor-${Date.now()}`, // Unique Firebase UID
      name: 'Test Tutor',
      email: 'test-tutor@attendance.com',
      phoneNo: '1234567890',
      role: UserRole.TUTOR,
      schoolId: school._id,
      isActive: true,
    });
    console.log('✅ Created test tutor:', tutor._id);
  } else {
    console.log('✅ Found existing test tutor:', tutor._id);
  }
  TEST_CONFIG.TUTOR_ID = tutor._id.toString();

  // Find or create test program (Level 1: 2 weeks, Level 2: 2 weeks)
  let program = await Program.findOne({ name: 'Test Attendance Program' });
  if (!program) {
    program = await Program.create({
      name: 'Test Attendance Program',
      subject: 'math',
      description: 'Test program for attendance progress tracking',
      totalLevels: 2,
      levels: [
        {
          levelNumber: 1,
          title: 'Level 1 - Test',
          description: 'First level for testing',
          timeframe: 2,
          timeframeUnit: 'weeks',
          assessmentQuestions: [
            {
              questionText: 'What is 2 + 2?',
              questionType: 'multiple_choice',
              options: ['3', '4', '5', '6'],
              correctOptionIndex: 1,
              points: 1,
            },
          ],
        },
        {
          levelNumber: 2,
          title: 'Level 2 - Test',
          description: 'Second level for testing',
          timeframe: 2,
          timeframeUnit: 'weeks',
          assessmentQuestions: [
            {
              questionText: 'What is 3 + 3?',
              questionType: 'multiple_choice',
              options: ['5', '6', '7', '8'],
              correctOptionIndex: 1,
              points: 1,
            },
          ],
        },
      ],
      isActive: true,
      createdBy: tutor._id,
    });
    console.log('✅ Created test program:', program._id);
  } else {
    console.log('✅ Found existing test program:', program._id);
  }
  TEST_CONFIG.PROGRAM_ID = program._id.toString();

  // Find or create test students
  const students = [];
  for (let i = 1; i <= 5; i++) {
    let student = await Student.findOne({ 
      school: school._id, 
      roll_no: `TEST${i}` 
    });
    if (!student) {
      student = await Student.create({
        name: `Test Student ${i}`,
        roll_no: `TEST${i}`,
        age: 10,
        gender: 'male',
        class: '5',
        caste: 'General',
        school: school._id,
        contactInfo: [{
          name: `Parent ${i}`,
          relation: 'Father',
          phone_no: `123456789${i}`,
        }],
        knowledgeLevel: [{ 
          level: 1,
          date: new Date()
        }],
        math_level: 1,
        currentProgressFlags: {},
        progressHistory: [],
        totalAssessments: 0,
        averagePerformance: 0,
      });
      console.log(`✅ Created test student ${i}:`, student._id);
    } else {
      console.log(`✅ Found existing test student ${i}:`, student._id);
    }
    students.push(student._id);
  }

  // Find or create test cohort
  let cohort = await Cohort.findOne({ name: 'Test Attendance Cohort' });
  if (!cohort) {
    cohort = await Cohort.create({
      name: 'Test Attendance Cohort',
      schoolId: school._id,
      tutorId: tutor._id,
      programId: program._id,
      currentLevel: 1,
      startDate: new Date(),
      status: 'active',
      students: students,
      attendance: [],
      progress: students.map(studentId => ({
        studentId,
        currentLevel: 1,
        status: 'green',
        failureCount: 0,
        assessmentHistory: [],
      })),
    });
    console.log('✅ Created test cohort:', cohort._id);
  } else {
    // Update existing cohort
    cohort.students = students;
    cohort.programId = program._id;
    cohort.currentLevel = 1;
    cohort.attendance = [];
    await cohort.save();
    console.log('✅ Updated existing test cohort:', cohort._id);
  }
  TEST_CONFIG.COHORT_ID = cohort._id.toString();

  console.log('\n✅ Test data setup complete!\n');
  return { cohort, program, students };
}

// Simulate taking attendance for a specific date
async function recordAttendance(cohortId: string, date: Date, presentCount: number = 5) {
  const cohort = await Cohort.findById(cohortId).populate('students');
  if (!cohort) {
    throw new Error('Cohort not found');
  }

  const attendanceRecords = cohort.students.slice(0, presentCount).map((student: any) => ({
    studentId: student._id.toString(),
    status: 'present' as const,
  }));

  // Add attendance records directly to cohort
  attendanceRecords.forEach((record: any) => {
    // Remove existing attendance for this date
    cohort.attendance = cohort.attendance.filter(
      (att: any) => !(
        att.studentId.toString() === record.studentId.toString() &&
        att.date.toDateString() === date.toDateString()
      )
    );

    // Add new attendance record - ensure date is a proper Date object
    const normalizedDate = new Date(date);
    normalizedDate.setHours(0, 0, 0, 0);
    
    cohort.attendance.push({
      date: normalizedDate,
      studentId: record.studentId,
      status: record.status,
    });
  });

  // Update time tracking
  if (cohort.programId) {
    const Program = require('../models/ProgramModel').default;
    const program = await Program.findById(cohort.programId._id || cohort.programId);
    
    if (program) {
      const currentLevel = cohort.currentLevel || 1;
      const currentLevelInfo = program.getLevelByNumber(currentLevel);
      
      if (currentLevelInfo) {
        if (!cohort.timeTracking) {
          const cohortStartDate = cohort.startDate || cohort.createdAt;
          let expectedDaysForCurrentLevel = currentLevelInfo.timeframe || 14;
          switch (currentLevelInfo.timeframeUnit) {
            case 'weeks':
              expectedDaysForCurrentLevel *= 7;
              break;
            case 'months':
              expectedDaysForCurrentLevel *= 30;
              break;
          }

          const totalExpectedDays = program.getTotalTimeToComplete(1, undefined, 'days') || 140;

          cohort.timeTracking = {
            cohortStartDate,
            currentLevelStartDate: cohortStartDate,
            attendanceDays: 0,
            expectedDaysForCurrentLevel,
            totalExpectedDays,
          };
        }

        // Mark attendance array as modified so Mongoose saves it
        cohort.markModified('attendance');
        
        // Update attendance days count BEFORE saving
        const presentDays = new Set();
        cohort.attendance.forEach((att: any) => {
          if (att.status === 'present') {
            const attDate = new Date(att.date);
            presentDays.add(attDate.toDateString());
          }
        });
        
        cohort.timeTracking.attendanceDays = presentDays.size;
        cohort.markModified('timeTracking');
        
        // Save the cohort
        await cohort.save();
        
        // Return null - we'll calculate progress in the main function after fetching
        return null;
      }
    }
  }

  // Mark attendance as modified
  cohort.markModified('attendance');
  await cohort.save();
  return null;
}

// Main test function
async function runTest() {
  try {
    console.log('🚀 Starting Attendance Progress Test\n');
    console.log('='.repeat(60));

    // Connect to database
    console.log('🔌 Connecting to MongoDB...');
    await connectDB();
    console.log('✅ Connected to MongoDB');

    // Setup test data
    const { cohort, program } = await setupTestData();

    console.log('\n📊 Initial State:');
    console.log('   Cohort:', cohort.name);
    console.log('   Current Level:', cohort.currentLevel);
    console.log('   Total Students:', cohort.students.length);
    console.log('   Program:', program.name);
    console.log('   Level 1 Duration:', program.levels[0].timeframe, program.levels[0].timeframeUnit);

    // Simulate taking attendance over 10 days (2 weeks = 14 days, but we'll test with 10 teaching days)
    console.log('\n📅 Simulating attendance over 10 teaching days...\n');
    console.log('='.repeat(60));

    // Calculate the first Monday (first teaching day) - this will be our level start date
    let firstAttendanceDate = new Date();
    firstAttendanceDate.setHours(0, 0, 0, 0);
    
    const dayOfWeek = firstAttendanceDate.getDay();
    const daysToMonday = dayOfWeek === 0 ? 1 : (8 - dayOfWeek) % 7;
    if (daysToMonday > 0) {
      firstAttendanceDate.setDate(firstAttendanceDate.getDate() + daysToMonday);
    }
    firstAttendanceDate.setHours(0, 0, 0, 0);
    
    // Initialize timeTracking with the first attendance date BEFORE recording any attendance
    const Program = require('../models/ProgramModel').default;
    const programDoc = await Program.findById(cohort.programId);
    const currentLevelInfo = programDoc?.getLevelByNumber(1);
    
    cohort.timeTracking = {
      cohortStartDate: firstAttendanceDate,
      currentLevelStartDate: firstAttendanceDate, // CRITICAL: Set to first attendance date
      attendanceDays: 0,
      expectedDaysForCurrentLevel: (currentLevelInfo?.timeframe || 2) * 7,
      totalExpectedDays: programDoc?.getTotalTimeToComplete(1, undefined, 'days') || 28,
    };
    cohort.markModified('timeTracking');
    await cohort.save();
    console.log(`\n📅 Set currentLevelStartDate to: ${firstAttendanceDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`);
    
    // Now use this date as the starting point for attendance
    let currentDate = new Date(firstAttendanceDate);
    
    let teachingDayCount = 0;
    while (teachingDayCount < 10) {
      const attendanceDate = new Date(currentDate);
      attendanceDate.setHours(0, 0, 0, 0); // Normalize time
      
      // Skip weekends (Sunday = 0, Saturday = 6)
      const dayOfWeek = attendanceDate.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        currentDate.setDate(currentDate.getDate() + 1);
        continue; // Skip weekends
      }
      
      teachingDayCount++;

      console.log(`\n📆 Teaching Day ${teachingDayCount}: ${attendanceDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`);
      
      // Record attendance
      await recordAttendance(
        TEST_CONFIG.COHORT_ID,
        attendanceDate,
        5 // All 5 students present
      );

      // Fetch updated cohort - IMPORTANT: Don't use populate on attendance, it's embedded
      const updatedCohort = await Cohort.findById(TEST_CONFIG.COHORT_ID).populate('programId');
      if (!updatedCohort) {
        throw new Error('Cohort not found after attendance recording');
      }
      
      // Debug: Check attendance count
      const attendanceCount = updatedCohort.attendance?.length || 0;
      const uniqueDates = new Set(
        (updatedCohort.attendance || [])
          .filter((a: any) => a.status === 'present')
          .map((a: any) => new Date(a.date).toDateString())
      );
      
      const progress = await calculateLevelProgress(updatedCohort);
      
      // Debug output on first day
      if (teachingDayCount === 1) {
        console.log(`   🔍 Debug: Total attendance records: ${attendanceCount}`);
        console.log(`   🔍 Debug: Unique present dates: ${uniqueDates.size}`);
        console.log(`   🔍 Debug: timeTracking.currentLevelStartDate: ${updatedCohort.timeTracking?.currentLevelStartDate ? new Date(updatedCohort.timeTracking.currentLevelStartDate).toLocaleDateString() : 'NOT SET'}`);
        if (updatedCohort.attendance && updatedCohort.attendance.length > 0) {
          const firstAtt = updatedCohort.attendance.find((a: any) => a.status === 'present');
          if (firstAtt) {
            console.log(`   🔍 Debug: First present attendance date: ${new Date(firstAtt.date).toLocaleDateString()}`);
            console.log(`   🔍 Debug: First attendance status: ${firstAtt.status}`);
          }
        }
        // Debug: Check what getCurrentLevelAttendanceDates returns
        const { getCurrentLevelAttendanceDates } = require('../lib/cohortProgressHelper');
        const levelDates = getCurrentLevelAttendanceDates(updatedCohort);
        console.log(`   🔍 Debug: getCurrentLevelAttendanceDates returned ${levelDates.length} dates`);
        if (levelDates.length > 0) {
          console.log(`   🔍 Debug: First level date: ${levelDates[0].toLocaleDateString()}`);
        }
      }

      console.log(`   ✅ Attendance recorded (5 students present)`);
      console.log(`   📊 Progress:`);
      console.log(`      - Weeks Completed: ${progress.weeksCompleted.toFixed(2)}`);
      console.log(`      - Weeks Required: ${progress.weeksRequired}`);
      console.log(`      - Completion: ${progress.completionPercentage.toFixed(1)}%`);
      console.log(`      - Teaching Days: ${updatedCohort!.timeTracking?.attendanceDays || 0}`);
      
      if (progress.isReadyForAssessment) {
        console.log(`   🎯 ✅ READY FOR ASSESSMENT!`);
      } else if (progress.daysRemaining) {
        console.log(`   ⏳ Days Remaining: ${progress.daysRemaining}`);
      }

      // Show progress bar visualization
      const progressBar = '█'.repeat(Math.floor(progress.completionPercentage / 5)) + 
                         '░'.repeat(20 - Math.floor(progress.completionPercentage / 5));
      console.log(`   📈 [${progressBar}] ${progress.completionPercentage.toFixed(1)}%`);
      
      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Final summary
    console.log('\n' + '='.repeat(60));
    console.log('\n📊 Final Summary:\n');
    
    const finalCohort = await Cohort.findById(TEST_CONFIG.COHORT_ID).populate('programId');
    const finalProgress = await calculateLevelProgress(finalCohort!);
    
    console.log(`   Cohort: ${finalCohort!.name}`);
    console.log(`   Current Level: ${finalCohort!.currentLevel}`);
    console.log(`   Weeks Completed: ${finalProgress.weeksCompleted.toFixed(2)} / ${finalProgress.weeksRequired}`);
    console.log(`   Completion: ${finalProgress.completionPercentage.toFixed(1)}%`);
    console.log(`   Teaching Days: ${finalCohort!.timeTracking?.attendanceDays || 0}`);
    console.log(`   Assessment Ready: ${finalProgress.isReadyForAssessment ? '✅ YES' : '❌ NO'}`);
    
    if (finalProgress.isReadyForAssessment) {
      console.log('\n   🎉 SUCCESS! The cohort has completed the required weeks and is ready for assessment!');
      console.log('   📝 Next Steps:');
      console.log('      1. Conduct level-specific assessment');
      console.log('      2. After passing, cohort will move to Level 2');
    } else {
      console.log(`\n   ⏳ The cohort needs ${finalProgress.daysRemaining || 0} more teaching days to complete Level ${finalCohort!.currentLevel}`);
    }

    console.log('\n✅ Test completed successfully!\n');

  } catch (error: any) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the test
if (require.main === module) {
  runTest().catch(console.error);
}

export { runTest, setupTestData, recordAttendance };

