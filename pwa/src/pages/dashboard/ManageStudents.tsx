import { useState, useContext, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createStudent,
  deleteStudent,
  getStudents,
  updateStudent,
  type Student,
  type CreateStudentDTO,
  type UpdateStudentDTO,
} from "@/services/students";
import { getSchools, School } from "@/services/schools";
import { AuthContext } from "@/contexts/AuthContext";
import { UserRole } from "@/types/user";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Plus, Loader2, Trash2, Edit, FileSpreadsheet } from "lucide-react";
import * as XLSX from "xlsx";

function ManageStudents() {
  const { user } = useContext(AuthContext) ?? {};
  const isSuper = !!(user && user.role === UserRole.SUPER_ADMIN);
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>("");
  // Assigned school for non-super admin users
  const [assignedSchool, setAssignedSchool] = useState<School | null>(null);
  // ...existing code...
  const [excelHeaders, setExcelHeaders] = useState<string[]>([]);
  const [columnMap, setColumnMap] = useState<{
    roll: string;
    name: string;
    email: string;
  }>({ roll: "", name: "", email: "" });
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importedRows, setImportedRows] = useState<
    Array<{ uid: string; name: string; email: string }>
  >([]);
  const [importLoading, setImportLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [deletingStudent, setDeletingStudent] = useState<Student | null>(null);
  const [formData, setFormData] = useState<CreateStudentDTO>({
    name: "",
    email: "",
    uid: "", // Roll number input
    schoolId: "",
  });

  const queryClient = useQueryClient();

  // Fetch students
  const { data: students, isLoading: isLoadingStudents } = useQuery({
    queryKey: ["students"],
    queryFn: () => getStudents(),
  });

  // Fetch schools for the select dropdown (for super admin)
  const { data: schools = [], isLoading: schoolsLoading } = useQuery<School[]>({
    queryKey: ["schools"],
    queryFn: getSchools,
  });

  // Find assigned school for non-super admin users
  // Mimic SchoolSwitcher.tsx logic
  useEffect(() => {
    if (
      user &&
      user.role !== UserRole.SUPER_ADMIN &&
      user.schoolId &&
      typeof user.schoolId === "object"
    ) {
      const foundSchool = schools.find((s) => s._id === user.schoolId._id);
      if (foundSchool && foundSchool._id) {
        setAssignedSchool({ ...foundSchool, _id: foundSchool._id || "" });
      }
    } else {
      setAssignedSchool(null);
    }
  }, [user, schools]);

  // Create student mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateStudentDTO) => createStudent(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      handleCloseDialog();
      toast.success("Student created successfully");
    },
    onError: () => {
      toast.error("Failed to create student");
    },
  });

  // Update student mutation
  const updateMutation = useMutation({
    mutationFn: ({ uid, data }: { uid: string; data: UpdateStudentDTO }) =>
      updateStudent(uid, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      handleCloseDialog();
      toast.success("Student updated successfully");
    },
    onError: () => {
      toast.error("Failed to update student");
    },
  });

  // Delete student mutation
  const deleteMutation = useMutation({
    mutationFn: deleteStudent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      setIsDeleteDialogOpen(false);
      toast.success("Student deleted successfully");
    },
    onError: () => {
      toast.error("Failed to delete student");
    },
  });

  const handleSubmit = () => {
    if (editingStudent) {
      const { name, email, schoolId } = formData;
      updateMutation.mutate({
        uid: editingStudent.uid,
        data: { name, email, schoolId },
      });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (student: Student) => {
    setEditingStudent(student);
    setFormData({
      name: student.name,
      email: student.email,
      uid: student.uid,
      schoolId: student.schoolId._id,
    });
    setIsOpen(true);
  };

  const handleCloseDialog = () => {
    setIsOpen(false);
    setEditingStudent(null);
    setFormData({
      name: "",
      email: "",
      uid: "",
      schoolId: "",
    });
  };

  const handleDelete = async () => {
    if (!deletingStudent?.uid) return;
    await deleteMutation.mutateAsync(deletingStudent.uid);
  };

  if (isLoadingStudents) {
    return (
      <div className="flex h-[200px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Manage Students</h1>
          <p className="text-muted-foreground">
            Create and manage students for your schools
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Student
          </Button>
          <Button
            variant="default"
            className="bg-green-600 text-white flex items-center gap-2"
            onClick={() => setIsImportOpen(true)}
          >
            <FileSpreadsheet className="h-4 w-4" />
            Import Students
          </Button>
        </div>
      </div>

      <div className="rounded-md border overflow-auto max-h-[60vh]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Roll Number</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>School</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students?.map((student) => (
              <TableRow key={student._id}>
                <TableCell>
                  <code className="rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold">
                    {student.uid}
                  </code>
                </TableCell>
                <TableCell>{student.name}</TableCell>
                <TableCell>{student.email}</TableCell>
                <TableCell>{student.schoolId.name}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(student)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        setDeletingStudent(student);
                        setIsDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isOpen} onOpenChange={handleCloseDialog}>
        {/* Import Students Modal */}
        <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Import Students from Excel</DialogTitle>
              <DialogDescription>
                Upload an Excel file (.xlsx) with columns for students.
                <br />
                Map the columns below before importing.
                <br />
                {isSuper ? (
                  <span className="text-sm text-muted-foreground">
                    Select a school to import students into.
                  </span>
                ) : (
                  <span className="text-sm text-muted-foreground">
                    Students will be imported to your school.
                  </span>
                )}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {isSuper && (
                <div>
                  <Label>School</Label>
                  <select
                    className="w-full border rounded px-2 py-1"
                    value={selectedSchoolId}
                    onChange={(e) => setSelectedSchoolId(e.target.value)}
                    disabled={schoolsLoading}
                  >
                    <option value="">Select school</option>
                    {schools.map((school) => (
                      <option key={school._id} value={school._id ?? ""}>
                        {school.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {!isSuper && assignedSchool && (
                <div>
                  <Label>School</Label>
                  <div className="w-full border rounded px-2 py-1 bg-muted text-muted-foreground">
                    {assignedSchool.name}
                  </div>
                </div>
              )}
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const data = await file.arrayBuffer();
                  const workbook = XLSX.read(data, { type: "array" });
                  const sheet = workbook.Sheets[workbook.SheetNames[0]];
                  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
                  const [header, ...body] = rows;
                  if (!Array.isArray(header) || header.length < 1) {
                    toast.error("Excel must have at least one column header");
                    return;
                  }
                  setExcelHeaders(header.map((h: unknown) => String(h)));
                  setColumnMap({ roll: "", name: "", email: "" });
                  setImportedRows([]);
                  // Save raw body for later mapping
                  (
                    window as unknown as { _importBody?: unknown[][] }
                  )._importBody = body as unknown[][];
                }}
              />
              {excelHeaders.length > 0 && (
                <div className="space-y-2">
                  <div className="font-medium">Map Excel Columns:</div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <div>
                      <Label>Roll Number</Label>
                      <select
                        className="w-full border rounded px-2 py-1"
                        value={columnMap.roll}
                        onChange={(e) =>
                          setColumnMap((prev) => ({
                            ...prev,
                            roll: e.target.value,
                          }))
                        }
                      >
                        <option value="">Select column</option>
                        {excelHeaders.map((h) => (
                          <option key={h} value={h}>
                            {h}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label>Name</Label>
                      <select
                        className="w-full border rounded px-2 py-1"
                        value={columnMap.name}
                        onChange={(e) =>
                          setColumnMap((prev) => ({
                            ...prev,
                            name: e.target.value,
                          }))
                        }
                      >
                        <option value="">Select column</option>
                        {excelHeaders.map((h) => (
                          <option key={h} value={h}>
                            {h}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label>Email</Label>
                      <select
                        className="w-full border rounded px-2 py-1"
                        value={columnMap.email}
                        onChange={(e) =>
                          setColumnMap((prev) => ({
                            ...prev,
                            email: e.target.value,
                          }))
                        }
                      >
                        <option value="">Select column</option>
                        {excelHeaders.map((h) => (
                          <option key={h} value={h}>
                            {h}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <Button
                    className="mt-2"
                    disabled={
                      !(columnMap.roll && columnMap.name && columnMap.email)
                    }
                    onClick={() => {
                      // Map raw body to importedRows
                      const body = ((
                        window as unknown as { _importBody?: unknown[][] }
                      )._importBody ?? []) as unknown[][];
                      const idxRoll = excelHeaders.indexOf(columnMap.roll);
                      const idxName = excelHeaders.indexOf(columnMap.name);
                      const idxEmail = excelHeaders.indexOf(columnMap.email);
                      const parsed = body
                        .filter(
                          (row) =>
                            Array.isArray(row) &&
                            row[idxRoll] &&
                            row[idxName] &&
                            row[idxEmail]
                        )
                        .map((row) => ({
                          uid: String(row[idxRoll]),
                          name: String(row[idxName]),
                          email: String(row[idxEmail]),
                        }));
                      setImportedRows(parsed);
                    }}
                  >
                    Preview Table
                  </Button>
                </div>
              )}
              {importedRows.length > 0 && (
                <div>
                  <div className="mb-2 font-medium">Preview:</div>
                  <div className="overflow-auto max-h-64">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Roll Number</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {importedRows.map((row, idx) => (
                          <TableRow key={idx}>
                            <TableCell>{row.uid}</TableCell>
                            <TableCell>{row.name}</TableCell>
                            <TableCell>{row.email}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsImportOpen(false)}>
                Cancel
              </Button>
              <Button
                className="bg-green-600 text-white"
                disabled={
                  Boolean(importLoading) ||
                  importedRows.length === 0 ||
                  (isSuper && !selectedSchoolId)
                }
                onClick={async () => {
                  let schoolId: string | undefined;
                  if (isSuper) {
                    schoolId = selectedSchoolId;
                    if (!schoolId) {
                      toast.error("Please select a school before importing.");
                      return;
                    }
                  } else {
                    schoolId = assignedSchool?._id;
                    if (!schoolId) {
                      toast.error("Your account is not linked to a school.");
                      return;
                    }
                  }
                  setImportLoading(true);
                  try {
                    await Promise.all(
                      importedRows.map((row) =>
                        createMutation.mutateAsync({
                          name: row.name,
                          email: row.email,
                          uid: row.uid,
                          schoolId,
                        })
                      )
                    );
                    toast.success("Students imported successfully");
                    setImportedRows([]);
                    setIsImportOpen(false);
                    queryClient.invalidateQueries({ queryKey: ["students"] });
                  } catch {
                    toast.error("Failed to import students");
                  } finally {
                    setImportLoading(false);
                  }
                }}
              >
                {importLoading && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Import Students
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingStudent ? "Edit Student" : "Create Student"}
            </DialogTitle>
            <DialogDescription>
              {editingStudent
                ? "Update the student's information below"
                : "Fill in the details to create a new student"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, email: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="uid">Roll Number</Label>
              <Input
                id="uid"
                value={formData.uid}
                placeholder="Enter student roll number"
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    uid: e.target.value,
                  }))
                }
                disabled={!!editingStudent} // Don't allow editing roll number
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="schoolId">School</Label>
              <Select
                value={formData.schoolId}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, schoolId: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a school" />
                </SelectTrigger>
                <SelectContent>
                  {Array.isArray(schools) &&
                    schools.map((school: School) => (
                      <SelectItem key={school._id} value={school._id || ""}>
                        {school.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {(createMutation.isPending || updateMutation.isPending) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {editingStudent ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
            
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              student "{deletingStudent?.name}" and remove them from any
              associated cohorts.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default ManageStudents;
