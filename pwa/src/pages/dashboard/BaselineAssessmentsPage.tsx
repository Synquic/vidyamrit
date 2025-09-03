"use client";

import { useState, useEffect } from "react";
import {
  getAssessmentQuestionSets,
  AssessmentQuestionSet,
} from "@/services/assessmentQuestionSets";
// import { Button } from "@/components/ui/button";
import { BaselineAssessmentModal } from "@/components/BaselineAssessment";
import { getStudents, Student } from "@/services/students";

export default function BaselineAssessmentsPage() {
  const [questionSets, setQuestionSets] = useState<AssessmentQuestionSet[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    fetchQuestionSets();
    fetchStudents();
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

  const fetchStudents = async () => {
    try {
      const data = await getStudents();
      setStudents(data);
    } catch {
      setError("Failed to fetch students");
    }
  };

  // const handleStartTest = (_subject: string) => {
  //   if (!selectedStudent) {
  //     setError("Please select a student first.");
  //     return;
  //   }
  //   setModalOpen(true);
  // };

  const handleCloseModal = () => {
    setModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <h1 className="text-2xl font-bold mb-4">Baseline Assessments</h1>
      {loading && <p>Loading...</p>}
      {error && <p className="text-red-600">{error}</p>}
      <div className="mb-4">
        <label className="block mb-2 font-medium">Select Student:</label>
        <select
          className="border rounded px-2 py-1 w-full max-w-md"
          value={selectedStudent?._id || ""}
          onChange={(e) => {
            const student = students.find((s) => s._id === e.target.value);
            setSelectedStudent(student || null);
            if (student) setModalOpen(true);
          }}
        >
          <option value="">-- Select --</option>
          {students.map((student) => (
            <option key={student._id} value={student._id}>
              {student.name}
            </option>
          ))}
        </select>
      </div>
      {/* Optionally, you can keep the question set list for info, but remove the start button since test starts on student select */}
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
          </div>
        ))}
      </div>
      {modalOpen && selectedStudent && (
        <BaselineAssessmentModal
          isOpen={modalOpen}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}
