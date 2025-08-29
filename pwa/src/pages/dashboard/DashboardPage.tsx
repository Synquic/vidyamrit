import { useContext } from "react";
import { AuthContext } from "../../contexts/AuthContext";
import { UserRole } from "@/types/user";

function DashboardPage() {
  const { user, loading } = useContext(AuthContext) || {};

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <div>Please log in to access the dashboard.</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="text-lg font-semibold mb-2">User Information</h2>
        <div className="space-y-2">
          <p>
            <span className="font-medium">Name:</span> {user.name}
          </p>
          <p>
            <span className="font-medium">Email:</span> {user.email}
          </p>
          <p>
            <span className="font-medium">Role:</span> {user.role}
          </p>
          {user.role !== UserRole.SUPER_ADMIN && user.schoolId && (
            <p>
              <span className="font-medium">School:</span> {user.schoolId.name} ({user.schoolId._id})
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
