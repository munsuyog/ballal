'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, doc, getDoc, updateDoc, arrayUnion, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/hooks/use-auth';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, 
  BookOpen, 
  FileText, 
  FileVideo, 
  Lock, 
  Users, 
  ExternalLink,
  Calendar,
  ArrowLeft 
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

// Course interface
interface Course {
  id: string;
  title: string;
  description: string;
  code: string;
  instructorId: string;
  instructorName: string;
  createdAt: any;
  updatedAt: any;
  students: number;
  materials: {
    title: string;
    description?: string;
    url: string;
    type: string;
  }[];
}

export default function CourseworkPage() {
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [myCourses, setMyCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('my');
  const [enrollDialogOpen, setEnrollDialogOpen] = useState(false);
  const [courseCode, setCourseCode] = useState('');
  const [enrolling, setEnrolling] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch courses from Firestore
  useEffect(() => {
    async function fetchCourses() {
      if (!user) return;

      try {
        setLoading(true);
        
        // Get all courses
        const coursesCollection = collection(db, 'courses');
        const courseSnapshot = await getDocs(coursesCollection);
        
        const courseList: Course[] = [];
        courseSnapshot.forEach((doc) => {
          const data = doc.data();
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
        });
        
        setAllCourses(courseList);
        
        // Get user's enrolled courses
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const userData = userDoc.data();
        const enrolledCourseIds = userData?.enrolledCourses || [];
        
        // Filter courses the user is enrolled in
        const enrolledCourses = courseList.filter(course => 
          enrolledCourseIds.includes(course.id)
        );
        
        setMyCourses(enrolledCourses);
        
        // Set initial filtered courses based on active tab
        setFilteredCourses(activeTab === 'my' ? enrolledCourses : courseList);
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
  }, [user, toast]);

  // Filter courses when search query or active tab changes
  useEffect(() => {
    const coursesToFilter = activeTab === 'my' ? myCourses : allCourses;
    
    if (!searchQuery.trim()) {
      setFilteredCourses(coursesToFilter);
      return;
    }
    
    const query = searchQuery.toLowerCase();
    const filtered = coursesToFilter.filter(
      course =>
        course.title.toLowerCase().includes(query) ||
        course.description.toLowerCase().includes(query) ||
        course.instructorName.toLowerCase().includes(query)
    );
    
    setFilteredCourses(filtered);
  }, [searchQuery, activeTab, allCourses, myCourses]);

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setSearchQuery('');
    setFilteredCourses(value === 'my' ? myCourses : allCourses);
  };

  // Enroll in a course
  const handleEnroll = async () => {
    if (!user || !courseCode.trim()) return;
    
    try {
      setEnrolling(true);
      
      // Find course by code
      const course = allCourses.find(c => c.code.toLowerCase() === courseCode.trim().toLowerCase());
      
      if (!course) {
        toast({
          title: 'Course Not Found',
          description: 'No course with that code was found. Please check and try again.',
          variant: 'destructive',
        });
        return;
      }
      
      // Check if already enrolled
      if (myCourses.some(c => c.id === course.id)) {
        toast({
          title: 'Already Enrolled',
          description: 'You are already enrolled in this course.',
          variant: 'destructive',
        });
        return;
      }
      
      // Update user document with enrolled course
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        enrolledCourses: arrayUnion(course.id)
      });
      
      // Increment student count in course
      const courseRef = doc(db, 'courses', course.id);
      await updateDoc(courseRef, {
        students: increment(1)
      });
      
      // Update local state
      const updatedCourse = { ...course, students: course.students + 1 };
      setMyCourses([...myCourses, updatedCourse]);
      
      if (activeTab === 'my') {
        setFilteredCourses([...filteredCourses, updatedCourse]);
      }
      
      // Update course in allCourses
      setAllCourses(allCourses.map(c => 
        c.id === course.id ? updatedCourse : c
      ));
      
      setCourseCode('');
      setEnrollDialogOpen(false);
      
      toast({
        title: 'Enrollment Successful',
        description: `You have been enrolled in ${course.title}.`,
      });
    } catch (error) {
      console.error('Error enrolling in course:', error);
      toast({
        title: 'Enrollment Failed',
        description: 'Failed to enroll in the course. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setEnrolling(false);
    }
  };

  // Format date
  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Unknown date';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString();
  };

  // Get icon for material type
  const getMaterialIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'pdf':
        return <FileText className="h-4 w-4" />;
      case 'video':
        return <FileVideo className="h-4 w-4" />;
      case 'article':
        return <BookOpen className="h-4 w-4" />;
      case 'assignment':
        return <FileText className="h-4 w-4" />;
      case 'quiz':
        return <FileText className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  // Get material type badge color
  const getMaterialTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'pdf':
        return 'bg-blue-100 text-blue-800';
      case 'video':
        return 'bg-red-100 text-red-800';
      case 'article':
        return 'bg-green-100 text-green-800';
      case 'assignment':
        return 'bg-purple-100 text-purple-800';
      case 'quiz':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get instructor initials for avatar
  const getInstructorInitials = (name: string) => {
    if (!name) return 'IN';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // if (loading) {
  //   return <div className="container mx-auto px-4 pt-24 pb-12 text-center">Loading courses...</div>;
  // }

  return (
    <div className="container mx-auto px-4 pt-24 pb-12">
      {!selectedCourse ? (
        // Course list view
        <>
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">Coursework</h1>
              <p className="text-muted-foreground">Browse and access your enrolled courses</p>
            </div>
            <Dialog open={enrollDialogOpen} onOpenChange={setEnrollDialogOpen}>
              <DialogTrigger asChild>
                <Button>Enroll in Course</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Enroll in a Course</DialogTitle>
                  <DialogDescription>
                    Enter the course code provided by your instructor to enroll.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <Input
                    placeholder="Enter course code (e.g. ABC123)"
                    value={courseCode}
                    onChange={(e) => setCourseCode(e.target.value)}
                  />
                </div>
                <DialogFooter>
                  <Button onClick={handleEnroll} disabled={enrolling || !courseCode.trim()}>
                    {enrolling ? 'Enrolling...' : 'Enroll'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search courses..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="grid w-full grid-cols-2 max-w-md mb-8">
              <TabsTrigger value="my">My Courses</TabsTrigger>
              <TabsTrigger value="all">All Courses</TabsTrigger>
            </TabsList>
            <TabsContent value="all" className="mt-0">
            {filteredCourses.length === 0 ? (
              <div className="text-center py-12 border rounded-lg">
                <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <h3 className="text-lg font-medium mb-2">No courses found</h3>
                <p className="text-muted-foreground">
                  {searchQuery ? 'Try a different search term' : 'There are no courses available yet'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCourses.map((course) => (
                  <Card key={course.id} className="overflow-hidden hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle>{course.title}</CardTitle>
                        <Badge variant="outline">{course.code}</Badge>
                      </div>
                      <CardDescription className="line-clamp-2">{course.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center mb-4">
                        <Avatar className="h-8 w-8 mr-2">
                          <AvatarFallback>{getInstructorInitials(course.instructorName)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{course.instructorName}</p>
                          <p className="text-xs text-muted-foreground">Instructor</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>{course.students} students</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span>{course.materials.length} materials</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>{formatDate(course.updatedAt)}</span>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="bg-muted p-4 flex justify-between">
                      {myCourses.some(c => c.id === course.id) ? (
                        <Button onClick={() => setSelectedCourse(course)} variant="outline">
                          View Course
                        </Button>
                      ) : (
                        <Button 
                          onClick={() => {
                            setCourseCode(course.code);
                            setEnrollDialogOpen(true);
                          }}
                        >
                          Enroll
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
            </TabsContent>
            <TabsContent value="my" className="mt-0">
            {filteredCourses.length === 0 ? (
              <div className="text-center py-12 border rounded-lg">
                <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <h3 className="text-lg font-medium mb-2">Not enrolled in any courses</h3>
                <p className="text-muted-foreground mb-6">
                  {searchQuery ? 'Try a different search term' : 'Enroll in a course to get started'}
                </p>
                <Button onClick={() => setEnrollDialogOpen(true)}>
                  Enroll in a Course
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCourses.map((course) => (
                  <Card key={course.id} className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedCourse(course)}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle>{course.title}</CardTitle>
                        <Badge variant="outline">{course.code}</Badge>
                      </div>
                      <CardDescription className="line-clamp-2">{course.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center mb-4">
                        <Avatar className="h-8 w-8 mr-2">
                          <AvatarFallback>{getInstructorInitials(course.instructorName)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{course.instructorName}</p>
                          <p className="text-xs text-muted-foreground">Instructor</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span>{course.materials.length} materials</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>Updated: {formatDate(course.updatedAt)}</span>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="bg-muted p-4 flex justify-end">
                      <Button variant="outline">
                        View Materials
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
          </Tabs>
          

        </>
      ) : (
        // Course detail view
        <div className="space-y-8">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => setSelectedCourse(null)}
              className="h-10 w-10"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold mb-1">{selectedCourse.title}</h1>
              <p className="text-muted-foreground flex items-center gap-2">
                <Badge variant="outline">{selectedCourse.code}</Badge>
                <span className="text-sm">•</span>
                <span>{selectedCourse.instructorName}</span>
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-3 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Course Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>{selectedCourse.description}</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Course Materials</CardTitle>
                  <Badge variant="outline">{selectedCourse.materials.length} items</Badge>
                </CardHeader>
                <CardContent>
                  {selectedCourse.materials.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                      <h3 className="text-lg font-medium mb-2">No materials yet</h3>
                      <p className="text-muted-foreground">
                        The instructor hasn't added any course materials yet.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {selectedCourse.materials.map((material, index) => (
                        <div key={index} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                          <div className="flex items-start justify-between">
                            <div className="flex gap-3">
                              <div className="mt-1">
                                {getMaterialIcon(material.type)}
                              </div>
                              <div>
                                <h4 className="font-medium mb-1">{material.title}</h4>
                                {material.description && (
                                  <p className="text-sm text-muted-foreground mb-2">
                                    {material.description}
                                  </p>
                                )}
                                <Badge 
                                  variant="outline" 
                                  className="text-xs"
                                >
                                  {material.type.toUpperCase()}
                                </Badge>
                              </div>
                            </div>
                            <Button 
                              size="sm" 
                              className="gap-1"
                              asChild
                            >
                              <a href={material.url} target="_blank" rel="noopener noreferrer">
                                <span>View</span>
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Course Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Instructor</p>
                    <div className="flex items-center mt-1">
                      <Avatar className="h-8 w-8 mr-2">
                        <AvatarFallback>{getInstructorInitials(selectedCourse.instructorName)}</AvatarFallback>
                      </Avatar>
                      <p className="font-medium">{selectedCourse.instructorName}</p>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground">Enrolled Students</p>
                    <p className="font-medium flex items-center gap-2 mt-1">
                      <Users className="h-4 w-4" />
                      {selectedCourse.students}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground">Course Created</p>
                    <p className="font-medium mt-1">{formatDate(selectedCourse.createdAt)}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground">Last Updated</p>
                    <p className="font-medium mt-1">{formatDate(selectedCourse.updatedAt)}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}