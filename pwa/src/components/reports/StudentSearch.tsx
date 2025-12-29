"use client";

import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Search, User, School, GraduationCap } from "lucide-react";
import { getStudents, Student } from "@/services/students";
import { useAuth } from "@/hooks/useAuth";
import { UserRole } from "@/types/user";
import { useSchoolContext } from "@/contexts/SchoolContext";

interface StudentSearchProps {
  onSelectStudent: (student: Student) => void;
  onBack?: () => void;
}

// Simple debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default function StudentSearch({
  onSelectStudent,
  onBack,
}: StudentSearchProps) {
  const { user } = useAuth();
  const { selectedSchool } = useSchoolContext();
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Determine which students to fetch based on user role
  const shouldFetchAll = user?.role === UserRole.SUPER_ADMIN;
  const schoolIdToFetch = shouldFetchAll ? undefined : selectedSchool?._id;

  // Fetch all students (for Super Admin) or students from selected school
  const { data: allStudents = [], isLoading } = useQuery({
    queryKey: ["students", schoolIdToFetch],
    queryFn: () => getStudents(schoolIdToFetch),
    enabled: shouldFetchAll || !!selectedSchool?._id,
  });

  // Filter students based on search query
  const filteredStudents = useMemo(() => {
    if (!debouncedSearch.trim()) {
      return allStudents; // Show all students
    }

    const query = debouncedSearch.toLowerCase().trim();
    return allStudents.filter((student) => {
      const name = student.name?.toLowerCase() || "";
      const rollNo = student.roll_no?.toLowerCase() || "";
      const className = student.class?.toLowerCase() || "";
      const schoolName = student.schoolId?.name?.toLowerCase() || "";

      return (
        name.includes(query) ||
        rollNo.includes(query) ||
        className.includes(query) ||
        schoolName.includes(query)
      );
    });
  }, [allStudents, debouncedSearch]);

  const handleSelectStudent = (student: Student) => {
    onSelectStudent(student);
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">
              Individual Student Report
            </h1>
            <p className="text-muted-foreground mt-1 md:mt-2">
              Search for a student to generate a comprehensive report
            </p>
          </div>
          {onBack && (
            <Button variant="outline" onClick={onBack}>
              Back to Reports
            </Button>
          )}
        </div>

        {/* Search Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Search Students
            </CardTitle>
            <CardDescription>
              Search by student name or roll number.{" "}
              {shouldFetchAll
                ? "Searching across all schools."
                : `Searching within ${
                    selectedSchool?.name || "selected school"
                  }.`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or roll number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : filteredStudents.length === 0 ? (
                <div className="text-center py-12">
                  <User className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    {debouncedSearch.trim()
                      ? "No students found"
                      : "No students available"}
                  </h3>
                  <p className="text-muted-foreground">
                    {debouncedSearch.trim()
                      ? `No students match "${debouncedSearch}"`
                      : shouldFetchAll
                      ? "No students found in the system"
                      : "No students found in the selected school"}
                  </p>
                </div>
              ) : (
                <div className="rounded-md border overflow-auto max-h-[600px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Roll Number</TableHead>
                        <TableHead>Class</TableHead>
                        {shouldFetchAll && <TableHead>School</TableHead>}
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredStudents.map((student) => (
                        <TableRow
                          key={student._id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => handleSelectStudent(student)}
                        >
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              {student.name}
                            </div>
                          </TableCell>
                          <TableCell>
                            {student.roll_no ? (
                              <Badge variant="outline">{student.roll_no}</Badge>
                            ) : (
                              <span className="text-muted-foreground text-sm">
                                -
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <GraduationCap className="h-4 w-4 text-muted-foreground" />
                              Class {student.class}
                            </div>
                          </TableCell>
                          {shouldFetchAll && (
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <School className="h-4 w-4 text-muted-foreground" />
                                {student.schoolId?.name || "Unknown"}
                              </div>
                            </TableCell>
                          )}
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectStudent(student);
                              }}
                            >
                              View Report
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {filteredStudents.length > 0 && (
                <p className="text-sm text-muted-foreground text-center">
                  Showing {filteredStudents.length} student
                  {filteredStudents.length !== 1 ? "s" : ""}
                  {debouncedSearch.trim() && ` matching "${debouncedSearch}"`}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
