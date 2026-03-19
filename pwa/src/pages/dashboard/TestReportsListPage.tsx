import { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { getStudents } from "@/services/students";
import { useSchoolContext } from "@/contexts/SchoolContext";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  FileText,
  Search,
  Loader2,
  GraduationCap,
  ChevronRight,
} from "lucide-react";

export default function TestReportsListPage() {
  const navigate = useNavigate();
  const { selectedSchool } = useSchoolContext();
  const [search, setSearch] = useState("");

  const {
    data: students,
    isLoading,
  } = useQuery({
    queryKey: ["students", selectedSchool?._id],
    queryFn: () => getStudents(selectedSchool?._id),
    enabled: true,
  });

  const filteredStudents = useMemo(() => {
    if (!students) return [];
    const q = search.toLowerCase().trim();
    if (!q) return students;
    return students.filter(
      (s) =>
        s.name?.toLowerCase().includes(q) ||
        s.roll_no?.toLowerCase().includes(q) ||
        s.class?.toLowerCase().includes(q)
    );
  }, [students, search]);

  if (isLoading) {
    return (
      <div className="p-4 md:p-6">
        <div className="flex items-center justify-center h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-2 sm:p-0">
      {/* Header */}
      <div>
        <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 flex items-center gap-2">
          <FileText className="h-5 w-5 sm:h-6 sm:w-6" />
          Test Reports
        </h1>
        <p className="text-xs sm:text-sm text-gray-600 mt-1">
          Select a student to view their test report
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, roll no, or class..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 h-11 text-base"
        />
      </div>

      {/* Student List */}
      <div className="space-y-2">
        {filteredStudents.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              {search ? "No students found" : "No students available"}
            </CardContent>
          </Card>
        ) : (
          filteredStudents.map((student) => (
            <Card
              key={student._id}
              className="hover:bg-muted/50 cursor-pointer transition-colors"
              onClick={() => navigate(`/test-report/student/${student._id}`)}
            >
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
                      <GraduationCap className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm sm:text-base truncate">
                        {student.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {student.roll_no && `Roll: ${student.roll_no} • `}
                        Class {student.class}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
