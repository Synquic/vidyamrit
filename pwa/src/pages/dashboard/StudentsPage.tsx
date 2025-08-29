import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getStudents } from "@/services/students";
import { getSchools } from "@/services/schools";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search } from "lucide-react";

function StudentsPage() {
  const [selectedSchool, setSelectedSchool] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch students with optional school filter
  const { data: students = [], isLoading: isLoadingStudents } = useQuery({
    queryKey: ["students", selectedSchool],
    queryFn: () => getStudents(selectedSchool),
  });

  // Fetch schools for the filter dropdown
  const { data: schools = [] } = useQuery({
    queryKey: ["schools"],
    queryFn: getSchools,
  });

  // Filter students based on search query
  const filteredStudents = students.filter((student) =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoadingStudents) {
    return (
      <div className="flex h-[200px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Students</h1>
        <p className="text-muted-foreground">View and manage student records</p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search students..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
        <Select value={selectedSchool} onValueChange={setSelectedSchool}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by school" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Schools</SelectItem>
            {schools.map((school) => (
              <SelectItem key={school._id} value={school._id || ""}>
                {school.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Students Table */}
      <div className="rounded-md border">
        <ScrollArea className="h-[600px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>School</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    No students found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredStudents.map((student) => (
                  <TableRow key={student._id}>
                    <TableCell className="font-medium">
                      {student.name}
                    </TableCell>
                    <TableCell>{student.email}</TableCell>
                    <TableCell>{student.schoolId.name}</TableCell>
                    <TableCell>
                      <Badge
                        variant={student.schoolId ? "default" : "secondary"}
                      >
                        {student.schoolId ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg border p-4">
          <div className="text-2xl font-bold">{filteredStudents.length}</div>
          <div className="text-sm text-muted-foreground">Total Students</div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-2xl font-bold">{schools.length}</div>
          <div className="text-sm text-muted-foreground">Schools</div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-2xl font-bold">
            {Math.round(filteredStudents.length / Math.max(schools.length, 1))}
          </div>
          <div className="text-sm text-muted-foreground">
            Average Students per School
          </div>
        </div>
      </div>
    </div>
  );
}

export default StudentsPage;
