import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useLocation } from "react-router";
import { School } from "@/services/schools";
import { useAuth } from "@/hooks/useAuth";
import { UserRole } from "@/types/user";
import { DASHBOARD_ROUTE_PATHS } from "@/routes";

interface SchoolContextType {
  selectedSchool: School | null;
  setSelectedSchool: (school: School | null) => void;
  isSchoolContextActive: boolean; // Whether to use school filtering (false for School Management page)
  setIsSchoolContextActive: (active: boolean) => void;
}

const SchoolContext = createContext<SchoolContextType | undefined>(undefined);

interface SchoolProviderProps {
  children: ReactNode;
}

export const SchoolProvider: React.FC<SchoolProviderProps> = ({ children }) => {
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [isSchoolContextActive, setIsSchoolContextActive] = useState(true);
  const { user } = useAuth();
  const location = useLocation();

  // Auto-disable school context on School Management page
  useEffect(() => {
    const isSchoolManagementPage =
      location.pathname === DASHBOARD_ROUTE_PATHS.schools;
    setIsSchoolContextActive(!isSchoolManagementPage);
  }, [location.pathname]);

  // Auto-set school for non-super-admin users based on their assignment
  useEffect(() => {
    if (
      user &&
      user.role !== UserRole.SUPER_ADMIN &&
      user.schoolId &&
      typeof user.schoolId === "object"
    ) {
      setSelectedSchool({
        _id: user.schoolId._id || "",
        name: user.schoolId.name || "",
        type: "private", // Default type since it's not available in user.schoolId
        udise_code: "",
        address: "",
        level: "primary",
        city: "",
        state: "",
        establishedYear: new Date().getFullYear(),
        pinCode: "",
        pointOfContact: "",
        phone: ""
      });
    }
  }, [user]);

  return (
    <SchoolContext.Provider
      value={{
        selectedSchool,
        setSelectedSchool,
        isSchoolContextActive,
        setIsSchoolContextActive,
      }}
    >
      {children}
    </SchoolContext.Provider>
  );
};

export const useSchoolContext = (): SchoolContextType => {
  const context = useContext(SchoolContext);
  if (!context) {
    throw new Error("useSchoolContext must be used within a SchoolProvider");
  }
  return context;
};
