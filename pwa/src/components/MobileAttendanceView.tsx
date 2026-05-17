"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { ChevronRight, Search, Calendar, CheckCircle, XCircle, Clock, User, Users, ArrowLeft, Loader2, Play } from "lucide-react";
import { getStudents } from "@/services/students";
import { programsService } from "@/services/programs";
import { getTutorAttendanceSummary, getAttendanceRecords, bulkMarkAttendance, AttendanceStatus, startCohort } from "@/services/attendance";
import { getCohorts } from "@/services/cohorts";
import { useSchoolContext } from "@/contexts/SchoolContext";
import { toast } from "sonner";
import { Link } from "react-router";

type Tab = "class" | "group";
type Screen = "list" | "detail";

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatDateDisplay(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

export default function MobileAttendanceView() {
  const [tab, setTab] = useState<Tab>("class");

  return (
    <div className="flex flex-col min-h-0">
      {/* Class / Group Toggle */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-4">
        <button
          onClick={() => setTab("class")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            tab === "class" ? "bg-blue-600 text-white shadow" : "text-gray-500"
          }`}
        >
          <User className="w-4 h-4" /> Class
        </button>
        <button
          onClick={() => setTab("group")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            tab === "group" ? "bg-blue-600 text-white shadow" : "text-gray-500"
          }`}
        >
          <Users className="w-4 h-4" /> Group
        </button>
      </div>

      {tab === "class" ? <ClassAttendance /> : <GroupAttendance />}
    </div>
  );
}

/* ─── CLASS TAB ─────────────────────────────────────────────────── */
function ClassAttendance() {
  const { selectedSchool, isSchoolContextActive } = useSchoolContext();
  const [screen, setScreen] = useState<Screen>("list");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSubject, setSelectedSubject] = useState<"hindi" | "math" | "english">("hindi");
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [searchQuery, setSearchQuery] = useState("");
  const [attendanceMap, setAttendanceMap] = useState<Map<string, AttendanceStatus>>(new Map());
  const [hasChanges, setHasChanges] = useState(false);
  const queryClient = useQueryClient();

  const schoolId = isSchoolContextActive && selectedSchool ? selectedSchool._id : undefined;

  const { data: students = [], isLoading: loadingStudents } = useQuery({
    queryKey: ["students", schoolId],
    queryFn: () => getStudents(schoolId),
    enabled: !!schoolId,
  });

  const { data: programsData } = useQuery({
    queryKey: ["programs-for-attendance", schoolId],
    queryFn: () => programsService.getPrograms({ limit: 100, schoolId }),
    enabled: !!schoolId,
  });

  const subjects = useMemo<Array<"hindi" | "math" | "english">>(() => {
    const subs = new Set<"hindi" | "math" | "english">();
    (programsData?.programs || []).forEach((p: any) => {
      const s = p.subject?.toLowerCase();
      if (s === "hindi" || s === "math" || s === "english") subs.add(s);
    });
    if (subs.size === 0) subs.add("hindi");
    return Array.from(subs);
  }, [programsData]);

  // Group students by class
  const classesList = useMemo(() => {
    const map = new Map<string, number>();
    students.forEach((s: any) => {
      const cls = s.class || "Unknown";
      map.set(cls, (map.get(cls) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([cls, count]) => ({ cls, count }))
      .sort((a, b) => a.cls.localeCompare(b.cls, undefined, { numeric: true }));
  }, [students]);

  const classStudents = useMemo(
    () => students.filter((s: any) => s.class === selectedClass),
    [students, selectedClass]
  );

  const filteredStudents = useMemo(
    () =>
      classStudents.filter((s: any) =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [classStudents, searchQuery]
  );

  // Load existing attendance when subject/date/class changes
  useQuery({
    queryKey: ["attendance-records", schoolId, selectedDate, selectedSubject],
    queryFn: async () => {
      const records = await getAttendanceRecords({ schoolId, date: selectedDate, subject: selectedSubject });
      const map = new Map<string, AttendanceStatus>();
      records.forEach((r: any) => { if (r.student?._id) map.set(r.student._id, r.status); });
      setAttendanceMap(map);
      setHasChanges(false);
      return records;
    },
    enabled: !!schoolId && !!selectedClass && screen === "detail",
  });

  const saveMutation = useMutation({
    mutationFn: () =>
      bulkMarkAttendance({
        schoolId: schoolId!,
        date: selectedDate,
        subject: selectedSubject,
        records: Array.from(attendanceMap.entries())
          .filter(([id]) => classStudents.some((s: any) => s._id === id))
          .map(([studentId, status]) => ({ studentId, status })),
      }),
    onSuccess: () => {
      toast.success("Attendance saved!");
      queryClient.invalidateQueries({ queryKey: ["attendance-records"] });
      setHasChanges(false);
    },
    onError: () => toast.error("Failed to save attendance"),
  });

  function mark(studentId: string, status: AttendanceStatus) {
    setAttendanceMap((prev) => new Map(prev).set(studentId, status));
    setHasChanges(true);
  }

  if (screen === "detail") {
    return (
      <div className="flex flex-col gap-4">
        {/* Back + title */}
        <div className="flex items-center gap-3">
          <button onClick={() => setScreen("list")} className="text-gray-600">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="text-base font-bold text-gray-900">Class {selectedClass}</span>
        </div>

        {/* Subject tabs + date */}
        <div className="flex items-center gap-2 overflow-x-auto">
          {subjects.map((sub) => (
            <button
              key={sub}
              onClick={() => setSelectedSubject(sub)}
              className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all border ${
                selectedSubject === sub
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-gray-100 text-gray-600 border-gray-200"
              }`}
            >
              {selectedClass} ({sub.charAt(0).toUpperCase() + sub.slice(1)})
            </button>
          ))}
          <div className="flex items-center gap-1 ml-auto border border-gray-200 rounded-full px-3 py-1.5 bg-white flex-shrink-0">
            <Calendar className="w-4 h-4 text-gray-500" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="text-xs text-gray-700 bg-transparent outline-none"
            />
          </div>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5">
          <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <input
            className="flex-1 bg-transparent text-sm outline-none"
            placeholder="Search student"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Student table */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="grid grid-cols-[1fr_56px_56px] text-xs font-semibold text-gray-500 px-4 py-2.5 border-b border-gray-100 bg-gray-50">
            <span>Name</span>
            <span className="text-center">Present</span>
            <span className="text-center">Absent</span>
          </div>
          {filteredStudents.map((student: any) => {
            const status = attendanceMap.get(student._id);
            return (
              <div key={student._id} className="grid grid-cols-[1fr_56px_56px] items-center px-4 py-3 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-800">{student.name}</p>
                  <p className="text-xs text-blue-500">Class {student.class}</p>
                </div>
                <div className="flex justify-center">
                  <button
                    onClick={() => mark(student._id, "present")}
                    className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                      status === "present"
                        ? "bg-green-500"
                        : "bg-gray-100"
                    }`}
                  >
                    <CheckCircle className={`w-5 h-5 ${status === "present" ? "text-white" : "text-gray-300"}`} />
                  </button>
                </div>
                <div className="flex justify-center">
                  <button
                    onClick={() => mark(student._id, "absent")}
                    className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                      status === "absent"
                        ? "bg-red-500"
                        : "bg-gray-100"
                    }`}
                  >
                    <XCircle className={`w-5 h-5 ${status === "absent" ? "text-white" : "text-gray-300"}`} />
                  </button>
                </div>
              </div>
            );
          })}
          {filteredStudents.length === 0 && (
            <p className="text-center text-gray-400 text-sm py-8">No students found</p>
          )}
        </div>

        {/* Save button */}
        <button
          onClick={() => saveMutation.mutate()}
          disabled={!hasChanges || saveMutation.isPending}
          className={`w-full py-4 rounded-xl font-semibold text-white text-sm flex items-center justify-center gap-2 transition-all ${
            hasChanges && !saveMutation.isPending ? "bg-blue-600 active:bg-blue-700" : "bg-blue-300"
          }`}
        >
          {saveMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
          Save Attendance
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-gray-500">Select a class to mark attendance</p>
      {loadingStudents ? (
        <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>
      ) : classesList.length === 0 ? (
        <p className="text-center text-gray-400 py-8">No classes found for this school</p>
      ) : (
        classesList.map(({ cls, count }) => (
          <button
            key={cls}
            onClick={() => { setSelectedClass(cls); setSearchQuery(""); setAttendanceMap(new Map()); setHasChanges(false); setScreen("detail"); }}
            className="flex items-center gap-4 bg-white border border-gray-100 rounded-2xl px-4 py-4 shadow-sm active:scale-[0.98] transition-all text-left"
          >
            <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
              <User className="w-6 h-6 text-gray-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-base font-semibold text-gray-900">Class {cls}</p>
              <p className="text-sm text-gray-500">{count} Students</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
              <ChevronRight className="w-5 h-5 text-white" />
            </div>
          </button>
        ))
      )}
    </div>
  );
}

/* ─── GROUP TAB ─────────────────────────────────────────────────── */
function GroupAttendance() {
  const { selectedSchool, isSchoolContextActive } = useSchoolContext();
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [searchQuery, setSearchQuery] = useState("");

  const schoolId = isSchoolContextActive && selectedSchool ? selectedSchool._id : undefined;

  const { data: attendanceSummary = [], isLoading } = useQuery({
    queryKey: ["tutor-attendance-summary", schoolId, selectedDate],
    queryFn: () => getTutorAttendanceSummary(selectedDate, schoolId),
    enabled: !!schoolId,
  });

  const filtered = useMemo(
    () =>
      (attendanceSummary as any[]).filter((s) =>
        s.cohort?.name?.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [attendanceSummary, searchQuery]
  );

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-gray-500">View and manage attendance across all groups</p>

      {/* Search + Date */}
      <div className="flex gap-2">
        <div className="flex-1 flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5">
          <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <input
            className="flex-1 bg-transparent text-sm outline-none"
            placeholder="Search Group"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-1 border border-gray-200 rounded-xl px-3 py-2 bg-white flex-shrink-0">
          <Calendar className="w-4 h-4 text-gray-500" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="text-xs text-gray-700 bg-transparent outline-none w-24"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>
      ) : filtered.length === 0 ? (
        <p className="text-center text-gray-400 py-8">No groups found</p>
      ) : (
        filtered.map((summary: any) => (
          <div key={summary.cohort._id} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs text-gray-400 font-medium">{summary.cohort.school?.name || "—"}</p>
                <p className="text-base font-bold text-gray-900 mt-0.5">{summary.cohort.name}</p>
                {summary.cohort.startDate && (
                  <p className="text-xs text-gray-500 mt-0.5">
                    Started: {new Date(summary.cohort.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                )}
              </div>
              <span className="bg-blue-50 text-blue-700 text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0">
                {summary.attendance?.totalStudents ?? 0} Students
              </span>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                <span className="text-gray-600">Present: <strong>{summary.attendance?.presentCount ?? 0}</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <span className="text-gray-600">Absent: <strong>{summary.attendance?.absentCount ?? 0}</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="text-gray-600">Unmarked: <strong>{summary.attendance?.unmarkedCount ?? 0}</strong></span>
              </div>
            </div>

            {/* Action */}
            <Link
              to={`/attendance/cohort/${summary.cohort._id}`}
              className="block w-full py-3 bg-blue-600 text-white text-sm font-semibold text-center rounded-xl active:bg-blue-700 transition-colors"
            >
              Mark Attendance
            </Link>
          </div>
        ))
      )}
    </div>
  );
}
