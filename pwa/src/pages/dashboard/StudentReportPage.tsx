"use client";

import { useParams, useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { getStudent } from "@/services/students";
import IndividualStudentReport from "@/components/reports/IndividualStudentReport";
import { Loader2, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function StudentReportPage() {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();

  const {
    data: student,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["student", studentId],
    queryFn: () => getStudent(studentId!),
    enabled: !!studentId,
  });

  const handleBack = () => {
    // Navigate back - check if we came from students page or reports page
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/students");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          <Card>
            <CardContent className="py-12 text-center">
              <AlertCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
              <h3 className="text-lg font-semibold mb-2">Student Not Found</h3>
              <p className="text-muted-foreground mb-4">
                {error instanceof Error
                  ? error.message
                  : "The student you're looking for could not be found."}
              </p>
              <Button onClick={handleBack}>Go Back</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return <IndividualStudentReport student={student} onBack={handleBack} />;
}

