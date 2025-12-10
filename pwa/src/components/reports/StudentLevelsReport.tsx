"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ArrowLeft,
  School,
  Users,
  GraduationCap,
  Loader2,
  ChevronDown,
  ChevronRight,
  User,
  Calendar,
  BookOpen,
  Table as TableIcon,
  Grid,
  Building2,
} from "lucide-react";
import { getStudents, Student } from "@/services/students";
import { getSchools, School as SchoolType } from "@/services/schools";
import { programsService, IProgram } from "@/services/programs";
import { getAssessments, Assessment } from "@/services/assessments";
import { useAuth } from "@/hooks/useAuth";
import { UserRole } from "@/types/user";
import { useNavigate } from "react-router";
import { DASHBOARD_ROUTE_PATHS } from "@/routes";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface StudentLevelsReportProps {
  onBack: () => void;
}

interface GroupedData {
  school: SchoolType;
  classes: {
    [className: string]: {
      students: Student[];
      levelDistribution: { [subject: string]: { [level: number]: number } };
      totalStudents: number;
    };
  };
}

interface StudentLevelInfo {
  subject: string;
  programName: string;
  level: number;
  date: string;
  programId: string;
}

type ViewMode = "tabular" | "matrix";
type SchoolViewMode = "individual" | "combined";

export default function StudentLevelsReport({ onBack }: StudentLevelsReportProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [schools, setSchools] = useState<SchoolType[]>([]);
  const [programs, setPrograms] = useState<IProgram[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSchools, setExpandedSchools] = useState<Set<string>>(new Set());
  const [expandedClasses, setExpandedClasses] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<ViewMode>("matrix");
  const [schoolViewMode, setSchoolViewMode] = useState<SchoolViewMode>("individual");
  const [selectedSchoolIds, setSelectedSchoolIds] = useState<Set<string>>(new Set());
  const [selectedBlock, setSelectedBlock] = useState<string>("all");
  const [schoolSearchQuery, setSchoolSearchQuery] = useState("");

  // Reset selected schools when block changes
  useEffect(() => {
    setSelectedSchoolIds(new Set());
    setSchoolSearchQuery("");
  }, [selectedBlock]);

  // Redirect if not super admin
  useEffect(() => {
    if (user && user.role !== UserRole.SUPER_ADMIN) {
      navigate(DASHBOARD_ROUTE_PATHS.dashboard);
    }
  }, [user, navigate]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all schools, students, programs, and assessments (Super Admin can access all)
      const [schoolsData, studentsData, programsResponse, assessmentsData] = await Promise.all([
        getSchools(),
        getStudents(), // No schoolId = all students for Super Admin
        programsService.getPrograms({ includeInactive: "false" }),
        getAssessments(), // Fetch all assessments for fallback to old data structure
      ]);

      setSchools(schoolsData);
      setStudents(studentsData);
      setPrograms(programsResponse.programs);
      setAssessments(assessmentsData);
    } catch (err: any) {
      console.error("Error fetching report data:", err);
      setError("Failed to load report data");
    } finally {
      setLoading(false);
    }
  };

  // Get student's latest level info per subject helper
  const getStudentLevelInfo = (student: Student): StudentLevelInfo[] => {
    const subjectLevels: { [subject: string]: StudentLevelInfo } = {};
    
    // Priority 1: Check for new data structure (with program, subject, etc.)
    if (student.knowledgeLevel && student.knowledgeLevel.length > 0) {
      let hasNewStructure = false;
      
      student.knowledgeLevel.forEach((kl: any) => {
        if (!kl) return;
        
        // Check if this is the new structure (has program and subject)
        const hasNewStructureFields = kl.program && kl.subject;
        
        if (hasNewStructureFields) {
          hasNewStructure = true;
          
          const subject = kl.subject || kl.programName || 'Unknown';
          const level = Number(kl.level);
          const date = kl.date;
          const programId = kl.program 
            ? (typeof kl.program === 'string' ? kl.program : String(kl.program))
            : '';
          const programName = kl.programName || kl.subject || subject;
          
          // Validate date
          const klDate = new Date(date);
          if (isNaN(klDate.getTime())) {
            return; // Skip invalid dates
          }
          
          // Validate level
          if (isNaN(level) || level <= 0) {
            return; // Skip invalid levels
          }
          
          // Keep the latest assessment for each subject
          if (!subjectLevels[subject] || klDate > new Date(subjectLevels[subject].date)) {
            subjectLevels[subject] = {
              subject: subject,
              programName: programName,
              level: level,
              date: date,
              programId: programId,
            };
          }
        }
      });
      
      // If we found new structure data, return it
      if (hasNewStructure) {
        return Object.values(subjectLevels).sort((a, b) => 
          a.subject.localeCompare(b.subject)
        );
      }
    }
    
    // Priority 2: Fallback to old structure - use Assessment model
    // Check if student has old knowledgeLevel structure (just level and date)
    const hasOldStructure = student.knowledgeLevel && student.knowledgeLevel.some(
      (kl: any) => kl && kl.level && kl.date && !kl.program && !kl.subject
    );
    
    if (hasOldStructure) {
      // Fetch assessments for this student from Assessment model
      const studentAssessments = assessments.filter(
        (assessment) => {
          const assessmentStudentId = typeof assessment.student === 'string' 
            ? assessment.student 
            : (assessment.student as any)?._id || assessment.student;
          return assessmentStudentId === student._id;
        }
      );
      
      // Group assessments by subject and get latest level per subject
      studentAssessments.forEach((assessment) => {
        const subject = assessment.subject || 'Unknown';
        const level = assessment.level;
        const date = assessment.date;
        
        // Capitalize first letter of subject
        const capitalizedSubject = subject.charAt(0).toUpperCase() + subject.slice(1);
        
        // Validate date
        const assessmentDate = new Date(date);
        if (isNaN(assessmentDate.getTime())) {
          return; // Skip invalid dates
        }
        
        // Validate level
        if (isNaN(level) || level <= 0) {
          return; // Skip invalid levels
        }
        
        // Keep the latest assessment for each subject
        if (!subjectLevels[capitalizedSubject] || assessmentDate > new Date(subjectLevels[capitalizedSubject].date)) {
          // Try to find matching program for this subject
          const matchingProgram = programs.find(
            (p) => p.subject.toLowerCase() === subject.toLowerCase()
          );
          
          subjectLevels[capitalizedSubject] = {
            subject: capitalizedSubject,
            programName: matchingProgram?.name || capitalizedSubject,
            level: level,
            date: date,
            programId: matchingProgram?._id || '',
          };
        }
      });
    }

    return Object.values(subjectLevels).sort((a, b) => 
      a.subject.localeCompare(b.subject)
    );
  };

  // Group students by school and class, calculate level distribution
  const groupedData = useMemo(() => {
    const grouped: { [schoolId: string]: GroupedData } = {};

    // Filter out students without schoolId
    const validStudents = students.filter((s) => s.schoolId && s.schoolId._id);

    schools.forEach((school) => {
      if (!school._id) return;
      const schoolStudents = validStudents.filter(
        (s) => s.schoolId && s.schoolId._id === school._id
      );

      const classes: { [className: string]: any } = {};

      schoolStudents.forEach((student) => {
        const className = student.class || "Unassigned";
        
        if (!classes[className]) {
          classes[className] = {
            students: [],
            levelDistribution: {} as { [level: number]: number },
            totalStudents: 0,
          };
        }

        classes[className].students.push(student);
        classes[className].totalStudents++;

        // Get latest level per subject/program for student
        // Priority 1: New structure (with program, subject)
        // Priority 2: Old structure (use Assessment model)
        if (student.knowledgeLevel && student.knowledgeLevel.length > 0) {
          // Check if student has new structure
          const hasNewStructure = student.knowledgeLevel.some(
            (kl: any) => kl && kl.program && kl.subject
          );
          
          if (hasNewStructure) {
            // Use new structure
            const subjectLevels: { [subject: string]: { level: number; date: Date } } = {};
            
            student.knowledgeLevel.forEach((kl: any) => {
              if (kl && kl.subject && kl.level && kl.date && kl.program) {
                const subject = kl.subject;
                const klDate = new Date(kl.date);
                
                // Keep the latest assessment for each subject
                if (!subjectLevels[subject] || klDate > subjectLevels[subject].date) {
                  subjectLevels[subject] = {
                    level: kl.level,
                    date: klDate,
                  };
                }
              }
            });

            // Update level distribution per subject
            Object.entries(subjectLevels).forEach(([subject, { level }]) => {
              if (!classes[className].levelDistribution[subject]) {
                classes[className].levelDistribution[subject] = {};
              }
              classes[className].levelDistribution[subject][level] =
                (classes[className].levelDistribution[subject][level] || 0) + 1;
            });
          } else {
            // Use old structure - get from Assessment model
            const studentAssessments = assessments.filter(
              (assessment) => {
                const assessmentStudentId = typeof assessment.student === 'string' 
                  ? assessment.student 
                  : (assessment.student as any)?._id || assessment.student;
                return assessmentStudentId === student._id;
              }
            );
            
            const subjectLevels: { [subject: string]: { level: number; date: Date } } = {};
            
            studentAssessments.forEach((assessment) => {
              const subject = assessment.subject 
                ? (assessment.subject.charAt(0).toUpperCase() + assessment.subject.slice(1))
                : 'Unknown';
              const assessmentDate = new Date(assessment.date);
              
              // Keep the latest assessment for each subject
              if (!subjectLevels[subject] || assessmentDate > subjectLevels[subject].date) {
                subjectLevels[subject] = {
                  level: assessment.level,
                  date: assessmentDate,
                };
              }
            });

            // Update level distribution per subject
            Object.entries(subjectLevels).forEach(([subject, { level }]) => {
              if (!classes[className].levelDistribution[subject]) {
                classes[className].levelDistribution[subject] = {};
              }
              classes[className].levelDistribution[subject][level] =
                (classes[className].levelDistribution[subject][level] || 0) + 1;
            });
          }
        }
      });

      if (Object.keys(classes).length > 0 && school._id) {
        grouped[school._id] = {
          school,
          classes,
        };
      }
    });

    return grouped;
  }, [students, schools, programs, assessments]);

  // Get all unique subjects across all data
  const allSubjects = useMemo(() => {
    const subjectsSet = new Set<string>();
    
    Object.values(groupedData).forEach((schoolData) => {
      Object.values(schoolData.classes).forEach((classData) => {
        Object.keys(classData.levelDistribution).forEach((subject) => {
          subjectsSet.add(subject);
        });
      });
    });
    
    return Array.from(subjectsSet).sort();
  }, [groupedData]);

  // Get max level across all subjects
  const maxLevel = useMemo(() => {
    let max = 0;
    
    Object.values(groupedData).forEach((schoolData) => {
      Object.values(schoolData.classes).forEach((classData) => {
        Object.values(classData.levelDistribution).forEach((levelDist) => {
          Object.keys(levelDist).forEach((level) => {
            const levelNum = parseInt(level);
            if (levelNum > max) {
              max = levelNum;
            }
          });
        });
      });
    });
    
    return max || 6; // Default to 6 if no data
  }, [groupedData]);

  // Get unique blocks from schools
  const uniqueBlocks = useMemo(() => {
    const blocks = new Set<string>();
    schools.forEach((school) => {
      if (school.block) {
        blocks.add(school.block);
      }
    });
    return Array.from(blocks).sort();
  }, [schools]);

  // Filter schools by block
  const filteredSchoolsByBlock = useMemo(() => {
    if (selectedBlock === "all") {
      return schools;
    }
    return schools.filter((school) => school.block === selectedBlock);
  }, [schools, selectedBlock]);

  // Filter schools by search query
  const filteredSchoolsForSelection = useMemo(() => {
    if (!schoolSearchQuery.trim()) {
      return filteredSchoolsByBlock;
    }
    const query = schoolSearchQuery.toLowerCase().trim();
    return filteredSchoolsByBlock.filter((school) =>
      school.name.toLowerCase().includes(query)
    );
  }, [filteredSchoolsByBlock, schoolSearchQuery]);

  // Filter data based on school view mode and selected schools
  const filteredGroupedData = useMemo(() => {
    // If using multi-select, filter by selectedSchoolIds
    if (selectedSchoolIds.size > 0) {
      const filtered: typeof groupedData = {};
      selectedSchoolIds.forEach((schoolId) => {
        if (groupedData[schoolId]) {
          filtered[schoolId] = groupedData[schoolId];
        }
      });
      return filtered;
    }
    
    // If no schools selected, show all schools
    return groupedData;
  }, [groupedData, selectedSchoolIds]);

  // Create combined data for matrix view
  const combinedData = useMemo(() => {
    const combined: {
      [className: string]: {
        [subject: string]: { [level: number]: number };
      } & {
        totalStudents: number;
        students: Student[];
      };
    } = {};

    Object.values(groupedData).forEach((schoolData) => {
      Object.entries(schoolData.classes).forEach(([className, classData]) => {
        if (!combined[className]) {
          (combined as any)[className] = {
            totalStudents: 0,
            students: [],
          };
        }
        
        combined[className].totalStudents += classData.totalStudents;
        
        // Add students from this class
        if (classData.students) {
          combined[className].students.push(...classData.students);
        }
        
        Object.entries(classData.levelDistribution).forEach(([subject, levelDist]) => {
          if (!combined[className][subject]) {
            combined[className][subject] = {};
          }
          
          Object.entries(levelDist).forEach(([level, count]) => {
            const levelNum = parseInt(level);
            combined[className][subject][levelNum] = 
              (combined[className][subject][levelNum] || 0) + count;
          });
        });
      });
    });

    return combined;
  }, [groupedData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-6 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading report data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <p className="text-destructive">{error}</p>
              <Button onClick={fetchData} className="mt-4">
                Retry
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Render Level Progression Matrix View
  const renderMatrixView = (data: typeof groupedData | { combined: typeof groupedData }, isCombined: boolean) => {
    const dataToRender = isCombined ? combinedData : 
      (() => {
        const flat: typeof combinedData = {};
        Object.values(data).forEach((schoolData) => {
          Object.entries(schoolData.classes).forEach(([className, classData]) => {
            const typedClassData = classData as GroupedData['classes'][string];
            flat[className] = {
              totalStudents: typedClassData.totalStudents,
              ...typedClassData.levelDistribution,
            } as typeof combinedData[string];
          });
        });
        return flat;
      })();

    if (Object.keys(dataToRender).length === 0 || allSubjects.length === 0) {
      return (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No data available for matrix view</p>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-6">
        {allSubjects.map((subject) => (
          <Card key={subject} className="overflow-hidden">
            <CardHeader className="bg-primary/5">
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                {subject} - Level Progression Matrix
              </CardTitle>
              <CardDescription>
                {isCombined ? "All Schools Combined" : "School-wise View"}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="sticky left-0 z-10 bg-background min-w-[150px]">
                        Class
                      </TableHead>
                      {Array.from({ length: maxLevel }, (_, i) => i + 1).map((level) => (
                        <TableHead key={level} className="text-center min-w-[80px]">
                          L{level}
                        </TableHead>
                      ))}
                      <TableHead className="text-center min-w-[80px]">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(dataToRender)
                      .sort(([a], [b]) => {
                        // Sort classes naturally (Class 1, Class 2, etc.)
                        const aNum = parseInt(a.match(/\d+/)?.[0] || "999");
                        const bNum = parseInt(b.match(/\d+/)?.[0] || "999");
                        if (aNum !== bNum) return aNum - bNum;
                        return a.localeCompare(b);
                      })
                      .map(([className, classData]) => {
                        const subjectData = (classData as any)[subject] || {};
                        const totalForSubject = Object.values(subjectData as { [key: number]: number }).reduce(
                          (sum: number, count: any) => sum + count,
                          0
                        );

                        return (
                          <TableRow key={className}>
                            <TableCell className="font-medium sticky left-0 z-10 bg-background">
                              {className}
                            </TableCell>
                            {Array.from({ length: maxLevel }, (_, i) => i + 1).map((level) => {
                              const count = subjectData[level] || 0;
                              return (
                                <TableCell key={level} className="text-center">
                                  {count > 0 ? (
                                    <span className="font-semibold">{count}</span>
                                  ) : (
                                    <span className="text-muted-foreground">-</span>
                                  )}
                                </TableCell>
                              );
                            })}
                            <TableCell className="text-center font-semibold">
                              {totalForSubject > 0 ? totalForSubject : "-"}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  // Render Tabular View
  const renderTabularView = (data: typeof groupedData | { combined: GroupedData }, isCombined: boolean) => {
    if (Object.keys(data).length === 0) {
      return (
        <Card>
          <CardContent className="py-12 text-center">
            <GraduationCap className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No student data available</p>
          </CardContent>
        </Card>
      );
    }

    // For combined view, create aggregated class data
    const dataToRender: typeof groupedData | { combined: GroupedData } = isCombined ? {
      combined: {
        school: { name: "All Schools Combined", _id: "combined" } as SchoolType,
        classes: combinedData as any,
      }
    } : data;

    return (
      <div className="space-y-4">
        {Object.values(dataToRender).map((schoolData) => {
          const schoolKey = schoolData.school?._id || "combined";
          const isSchoolExpanded = expandedSchools.has(schoolKey);

          return (
            <Card key={schoolKey} className="overflow-hidden">
              <Collapsible
                open={isSchoolExpanded}
                onOpenChange={(open) => {
                  const newSet = new Set(expandedSchools);
                  if (open) {
                    newSet.add(schoolKey);
                  } else {
                    newSet.delete(schoolKey);
                  }
                  setExpandedSchools(newSet);
                }}
              >
                <CollapsibleTrigger asChild>
                  <CardHeader className="bg-muted/50 cursor-pointer hover:bg-muted/70 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        {isCombined ? (
                          <Building2 className="w-5 h-5 text-primary" />
                        ) : (
                          <School className="w-5 h-5 text-primary" />
                        )}
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-lg md:text-xl flex items-center gap-2">
                          {isSchoolExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                          {isCombined ? "All Schools Combined" : schoolData.school?.name}
                        </CardTitle>
                        {!isCombined && (
                          <CardDescription className="mt-1">
                            {schoolData.school?.type} • {schoolData.school?.city || "N/A"}
                          </CardDescription>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="hidden sm:flex">
                          {Object.keys(schoolData.classes).length} Classes
                        </Badge>
                        <Badge variant="secondary" className="hidden sm:flex">
                          {Object.values(schoolData.classes).reduce(
                            (sum, c) => sum + c.totalStudents,
                            0
                          )} Students
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="p-4 md:p-6">
                    <div className="space-y-4">
                      {Object.entries(schoolData.classes).map(([className, classData]) => {
                        const classKey = `${schoolKey}-${className}`;
                        const isClassExpanded = expandedClasses.has(classKey);

                        return (
                          <Card key={className} className="border-l-4 border-l-primary">
                            <Collapsible
                              open={isClassExpanded}
                              onOpenChange={(open) => {
                                const newSet = new Set(expandedClasses);
                                if (classKey) {
                                  if (open) {
                                    newSet.add(classKey);
                                  } else {
                                    newSet.delete(classKey);
                                  }
                                }
                                setExpandedClasses(newSet);
                              }}
                            >
                              <CollapsibleTrigger asChild>
                                <CardHeader className="pb-3 cursor-pointer hover:bg-muted/50 transition-colors">
                                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                      {isClassExpanded ? (
                                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                      ) : (
                                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                      )}
                                      <Users className="h-4 w-4 text-muted-foreground" />
                                      <CardTitle className="text-base md:text-lg">
                                        Class {className}
                                      </CardTitle>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Badge variant="secondary">
                                        {classData.totalStudents} Students
                                      </Badge>
                                      {(() => {
                                        const subjectCount = isCombined
                                          ? Object.keys(classData as any).filter(k => k !== 'totalStudents').length
                                          : Object.keys((classData as any).levelDistribution || {}).length;
                                        return subjectCount > 0 && (
                                          <Badge variant="outline">
                                            {subjectCount} Subjects
                                          </Badge>
                                        );
                                      })()}
                                    </div>
                                  </div>
                                </CardHeader>
                              </CollapsibleTrigger>
                              <CollapsibleContent>
                                <CardContent className="space-y-4">
                                  {/* Level Distribution Summary - Per Subject */}
                                  {(() => {
                                    // Handle both combined and individual structures
                                    const levelDist = isCombined 
                                      ? classData as any // In combined, subjects are direct keys
                                      : (classData as any).levelDistribution || {};
                                    const subjects = isCombined
                                      ? Object.keys(classData as any).filter(k => k !== 'totalStudents' && k !== 'students')
                                      : Object.keys(levelDist);
                                    
                                    if (subjects.length === 0) {
                                      return <div className="text-sm text-muted-foreground">No level distribution data available</div>;
                                    }
                                    
                                    return (
                                      <div className="space-y-4">
                                        {subjects
                                          .sort((a, b) => a.localeCompare(b))
                                          .map((subject) => {
                                            const levelCounts = isCombined
                                              ? (classData as any)[subject]
                                              : levelDist[subject];
                                            
                                            if (!levelCounts || Object.keys(levelCounts).length === 0) {
                                              return null;
                                            }
                                            
                                            return (
                                              <div key={subject} className="space-y-2">
                                                <div className="flex items-center gap-2 mb-2">
                                                  <BookOpen className="h-4 w-4 text-primary" />
                                                  <div className="text-sm font-semibold capitalize">
                                                    {subject} - Level Distribution:
                                                  </div>
                                                </div>
                                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 md:gap-3">
                                                  {Object.entries(levelCounts)
                                                    .sort(([a], [b]) => Number(a) - Number(b))
                                                    .map(([level, count]) => {
                                                      const countNum = count as number;
                                                      const classDataTyped = classData as GroupedData['classes'][string];
                                                      return (
                                                        <div
                                                          key={`${subject}-${level}`}
                                                          className="flex flex-col items-center p-2 md:p-3 bg-muted/50 rounded-lg"
                                                        >
                                                          <div className="text-xs text-muted-foreground mb-1 md:mb-2">
                                                            Level {level}
                                                          </div>
                                                          <span className="text-sm md:text-base font-semibold">
                                                            {countNum}
                                                          </span>
                                                          <span className="text-xs text-muted-foreground">
                                                            {((countNum / classDataTyped.totalStudents) * 100).toFixed(0)}%
                                                          </span>
                                                        </div>
                                                      );
                                                    })}
                                                </div>
                                              </div>
                                            );
                                          })}
                                      </div>
                                    );
                                  })()}

                                  {/* Students Table - Show in both individual and combined views */}
                                  {(() => {
                                    // Get students for this class
                                    let classStudents: Student[] = [];
                                    
                                    if (!isCombined && classData.students) {
                                      classStudents = classData.students;
                                    } else if (isCombined) {
                                      // For combined view, get students from combinedData
                                      if (combinedData[className] && combinedData[className].students) {
                                        classStudents = combinedData[className].students;
                                      }
                                    }
                                    
                                    if (classStudents.length === 0) {
                                      return (
                                        <div className="mt-4">
                                          <div className="text-sm font-medium text-muted-foreground mb-3">
                                            Students ({classData.totalStudents}):
                                          </div>
                                          <div className="text-center py-8 text-muted-foreground">
                                            No students found in this class
                                          </div>
                                        </div>
                                      );
                                    }
                                    
                                    return (
                                      <div className="mt-4">
                                        <div className="text-sm font-medium text-muted-foreground mb-3">
                                          Students ({classStudents.length}):
                                        </div>
                                        <div className="overflow-x-auto">
                                          <Table>
                                            <TableHeader>
                                              <TableRow>
                                                <TableHead className="w-[50px]">#</TableHead>
                                                <TableHead>Name</TableHead>
                                                <TableHead className="hidden sm:table-cell">Roll No</TableHead>
                                                <TableHead className="hidden md:table-cell">Age</TableHead>
                                                {!isCombined && <TableHead className="hidden lg:table-cell">School</TableHead>}
                                                <TableHead>Class</TableHead>
                                                <TableHead>Levels (by Subject)</TableHead>
                                                <TableHead className="hidden md:table-cell">Last Assessment</TableHead>
                                                <TableHead className="hidden lg:table-cell">Total Assessments</TableHead>
                                              </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                              {classStudents
                                                .sort((a, b) => {
                                                  // Sort by name
                                                  return (a.name || "").localeCompare(b.name || "");
                                                })
                                                .map((student, index) => {
                                                const levelInfos = getStudentLevelInfo(student);
                                                const latestAssessment = levelInfos.length > 0
                                                  ? levelInfos.sort((a, b) => 
                                                      new Date(b.date).getTime() - new Date(a.date).getTime()
                                                    )[0]
                                                  : null;
                                                
                                                return (
                                                  <TableRow key={student._id} className="hover:bg-muted/50">
                                                    <TableCell className="font-medium text-muted-foreground">
                                                      {index + 1}
                                                    </TableCell>
                                                    <TableCell>
                                                      <div className="flex items-center gap-2">
                                                        <User className="h-4 w-4 text-muted-foreground" />
                                                        <div>
                                                          <div className="font-medium">{student.name}</div>
                                                          <div className="text-xs text-muted-foreground sm:hidden">
                                                            Roll: {student.roll_no || "N/A"}
                                                          </div>
                                                        </div>
                                                      </div>
                                                    </TableCell>
                                                    <TableCell className="hidden sm:table-cell">
                                                      {student.roll_no || "N/A"}
                                                    </TableCell>
                                                    <TableCell className="hidden md:table-cell">
                                                      {student.age || "N/A"}
                                                    </TableCell>
                                                    {!isCombined && (
                                                      <TableCell className="hidden lg:table-cell">
                                                        {schoolData.school?.name || "N/A"}
                                                      </TableCell>
                                                    )}
                                                    <TableCell>
                                                      <Badge variant="outline">{student.class || "N/A"}</Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                      {levelInfos.length > 0 ? (
                                                        <div className="flex flex-wrap gap-2">
                                                          {levelInfos.map((info) => (
                                                            <div
                                                              key={info.subject}
                                                              className="text-sm"
                                                            >
                                                              <span className="font-medium">{info.subject}:</span>{" "}
                                                              <span className="font-semibold">L{info.level}</span>
                                                            </div>
                                                          ))}
                                                        </div>
                                                      ) : (
                                                        <span className="text-muted-foreground text-sm">Not Assessed</span>
                                                      )}
                                                    </TableCell>
                                                    <TableCell className="hidden md:table-cell">
                                                      {latestAssessment ? (
                                                        <div className="flex flex-col gap-1">
                                                          <div className="flex items-center gap-1 text-sm">
                                                            <Calendar className="h-3 w-3 text-muted-foreground" />
                                                            {new Date(latestAssessment.date).toLocaleDateString("en-US", {
                                                              month: "short",
                                                              day: "numeric",
                                                              year: "numeric",
                                                            })}
                                                          </div>
                                                          <Badge variant="secondary" className="text-xs w-fit capitalize">
                                                            {latestAssessment.subject}
                                                          </Badge>
                                                        </div>
                                                      ) : (
                                                        <span className="text-muted-foreground text-sm">-</span>
                                                      )}
                                                    </TableCell>
                                                    <TableCell className="hidden lg:table-cell">
                                                      {student.knowledgeLevel && student.knowledgeLevel.length > 0 ? (
                                                        <Badge variant="outline">
                                                          {student.knowledgeLevel.length}
                                                        </Badge>
                                                      ) : (
                                                        <span className="text-muted-foreground text-sm">0</span>
                                                      )}
                                                    </TableCell>
                                                  </TableRow>
                                                );
                                              })}
                                            </TableBody>
                                          </Table>
                                        </div>
                                      </div>
                                    );
                                  })()}
                                </CardContent>
                              </CollapsibleContent>
                            </Collapsible>
                          </Card>
                        );
                      })}
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <Button
            variant="ghost"
            onClick={onBack}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Reports
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">
              Student Levels - Class & School Wise
            </h1>
            <p className="text-muted-foreground mt-1 md:mt-2">
              Assessment levels grouped by school and class
            </p>
          </div>
        </div>

        {/* Controls */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
                {/* View Mode Toggle */}
                <div className="flex items-center gap-2">
                  <Label className="whitespace-nowrap">View:</Label>
                  <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
                    <TabsList>
                      <TabsTrigger value="tabular">
                        <TableIcon className="h-4 w-4 mr-2" />
                        Tabular
                      </TabsTrigger>
                      <TabsTrigger value="matrix">
                        <Grid className="h-4 w-4 mr-2" />
                        Matrix
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>

                {/* School View Mode Toggle */}
                <div className="flex items-center gap-2">
                  <Label className="whitespace-nowrap">School View:</Label>
                  <Tabs value={schoolViewMode} onValueChange={(v) => setSchoolViewMode(v as SchoolViewMode)}>
                    <TabsList>
                      <TabsTrigger value="individual">
                        <School className="h-4 w-4 mr-2" />
                        Individual
                      </TabsTrigger>
                      <TabsTrigger value="combined">
                        <Building2 className="h-4 w-4 mr-2" />
                        Combined
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </div>

              {/* School Multi-Select and Block Filter (only in individual mode) */}
              {schoolViewMode === "individual" && (
                <div className="flex flex-col sm:flex-row gap-3 w-full">
                  {/* Block Filter */}
                  {uniqueBlocks.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Label htmlFor="block-select" className="whitespace-nowrap">Block:</Label>
                      <Select value={selectedBlock} onValueChange={setSelectedBlock}>
                        <SelectTrigger id="block-select" className="w-full sm:w-[150px]">
                          <SelectValue placeholder="All Blocks" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Blocks</SelectItem>
                          {uniqueBlocks.map((block) => (
                            <SelectItem key={block} value={block}>
                              {block}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  
                  {/* School Multi-Select */}
                  <div className="flex items-center gap-2 flex-1">
                    <Label className="whitespace-nowrap">Schools:</Label>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full sm:w-[250px] justify-between"
                        >
                          {selectedSchoolIds.size === 0
                            ? "Select schools..."
                            : selectedSchoolIds.size === 1
                            ? schools.find((s) => s._id && selectedSchoolIds.has(s._id))?.name || "1 school selected"
                            : `${selectedSchoolIds.size} schools selected`}
                          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-[300px] p-0" align="start">
                        <div className="p-3 border-b">
                          <div className="relative">
                            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder="Search schools..."
                              value={schoolSearchQuery}
                              onChange={(e) => setSchoolSearchQuery(e.target.value)}
                              className="pl-8"
                            />
                          </div>
                        </div>
                        <ScrollArea className="h-[300px]">
                          <div className="p-1">
                            <DropdownMenuCheckboxItem
                              checked={
                                filteredSchoolsForSelection.length > 0 &&
                                filteredSchoolsForSelection.every(
                                  (s) => s._id && selectedSchoolIds.has(s._id)
                                )
                              }
                              onCheckedChange={(checked) => {
                                const newSet = new Set(selectedSchoolIds);
                                if (checked) {
                                  filteredSchoolsForSelection.forEach((school) => {
                                    if (school._id) newSet.add(school._id);
                                  });
                                } else {
                                  filteredSchoolsForSelection.forEach((school) => {
                                    if (school._id) newSet.delete(school._id);
                                  });
                                }
                                setSelectedSchoolIds(newSet);
                              }}
                              onSelect={(e) => e.preventDefault()}
                            >
                              Select All ({filteredSchoolsForSelection.length})
                            </DropdownMenuCheckboxItem>
                            <DropdownMenuSeparator />
                            {filteredSchoolsForSelection.map((school) => (
                              <DropdownMenuCheckboxItem
                                key={school._id}
                                checked={school._id ? selectedSchoolIds.has(school._id) : false}
                                onCheckedChange={(checked) => {
                                  const newSet = new Set(selectedSchoolIds);
                                  if (school._id) {
                                    if (checked) {
                                      newSet.add(school._id);
                                    } else {
                                      newSet.delete(school._id);
                                    }
                                    setSelectedSchoolIds(newSet);
                                  }}
                                }
                                onSelect={(e) => e.preventDefault()}
                              >
                                {school.name}
                                {school.block && (
                                  <span className="text-xs text-muted-foreground ml-2">
                                    ({school.block})
                                  </span>
                                )}
                              </DropdownMenuCheckboxItem>
                            ))}
                            {filteredSchoolsForSelection.length === 0 && (
                              <div className="p-4 text-center text-sm text-muted-foreground">
                                No schools found
                              </div>
                            )}
                          </div>
                        </ScrollArea>
                        {selectedSchoolIds.size > 0 && (
                          <div className="p-3 border-t flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">
                              {selectedSchoolIds.size} selected
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedSchoolIds(new Set())}
                            >
                              Clear
                            </Button>
                          </div>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Report Content */}
        {viewMode === "tabular" ? (
          renderTabularView(
            schoolViewMode === "combined" 
              ? { combined: { school: { name: "All Schools Combined", _id: "combined" } as SchoolType, classes: combinedData as any } }
              : filteredGroupedData,
            schoolViewMode === "combined"
          )
        ) : (
          renderMatrixView(
            schoolViewMode === "combined" 
              ? { combined: { school: { name: "All Schools Combined", _id: "combined" } as SchoolType, classes: combinedData as any } }
              : filteredGroupedData,
            schoolViewMode === "combined"
          )
        )}

        {/* Summary Stats */}
        {Object.keys(groupedData).length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="text-2xl md:text-3xl font-bold">
                    {Object.keys(groupedData).length}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">Schools</div>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="text-2xl md:text-3xl font-bold">
                    {Object.values(groupedData).reduce(
                      (sum, school) => sum + Object.keys(school.classes).length,
                      0
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">Classes</div>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="text-2xl md:text-3xl font-bold">{students.length}</div>
                  <div className="text-sm text-muted-foreground mt-1">Total Students</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
