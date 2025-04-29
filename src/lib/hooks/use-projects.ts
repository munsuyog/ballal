'use client';

// hooks/use-projects.ts
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import * as projectsService from '@/lib/services/projects-service';
import { Project } from '@/lib/types';

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [userProjects, setUserProjects] = useState<Project[]>([]);
  const [collaboratingProjects, setCollaboratingProjects] = useState<Project[]>([]);
  const [likedProjects, setLikedProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  // Fetch all projects with optional filters
  const fetchProjects = async (filters?: {
    category?: string;
    tech?: string[];
    college?: string;
    status?: string;
    search?: string;
    limit?: number;
  }) => {
    setLoading(true);
    setError(null);
    try {
      const fetchedProjects = await projectsService.getProjects(filters);
      setProjects(fetchedProjects);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch projects');
      toast({
        title: "Error",
        description: err.message || "Failed to fetch projects",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch projects created by the current user
  const fetchUserProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const fetchedProjects = await projectsService.getProjects({ ownerId: 'current' });
      setUserProjects(fetchedProjects);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch your projects');
      toast({
        title: "Error",
        description: err.message || "Failed to fetch your projects",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch projects the user is collaborating on
  const fetchCollaboratingProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const fetchedProjects = await projectsService.getProjects({ collaboratorId: 'current' });
      setCollaboratingProjects(fetchedProjects);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch collaborating projects');
      toast({
        title: "Error",
        description: err.message || "Failed to fetch collaborating projects",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch projects the user has liked
  const fetchLikedProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      // This requires a custom endpoint to get liked projects from user's liked list
      const userService = await import('@/lib/services/user-service');
      const liked = await userService.getUserLikedProjects();
      setLikedProjects(liked);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch liked projects');
      toast({
        title: "Error",
        description: err.message || "Failed to fetch liked projects",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch a single project by ID
  const fetchProjectById = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const project = await projectsService.getProjectById(id);
      setCurrentProject(project);
      return project;
    } catch (err: any) {
      setError(err.message || 'Failed to fetch project');
      toast({
        title: "Error",
        description: err.message || "Failed to fetch project",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Create a new project
  const createProject = async (data: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'likes' | 'views' | 'ownerId' | 'ownerName'>) => {
    setLoading(true);
    try {
      const projectId = await projectsService.createProject(data);
      toast({
        title: "Success",
        description: "Project created successfully",
      });
      return projectId;
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to create project",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Update an existing project
  const updateProject = async (id: string, data: Partial<Project>) => {
    setLoading(true);
    try {
      await projectsService.updateProject(id, data);
      // Update local state if the current project is being updated
      if (currentProject && currentProject.id === id) {
        setCurrentProject({
          ...currentProject,
          ...data,
        });
      }
      toast({
        title: "Success",
        description: "Project updated successfully",
      });
      return true;
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to update project",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Delete a project
  const deleteProject = async (id: string) => {
    setLoading(true);
    try {
      await projectsService.deleteProject(id);
      // Update local state
      setProjects(projects.filter(p => p.id !== id));
      setUserProjects(userProjects.filter(p => p.id !== id));
      if (currentProject && currentProject.id === id) {
        setCurrentProject(null);
      }
      toast({
        title: "Success",
        description: "Project deleted successfully",
      });
      return true;
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to delete project",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Join a project as a collaborator
  const joinProject = async (projectId: string, role: string) => {
    setLoading(true);
    try {
      await projectsService.joinProject(projectId, role);
      // Refresh the project details
      await fetchProjectById(projectId);
      // Refresh collaborating projects
      fetchCollaboratingProjects();
      toast({
        title: "Success",
        description: "You have joined the project successfully",
      });
      return true;
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to join project",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Leave a project (as a collaborator)
  const leaveProject = async (projectId: string) => {
    setLoading(true);
    try {
      await projectsService.leaveProject(projectId);
      // Update local state
      setCollaboratingProjects(collaboratingProjects.filter(p => p.id !== projectId));
      // Refresh the project details if currently viewing
      if (currentProject && currentProject.id === projectId) {
        await fetchProjectById(projectId);
      }
      toast({
        title: "Success",
        description: "You have left the project",
      });
      return true;
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to leave project",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Toggle like on a project
  const toggleLikeProject = async (projectId: string) => {
    try {
      const isLiked = await projectsService.toggleLikeProject(projectId);
      
      // Optimistically update local state
      if (isLiked) {
        // Find the project in any of our lists
        const projectToAdd = projects.find(p => p.id === projectId) || 
                             userProjects.find(p => p.id === projectId) ||
                             collaboratingProjects.find(p => p.id === projectId);
                             
        if (projectToAdd && !likedProjects.some(p => p.id === projectId)) {
          setLikedProjects([...likedProjects, projectToAdd]);
        }
        
        // Update like count in the current project
        if (currentProject && currentProject.id === projectId) {
          setCurrentProject({
            ...currentProject,
            likes: currentProject.likes + 1
          });
        }
        
        toast({
          title: "Project liked",
          description: "This project has been added to your liked list",
        });
      } else {
        // Remove from liked projects
        setLikedProjects(likedProjects.filter(p => p.id !== projectId));
        
        // Update like count in the current project
        if (currentProject && currentProject.id === projectId) {
          setCurrentProject({
            ...currentProject,
            likes: currentProject.likes - 1
          });
        }
        
        toast({
          title: "Project unliked",
          description: "This project has been removed from your liked list",
        });
      }
      
      return isLiked;
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to update like status",
        variant: "destructive",
      });
      return false;
    }
  };

  // Update project milestone
  const updateMilestone = async (
    projectId: string, 
    milestoneIndex: number, 
    status: 'pending' | 'in-progress' | 'completed'
  ) => {
    setLoading(true);
    try {
      await projectsService.updateMilestone(projectId, milestoneIndex, status);
      
      // Update local state if this is the current project
      if (currentProject && currentProject.id === projectId && currentProject.milestones) {
        const updatedMilestones = [...currentProject.milestones];
        updatedMilestones[milestoneIndex] = {
          ...updatedMilestones[milestoneIndex],
          status
        };
        
        // Calculate new progress
        const completedCount = updatedMilestones.filter(m => m.status === 'completed').length;
        const progress = Math.round((completedCount / updatedMilestones.length) * 100);
        
        setCurrentProject({
          ...currentProject,
          milestones: updatedMilestones,
          progress
        });
      }
      
      toast({
        title: "Success",
        description: "Milestone updated successfully",
      });
      return true;
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to update milestone",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Get project messages
  const getProjectMessages = async (projectId: string) => {
    setLoading(true);
    try {
      const messages = await projectsService.getProjectMessages(projectId);
      return messages;
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to fetch project messages",
        variant: "destructive",
      });
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Send a message to project chat
  const sendProjectMessage = async (projectId: string, content: string) => {
    try {
      const messageId = await projectsService.addProjectMessage(projectId, content);
      toast({
        title: "Message sent",
        description: "Your message has been sent to the project chat",
      });
      return messageId;
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to send message",
        variant: "destructive",
      });
      return null;
    }
  };

  return {
    projects,
    userProjects,
    collaboratingProjects,
    likedProjects,
    currentProject,
    loading,
    error,
    fetchProjects,
    fetchUserProjects,
    fetchCollaboratingProjects,
    fetchLikedProjects,
    fetchProjectById,
    createProject,
    updateProject,
    deleteProject,
    joinProject,
    leaveProject,
    toggleLikeProject,
    updateMilestone,
    getProjectMessages,
    sendProjectMessage
  };
}