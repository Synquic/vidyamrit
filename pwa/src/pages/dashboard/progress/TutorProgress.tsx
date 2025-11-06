import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { TrendingUp, Users, AlertTriangle, CheckCircle, Target, Clock, Timer } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { getTutorProgressSummary, TutorProgressSummary } from '@/services/progress';
import { TimelineProgress } from '@/components/progress/TimelineProgress';
import { toast } from 'sonner';

export default function TutorProgress() {
  const { t } = useTranslation();
  const [progressSummary, setProgressSummary] = useState<TutorProgressSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProgressSummary();
  }, []);

  const fetchProgressSummary = async () => {
    try {
      setLoading(true);
      const data = await getTutorProgressSummary();
      setProgressSummary(data);
    } catch (error) {
      console.error('Error fetching progress summary:', error);
      toast.error('Failed to load progress summary');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
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
        return <Target className="h-4 w-4 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-9 w-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const totalStudents = progressSummary.reduce((sum, s) => sum + s.summary.totalStudents, 0);
  const overallProgressCounts = progressSummary.reduce(
    (acc, summary) => {
      acc.green += summary.summary.progressCounts.green;
      acc.yellow += summary.summary.progressCounts.yellow;
      acc.orange += summary.summary.progressCounts.orange;
      acc.red += summary.summary.progressCounts.red;
      return acc;
    },
    { green: 0, yellow: 0, orange: 0, red: 0 }
  );

  // Calculate time-based metrics
  const timeMetrics = progressSummary.reduce(
    (acc, summary) => {
      if (summary.timeTracking) {
        acc.totalCohorts += 1;
        acc.cohortsNearingAssessment += summary.timeTracking.daysUntilNextAssessment <= 7 ? 1 : 0;
        acc.cohortsOverdue += summary.timeTracking.daysUntilNextAssessment < 0 ? 1 : 0;
        acc.averageProgress += (summary.timeTracking.elapsedWeeks / summary.timeTracking.totalDurationWeeks) * 100;
      }
      return acc;
    },
    { totalCohorts: 0, cohortsNearingAssessment: 0, cohortsOverdue: 0, averageProgress: 0 }
  );
  
  if (timeMetrics.totalCohorts > 0) {
    timeMetrics.averageProgress = timeMetrics.averageProgress / timeMetrics.totalCohorts;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <TrendingUp className="h-6 w-6" />
          {t('progress.title')}
        </h1>
        <p className="text-gray-600 mt-1">
          {t('progress.subtitle')}
        </p>
      </div>

      {/* Overall Summary */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total Students</p>
                <p className="text-2xl font-bold text-blue-600">{totalStudents}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">On Track</p>
                <p className="text-2xl font-bold text-green-600">{overallProgressCounts.green}</p>
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
                <p className="text-2xl font-bold text-yellow-600">
                  {overallProgressCounts.yellow + overallProgressCounts.orange}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Timer className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">Assessment Soon</p>
                <p className="text-2xl font-bold text-orange-600">{timeMetrics.cohortsNearingAssessment}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm text-gray-600">Urgent Attention</p>
                <p className="text-2xl font-bold text-red-600">{overallProgressCounts.red}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Time-based Overview */}
      {timeMetrics.totalCohorts > 0 && (
        <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-indigo-600" />
              Program Timeline Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="text-center">
                <p className="text-2xl font-bold text-indigo-600">
                  {timeMetrics.averageProgress.toFixed(1)}%
                </p>
                <p className="text-sm text-gray-600">Average Progress</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">
                  {timeMetrics.cohortsNearingAssessment}
                </p>
                <p className="text-sm text-gray-600">Assessments Due (7 days)</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">
                  {timeMetrics.cohortsOverdue}
                </p>
                <p className="text-sm text-gray-600">Overdue Assessments</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cohort Progress Cards */}
      {progressSummary.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">
              {t('progress.noCohorts')}
            </p>
            <p className="text-gray-400 text-sm mt-2">
              {t('progress.noCohortsDescription')}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {progressSummary.map((summary) => {
            const progressPercentage = summary.summary.totalStudents > 0 
              ? (summary.summary.progressCounts.green / summary.summary.totalStudents) * 100 
              : 0;

            return (
              <Card key={summary.cohort._id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center justify-between">
                    <span className="truncate">{summary.cohort.name}</span>
                    <Badge variant="outline" className="ml-2">
                      {summary.summary.totalStudents} students
                    </Badge>
                  </CardTitle>
                  <div className="space-y-1">
                    <p className="text-sm text-gray-600">
                      {summary.cohort.school?.name || 'School not assigned'}
                    </p>
                    {/* Program Information */}
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {summary.cohort.program?.subject || 'No Program'} Program
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {summary.cohort.program?.totalLevels || 0} Levels
                      </span>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Enhanced Time Tracking Section */}
                  {summary.timeTracking ? (
                    <TimelineProgress
                      timeTracking={{
                        ...summary.timeTracking,
                        currentLevelTimeframe: summary.timeTracking.currentLevelTimeframe || undefined
                      }}
                      programName={summary.cohort.program?.name}
                    />
                  ) : (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
                      <p className="text-sm text-gray-600">
                        ⏱️ Enhanced time tracking available when program is assigned
                      </p>
                    </div>
                  )}

                  {!summary.timeTracking && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
                      <p className="text-sm text-gray-600">
                        ⏱️ Enhanced time tracking coming soon
                      </p>
                    </div>
                  )}

                  {/* Progress Bar */}
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600">Students on track</span>
                      <span className="font-medium">{progressPercentage.toFixed(0)}%</span>
                    </div>
                    <Progress value={progressPercentage} className="h-2" />
                  </div>

                  {/* Status Distribution */}
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      {getStatusIcon('green')}
                      <span>Green: {summary.summary.progressCounts.green}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon('yellow')}
                      <span>Yellow: {summary.summary.progressCounts.yellow}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon('orange')}
                      <span>Orange: {summary.summary.progressCounts.orange}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon('red')}
                      <span>Red: {summary.summary.progressCounts.red}</span>
                    </div>
                  </div>

                  {/* Level Distribution */}
                  {Object.keys(summary.summary.levelDistribution).length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Level Distribution</p>
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(summary.summary.levelDistribution).map(([level, count]) => (
                          <Badge key={level} variant="secondary" className="text-xs">
                            L{level}: {count}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Attention Alert */}
                  {summary.summary.studentsNeedingAttention > 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                        <span className="text-sm text-yellow-700">
                          {summary.summary.studentsNeedingAttention} students need attention
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Action Button */}
                  <Button 
                    className="w-full"
                    variant={summary.summary.studentsNeedingAttention > 0 ? "default" : "outline"}
                    onClick={() => window.location.href = `/progress/cohort/${summary.cohort._id}`}
                  >
                    {t('progress.viewDetails')}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}