import { Request, Response } from 'express';
import Assessment from '../models/AssessmentModel';

// Get all assessments
export const getAssessments = async (req: Request, res: Response) => {
    try {
        const assessments = await Assessment.find().sort({ date: -1 });
        res.json(assessments);
    } catch (error) {
        res.status(500).json({ error: "Error fetching assessments" });
    }
};

// Get single assessment
export const getAssessment = async (req: Request, res: Response) => {
    try {
        const assessment = await Assessment.findById(req.params.id);
        if (!assessment) {
            return res.status(404).json({ error: "Assessment not found" });
        }
        res.json(assessment);
    } catch (error) {
        res.status(500).json({ error: "Error fetching assessment" });
    }
};

// Create assessment (Mentor and above)
export const createAssessment = async (req: Request, res: Response) => {
    try {
        const assessment = new Assessment(req.body);
        await assessment.save();
        res.status(201).json(assessment);
    } catch (error) {
        res.status(500).json({ error: "Error creating assessment" });
    }
};
