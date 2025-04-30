'use client';

import { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, deleteDoc, doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/hooks/use-auth';
import { useToast } from '@/components/ui/use-toast';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, Edit, Users, BookOpen } from 'lucide-react';

// Course interface
interface Course {
  id: string;
  title: string;
  description: string;
  code: string; // Unique course code for enrollment
  instructorId: string;
  instructorName: string;
  createdAt: any;
  updatedAt: any;
  students: number; // Number of enrolled students
  materials: {
    title: string;
    description?: string;
    url: string;
    type: string;
  }[];
}

export default function InstructorCourseworkPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
  });
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [materialForm, setMaterialForm] = useState({
    title: '',
    description: '',
    url: '',
    type: 'pdf'
  });
  
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  // Fetch courses from Firestore
  useEffect(() => {
    async function fetchCourses() {
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
        router.push('/coursework');
        return;
      }

      try {
        setLoading(true);
        
        // Get courses created by this instructor
        const coursesCollection = collection(db, 'courses');
        const courseSnapshot = await getDocs(coursesCollection);
        
        const courseList: Course[] = [];
        courseSnapshot.forEach((doc) => {
          const data = doc.data();
          
          // Only include courses created by this instructor
          if (data.instructorId === user.uid) {
            courseList.push({
              id: doc.id,
              title: data.title || 'Untitled Course',
              description: data.description || 'No description',
              code: data.code || 'XXX000',
              instructorId: data.instructorId,
              instructorName: data.instructorName || 'Instructor',
              createdAt: data.createdAt,
              updatedAt: data.updatedAt,
              students: data.students || 0,
              materials: data.materials || []
            });
          }
        });
        
        setCourses(courseList);
      } catch (error) {
        console.error('Error fetching courses:', error);
        toast({
          title: 'Error',
          description: 'Failed to load courses. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    }

    fetchCourses();
  }, [user, router, toast]);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle material form input changes
  const handleMaterialInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setMaterialForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Generate a random course code
  const generateCourseCode = () => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const prefix = Array(3).fill(0).map(() => letters.charAt(Math.floor(Math.random() * letters.length))).join('');
    const numbers = Math.floor(Math.random() * 900) + 100; // 3-digit number
    return `${prefix}${numbers}`;
  };

  // Create new course
  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    try {
      const newCourse = {
        ...formData,
        code: generateCourseCode(),
        instructorId: user.uid,
        instructorName: user.displayName || user.email,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        students: 0,
        materials: []
      };
      
      const docRef = await addDoc(collection(db, 'courses'), newCourse);
      
      // Add the new course to the state
      setCourses([...courses, {
        id: docRef.id,
        ...newCourse,
        createdAt: new Date(),
        updatedAt: new Date(),
        materials: []
      } as Course]);
      
      // Reset form
      setFormData({
        title: '',
        description: '',
      });
      
      setShowForm(false);
      
      toast({
        title: 'Course Created',
        description: 'The course has been created successfully.',
      });
    } catch (error) {
      console.error('Error creating course:', error);
      toast({
        title: 'Error',
        description: 'Failed to create course. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Delete a course
  const handleDeleteCourse = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'courses', id));
      
      // Update state
      setCourses(courses.filter(course => course.id !== id));
      
      toast({
        title: 'Course Deleted',
        description: 'The course has been deleted successfully.',
      });
    } catch (error) {
      console.error('Error deleting course:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete course. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Add material to a course
  const handleAddMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCourse) return;
    
    try {
      const courseRef = doc(db, 'courses', selectedCourse.id);
      
      // Get current materials and add new one
      const updatedMaterials = [
        ...selectedCourse.materials,
        materialForm
      ];
      
      await updateDoc(courseRef, {
        materials: updatedMaterials,
        updatedAt: serverTimestamp()
      });
      
      // Update local state
      const updatedCourses = courses.map(course => {
        if (course.id === selectedCourse.id) {
          return {
            ...course,
            materials: updatedMaterials,
            updatedAt: new Date()
          };
        }
        return course;
      });
      
      setCourses(updatedCourses);
      
      // Update selected course
      setSelectedCourse({
        ...selectedCourse,
        materials: updatedMaterials,
        updatedAt: new Date()
      });
      
      // Reset form
      setMaterialForm({
        title: '',
        description: '',
        url: '',
        type: 'pdf'
      });
      
      toast({
        title: 'Material Added',
        description: 'Course material has been added successfully.',
      });
    } catch (error) {
      console.error('Error adding material:', error);
      toast({
        title: 'Error',
        description: 'Failed to add material. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Remove material from course
  const handleRemoveMaterial = async (courseId: string, materialIndex: number) => {
    try {
      const course = courses.find(c => c.id === courseId);
      if (!course) return;
      
      const updatedMaterials = [...course.materials];
      updatedMaterials.splice(materialIndex, 1);
      
      const courseRef = doc(db, 'courses', courseId);
      await updateDoc(courseRef, {
        materials: updatedMaterials,
        updatedAt: serverTimestamp()
      });
      
      // Update local state
      const updatedCourses = courses.map(c => {
        if (c.id === courseId) {
          return {
            ...c,
            materials: updatedMaterials,
            updatedAt: new Date()
          };
        }
        return c;
      });
      
      setCourses(updatedCourses);
      
      // Update selected course if needed
      if (selectedCourse && selectedCourse.id === courseId) {
        setSelectedCourse({
          ...selectedCourse,
          materials: updatedMaterials,
          updatedAt: new Date()
        });
      }
      
      toast({
        title: 'Material Removed',
        description: 'Course material has been removed successfully.',
      });
    } catch (error) {
      console.error('Error removing material:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove material. Please try again.',
        variant: 'destructive',
      });
    }
  };

//   if (loading) {
//     return <div className="p-8 text-center">Loading courses...</div>;
//   }

  // Format date
  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Unknown date';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString();
  };

  return (
    <div className="p-8 mt-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Instructor Coursework</h1>
        
        {!selectedCourse && (
          <Button onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Create Course
              </>
            )}
          </Button>
        )}
        
        {selectedCourse && (
          <Button onClick={() => setSelectedCourse(null)}>
            Back to Courses
          </Button>
        )}
      </div>
      
      {showForm && !selectedCourse && (
        <div className="mb-8 p-4 border rounded-lg mt-20">
          <h2 className="text-xl font-semibold mb-4">Create New Course</h2>
          <form onSubmit={handleCreateCourse} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Course Title
              </label>
              <Input
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Enter course title"
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
                placeholder="Brief description of the course"
                required
                rows={3}
              />
            </div>
            
            <div className="flex justify-end">
              <Button type="submit">
                Create Course
              </Button>
            </div>
          </form>
        </div>
      )}
      
      {!selectedCourse ? (
        // Course list view
        <>
          {courses.length === 0 ? (
            <div className="text-center p-8 border rounded-lg">
              <p>You haven't created any courses yet.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => (
                <div key={course.id} className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                  <div className="p-6">
                    <div className="flex justify-between items-start">
                      <h3 className="font-medium text-lg mb-2">{course.title}</h3>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleDeleteCourse(course.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-4">
                      {course.description}
                    </p>
                    
                    <div className="flex flex-wrap gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Course Code</p>
                        <p className="font-medium">{course.code}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Enrolled</p>
                        <p className="font-medium">{course.students} students</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Materials</p>
                        <p className="font-medium">{course.materials.length} items</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-muted p-4 flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">
                      Created: {formatDate(course.createdAt)}
                    </span>
                    <Button onClick={() => setSelectedCourse(course)}>
                      Manage Course
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        // Course detail view
        <div className="space-y-6">
          <div className="p-6 border rounded-lg">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold mb-2">{selectedCourse.title}</h2>
                <p className="text-muted-foreground">{selectedCourse.description}</p>
              </div>
              <div className="text-right">
                <div className="inline-block px-3 py-1 rounded-full bg-muted text-sm mb-2">
                  Code: <span className="font-medium">{selectedCourse.code}</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  <Users className="inline h-4 w-4 mr-1" /> 
                  {selectedCourse.students} students enrolled
                </p>
              </div>
            </div>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <h3 className="text-xl font-semibold mb-4">Course Materials</h3>
              
              {selectedCourse.materials.length === 0 ? (
                <div className="text-center p-8 border rounded-lg">
                  <p>No materials have been added to this course yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedCourse.materials.map((material, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{material.title}</h4>
                          {material.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {material.description}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" asChild>
                            <a 
                              href={material.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                            >
                              View
                            </a>
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleRemoveMaterial(selectedCourse.id, index)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                      <div className="mt-2">
                        <span className="inline-block px-2 py-0.5 text-xs rounded-full bg-muted">
                          {material.type.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div>
              <h3 className="text-xl font-semibold mb-4">Add New Material</h3>
              <div className="p-4 border rounded-lg">
                <form onSubmit={handleAddMaterial} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Title
                    </label>
                    <Input
                      name="title"
                      value={materialForm.title}
                      onChange={handleMaterialInputChange}
                      placeholder="Material title"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Description (Optional)
                    </label>
                    <Textarea
                      name="description"
                      value={materialForm.description}
                      onChange={handleMaterialInputChange}
                      placeholder="Brief description"
                      rows={2}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      URL
                    </label>
                    <Input
                      name="url"
                      value={materialForm.url}
                      onChange={handleMaterialInputChange}
                      placeholder="Link to material"
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
                      value={materialForm.type}
                      onChange={handleMaterialInputChange}
                      className="w-full p-2 border rounded-md"
                      required
                    >
                      <option value="pdf">PDF</option>
                      <option value="video">Video</option>
                      <option value="article">Article</option>
                      <option value="assignment">Assignment</option>
                      <option value="quiz">Quiz</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  
                  <Button type="submit" className="w-full">
                    Add Material
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}