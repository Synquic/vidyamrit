"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Clock, Plus } from "lucide-react";
import { toast } from "sonner";
import {
  extendLevelDuration,
  markDayCompleted,
  unmarkDay,
  markLevelComplete,
} from "@/services/cohorts";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";

interface LevelProgress {
  originalDaysRequired: number;
  adjustedDaysRequired: number;
  completedDays: number;
  completedDates: string[];
  isCompleted: boolean;
  completedAt?: string;
  lastUpdated: string;
}

interface LevelDurationTrackerProps {
  cohortId: string;
  currentLevel: number;
  levelInfo: {
    levelNumber: number;
    title: string;
    timeframe: number;
    timeframeUnit: string;
  };
  levelProgress?: LevelProgress;
  levelStartDate?: string; // Start date for current level
  onExtend?: () => void;
  onMarkDay?: () => void;
  onMarkComplete?: () => void;
}

export function LevelDurationTracker({
  cohortId,
  currentLevel,
  levelInfo,
  levelProgress,
  levelStartDate,
  onExtend,
  onMarkDay,
  onMarkComplete,
}: LevelDurationTrackerProps) {
  const [isExtendModalOpen, setIsExtendModalOpen] = useState(false);
  const [additionalDays, setAdditionalDays] = useState<string>("");
  const [reason, setReason] = useState("");
  const [isMarking, setIsMarking] = useState(false);
  const queryClient = useQueryClient();

  const progress = levelProgress || {
    originalDaysRequired: levelInfo.timeframeUnit === "weeks" 
      ? levelInfo.timeframe * 6 
      : levelInfo.timeframeUnit === "days"
      ? levelInfo.timeframe
      : levelInfo.timeframe * 30,
    adjustedDaysRequired: levelInfo.timeframeUnit === "weeks"
      ? levelInfo.timeframe * 6
      : levelInfo.timeframeUnit === "days"
      ? levelInfo.timeframe
      : levelInfo.timeframe * 30,
    completedDays: 0,
    completedDates: [],
    isCompleted: false,
    lastUpdated: new Date().toISOString(),
  };

  const completionPercentage =
    progress.adjustedDaysRequired > 0
      ? (progress.completedDays / progress.adjustedDaysRequired) * 100
      : 0;

  const isAdjusted = progress.adjustedDaysRequired > progress.originalDaysRequired;
  const daysDifference = progress.adjustedDaysRequired - progress.originalDaysRequired;

  const handleExtendLevel = async () => {
    const days = parseInt(additionalDays);
    if (!days || days <= 0) {
      toast.error("Please enter a valid number of days");
      return;
    }

    setIsMarking(true);
    try {
      await extendLevelDuration(cohortId, days, reason || undefined);
      toast.success(`Level ${currentLevel} extended by ${days} days`);
      setIsExtendModalOpen(false);
      setAdditionalDays("");
      setReason("");
      queryClient.invalidateQueries({ queryKey: ["cohort-progress", cohortId] });
      queryClient.invalidateQueries({ queryKey: ["assessment-readiness", cohortId] });
      onExtend?.();
    } catch (error: any) {
      toast.error(error?.response?.data?.error || "Failed to extend level duration");
    } finally {
      setIsMarking(false);
    }
  };

  const handleMarkDay = async (date: Date) => {
    try {
      await markDayCompleted(cohortId, date.toISOString(), currentLevel);
      toast.success("Day marked as completed");
      queryClient.invalidateQueries({ queryKey: ["cohort-progress", cohortId] });
      queryClient.invalidateQueries({ queryKey: ["assessment-readiness", cohortId] });
      onMarkDay?.();
    } catch (error: any) {
      toast.error(error?.response?.data?.error || "Failed to mark day");
    }
  };

  const handleUnmarkDay = async (date: Date) => {
    try {
      await unmarkDay(cohortId, date.toISOString(), currentLevel);
      toast.success("Day unmarked");
      queryClient.invalidateQueries({ queryKey: ["cohort-progress", cohortId] });
      queryClient.invalidateQueries({ queryKey: ["assessment-readiness", cohortId] });
      onMarkDay?.();
    } catch (error: any) {
      toast.error(error?.response?.data?.error || "Failed to unmark day");
    }
  };

  const handleMarkComplete = async () => {
    if (progress.completedDays < progress.adjustedDaysRequired) {
      toast.error(
        `Cannot mark complete. Only ${progress.completedDays} of ${progress.adjustedDaysRequired} days completed.`
      );
      return;
    }

    setIsMarking(true);
    try {
      await markLevelComplete(cohortId, currentLevel);
      toast.success(`Level ${currentLevel} marked as complete!`);
      queryClient.invalidateQueries({ queryKey: ["cohort-progress", cohortId] });
      queryClient.invalidateQueries({ queryKey: ["assessment-readiness", cohortId] });
      queryClient.invalidateQueries({ queryKey: ["cohorts"] });
      onMarkComplete?.();
    } catch (error: any) {
      toast.error(error?.response?.data?.error || "Failed to mark level as complete");
    } finally {
      setIsMarking(false);
    }
  };

  // Generate list of teaching days for current level
  const getTeachingDays = () => {
    const days: Date[] = [];
    const startDate = levelStartDate 
      ? new Date(levelStartDate) 
      : new Date(); // Fallback to current date if not provided
    let currentDate = new Date(startDate);
    currentDate.setHours(0, 0, 0, 0);
    let dayCount = 0;

    while (dayCount < progress.adjustedDaysRequired) {
      // Skip Sundays
      if (currentDate.getDay() !== 0) {
        days.push(new Date(currentDate));
        dayCount++;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return days;
  };

  const teachingDays = getTeachingDays();
  const completedDatesSet = new Set(
    progress.completedDates.map((d) => new Date(d).toISOString().split("T")[0])
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Level {currentLevel} Duration Management</span>
          {progress.isCompleted && (
            <Badge variant="default" className="bg-green-600">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Completed
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Summary */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">
              {progress.completedDays} of {progress.adjustedDaysRequired} days completed
            </span>
          </div>
          <Progress value={completionPercentage} className="h-2" />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{completionPercentage.toFixed(0)}% complete</span>
            {progress.adjustedDaysRequired > progress.completedDays && (
              <span>
                {progress.adjustedDaysRequired - progress.completedDays} days remaining
              </span>
            )}
          </div>
        </div>

        {/* Duration Info */}
        <div className="flex items-center gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Original Duration: </span>
            <span className="font-medium">
              {progress.originalDaysRequired} days (
              {(progress.originalDaysRequired / 6).toFixed(1)} weeks)
            </span>
          </div>
          {isAdjusted && (
            <div>
              <span className="text-muted-foreground">Adjusted Duration: </span>
              <span className="font-medium text-orange-600">
                {progress.adjustedDaysRequired} days (
                {(progress.adjustedDaysRequired / 6).toFixed(1)} weeks)
              </span>
              <Badge variant="outline" className="ml-2 text-xs">
                +{daysDifference} days
              </Badge>
            </div>
          )}
        </div>

        {/* Actions */}
        {!progress.isCompleted && (
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExtendModalOpen(true)}
              disabled={isMarking}
            >
              <Plus className="h-4 w-4 mr-2" />
              Extend Level
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleMarkComplete}
              disabled={
                isMarking || progress.completedDays < progress.adjustedDaysRequired
              }
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Mark Level Complete
            </Button>
          </div>
        )}

        {/* Teaching Days List */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Teaching Days</Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 max-h-48 overflow-y-auto border rounded-md p-3">
            {teachingDays.map((day, index) => {
              const dayStr = day.toISOString().split("T")[0];
              const isCompleted = completedDatesSet.has(dayStr);
              const isPast = day < new Date();
              const isToday =
                day.toISOString().split("T")[0] === new Date().toISOString().split("T")[0];

              return (
                <button
                  key={index}
                  onClick={() => {
                    if (isCompleted) {
                      handleUnmarkDay(day);
                    } else {
                      handleMarkDay(day);
                    }
                  }}
                  className={`p-2 rounded-md border text-xs text-center transition-colors ${
                    isCompleted
                      ? "bg-green-100 border-green-300 text-green-700"
                      : isToday
                      ? "bg-blue-50 border-blue-300 text-blue-700"
                      : isPast
                      ? "bg-gray-50 border-gray-200 text-gray-600"
                      : "bg-white border-gray-200 text-gray-400"
                  }`}
                  disabled={isMarking}
                >
                  <div className="font-medium">
                    {format(day, "MMM d")}
                  </div>
                  <div className="text-xs mt-1">
                    {isCompleted ? (
                      <CheckCircle2 className="h-3 w-3 mx-auto text-green-600" />
                    ) : (
                      <Clock className="h-3 w-3 mx-auto text-gray-400" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </CardContent>

      {/* Extend Level Modal */}
      <Dialog open={isExtendModalOpen} onOpenChange={setIsExtendModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Extend Level {currentLevel} Duration</DialogTitle>
            <DialogDescription>
              Add additional days to the current level. This will push the next level's start date accordingly.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="additionalDays">Additional Days</Label>
              <Input
                id="additionalDays"
                type="number"
                min="1"
                value={additionalDays}
                onChange={(e) => setAdditionalDays(e.target.value)}
                placeholder="Enter number of days"
              />
              <p className="text-xs text-muted-foreground">
                This will extend Level {currentLevel} by {additionalDays || 0} days and push Level{" "}
                {currentLevel + 1} start date by the same amount.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason">Reason (Optional)</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Why is this extension needed?"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsExtendModalOpen(false);
                setAdditionalDays("");
                setReason("");
              }}
              disabled={isMarking}
            >
              Cancel
            </Button>
            <Button onClick={handleExtendLevel} disabled={isMarking || !additionalDays}>
              {isMarking ? "Extending..." : "Extend Level"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

