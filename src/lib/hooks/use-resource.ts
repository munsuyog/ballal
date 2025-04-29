'use client';

// hooks/use-resources.ts
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import * as resourcesService from '@/lib/services/resources-service';
import { Resource } from '@/lib/types';

export function useResources() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [userResources, setUserResources] = useState<Resource[]>([]);
  const [enrolledResources, setEnrolledResources] = useState<Resource[]>([]);
  const [starredResources, setStarredResources] = useState<Resource[]>([]);
  const [currentResource, setCurrentResource] = useState<Resource | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  // Fetch all available resources
  const fetchResources = async (filters?: {
    subject?: string;
    resourceType?: string;
  }) => {
    setLoading(true);
    setError(null);
    try {
      const fetchedResources = await resourcesService.getResources(filters);
      setResources(fetchedResources);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch resources');
      toast({
        title: "Error",
        description: err.message || "Failed to fetch resources",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch resources created by the current user
  const fetchUserResources = async () => {
    setLoading(true);
    setError(null);
    try {
      const fetchedResources = await resourcesService.getResources({ ownerId: 'current' });
      setUserResources(fetchedResources);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch your resources');
      toast({
        title: "Error",
        description: err.message || "Failed to fetch your resources",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch resources the user is enrolled in
  const fetchEnrolledResources = async () => {
    setLoading(true);
    setError(null);
    try {
      // This requires a custom query to get resources where the user is enrolled
      const userDoc = await resourcesService.getUserEnrolledResources();
      setEnrolledResources(userDoc);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch enrolled resources');
      toast({
        title: "Error",
        description: err.message || "Failed to fetch enrolled resources",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch starred resources
  const fetchStarredResources = async () => {
    setLoading(true);
    setError(null);
    try {
      const fetchedResources = await resourcesService.getResources({ starred: true });
      setStarredResources(fetchedResources);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch starred resources');
      toast({
        title: "Error",
        description: err.message || "Failed to fetch starred resources",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch a single resource by ID
  const fetchResourceById = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const resource = await resourcesService.getResourceById(id);
      setCurrentResource(resource);
      return resource;
    } catch (err: any) {
      setError(err.message || 'Failed to fetch resource');
      toast({
        title: "Error",
        description: err.message || "Failed to fetch resource",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Create a new resource
  const createResource = async (data: Omit<Resource, 'id' | 'createdAt' | 'ownerId' | 'ownerName' | 'students'>) => {
    setLoading(true);
    try {
      const resourceId = await resourcesService.createResource(data);
      toast({
        title: "Success",
        description: "Resource created successfully",
      });
      return resourceId;
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to create resource",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Update an existing resource
  const updateResource = async (id: string, data: Partial<Resource>) => {
    setLoading(true);
    try {
      await resourcesService.updateResource(id, data);
      // Update local state
      if (currentResource && currentResource.id === id) {
        setCurrentResource({
          ...currentResource,
          ...data,
        });
      }
      toast({
        title: "Success",
        description: "Resource updated successfully",
      });
      return true;
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to update resource",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Delete a resource
  const deleteResource = async (id: string) => {
    setLoading(true);
    try {
      await resourcesService.deleteResource(id);
      // Update local state
      setResources(resources.filter(r => r.id !== id));
      setUserResources(userResources.filter(r => r.id !== id));
      if (currentResource && currentResource.id === id) {
        setCurrentResource(null);
      }
      toast({
        title: "Success",
        description: "Resource deleted successfully",
      });
      return true;
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to delete resource",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Join a resource using a class code
  const joinResource = async (code: string) => {
    setLoading(true);
    try {
      const resourceId = await resourcesService.joinResource(code);
      toast({
        title: "Success",
        description: "You have joined the resource successfully",
      });
      // Refresh enrolled resources
      fetchEnrolledResources();
      return resourceId;
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to join resource",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Toggle star status for a resource
  const toggleStarResource = async (resourceId: string) => {
    try {
      const isStarred = await resourcesService.toggleStarResource(resourceId);
      
      // Update local state optimistically
      if (isStarred) {
        // Resource was starred
        const resourceToAdd = resources.find(r => r.id === resourceId) || 
                             userResources.find(r => r.id === resourceId) ||
                             enrolledResources.find(r => r.id === resourceId);
                             
        if (resourceToAdd && !starredResources.some(r => r.id === resourceId)) {
          setStarredResources([...starredResources, resourceToAdd]);
        }
        
        toast({
          title: "Resource starred",
          description: "This resource has been added to your starred list",
        });
      } else {
        // Resource was unstarred
        setStarredResources(starredResources.filter(r => r.id !== resourceId));
        
        toast({
          title: "Resource unstarred",
          description: "This resource has been removed from your starred list",
        });
      }
      
      return isStarred;
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to update star status",
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    resources,
    userResources,
    enrolledResources,
    starredResources,
    currentResource,
    loading,
    error,
    fetchResources,
    fetchUserResources,
    fetchEnrolledResources,
    fetchStarredResources,
    fetchResourceById,
    createResource,
    updateResource,
    deleteResource,
    joinResource,
    toggleStarResource,
  };
}