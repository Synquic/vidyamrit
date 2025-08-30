"use client";

import { useState, useEffect } from "react";
import {
  getAssessmentQuestionSets,
  AssessmentQuestionSet,
} from "@/services/assessmentQuestionSets";
import { Button } from "@/components/ui/button";
import { BaselineAssessmentModal } from "@/components/BaselineAssessment";

export default function BaselineAssessmentsPage() {
  const [questionSets, setQuestionSets] = useState<AssessmentQuestionSet[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);

  useEffect(() => {
    fetchQuestionSets();
  }, []);

  const fetchQuestionSets = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAssessmentQuestionSets();
      setQuestionSets(data);
    } catch {
      setError("Failed to fetch question sets");
    } finally {
      setLoading(false);
    }
  };

  const handleStartTest = (subject: string) => {
    setSelectedSubject(subject);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedSubject(null);
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <h1 className="text-2xl font-bold mb-4">Baseline Assessments</h1>
      {loading && <p>Loading...</p>}
      {error && <p className="text-red-600">{error}</p>}
      <div className="space-y-4">
        {questionSets.map((set) => (
          <div
            key={set._id}
            className="border rounded p-4 flex justify-between items-center"
          >
            <div>
              <h2 className="text-lg font-semibold">
                {set.subject} (v{set.version})
              </h2>
              <p className="text-sm text-muted-foreground">
                Levels: {set.levels.length}
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => handleStartTest(set.subject)}
            >
              Start {set.subject} Test
            </Button>
          </div>
        ))}
      </div>
      {modalOpen && (
        <BaselineAssessmentModal
          isOpen={modalOpen}
          onClose={handleCloseModal}
          questionSets={questionSets}
          selectedSubject={selectedSubject}
        />
      )}
    </div>
  );
}
