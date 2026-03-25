import { useState, useEffect, useMemo } from "react";
import {
  Users,
  GraduationCap,
  LayoutDashboard,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getTutorProgressSummary,
  getTutorDashboardStats,
  TutorProgressSummary,
} from "@/services/progress";
import { getTutorAvgAttendance } from "@/services/attendance";
import { useAuth } from "@/hooks/useAuth";
import { useSchoolContext } from "@/contexts/SchoolContext";
import { toast } from "sonner";
import { Calendar, UserX, Award, TrendingDown, CheckCircle } from "lucide-react";

export default function TutorDashboard() {
  const { user } = useAuth();
  const { selectedSchool, isSchoolContextActive } = useSchoolContext();

  const [_progressData, setProgressData] = useState<TutorProgressSummary[]>([]);
  const [avgAttendance, setAvgAttendance] = useState<number>(0);
  const [dashboardStats, setDashboardStats] = useState({ inactive: 0, proficient: 0, progressing: 0, notProgressing: 0, totalStudents: 0, activeGroups: 0 });
  const [loadingProgress, setLoadingProgress] = useState(true);
  const [loadingAttendance, setLoadingAttendance] = useState(true);

  useEffect(() => {
    const schoolId =
      isSchoolContextActive && selectedSchool
        ? selectedSchool._id
        : undefined;
    fetchProgressData(schoolId);
    fetchAvgAttendance(schoolId);
    fetchDashboardStats(schoolId);
  }, [selectedSchool, isSchoolContextActive]);

  const fetchProgressData = async (schoolId?: string) => {
    try {
      setLoadingProgress(true);
      const data = await getTutorProgressSummary(schoolId);
      setProgressData(data);
    } catch (error) {
      console.error("Error fetching progress:", error);
      toast.error("Failed to load progress data");
    } finally {
      setLoadingProgress(false);
    }
  };

  const fetchDashboardStats = async (schoolId?: string) => {
    try {
      const data = await getTutorDashboardStats(schoolId);
      setDashboardStats({ ...dashboardStats, ...data });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    }
  };

  const fetchAvgAttendance = async (schoolId?: string) => {
    try {
      setLoadingAttendance(true);
      const data = await getTutorAvgAttendance(0, schoolId);
      setAvgAttendance(data.avgAttendanceRate);
    } catch (error) {
      console.error("Error fetching avg attendance:", error);
    } finally {
      setLoadingAttendance(false);
    }
  };

  // Computed stats - from dashboardStats (school level)
  const stats = useMemo(() => {
    return {
      totalStudents: dashboardStats.totalStudents,
      activeGroups: dashboardStats.activeGroups,
    };
  }, [dashboardStats]);

  const isLoading = loadingProgress || loadingAttendance;

  if (isLoading) {
    return (
      <div className="space-y-6 p-4 sm:p-6">
        {/* Skeleton for header */}
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-5 w-48" />
        {/* Skeleton for stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {[...Array(7)].map((_, i) => (
            <Skeleton key={i} className="h-28 sm:h-32 rounded-2xl" />
          ))}
        </div>
        {/* Skeleton for sections */}
        <div className="grid grid-cols-1 gap-4 sm:gap-6">
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 p-2 sm:p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2 sm:gap-3">
          <LayoutDashboard className="h-7 w-7 sm:h-8 sm:w-8 text-orange-600" />
          Dashboard
        </h1>
        <p className="text-base sm:text-lg text-gray-600 mt-1">
          Welcome back, {user?.name}!
        </p>
      </div>

      {/* Section 1: Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Students */}
        <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-2xl">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col items-center sm:items-start gap-2">
              <div className="p-2.5 sm:p-3 rounded-xl bg-blue-500/10">
                <GraduationCap className="h-6 w-6 sm:h-7 sm:w-7 text-blue-600" />
              </div>
              <div className="text-center sm:text-left">
                <p className="text-2xl sm:text-3xl font-bold text-blue-700">
                  {stats.totalStudents}
                </p>
                <p className="text-sm sm:text-base text-blue-600/80 font-medium mt-0.5">
                  Total Students
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active Groups */}
        <Card className="border-0 shadow-sm bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-2xl">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col items-center sm:items-start gap-2">
              <div className="p-2.5 sm:p-3 rounded-xl bg-purple-500/10">
                <Users className="h-6 w-6 sm:h-7 sm:w-7 text-purple-600" />
              </div>
              <div className="text-center sm:text-left">
                <p className="text-2xl sm:text-3xl font-bold text-purple-700">
                  {stats.activeGroups}
                </p>
                <p className="text-sm sm:text-base text-purple-600/80 font-medium mt-0.5">
                  Active Groups
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Avg Attendance (7d) */}
        <Card className="border-0 shadow-sm bg-gradient-to-br from-green-50 to-green-100/50 rounded-2xl">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col items-center sm:items-start gap-2">
              <div className="p-2.5 sm:p-3 rounded-xl bg-green-500/10">
                <Calendar className="h-6 w-6 sm:h-7 sm:w-7 text-green-600" />
              </div>
              <div className="text-center sm:text-left">
                <p className="text-2xl sm:text-3xl font-bold text-green-700">
                  {avgAttendance}%
                </p>
                <p className="text-sm sm:text-base text-green-600/80 font-medium mt-0.5">
                  Avg Attendance
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Inactive Students */}
        <Card className="border-0 shadow-sm bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-2xl">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col items-center sm:items-start gap-2">
              <div className="p-2.5 sm:p-3 rounded-xl bg-gray-500/10">
                <UserX className="h-6 w-6 sm:h-7 sm:w-7 text-gray-600" />
              </div>
              <div className="text-center sm:text-left">
                <p className="text-2xl sm:text-3xl font-bold text-gray-700">
                  {dashboardStats.inactive}
                </p>
                <p className="text-sm sm:text-base text-gray-600/80 font-medium mt-0.5">
                  Inactive
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Proficient Students */}
        <Card className="border-0 shadow-sm bg-gradient-to-br from-amber-50 to-amber-100/50 rounded-2xl">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col items-center sm:items-start gap-2">
              <div className="p-2.5 sm:p-3 rounded-xl bg-amber-500/10">
                <Award className="h-6 w-6 sm:h-7 sm:w-7 text-amber-600" />
              </div>
              <div className="text-center sm:text-left">
                <p className="text-2xl sm:text-3xl font-bold text-amber-700">
                  {dashboardStats.proficient}
                </p>
                <p className="text-sm sm:text-base text-amber-600/80 font-medium mt-0.5">
                  Proficient
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Progressing */}
        <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-2xl">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col items-center sm:items-start gap-2">
              <div className="p-2.5 sm:p-3 rounded-xl bg-emerald-500/10">
                <CheckCircle className="h-6 w-6 sm:h-7 sm:w-7 text-emerald-600" />
              </div>
              <div className="text-center sm:text-left">
                <p className="text-2xl sm:text-3xl font-bold text-emerald-700">
                  {dashboardStats.progressing}
                </p>
                <p className="text-sm sm:text-base text-emerald-600/80 font-medium mt-0.5">
                  Progressing
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Not Progressing */}
        <Card className="border-0 shadow-sm bg-gradient-to-br from-red-50 to-red-100/50 rounded-2xl">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col items-center sm:items-start gap-2">
              <div className="p-2.5 sm:p-3 rounded-xl bg-red-500/10">
                <TrendingDown className="h-6 w-6 sm:h-7 sm:w-7 text-red-600" />
              </div>
              <div className="text-center sm:text-left">
                <p className="text-2xl sm:text-3xl font-bold text-red-700">
                  {dashboardStats.notProgressing}
                </p>
                <p className="text-sm sm:text-base text-red-600/80 font-medium mt-0.5">
                  Not Progressing
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
