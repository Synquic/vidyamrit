import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { AuthContext } from "../../contexts/AuthContext";
import { DASHBOARD_ROUTE_PATHS } from "@/routes";
import { getDashboardAnalytics, DashboardAnalytics } from "@/services/analytics";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";
import {
  Users,
  GraduationCap,
  School,
  BookOpen,
  TrendingUp,
  TrendingDown,
  Activity,
  CheckCircle,
  UserCheck,
  UserX,
  Target,
  Award
} from "lucide-react";
import { useTranslation } from "react-i18next";

function DashboardPage() {
  const { user, loading } = useContext(AuthContext) || {};
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);

  useEffect(() => {
    // Redirect view users to their dashboard
    if (user && (user.role as string) === "view_user") {
      navigate(DASHBOARD_ROUTE_PATHS.viewDashboard, { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoadingAnalytics(true);
        const data = await getDashboardAnalytics();
        setAnalytics(data);
      } catch (error) {
        console.error("Error fetching analytics:", error);
      } finally {
        setLoadingAnalytics(false);
      }
    };

    if (user) {
      fetchAnalytics();
    }
  }, [user]);

  if (loading || loadingAnalytics) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  if (!user) {
    return <div>Please log in to access the dashboard.</div>;
  }

  if (!analytics) {
    return <div>No data available.</div>;
  }

  const { overview, charts } = analytics;

  // Chart colors
  const COLORS = {
    primary: "#ea580c",
    secondary: "#f97316",
    success: "#10b981",
    warning: "#f59e0b",
    danger: "#ef4444",
    info: "#3b82f6",
    purple: "#8b5cf6",
    pink: "#ec4899"
  };

  // Progress flag color mapping
  const progressFlagColors: Record<string, string> = {
    excelling: COLORS.success,
    improving: COLORS.info,
    average: COLORS.warning,
    struggling: COLORS.danger,
    needs_attention: COLORS.purple
  };

  // Format progress distribution data
  const progressData = charts.progressDistribution.map(item => ({
    name: item._id,
    value: item.count,
    color: progressFlagColors[item._id] || COLORS.primary
  }));

  // Format monthly enrollment data
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const enrollmentData = charts.monthlyEnrollment.map(item => ({
    month: `${monthNames[item._id.month - 1]} ${item._id.year}`,
    students: item.count
  }));

  // Format attendance data for pie chart
  const attendanceChartData = [
    { name: "Present", value: charts.attendanceData.present, color: COLORS.success },
    { name: "Absent", value: charts.attendanceData.absent, color: COLORS.danger }
  ];

  // Stats card component
  const StatsCard = ({ title, value, subtitle, icon: Icon, trend, trendValue, color }: any) => (
    <div className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 p-6 border border-gray-100">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-xl bg-gradient-to-br ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
            trend === "up" ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
          }`}>
            {trend === "up" ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {trendValue}
          </div>
        )}
      </div>
      <div>
        <h3 className="text-3xl font-bold text-gray-900 mb-1">{value.toLocaleString()}</h3>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        {subtitle && (
          <p className="text-xs text-gray-500 mt-2">{subtitle}</p>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-orange-50/30 to-amber-50/30 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
          {t("Admin Dashboard")}
        </h1>
        <p className="text-gray-600">
          Welcome back, {user.name}! Here's what's happening with your organization.
        </p>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
        <StatsCard
          title="Total Schools"
          value={overview.totalSchools}
          subtitle={`${overview.activeSchools} active in last 30 days`}
          icon={School}
          color="from-orange-500 to-orange-600"
        />
        <StatsCard
          title="Total Students"
          value={overview.totalStudents}
          subtitle={`${overview.activeStudents} active students`}
          icon={Users}
          trend="up"
          trendValue={`${((overview.activeStudents / overview.totalStudents) * 100).toFixed(1)}%`}
          color="from-blue-500 to-blue-600"
        />
        <StatsCard
          title="Total Cohorts"
          value={overview.totalCohorts}
          subtitle={`${overview.activeCohorts} active cohorts`}
          icon={BookOpen}
          color="from-purple-500 to-purple-600"
        />
        <StatsCard
          title="Engaged Tutors"
          value={overview.engagedTutors}
          subtitle={`out of ${overview.totalTutors} total tutors`}
          icon={GraduationCap}
          color="from-pink-500 to-pink-600"
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
        <StatsCard
          title="Schools with Baseline"
          value={overview.schoolsWithBaseline}
          subtitle="Completed baseline assessments"
          icon={Target}
          color="from-emerald-500 to-emerald-600"
        />
        <StatsCard
          title="Active Students"
          value={overview.activeStudents}
          subtitle="Engaged in last 30 days"
          icon={UserCheck}
          color="from-green-500 to-green-600"
        />
        <StatsCard
          title="Dropped Students"
          value={overview.droppedStudents}
          subtitle="Archived students"
          icon={UserX}
          color="from-red-500 to-red-600"
        />
        <StatsCard
          title="Total Assessments"
          value={overview.totalAssessments}
          subtitle={`${overview.assessmentSuccessRate.toFixed(1)}% success rate`}
          icon={Award}
          trend="up"
          trendValue={`${overview.assessmentSuccessRate.toFixed(1)}%`}
          color="from-yellow-500 to-yellow-600"
        />
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-8">
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Attendance Rate</h2>
            <Activity className="w-6 h-6 text-orange-600" />
          </div>
          <div className="flex items-center gap-4">
            <div className="relative w-32 h-32">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="#f3f4f6"
                  strokeWidth="12"
                  fill="none"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke={COLORS.success}
                  strokeWidth="12"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 56}`}
                  strokeDashoffset={`${2 * Math.PI * 56 * (1 - overview.attendanceRate / 100)}`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold text-gray-900">
                  {overview.attendanceRate.toFixed(1)}%
                </span>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-2">Overall attendance across all cohorts</p>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-gray-600">
                    {charts.attendanceData.present} Present
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span className="text-gray-600">
                    {charts.attendanceData.absent} Absent
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Assessment Success</h2>
            <CheckCircle className="w-6 h-6 text-orange-600" />
          </div>
          <div className="flex items-center gap-4">
            <div className="relative w-32 h-32">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="#f3f4f6"
                  strokeWidth="12"
                  fill="none"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke={COLORS.primary}
                  strokeWidth="12"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 56}`}
                  strokeDashoffset={`${2 * Math.PI * 56 * (1 - overview.assessmentSuccessRate / 100)}`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold text-gray-900">
                  {overview.assessmentSuccessRate.toFixed(1)}%
                </span>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-2">Students passing assessments</p>
              <p className="text-xs text-gray-500">
                Based on {overview.totalAssessments} total assessments
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-8">
        {/* Monthly Enrollment Trend */}
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Monthly Student Enrollment</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={enrollmentData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis
                dataKey="month"
                tick={{ fill: "#6b7280", fontSize: 12 }}
                stroke="#e5e7eb"
              />
              <YAxis
                tick={{ fill: "#6b7280", fontSize: 12 }}
                stroke="#e5e7eb"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)"
                }}
              />
              <Line
                type="monotone"
                dataKey="students"
                stroke={COLORS.primary}
                strokeWidth={3}
                dot={{ fill: COLORS.primary, r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Student Progress Distribution */}
        {progressData.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Student Progress Distribution</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={progressData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => entry.name}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {progressData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)"
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Attendance Distribution */}
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Attendance Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={attendanceChartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => `${entry.name}: ${entry.value}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {attendanceChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)"
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Cohort Performance */}
        {charts.cohortPerformance.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Top Performing Cohorts</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={charts.cohortPerformance.slice(0, 5)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis
                  dataKey="name"
                  tick={{ fill: "#6b7280", fontSize: 12 }}
                  stroke="#e5e7eb"
                />
                <YAxis
                  tick={{ fill: "#6b7280", fontSize: 12 }}
                  stroke="#e5e7eb"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)"
                  }}
                />
                <Bar dataKey="averageProgress" fill={COLORS.secondary} radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* School Type Distribution */}
      {charts.schoolTypeDistribution.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">School Type Distribution</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {charts.schoolTypeDistribution.map((item, index) => (
              <div key={index} className="p-4 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600 capitalize">{item._id}</span>
                  <School className="w-5 h-5 text-orange-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900">{item.count}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default DashboardPage;
