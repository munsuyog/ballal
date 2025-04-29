'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from '@/lib/hooks/use-auth';
import { collection, addDoc, updateDoc, doc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { Loader2, Plus, X, Calendar } from 'lucide-react';

interface ProjectFormProps {
  projectId?: string;
  isEditing?: boolean;
}

export function ProjectForm({ projectId, isEditing = false }: ProjectFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    tech: [] as string[],
    college: '',
    branch: '',
    location: '',
    objective: '',
    status: 'Open',
    supervisor: {
      name: '',
      role: '',
      department: '',
      email: '',
    },
    startDate: '',
    deadline: '',
    milestones: [
      {
        title: '',
        status: 'pending',
        date: ''
      }
    ]
  });
  
  const [techInput, setTechInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(isEditing);
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();

  // Fetch project data if editing
  useEffect(() => {
    if (isEditing && projectId) {
      const fetchProject = async () => {
        try {
          setIsLoading(true);
          const projectDoc = await getDoc(doc(db, 'projects', projectId));
          
          if (!projectDoc.exists()) {
            toast({
              title: "Project not found",
              description: "The requested project could not be found",
              variant: "destructive",
            });
            router.push('/projects');
            return;
          }
          
          const projectData = projectDoc.data();
          
          // Check if user is owner
          if (projectData.ownerId !== auth.currentUser?.uid) {
            toast({
              title: "Permission denied",
              description: "You don't have permission to edit this project",
              variant: "destructive",
            });
            router.push(`/projects/${projectId}`);
            return;
          }
          
          // Format dates for form inputs
          const formatDate = (dateStr: string) => {
            if (!dateStr) return '';
            const date = new Date(dateStr);
            return date.toISOString().split('T')[0];
          };
          
          setFormData({
            title: projectData.title || '',
            description: projectData.description || '',
            category: projectData.category || '',
            tech: projectData.tech || [],
            college: projectData.college || '',
            branch: projectData.branch || '',
            location: projectData.location || '',
            objective: projectData.objective || '',
            status: projectData.status || 'Open',
            supervisor: projectData.supervisor || {
              name: '',
              role: '',
              department: '',
              email: '',
            },
            startDate: formatDate(projectData.startDate),
            deadline: formatDate(projectData.deadline),
            milestones: projectData.milestones || [
              {
                title: '',
                status: 'pending',
                date: ''
              }
            ]
          });
        } catch (error) {
          console.error('Error fetching project:', error);
          toast({
            title: "Error",
            description: "Failed to load project data",
            variant: "destructive",
          });
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchProject();
    }
  }, [isEditing, projectId, router, toast]);

  const handleTechAdd = () => {
    if (techInput.trim() === '') return;
    if (formData.tech.includes(techInput.trim())) {
      setTechInput('');
      return;
    }
    
    setFormData({
      ...formData,
      tech: [...formData.tech, techInput.trim()]
    });
    setTechInput('');
  };

  const handleTechRemove = (tech: string) => {
    setFormData({
      ...formData,
      tech: formData.tech.filter(t => t !== tech)
    });
  };

  const handleMilestoneChange = (index: number, field: string, value: string) => {
    const updatedMilestones = [...formData.milestones];
    updatedMilestones[index] = {
      ...updatedMilestones[index],
      [field]: value
    };
    
    setFormData({
      ...formData,
      milestones: updatedMilestones
    });
  };

  const addMilestone = () => {
    setFormData({
      ...formData,
      milestones: [
        ...formData.milestones,
        {
          title: '',
          status: 'pending',
          date: ''
        }
      ]
    });
  };

  const removeMilestone = (index: number) => {
    if (formData.milestones.length <= 1) return;
    
    const updatedMilestones = formData.milestones.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      milestones: updatedMilestones
    });
  };

  const handleSupervisorChange = (field: string, value: string) => {
    setFormData({
      ...formData,
      supervisor: {
        ...formData.supervisor,
        [field]: value
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Authentication required",
        description: "You must be logged in to create or edit projects",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      if (isEditing && projectId) {
        // Update existing project
        await updateDoc(doc(db, 'projects', projectId), {
          ...formData,
          updatedAt: serverTimestamp()
        });
        
        toast({
          title: "Project updated",
          description: "Your project has been updated successfully",
        });
        
        router.push(`/projects/${projectId}`);
      } else {
        // Create new project
        const docRef = await addDoc(collection(db, 'projects'), {
          ...formData,
          ownerId: user.uid,
          ownerName: user.displayName || user.email,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          progress: 0,
          likes: 0,
          views: 0,
          collaborators: [
            {
              id: user.uid,
              name: user.displayName || user.email,
              role: 'Project Lead',
              email: user.email
            }
          ]
        });
        
        toast({
          title: "Project created",
          description: "Your project has been created successfully",
        });
        
        router.push(`/projects/${docRef.id}`);
      }
    } catch (error: any) {
      console.error('Error saving project:', error);
      toast({
        title: isEditing ? "Update failed" : "Creation failed",
        description: error.message || `Failed to ${isEditing ? 'update' : 'create'} project`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{isEditing ? 'Edit Project' : 'Create a New Project'}</CardTitle>
            <CardDescription>
              {isEditing 
                ? 'Update your project details to keep your collaborators informed'
                : 'Fill in the details below to create your new project'
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="title">Project Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter a descriptive title"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Artificial Intelligence">Artificial Intelligence</SelectItem>
                    <SelectItem value="Web Development">Web Development</SelectItem>
                    <SelectItem value="Mobile Development">Mobile Development</SelectItem>
                    <SelectItem value="Data Science">Data Science</SelectItem>
                    <SelectItem value="Virtual Reality">Virtual Reality</SelectItem>
                    <SelectItem value="Blockchain">Blockchain</SelectItem>
                    <SelectItem value="IoT">IoT</SelectItem>
                    <SelectItem value="Research">Research</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Project Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Provide a brief overview of your project"
                rows={3}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="objective">Project Objective</Label>
              <Textarea
                id="objective"
                value={formData.objective}
                onChange={(e) => setFormData({ ...formData, objective: e.target.value })}
                placeholder="What are the goals of this project?"
                rows={4}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="tech">Technologies & Skills</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="tech"
                  value={techInput}
                  onChange={(e) => setTechInput(e.target.value)}
                  placeholder="e.g. React, Python, Machine Learning"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleTechAdd();
                    }
                  }}
                />
                <Button type="button" onClick={handleTechAdd}>Add</Button>
              </div>
              {formData.tech.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.tech.map((tech) => (
                    <div 
                      key={tech} 
                      className="flex items-center gap-1 bg-primary/10 text-primary rounded-full px-3 py-1 text-sm"
                    >
                      <span>{tech}</span>
                      <button 
                        type="button" 
                        className="text-primary/70 hover:text-primary"
                        onClick={() => handleTechRemove(tech)}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="college">College/University</Label>
                <Input
                  id="college"
                  value={formData.college}
                  onChange={(e) => setFormData({ ...formData, college: e.target.value })}
                  placeholder="Institution name"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="branch">Department/Branch</Label>
                <Input
                  id="branch"
                  value={formData.branch}
                  onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                  placeholder="e.g. Computer Science"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="City, Country"
                  required
                />
              </div>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="status">Project Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                  required
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Open">Open</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="deadline">Deadline</Label>
                <Input
                  id="deadline"
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Project Supervisor</CardTitle>
            <CardDescription>
              Add details about the faculty member supervising this project
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="supervisorName">Supervisor Name</Label>
                <Input
                  id="supervisorName"
                  value={formData.supervisor.name}
                  onChange={(e) => handleSupervisorChange('name', e.target.value)}
                  placeholder="Full name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="supervisorRole">Role</Label>
                <Input
                  id="supervisorRole"
                  value={formData.supervisor.role}
                  onChange={(e) => handleSupervisorChange('role', e.target.value)}
                  placeholder="e.g. Professor, Associate Professor"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="supervisorDepartment">Department</Label>
                <Input
                  id="supervisorDepartment"
                  value={formData.supervisor.department}
                  onChange={(e) => handleSupervisorChange('department', e.target.value)}
                  placeholder="Academic department"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="supervisorEmail">Email</Label>
                <Input
                  id="supervisorEmail"
                  type="email"
                  value={formData.supervisor.email}
                  onChange={(e) => handleSupervisorChange('email', e.target.value)}
                  placeholder="Contact email"
                />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <CardTitle>Project Milestones</CardTitle>
                <CardDescription>
                  Break down your project into key milestones
                </CardDescription>
              </div>
              <Button type="button" onClick={addMilestone} variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Milestone
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {formData.milestones.map((milestone, index) => (
                <div key={index} className="grid md:grid-cols-8 gap-4 items-end border-b pb-4">
                  <div className="md:col-span-3 space-y-2">
                    <Label htmlFor={`milestone-${index}-title`}>Title</Label>
                    <Input
                      id={`milestone-${index}-title`}
                      value={milestone.title}
                      onChange={(e) => handleMilestoneChange(index, 'title', e.target.value)}
                      placeholder="Milestone name"
                      required
                    />
                  </div>
                  
                  <div className="md:col-span-2 space-y-2">
                    <Label htmlFor={`milestone-${index}-date`}>Target Date</Label>
                    <Input
                      id={`milestone-${index}-date`}
                      type="text"
                      value={milestone.date}
                      onChange={(e) => handleMilestoneChange(index, 'date', e.target.value)}
                      placeholder="e.g. April 2025"
                      required
                    />
                  </div>
                  
                  <div className="md:col-span-2 space-y-2">
                    <Label htmlFor={`milestone-${index}-status`}>Status</Label>
                    <Select
                      value={milestone.status}
                      onValueChange={(value) => handleMilestoneChange(index, 'status', value)}
                    >
                      <SelectTrigger id={`milestone-${index}-status`}>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="in-progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="md:col-span-1 flex justify-end">
                    {formData.milestones.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => removeMilestone(index)}
                        className="h-10 w-10"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEditing ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                isEditing ? 'Update Project' : 'Create Project'
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </form>
  );
}