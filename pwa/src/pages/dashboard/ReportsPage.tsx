"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, FileText, ArrowRight, PieChart, UserSearch } from "lucide-react";
import StudentLevelsReport from "@/components/reports/StudentLevelsReport";
import StudentDistributionReport from "@/components/reports/StudentDistributionReport";
import StudentSearch from "@/components/reports/StudentSearch";
import IndividualStudentReport from "@/components/reports/IndividualStudentReport";
import { Student } from "@/services/students";

interface Report {
  id: string;
  title: string;
  description: string;
  icon: any;
}

const availableReports: Report[] = [
  {
    id: "student-levels",
    title: "Student Levels - Class & School Wise",
    description: "View student assessment levels grouped by school and class",
    icon: BarChart3,
  },
  {
    id: "student-distribution",
    title: "Student Distribution Analysis",
    description: "View students by level, class, and category with visual charts",
    icon: PieChart,
  },
  {
    id: "individual-student",
    title: "Individual Student Report",
    description: "Generate comprehensive reports for individual students with detailed analytics",
    icon: UserSearch,
  },
  // Future reports can be added here
];

export default function ReportsPage() {
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  const handleReportClick = (reportId: string) => {
    setSelectedReport(reportId);
    setSelectedStudent(null); // Reset student selection when switching reports
  };

  const handleBack = () => {
    if (selectedStudent) {
      // If viewing a student report, go back to student search
      setSelectedStudent(null);
    } else {
      // If in student search, go back to reports list
      setSelectedReport(null);
    }
  };

  const handleSelectStudent = (student: Student) => {
    setSelectedStudent(student);
  };

  // Show individual student report if student is selected
  if (selectedReport === "individual-student" && selectedStudent) {
    return <IndividualStudentReport student={selectedStudent} onBack={handleBack} />;
  }

  // Show student search if individual student report is selected but no student chosen
  if (selectedReport === "individual-student" && !selectedStudent) {
    return <StudentSearch onSelectStudent={handleSelectStudent} onBack={handleBack} />;
  }

  // Show other reports
  if (selectedReport) {
    if (selectedReport === "student-levels") {
      return <StudentLevelsReport onBack={handleBack} />;
    }
    if (selectedReport === "student-distribution") {
      return <StudentDistributionReport onBack={handleBack} />;
    }
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold">Reports</h1>
          <p className="text-muted-foreground mt-1 md:mt-2">
            View and analyze data across all schools
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {availableReports.map((report) => {
            const Icon = report.icon;
            return (
              <Card
                key={report.id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => handleReportClick(report.id)}
              >
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <CardTitle className="text-lg md:text-xl">{report.title}</CardTitle>
                  </div>
                  <CardDescription className="text-sm">
                    {report.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full">
                    View Report
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {availableReports.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No reports available yet</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}







