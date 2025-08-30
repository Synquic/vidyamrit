import { Request, Response } from 'express';
import AssessmentQuestionSet from '../models/AssessmentQuestionSetModel';

export const getQuestionSets = async (req: Request, res: Response) => {
    try {
        const { subject, version } = req.query;
        const filter: any = {};
        if (subject) filter.subject = subject;
        if (version) filter.version = Number(version);
        const sets = await AssessmentQuestionSet.find(filter).sort({ createdAt: -1 });
        res.json(sets);
    } catch (error) {
        res.status(500).json({ error: "Error fetching question sets" });
    }
};

export const getQuestionSet = async (req: Request, res: Response) => {
    try {
        const set = await AssessmentQuestionSet.findById(req.params.id);
        if (!set) return res.status(404).json({ error: "Question set not found" });
        res.json(set);
    } catch (error) {
        res.status(500).json({ error: "Error fetching question set" });
    }
};

export const createQuestionSet = async (req: Request, res: Response) => {
    try {
        const set = new AssessmentQuestionSet(req.body);
        await set.save();
        res.status(201).json(set);
    } catch (error) {
        res.status(500).json({ error: "Error creating question set" });
    }
};

export const updateQuestionSet = async (req: Request, res: Response) => {
    try {
        const set = await AssessmentQuestionSet.findByIdAndUpdate(
            req.params.id,
            { ...req.body, updatedAt: new Date() },
            { new: true, runValidators: true }
        );
        if (!set) return res.status(404).json({ error: "Question set not found" });
        res.json(set);
    } catch (error) {
        res.status(500).json({ error: "Error updating question set" });
    }
};

export const deleteQuestionSet = async (req: Request, res: Response) => {
    try {
        const set = await AssessmentQuestionSet.findByIdAndDelete(req.params.id);
        if (!set) return res.status(404).json({ error: "Question set not found" });
        res.json({ message: "Question set deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: "Error deleting question set" });
    }
};
