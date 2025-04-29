'use client';

// hooks/use-announcements.ts
import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import * as announcementsService from '@/lib/services/announcements-service';
import { Announcement } from '@/lib/types';

export function useAnnouncements(resourceId: string) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch announcements for a resource
  const fetchAnnouncements = async (limit?: number) => {
    setLoading(true);
    setError(null);
    try {
      const fetchedAnnouncements = await announcementsService.getAnnouncements(resourceId, limit);
      setAnnouncements(fetchedAnnouncements);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch announcements');
      toast({
        title: "Error",
        description: err.message || "Failed to fetch announcements",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch a single announcement by ID
  const fetchAnnouncementById = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const announcement = await announcementsService.getAnnouncementById(id);
      return announcement;
    } catch (err: any) {
      setError(err.message || 'Failed to fetch announcement');
      toast({
        title: "Error",
        description: err.message || "Failed to fetch announcement",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Create a new announcement
  const createAnnouncement = async (
    content: string,
    attachments?: { type: 'file' | 'image' | 'youtube'; url: string; name: string; file?: File }[]
  ) => {
    setLoading(true);
    try {
      const announcementId = await announcementsService.createAnnouncement(resourceId, content, attachments);
      
      // Refetch announcements to update the list
      await fetchAnnouncements();
      
      toast({
        title: "Success",
        description: "Announcement created successfully",
      });
      return announcementId;
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to create announcement",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Update an announcement
  const updateAnnouncement = async (id: string, content: string) => {
    setLoading(true);
    try {
      await announcementsService.updateAnnouncement(id, content);
      
      // Update local state
      setAnnouncements(announcements.map(a => 
        a.id === id ? { ...a, content } : a
      ));
      
      toast({
        title: "Success",
        description: "Announcement updated successfully",
      });
      return true;
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to update announcement",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Delete an announcement
  const deleteAnnouncement = async (id: string) => {
    setLoading(true);
    try {
      await announcementsService.deleteAnnouncement(id);
      
      // Update local state
      setAnnouncements(announcements.filter(a => a.id !== id));
      
      toast({
        title: "Success",
        description: "Announcement deleted successfully",
      });
      return true;
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to delete announcement",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Get comments for an announcement
  const getComments = async (announcementId: string) => {
    setLoading(true);
    try {
      const comments = await announcementsService.getComments(announcementId);
      return comments;
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to fetch comments",
        variant: "destructive",
      });
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Add a comment to an announcement
  const addComment = async (announcementId: string, content: string) => {
    try {
      const commentId = await announcementsService.addComment(announcementId, content);
      
      // Update comment count in local state
      setAnnouncements(announcements.map(a => 
        a.id === announcementId ? { ...a, comments: a.comments + 1 } : a
      ));
      
      toast({
        title: "Comment added",
        description: "Your comment has been added",
      });
      return commentId;
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to add comment",
        variant: "destructive",
      });
      return null;
    }
  };

  // Delete a comment
  const deleteComment = async (commentId: string, announcementId: string) => {
    try {
      await announcementsService.deleteComment(commentId);
      
      // Update comment count in local state
      setAnnouncements(announcements.map(a => 
        a.id === announcementId ? { ...a, comments: Math.max(0, a.comments - 1) } : a
      ));
      
      toast({
        title: "Comment deleted",
        description: "The comment has been deleted",
      });
      return true;
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to delete comment",
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    announcements,
    loading,
    error,
    fetchAnnouncements,
    fetchAnnouncementById,
    createAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    getComments,
    addComment,
    deleteComment
  };
}