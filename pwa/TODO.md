# 📋 Vidyamrit - Missing Features TODO List

Based on the original specification document, here are the features that are **missing** from the current implementation and need to be developed.

## 🎯 **Priority Classification**

- 🔴 **High Priority** - Core functionality for MVP
- 🟡 **Medium Priority** - Important for complete system
- 🟢 **Low Priority** - Enhancement features

---

## 🔴 **HIGH PRIORITY - Phase 1**

### **1. Multiple Assessment Types**

- [ ] **Midline Assessments** - Progress tracking assessments
- [ ] **Endline Assessments** - Final evaluation assessments
- [ ] **Periodic Assessments** - Regular interval testing
- [ ] Assessment type selection in UI
- [ ] Different evaluation criteria per type
- [ ] Assessment scheduling system

**Current Status**: ❌ Only baseline assessments implemented  
**Impact**: Critical for comprehensive student evaluation

### **2. Daily Attendance Management System**

- [ ] **Mark Daily Attendance** interface
  - Present/Absent/Exam status options
  - Date-wise attendance marking
  - Bulk attendance entry
- [ ] **Attendance Analytics**
  - Attendance % by student
  - Attendance % by group
  - Attendance % by school
  - Attendance % by subject
- [ ] **Admin Attendance Overview** dashboard
- [ ] Attendance reports and exports

**Current Status**: ❌ No attendance system  
**Impact**: Essential for program monitoring

### **3. Level-Based Group Assignment System**

- [ ] **Standardized Group System** (A/B/C/D/E)
  - Group A: Levels 1-2
  - Group B: Levels 3-4
  - Group C: Levels 5-6
  - Group D: Levels 7-8
  - Group E: Levels 9-10
- [ ] **Auto-assignment** after assessment completion
- [ ] **Manual group management** interface
- [ ] **Group-wise progress tracking**
- [ ] Group performance analytics

**Current Status**: ❌ No standardized grouping system  
**Impact**: Critical for organized learning management

### **4. Progress Monitoring with Flag System**

- [ ] **Visual Progress Markers**
  - 🟢 Green: On track/Good progress
  - 🟡 Yellow: Needs attention/Slow progress
  - 🔴 Red: Concerning/No progress
- [ ] **Automated flag assignment** based on:
  - Assessment progress
  - Attendance rates
  - Level advancement
- [ ] **Flag-based filtering** in dashboards
- [ ] **Alert system** for red flag students

**Current Status**: ❌ No progress flag system  
**Impact**: High - Essential for identifying at-risk students

---

## 🟡 **MEDIUM PRIORITY - Phase 2**

### **5. Comprehensive Tutor Management System**

- [ ] **Tutor Profile Management**
  - Name, Phone, Location, Email
  - Qualification details
  - Prior experience records
  - Employment history
- [ ] **Tutor Selection & Recruitment**
  - Application form system
  - Qualification verification
  - Interview scheduling
  - Selection criteria scoring
- [ ] **Auto Shortlisting Logic**
  - Criteria-based filtering
  - Scoring algorithm
  - Ranking system
- [ ] **Tutor Assignment** to schools/students

**Current Status**: ❌ Basic mentor system exists but lacks recruitment workflow  
**Impact**: Important for scaling operations

### **6. Tutor Training Management**

- [ ] **Training Tracker System**
  - Online Training modules
  - In-house Workshop tracking
  - On-ground Demo sessions
  - Final Status determination
- [ ] **Training Progress Dashboard**
- [ ] **Certification Management**
- [ ] **Training Material Repository**
- [ ] **Performance Evaluation** during training

**Current Status**: ❌ No training system  
**Impact**: Critical for tutor quality assurance

### **7. Media Upload & Management System**

- [ ] **Assessment Video Recording**
  - Video capture during assessments
  - Video quality optimization
  - Automatic tagging (student, subject, date)
- [ ] **Session Photo Documentation**
  - Photo capture of teaching sessions
  - Image compression and optimization
  - Bulk photo uploads
- [ ] **Mobile-Friendly Upload Interface**
  - Progressive upload with resumption
  - Offline queue for uploads
  - Upload progress indicators
- [ ] **Admin Media Gallery**
  - Filterable media view
  - Search functionality
  - Downloadable for reporting
  - Media analytics dashboard

**Current Status**: ❌ No media management system  
**Impact**: Important for documentation and quality control

### **8. School Evaluation & Onboarding System**

- [ ] **School Evaluation Checklist**
  - Minimum 100 eligible students post-baseline
  - Dedicated room for sessions availability
  - Staff response and cooperation level
  - Principal support assessment
  - History of NGO collaboration
  - Infrastructure adequacy evaluation
- [ ] **Evaluation Scoring System**
- [ ] **Decision Workflow**
  - Include school in program
  - Follow-up required
  - Reject application
- [ ] **Onboarding Process Management**
- [ ] **School Status Tracking**

**Current Status**: ❌ Basic school creation but no evaluation workflow  
**Impact**: Important for systematic school selection

---

## 🟢 **LOW PRIORITY - Phase 3**

### **9. Enhanced Student Management**

- [ ] **Auto-generated Student ID System**
  - Unique ID generation algorithm
  - QR code generation for students
  - Barcode scanning for quick access
- [ ] **Enhanced Student Profiles**
  - Parent background information
  - Socioeconomic status tracking
  - Guardian occupation details
  - Family contact information
- [ ] **Subject-wise Level Tracking** (1-10 scale)
  - Separate level tracking for Hindi/English/Math
  - Level progression history
  - Subject-wise performance analytics

**Current Status**: ⚠️ Basic student management exists, missing enhancements  
**Impact**: Enhancement - improves data richness

### **10. Advanced Analytics Dashboard**

- [ ] **Assessment Completion Tracking**
  - % of assessments completed by type
  - Completion rate by school/tutor
  - Overdue assessment alerts
- [ ] **Students by Level Distribution**
  - Level-wise student distribution charts
  - Subject-wise level analytics
  - Progress trajectory visualization
- [ ] **Comprehensive Reporting System**
  - Custom report builder
  - Scheduled report generation
  - Export to multiple formats (PDF, Excel, CSV)
- [ ] **Tutor Performance Dashboard**
  - Tutor-specific metrics
  - Student progress under each tutor
  - Assessment completion rates

**Current Status**: ⚠️ Basic dashboard exists, missing advanced features  
**Impact**: Enhancement - provides deeper insights

### **11. Enhanced School Information Management**

- [ ] **UDISE Code Integration**
  - UDISE code validation
  - Government database integration
  - School verification system
- [ ] **School Type Classification**
  - Primary/Middle school designation
  - Grade range management
  - Curriculum tracking
- [ ] **Contact Management Enhancement**
  - Headmaster contact details
  - Coordinator information
  - Multiple contact persons
  - Communication history tracking
- [ ] **Infrastructure Details**
  - Facility availability checklist
  - Resource inventory
  - Maintenance tracking

**Current Status**: ⚠️ Basic school info exists, missing detailed attributes  
**Impact**: Enhancement - improves school data management

### **12. Notification & Communication System**

- [ ] **SMS/Email Notifications**
  - Assessment reminders
  - Training schedule notifications
  - Progress alerts
- [ ] **In-app Notification System**
  - Real-time notifications
  - Notification history
  - Priority-based alerts
- [ ] **Communication Hub**
  - Tutor-admin messaging
  - Announcement system
  - Group communications

**Current Status**: ❌ No notification system  
**Impact**: Enhancement - improves communication

---

## 📊 **Implementation Statistics**

| Priority Level     | Total Features | Estimated Effort |
| ------------------ | -------------- | ---------------- |
| 🔴 High Priority   | 4 modules      | 8-10 weeks       |
| 🟡 Medium Priority | 4 modules      | 10-12 weeks      |
| 🟢 Low Priority    | 4 modules      | 6-8 weeks        |
| **Total**          | **12 modules** | **24-30 weeks**  |

---

## 🚀 **Recommended Implementation Order**

### **Sprint 1-2 (Weeks 1-4)**

1. Multiple Assessment Types
2. Daily Attendance System

### **Sprint 3-4 (Weeks 5-8)**

3. Level-Based Group Assignment
4. Progress Flag System

### **Sprint 5-6 (Weeks 9-12)**

5. Media Upload System
6. Tutor Management Enhancement

### **Sprint 7-8 (Weeks 13-16)**

7. School Evaluation System
8. Training Management

### **Sprint 9-10 (Weeks 17-20)**

9. Enhanced Analytics
10. Advanced Student Management

### **Sprint 11-12 (Weeks 21-24)**

11. Enhanced School Management
12. Notification System

---

## 📝 **Notes**

- Current implementation has solid foundation with user management, basic assessments, and student tracking
- Missing features align with original specification requirements
- Implementation order prioritizes core educational workflow features first
- Each sprint should include testing and documentation
- Consider user feedback during development for feature refinement

---

**Last Updated**: October 5, 2025  
**Status**: Planning Phase - Ready for Implementation
