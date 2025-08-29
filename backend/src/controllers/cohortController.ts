import { Request, Response } from 'express';
import Cohort from '../models/CohortModel';

// Get all cohorts
export const getCohorts = async (req: Request, res: Response) => {
    try {
        const cohorts = await Cohort.find().sort({ createdAt: -1 });
        res.json(cohorts);
    } catch (error) {
        res.status(500).json({ error: "Error fetching cohorts" });
    }
};

// Get single cohort
export const getCohort = async (req: Request, res: Response) => {
    try {
        const cohort = await Cohort.findById(req.params.id);
        if (!cohort) {
            return res.status(404).json({ error: "Cohort not found" });
        }
        res.json(cohort);
    } catch (error) {
        res.status(500).json({ error: "Error fetching cohort" });
    }
};

// Create cohort (School Admin, Super Admin only)
export const createCohort = async (req: Request, res: Response) => {
    try {
        const cohort = new Cohort(req.body);
        await cohort.save();
        res.status(201).json(cohort);
    } catch (error: any) {
        res.status(500).json({ error: "Error creating cohort" });
    }
};

// Update cohort (School Admin, Super Admin only)
export const updateCohort = async (req: Request, res: Response) => {
    try {
        const cohort = await Cohort.findByIdAndUpdate(
            req.params.id,
            { ...req.body, updatedAt: new Date() },
            { new: true, runValidators: true }
        );
        if (!cohort) {
            return res.status(404).json({ error: "Cohort not found" });
        }
        res.json(cohort);
    } catch (error: any) {
        res.status(500).json({ error: "Error updating cohort" });
    }
};

// Delete cohort (School Admin, Super Admin only)
export const deleteCohort = async (req: Request, res: Response) => {
    try {
        const cohort = await Cohort.findByIdAndDelete(req.params.id);
        if (!cohort) {
            return res.status(404).json({ error: "Cohort not found" });
        }
        res.json({ message: "Cohort deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: "Error deleting cohort" });
    }
};

// Mentor can add students to cohort
export const addStudentToCohort = async (req: Request, res: Response) => {
    try {
        const { studentId } = req.body;
        const cohort = await Cohort.findByIdAndUpdate(
            req.params.id,
            { $addToSet: { students: studentId }, updatedAt: new Date() },
            { new: true }
        );
        if (!cohort) {
            return res.status(404).json({ error: "Cohort not found" });
        }
        res.json(cohort);
    } catch (error) {
        res.status(500).json({ error: "Error adding student to cohort" });
    }
};
