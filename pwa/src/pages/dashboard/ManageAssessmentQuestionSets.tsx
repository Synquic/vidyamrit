import React, { useEffect, useState } from "react";
import {
  getAssessmentQuestionSets,
  createAssessmentQuestionSet,
  updateAssessmentQuestionSet,
  deleteAssessmentQuestionSet,
  AssessmentQuestionSet,
  CreateAssessmentQuestionSetDTO,
  UpdateAssessmentQuestionSetDTO,
} from "@/services/assessmentQuestionSets";
import { Button } from "@/components/ui/button";

function emptyLevel(levelNum: number) {
  return {
    level: levelNum,
    title: "",
    instructions: "",
    questions: [{ question: "", options: [], correct_answer: "" }],
  };
}

export default function ManageAssessmentQuestionSetsPage() {
  const [questionSets, setQuestionSets] = useState<AssessmentQuestionSet[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<CreateAssessmentQuestionSetDTO>({
    subject: "",
    version: 1,
    levels: [emptyLevel(1)],
  });

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

  const handleOpenModal = (set?: AssessmentQuestionSet) => {
    if (set) {
      setEditId(set._id);
      setForm({
        subject: set.subject,
        version: set.version,
        levels: set.levels.map((lvl) => ({
          ...lvl,
          questions: lvl.questions.map((q) => ({ ...q })),
        })),
      });
    } else {
      setEditId(null);
      setForm({ subject: "", version: 1, levels: [emptyLevel(1)] });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditId(null);
    setForm({ subject: "", version: 1, levels: [emptyLevel(1)] });
  };

  const handleFormChange = (field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleLevelChange = (idx: number, field: string, value: any) => {
    setForm((prev) => {
      const levels = [...prev.levels];
      levels[idx] = { ...levels[idx], [field]: value };
      return { ...prev, levels };
    });
  };

  const handleQuestionChange = (
    levelIdx: number,
    qIdx: number,
    field: string,
    value: any
  ) => {
    setForm((prev) => {
      const levels = [...prev.levels];
      const questions = [...levels[levelIdx].questions];
      questions[qIdx] = { ...questions[qIdx], [field]: value };
      levels[levelIdx].questions = questions;
      return { ...prev, levels };
    });
  };

  const handleAddLevel = () => {
    setForm((prev) => ({
      ...prev,
      levels: [...prev.levels, emptyLevel(prev.levels.length + 1)],
    }));
  };

  const handleAddQuestion = (levelIdx: number) => {
    setForm((prev) => {
      const levels = [...prev.levels];
      levels[levelIdx].questions.push({
        question: "",
        options: [],
        correct_answer: "",
      });
      return { ...prev, levels };
    });
  };

  const handleRemoveLevel = (idx: number) => {
    setForm((prev) => ({
      ...prev,
      levels: prev.levels.filter((_, i) => i !== idx),
    }));
  };

  const handleRemoveQuestion = (levelIdx: number, qIdx: number) => {
    setForm((prev) => {
      const levels = [...prev.levels];
      levels[levelIdx].questions = levels[levelIdx].questions.filter(
        (_, i) => i !== qIdx
      );
      return { ...prev, levels };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editId) {
        await updateAssessmentQuestionSet(
          editId,
          form as UpdateAssessmentQuestionSetDTO
        );
      } else {
        await createAssessmentQuestionSet(form);
      }
      fetchQuestionSets();
      handleCloseModal();
    } catch {
      setError("Failed to save question set");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">
        Manage Assessment Question Sets
      </h1>
      {loading && <p>Loading...</p>}
      {error && <p className="text-red-600">{error}</p>}
      <div className="space-y-4">
        {questionSets.map((set) => (
          <div key={set._id} className="border rounded p-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold">
                  {set.subject} (v{set.version})
                </h2>
                <p className="text-sm text-muted-foreground">
                  Levels: {set.levels.length}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenModal(set)}
                >
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() =>
                    deleteAssessmentQuestionSet(set._id).then(fetchQuestionSets)
                  }
                >
                  Delete
                </Button>
              </div>
            </div>
            <div className="mt-2">
              {set.levels.map((level) => (
                <div key={level.level} className="mb-2">
                  <strong>Level {level.level}: </strong>
                  {level.title}
                  <div className="text-xs text-muted-foreground">
                    {level.instructions}
                  </div>
                  <div className="ml-4">
                    {level.questions.map((q, idx) => (
                      <div key={idx} className="mb-1">
                        <span>{q.question}</span>
                        {q.options && q.options.length > 0 && (
                          <span className="ml-2">
                            Options: {q.options.join(", ")}
                          </span>
                        )}
                        {q.correct_answer && (
                          <span className="ml-2">
                            Answer: {q.correct_answer}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6">
        <Button variant="outline" onClick={() => handleOpenModal()}>
          Add New Question Set
        </Button>
      </div>
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
          <form
            className="bg-white rounded-lg p-6 w-full max-w-2xl space-y-4 overflow-y-auto max-h-[90vh]"
            onSubmit={handleSubmit}
          >
            <h2 className="text-xl font-bold mb-2">
              {editId ? "Edit" : "Add"} Assessment Question Set
            </h2>
            <div className="space-y-2">
              <label className="block font-medium">Subject</label>
              <input
                className="border rounded px-2 py-1 w-full"
                value={form.subject}
                onChange={(e) => handleFormChange("subject", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="block font-medium">Version</label>
              <input
                type="number"
                className="border rounded px-2 py-1 w-full"
                value={form.version}
                onChange={(e) =>
                  handleFormChange("version", Number(e.target.value))
                }
                min={1}
                required
              />
            </div>
            <div className="space-y-4">
              <label className="block font-medium">Levels</label>
              {form.levels.map((level, idx) => (
                <div key={idx} className="border rounded p-3 mb-2">
                  <div className="flex gap-2 items-center mb-2">
                    <input
                      type="number"
                      className="border rounded px-2 py-1 w-20"
                      value={level.level}
                      onChange={(e) =>
                        handleLevelChange(idx, "level", Number(e.target.value))
                      }
                      min={1}
                      required
                    />
                    <input
                      className="border rounded px-2 py-1 flex-1"
                      placeholder="Title"
                      value={level.title}
                      onChange={(e) =>
                        handleLevelChange(idx, "title", e.target.value)
                      }
                      required
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveLevel(idx)}
                      type="button"
                    >
                      Remove Level
                    </Button>
                  </div>
                  <textarea
                    className="border rounded px-2 py-1 w-full mb-2"
                    placeholder="Instructions"
                    value={level.instructions}
                    onChange={(e) =>
                      handleLevelChange(idx, "instructions", e.target.value)
                    }
                    required
                  />
                  <div className="space-y-2">
                    <label className="block font-medium">Questions</label>
                    {level.questions.map((q, qIdx) => (
                      <div key={qIdx} className="flex gap-2 items-center mb-1">
                        <input
                          className="border rounded px-2 py-1 flex-1"
                          placeholder="Question"
                          value={q.question}
                          onChange={(e) =>
                            handleQuestionChange(
                              idx,
                              qIdx,
                              "question",
                              e.target.value
                            )
                          }
                          required
                        />
                        <input
                          className="border rounded px-2 py-1 w-40"
                          placeholder="Options (comma separated)"
                          value={q.options ? q.options.join(", ") : ""}
                          onChange={(e) =>
                            handleQuestionChange(
                              idx,
                              qIdx,
                              "options",
                              e.target.value
                                .split(",")
                                .map((opt) => opt.trim())
                                .filter(Boolean)
                            )
                          }
                        />
                        <input
                          className="border rounded px-2 py-1 w-32"
                          placeholder="Correct Answer"
                          value={q.correct_answer || ""}
                          onChange={(e) =>
                            handleQuestionChange(
                              idx,
                              qIdx,
                              "correct_answer",
                              e.target.value
                            )
                          }
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveQuestion(idx, qIdx)}
                          type="button"
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddQuestion(idx)}
                      type="button"
                    >
                      Add Question
                    </Button>
                  </div>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddLevel}
                type="button"
              >
                Add Level
              </Button>
            </div>
            <div className="flex gap-2 justify-end mt-4">
              <Button
                variant="outline"
                type="button"
                onClick={handleCloseModal}
              >
                Cancel
              </Button>
              <Button variant="default" type="submit">
                {editId ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
