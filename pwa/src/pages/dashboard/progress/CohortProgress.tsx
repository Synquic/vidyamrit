import { useState, useEffect } from 'react';
import { useParams } from 'react-router';
import { ArrowLeft, AlertTriangle, CheckCircle, TrendingUp, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { TimelineProgress } from '@/components/progress/TimelineProgress';
import { 
  getCohortProgress, 
  // getStudentsReadyForAssessment,
  CohortProgressData,
  // StudentsReadyData,
  getProgressStatusDescription,
  ProgressStatus 
} from '@/services/progress';
import { toast } from 'sonner';

export default function CohortProgress() {
  const { cohortId } = useParams<{ cohortId: string }>();
  
  const [cohortData, setCohortData] = useState<CohortProgressData | null>(null);
  // const [studentsReady, setStudentsReady] = useState<StudentsReadyData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (cohortId) {
      fetchCohortProgress();
      // TODO: Re-enable when backend endpoint is fixed
      // fetchStudentsReady();
    }
  }, [cohortId]);

  const fetchCohortProgress = async () => {
    try {
      setLoading(true);
      const data = await getCohortProgress(cohortId!);
      setCohortData(data);
    } catch (error) {
      console.error('Error fetching cohort progress:', error);
      toast.error('Failed to load cohort progress');
    } finally {
      setLoading(false);
    }
  };

  /* const fetchStudentsReady = async () => {
    try {
      const data = await getStudentsReadyForAssessment(cohortId!);
      setStudentsReady(data);
    } catch (error) {
      console.error('Error fetching students ready for assessment:', error);
      // Don't show error toast as this is optional functionality
      // Just set to null so the component knows it failed
      setStudentsReady(null);
    }
  }; */

  const getStatusIcon = (status: ProgressStatus) => {
    switch (status) {
      case 'green':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'yellow':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'orange':
        return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      case 'red':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <CheckCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadgeVariant = (status: ProgressStatus) => {
    switch (status) {
      case 'green':
        return 'default';
      case 'yellow':
        return 'secondary';
      case 'orange':
        return 'outline';
      case 'red':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="grid gap-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-6 w-16" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!cohortData) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Cohort not found</p>
        <Button onClick={() => window.location.href = '/progress'} className="mt-4">
          Go Back
        </Button>
      </div>
    );
  }

  const progressCounts = cohortData.studentsProgress.reduce(
    (acc, student) => {
      acc[student.progress.status]++;
      return acc;
    },
    { green: 0, yellow: 0, orange: 0, red: 0 } as Record<ProgressStatus, number>
  );

  const levelDistribution = cohortData.studentsProgress.reduce((acc, student) => {
    const level = student.progress.currentLevel;
    acc[level] = (acc[level] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => window.location.href = '/progress'}
          className="p-2"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <TrendingUp className="h-6 w-6" />
            {cohortData.cohort.name} Progress
          </h1>
          <div className="space-y-1">
            <p className="text-gray-600">
              {cohortData.cohort.school?.name || 'School not assigned'} • {cohortData.studentsProgress.length} students
            </p>
            {/* Program Information */}
            {cohortData.cohort.program && (
              <div className="flex items-center gap-2">
                <Badge variant="default" className="text-xs">
                  {cohortData.cohort.program.subject} Program
                </Badge>
                <span className="text-sm text-gray-500">
                  {cohortData.cohort.program.name}
                </span>
                <span className="text-xs text-gray-400">
                  ({cohortData.cohort.program.totalLevels} levels)
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">On Track</p>
                <p className="text-2xl font-bold text-green-600">{progressCounts.green}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm text-gray-600">Need Support</p>
                <p className="text-2xl font-bold text-yellow-600">{progressCounts.yellow}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">Struggling</p>
                <p className="text-2xl font-bold text-orange-600">{progressCounts.orange}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm text-gray-600">Urgent</p>
                <p className="text-2xl font-bold text-red-600">{progressCounts.red}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Program Timeline & Time Tracking */}
      {cohortData.timeTracking ? (
        <TimelineProgress
          timeTracking={cohortData.timeTracking}
          programName={cohortData.cohort.program?.name}
        />
      ) : cohortData.cohort.program ? (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="text-center py-8">
            <Clock className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
            <p className="text-yellow-700 text-lg font-medium">
              Enhanced Time Tracking Available
            </p>
            <p className="text-yellow-600 text-sm mt-2">
              Backend implementation required for program timeline and assessment scheduling features.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-gray-200 bg-gray-50">
          <CardContent className="text-center py-8">
            <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-700 text-lg font-medium">
              No Program Assigned
            </p>
            <p className="text-gray-600 text-sm mt-2">
              Assign a program to this cohort to enable time-based progress tracking.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Students Ready for Assessment - Temporarily Disabled Due to Backend Issue 
      {false && studentsReady && studentsReady.totalReady > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              Students Ready for Assessment
              <Badge variant="default" className="bg-blue-600">
                {studentsReady?.totalReady || 0}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              {studentsReady?.studentsReady?.slice(0, 3).map((student) => (
                <div key={student.student._id} className="flex items-center justify-between p-2 bg-white rounded border">
                  <div>
                    <p className="font-medium">{student.student.name}</p>
                    <p className="text-sm text-gray-600">
                      Level {student.progress.currentLevel} → {student.nextLevel} • {student.daysInCurrentLevel} days
                    </p>
                  </div>
                  <Button size="sm" variant="outline">
                    Assess
                  </Button>
                </div>
              )) || []}
              {(studentsReady?.totalReady || 0) > 3 && (
                <p className="text-sm text-gray-600 text-center mt-2">
                  +{(studentsReady?.totalReady || 0) - 3} more students ready
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
      */}

      {/* Level Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Level Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {Object.entries(levelDistribution).map(([level, count]) => (
              <Badge key={level} variant="secondary" className="px-3 py-1">
                Level {level}: {count} students
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Student Progress List */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-900">Student Progress</h2>
        {cohortData.studentsProgress.map((studentData) => {
          const { student, progress } = studentData;
          
          return (
            <Card key={student._id} className={`transition-colors ${
              progress.status === 'green' ? 'border-green-200' :
              progress.status === 'yellow' ? 'border-yellow-200' :
              progress.status === 'orange' ? 'border-orange-200' :
              progress.status === 'red' ? 'border-red-200' :
              'border-gray-200'
            }`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(progress.status)}
                    <div>
                      <h3 className="font-medium text-gray-900">{student.name}</h3>
                      <p className="text-sm text-gray-600">
                        Roll No: {student.roll_no} • Class: {student.class}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm font-medium">Level {progress.currentLevel}</p>
                      {progress.failureCount > 0 && (
                        <p className="text-xs text-gray-500">
                          {progress.failureCount} failure{progress.failureCount > 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                    
                    <Badge variant={getStatusBadgeVariant(progress.status)}>
                      {progress.status.toUpperCase()}
                    </Badge>
                    
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => {
                        // Navigate to student detail view
                        window.location.href = `/progress/cohort/${cohortId}/student/${student._id}`;
                      }}
                    >
                      View Details
                    </Button>
                  </div>
                </div>
                
                {/* Status Description */}
                <div className="mt-3 p-2 bg-gray-50 rounded text-sm text-gray-600">
                  {getProgressStatusDescription(progress.status)}
                </div>
                
                {/* Last Update */}
                {progress.lastUpdated && (
                  <div className="mt-2 text-xs text-gray-500">
                    Last updated: {new Date(progress.lastUpdated).toLocaleDateString()}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}