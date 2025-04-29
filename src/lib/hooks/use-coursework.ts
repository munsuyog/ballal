'use client';

// hooks/use-coursework.ts
import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import * as courseworkService from '@/lib/services/coursework-service';
import { Assignment, Submission } from '@/lib/types';

export function useCoursework(resourceId: string) {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [currentAssignment, setCurrentAssignment] = useState<Assignment | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [currentSubmission, setCurrentSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch assignments for a resource
  const fetchAssignments = async () => {
    setLoading(true);
    setError(null);
    try {
      const fetchedAssignments = await courseworkService.getAssignments(resourceId);
      setAssignments(fetchedAssignments);
      return fetchedAssignments;
    } catch (err: any) {
      setError(err.message || 'Failed to fetch assignments');
      toast({
        title: "Error",
        description: err.message || "Failed to fetch assignments",
        variant: "destructive",
      });
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Fetch a single assignment by ID
  const fetchAssignmentById = async (assignmentId: string) => {
    setLoading(true);
    setError(null);
    try {
      const assignment = await courseworkService.getAssignmentById(assignmentId);
      setCurrentAssignment(assignment);
      return assignment;
    } catch (err: any) {
      setError(err.message || 'Failed to fetch assignment');
      toast({
        title: "Error",
        description: err.message || "Failed to fetch assignment",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Create a new assignment
  const createAssignment = async (
    title: string,
    description: string,
    dueDate: Date,
    points: number,
    attachments?: { type: 'file' | 'image' | 'youtube'; url: string; name: string; file?: File }[]
  ) => {
    setLoading(true);
    try {
      const assignmentId = await courseworkService.createAssignment(
        resourceId,
        title,
        description,
        dueDate,
        points,
        attachments
      );
      
      // Refresh assignments
      await fetchAssignments();
      
      toast({
        title: "Success",
        description: "Assignment created successfully",
      });
      return assignmentId;
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to create assignment",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Update an assignment
  const updateAssignment = async (
    assignmentId: string,
    data: {
      title?: string;
      description?: string;
      dueDate?: Date;
      points?: number;
    }
  ) => {
    setLoading(true);
    try {
      await courseworkService.updateAssignment(assignmentId, data);
      
      // Update local state if this is the current assignment
      if (currentAssignment && currentAssignment.id === assignmentId) {
        setCurrentAssignment({
          ...currentAssignment,
          ...data,
        });
      }
      
      // Update in assignments list
      setAssignments(assignments.map(a => 
        a.id === assignmentId ? { ...a, ...data } : a
      ));
      
      toast({
        title: "Success",
        description: "Assignment updated successfully",
      });
      return true;
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to update assignment",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Delete an assignment
  const deleteAssignment = async (assignmentId: string) => {
    setLoading(true);
    try {
      await courseworkService.deleteAssignment(assignmentId);
      
      // Update local state
      setAssignments(assignments.filter(a => a.id !== assignmentId));
      if (currentAssignment && currentAssignment.id === assignmentId) {
        setCurrentAssignment(null);
      }
      
      toast({
        title: "Success",
        description: "Assignment deleted successfully",
      });
      return true;
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to delete assignment",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Submit an assignment
  const submitAssignment = async (
    assignmentId: string,
    content?: string,
    attachments?: { type: 'file' | 'image' | 'youtube'; url: string; name: string; file?: File }[]
  ) => {
    setLoading(true);
    try {
      const submissionId = await courseworkService.submitAssignment(
        assignmentId,
        content,
        attachments
      );
      
      toast({
        title: "Success",
        description: "Assignment submitted successfully",
      });
      return submissionId;
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to submit assignment",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Get submissions for an assignment (teacher only)
  const getAssignmentSubmissions = async (assignmentId: string) => {
    setLoading(true);
    try {
      const fetchedSubmissions = await courseworkService.getAssignmentSubmissions(assignmentId);
      setSubmissions(fetchedSubmissions);
      return fetchedSubmissions;
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to fetch submissions",
        variant: "destructive",
      });
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Get submission by ID
  const getSubmissionById = async (submissionId: string) => {
    setLoading(true);
    try {
      const submission = await courseworkService.getSubmissionById(submissionId);
      setCurrentSubmission(submission);
      return submission;
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to fetch submission",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Get a student's submission for an assignment
  const getStudentSubmission = async (assignmentId: string) => {
    setLoading(true);
    try {
      const submission = await courseworkService.getStudentSubmission(assignmentId);
      setCurrentSubmission(submission);
      return submission;
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to fetch your submission",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Grade a submission
  const gradeSubmission = async (
    submissionId: string,
    grade: number,
    feedback?: string
  ) => {
    setLoading(true);
    try {
      await courseworkService.gradeSubmission(submissionId, grade, feedback);
      
      // Update submission in local state
      if (currentSubmission && currentSubmission.id === submissionId) {
        setCurrentSubmission({
          ...currentSubmission,
          grade,
          feedback,
        });
      }
      
      // Update in submissions list
      setSubmissions(submissions.map(s => 
        s.id === submissionId ? { ...s, grade, feedback } : s
      ));
      
      toast({
        title: "Success",
        description: "Submission graded successfully",
      });
      return true;
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to grade submission",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Get student grades
  const getStudentGrades = async () => {
    setLoading(true);
    try {
      const grades = await courseworkService.getStudentGrades(resourceId);
      return grades;
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to fetch grades",
        variant: "destructive",
      });
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Get all grades (teacher only)
  const getAllGrades = async () => {
    setLoading(true);
    try {
      const grades = await courseworkService.getAllGrades(resourceId);
      return grades;
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to fetch all grades",
        variant: "destructive",
      });
      return [];
    } finally {
      setLoading(false);
    }
  };

  return {
    assignments,
    currentAssignment,
    submissions,
    currentSubmission,
    loading,
    error,
    fetchAssignments,
    fetchAssignmentById,
    createAssignment,
    updateAssignment,
    deleteAssignment,
    submitAssignment,
    getAssignmentSubmissions,
    getSubmissionById,
    getStudentSubmission,
    gradeSubmission,
    getStudentGrades,
    getAllGrades
  };
}