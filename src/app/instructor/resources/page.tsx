'use client';

import { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/hooks/use-auth';
import { useToast } from '@/components/ui/use-toast';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Trash2, Plus, FileText } from 'lucide-react';

// Simple Resource interface
interface Resource {
  id: string;
  title: string;
  description: string;
  url: string; // Link to the resource
  type: string; // Type of resource (pdf, video, article, etc.)
  createdAt: any;
  createdBy: string;
  creatorName: string;
}

export default function InstructorResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    url: '',
    type: 'pdf' // Default type
  });
  
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  // Fetch resources from Firestore
  useEffect(() => {
    async function fetchResources() {
    //   if (!user) {
    //     router.push('/auth/login');
    //     return;
    //   }

      // Check if user is an instructor
      if (user.role !== 'teacher') {
        toast({
          title: 'Access Denied',
          description: 'Only instructors can access this page.',
          variant: 'destructive',
        });
        router.push('/resources');
        return;
      }

      try {
        setLoading(true);
        const resourcesCollection = collection(db, 'resources');
        const resourceSnapshot = await getDocs(resourcesCollection);
        
        const resourcesList: Resource[] = [];
        resourceSnapshot.forEach((doc) => {
          const data = doc.data();
          resourcesList.push({
            id: doc.id,
            title: data.title || 'Untitled Resource',
            description: data.description || 'No description',
            url: data.url || '#',
            type: data.type || 'pdf',
            createdAt: data.createdAt,
            createdBy: data.createdBy,
            creatorName: data.creatorName || 'Instructor'
          });
        });
        
        setResources(resourcesList);
      } catch (error) {
        console.error('Error fetching resources:', error);
        toast({
          title: 'Error',
          description: 'Failed to load resources. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    }

    fetchResources();
  }, [user, router, toast]);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Create new resource
  const handleCreateResource = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    try {
      const newResource = {
        ...formData,
        createdAt: serverTimestamp(),
        createdBy: user.uid,
        creatorName: user.displayName || user.email
      };
      
      const docRef = await addDoc(collection(db, 'resources'), newResource);
      
      // Add the new resource to the state
      setResources([...resources, {
        id: docRef.id,
        ...newResource,
        createdAt: new Date()
      } as Resource]);
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        url: '',
        type: 'pdf'
      });
      
      setShowForm(false);
      
      toast({
        title: 'Resource Created',
        description: 'The resource has been created successfully.',
      });
    } catch (error) {
      console.error('Error creating resource:', error);
      toast({
        title: 'Error',
        description: 'Failed to create resource. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Delete a resource
  const handleDeleteResource = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'resources', id));
      
      // Update state
      setResources(resources.filter(resource => resource.id !== id));
      
      toast({
        title: 'Resource Deleted',
        description: 'The resource has been deleted successfully.',
      });
    } catch (error) {
      console.error('Error deleting resource:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete resource. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Get icon based on resource type
  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'pdf':
        return <FileText className="h-5 w-5" />;
      case 'video':
        return <FileText className="h-5 w-5" />;
      case 'article':
        return <FileText className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

//   if (loading) {
//     return <div className="p-8 text-center">Loading resources...</div>;
//   }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Instructor Resources</h1>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : (
            <>
              <Plus className="h-4 w-4 mr-2" />
              Add Resource
            </>
          )}
        </Button>
      </div>
      
      {showForm && (
        <div className="mb-8 p-4 border rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Add New Resource</h2>
          <form onSubmit={handleCreateResource} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Title
              </label>
              <Input
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Resource title"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">
                Description
              </label>
              <Textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Brief description of the resource"
                required
                rows={3}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">
                URL
              </label>
              <Input
                name="url"
                value={formData.url}
                onChange={handleInputChange}
                placeholder="Link to the resource"
                required
                type="url"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">
                Type
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                className="w-full p-2 border rounded-md"
                required
              >
                <option value="pdf">PDF</option>
                <option value="video">Video</option>
                <option value="article">Article</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            <div className="flex justify-end">
              <Button type="submit">
                Create Resource
              </Button>
            </div>
          </form>
        </div>
      )}
      
      {resources.length === 0 ? (
        <div className="text-center p-8 border rounded-lg">
          <p>No resources have been created yet.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {resources.map((resource) => (
            <div key={resource.id} className="border rounded-lg overflow-hidden">
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex gap-3">
                    <div className="p-2 bg-muted rounded-md">
                      {getTypeIcon(resource.type)}
                    </div>
                    <div>
                      <h3 className="font-medium">{resource.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {resource.description}
                      </p>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => handleDeleteResource(resource.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
              <div className="bg-muted p-2 flex justify-between items-center">
                <span className="text-xs text-muted-foreground">
                  {resource.type.toUpperCase()}
                </span>
                <a 
                  href={resource.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline"
                >
                  View Resource
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}