import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, Clock, Calendar, Target } from 'lucide-react';

interface TimelineProgressProps {
  timeTracking: {
    cohortStartDate: string;
    estimatedCompletionDate: string;
    totalDurationWeeks: number;
    elapsedWeeks: number;
    remainingWeeks: number;
    nextAssessmentDue: string;
    daysUntilNextAssessment: number;
    currentLevelTimeframe?: {
      level: number;
      durationWeeks: number;
      startDate: string;
      endDate: string;
    };
  };
  programName?: string;
}

export function TimelineProgress({ timeTracking, programName }: TimelineProgressProps) {
  const overallProgress = Math.min(100, (timeTracking.elapsedWeeks / timeTracking.totalDurationWeeks) * 100);
  const currentLevelProgress = timeTracking.currentLevelTimeframe 
    ? Math.min(100, (timeTracking.elapsedWeeks / timeTracking.currentLevelTimeframe.durationWeeks) * 100)
    : 0;

  const getAssessmentUrgency = (days: number) => {
    if (days < 0) return { color: 'red', text: 'Overdue', icon: AlertTriangle };
    if (days <= 3) return { color: 'red', text: 'Due Soon', icon: AlertTriangle };
    if (days <= 7) return { color: 'orange', text: 'Approaching', icon: Clock };
    return { color: 'green', text: 'Scheduled', icon: CheckCircle };
  };

  const urgency = getAssessmentUrgency(timeTracking.daysUntilNextAssessment);
  const UrgencyIcon = urgency.icon;

  return (
    <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
      <CardHeader className="pb-3">
        <CardTitle className="text-base sm:text-lg flex flex-col sm:flex-row items-start sm:items-center gap-2">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 flex-shrink-0" />
            <span className="truncate">Program Timeline Progress</span>
          </div>
          <Badge variant="outline" className="ml-0 sm:ml-auto self-start sm:self-auto">
            {programName || 'Program'}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Overall Program Progress */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <h3 className="font-medium text-sm sm:text-base text-gray-900">Overall Program Progress</h3>
            <span className="text-xs sm:text-sm font-medium text-blue-600">
              {overallProgress.toFixed(1)}% Complete
            </span>
          </div>
          
          <div className="space-y-2">
            <Progress 
              value={overallProgress} 
              className="h-3 bg-blue-100" 
              style={{
                '--progress-foreground': 'linear-gradient(to right, #3b82f6, #6366f1)',
              } as React.CSSProperties}
            />
            
            <div className="flex justify-between text-sm text-gray-600">
              <span>{timeTracking.elapsedWeeks} weeks elapsed</span>
              <span>{timeTracking.remainingWeeks} weeks remaining</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 text-center">
            <div className="p-2 sm:p-3 bg-white rounded border">
              <p className="text-xs text-gray-500">Start Date</p>
              <p className="font-medium text-xs sm:text-sm">
                {new Date(timeTracking.cohortStartDate).toLocaleDateString()}
              </p>
            </div>
            <div className="p-2 sm:p-3 bg-white rounded border">
              <p className="text-xs text-gray-500">Total Duration</p>
              <p className="font-medium text-xs sm:text-sm">{timeTracking.totalDurationWeeks} weeks</p>
            </div>
            <div className="p-2 sm:p-3 bg-white rounded border">
              <p className="text-xs text-gray-500">Est. Completion</p>
              <p className="font-medium text-xs sm:text-sm">
                {new Date(timeTracking.estimatedCompletionDate).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Current Level Progress */}
        {timeTracking.currentLevelTimeframe && (
          <div className="space-y-3 pt-4 border-t border-blue-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <h3 className="font-medium text-sm sm:text-base text-gray-900">
                Current Level {timeTracking.currentLevelTimeframe.level} Progress
              </h3>
              <span className="text-xs sm:text-sm font-medium text-indigo-600">
                {currentLevelProgress.toFixed(1)}%
              </span>
            </div>
            
            <Progress 
              value={currentLevelProgress} 
              className="h-2 bg-indigo-100"
              style={{
                '--progress-foreground': 'linear-gradient(to right, #10b981, #3b82f6)',
              } as React.CSSProperties}
            />
            
            <div className="text-xs sm:text-sm text-gray-600">
              Duration: {timeTracking.currentLevelTimeframe.durationWeeks} weeks
            </div>
          </div>
        )}

        {/* Assessment Schedule */}
        <div className={`p-4 rounded-lg border space-y-3 ${
          urgency.color === 'red' ? 'bg-red-50 border-red-200' :
          urgency.color === 'orange' ? 'bg-orange-50 border-orange-200' :
          'bg-green-50 border-green-200'
        }`}>
          <div className="flex items-center gap-2">
            <UrgencyIcon className={`h-4 w-4 ${
              urgency.color === 'red' ? 'text-red-600' :
              urgency.color === 'orange' ? 'text-orange-600' :
              'text-green-600'
            }`} />
            <h3 className={`font-medium text-sm sm:text-base ${
              urgency.color === 'red' ? 'text-red-900' :
              urgency.color === 'orange' ? 'text-orange-900' :
              'text-green-900'
            }`}>
              Next Assessment - {urgency.text}
            </h3>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
            <div>
              <p className={`${
                urgency.color === 'red' ? 'text-red-600' :
                urgency.color === 'orange' ? 'text-orange-600' :
                'text-green-600'
              }`}>
                Due Date:
              </p>
              <p className={`font-medium ${
                urgency.color === 'red' ? 'text-red-900' :
                urgency.color === 'orange' ? 'text-orange-900' :
                'text-green-900'
              }`}>
                {new Date(timeTracking.nextAssessmentDue).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className={`${
                urgency.color === 'red' ? 'text-red-600' :
                urgency.color === 'orange' ? 'text-orange-600' :
                'text-green-600'
              }`}>
                Days Remaining:
              </p>
              <p className={`font-medium ${
                urgency.color === 'red' ? 'text-red-900' :
                urgency.color === 'orange' ? 'text-orange-900' :
                'text-green-900'
              }`}>
                {timeTracking.daysUntilNextAssessment > 0 ? timeTracking.daysUntilNextAssessment : 'Overdue'}
              </p>
            </div>
          </div>

          {/* Action based on urgency */}
          {urgency.color === 'red' && (
            <div className="mt-3 p-2 sm:p-3 bg-red-100 rounded border border-red-200">
              <p className="text-xs sm:text-sm text-red-800 font-medium">
                🚨 Action Required: Schedule assessment immediately or update progress
              </p>
            </div>
          )}
          
          {urgency.color === 'orange' && (
            <div className="mt-3 p-2 sm:p-3 bg-orange-100 rounded border border-orange-200">
              <p className="text-xs sm:text-sm text-orange-800 font-medium">
                ⚠️ Reminder: Assessment due within a week - prepare students
              </p>
            </div>
          )}
        </div>

        {/* Attendance-based Progress Note */}
        <div className="text-xs text-gray-500 italic bg-white p-3 rounded border">
          <Calendar className="h-3 w-3 inline mr-1" />
          Progress updates automatically based on daily attendance recording. 
          Each teaching day advances the timeline toward assessment readiness.
        </div>
      </CardContent>
    </Card>
  );
}

export default TimelineProgress;