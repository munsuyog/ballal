'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart, 
  BookOpen, 
  Calendar, 
  Clock, 
  FileText, 
  GraduationCap, 
  LayoutDashboard, 
  PenLine, 
  Plus,
  Users
} from "lucide-react";
import { useAuth } from '@/lib/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function DashboardPage() {
  const { user, loading, requireAuth } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [recentProjects, setRecentProjects] = useState<any[]>([]);
  const [upcomingAssignments, setUpcomingAssignments] = useState<any[]>([]);
  const [resources, setResources] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  // Make sure user is authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        
        // Fetch recent projects (either owned or collaborating)
        const projectsQuery = query(
          collection(db, 'projects'),
          where('collaborators', 'array-contains', { id: user.uid }),
          orderBy('updatedAt', 'desc'),
          limit(3)
        );
        
        const projectsSnapshot = await getDocs(projectsQuery);
        setRecentProjects(
          projectsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }))
        );
        
        // Fetch resources
        const resourcesQuery = query(
          collection(db, 'resources'),
          where('ownerId', '==', user.uid),
          orderBy('createdAt', 'desc'),
          limit(4)
        );
        
        const resourcesSnapshot = await getDocs(resourcesQuery);
        setResources(
          resourcesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }))
        );
        
        // Fetch upcoming assignments
        const assignmentsQuery = query(
          collection(db, 'assignments'),
          where('dueDate', '>=', new Date()),
          orderBy('dueDate', 'asc'),
          limit(5)
        );
        
        const assignmentsSnapshot = await getDocs(assignmentsQuery);
        setUpcomingAssignments(
          assignmentsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }))
        );
        
      } catch (error: any) {
        console.error('Error fetching dashboard data:', error);
        toast({
          title: "Error",
          description: "Could not load dashboard data",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [user, toast]);

  if (loading || !user) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="animate-pulse text-xl text-center">Loading dashboard...</div>
    </div>;
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container mx-auto px-4 pt-24 pb-12">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, {user.displayName || 'Student'}</p>
          </div>
          <div className="flex gap-4">
            <Button asChild>
              <Link href="/projects/new">
                <Plus className="h-4 w-4 mr-2" />
                New Project
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/resources">
                <BookOpen className="h-4 w-4 mr-2" />
                Resources
              </Link>
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="grid grid-cols-3 md:w-[400px]">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="projects">Projects</TabsTrigger>
            <TabsTrigger value="coursework">Coursework</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid md:grid-cols-3 gap-6">
              {/* Stats Cards */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Active Projects
                  </CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{recentProjects.length}</div>
                  <p className="text-xs text-muted-foreground">
                    {recentProjects.length > 0 
                      ? 'Projects in progress' 
                      : 'No active projects'}
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Your Resources
                  </CardTitle>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{resources.length}</div>
                  <p className="text-xs text-muted-foreground">
                    {resources.length > 0 
                      ? 'Active learning resources' 
                      : 'No learning resources'}
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Pending Assignments
                  </CardTitle>
                  <PenLine className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{upcomingAssignments.length}</div>
                  <p className="text-xs text-muted-foreground">
                    {upcomingAssignments.length > 0 
                      ? 'Assignments due soon' 
                      : 'No pending assignments'}
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Recent Projects */}
              <Card className="col-span-1">
                <CardHeader>
                  <CardTitle>Recent Projects</CardTitle>
                  <CardDescription>Your latest project activities</CardDescription>
                </CardHeader>
                <CardContent>
                  {recentProjects.length > 0 ? (
                    <div className="space-y-4">
                      {recentProjects.map((project) => (
                        <div key={project.id} className="flex items-center gap-4">
                          <div className={`h-10 w-10 rounded-full ${project.coverColor || 'bg-primary/10'} flex items-center justify-center`}>
                            <Users className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1 space-y-1">
                            <p className="font-medium leading-none">{project.title}</p>
                            <p className="text-sm text-muted-foreground">{project.status}</p>
                          </div>
                          <div className="text-sm text-muted-foreground text-right">
                            <p>Progress</p>
                            <p className="font-medium">{project.progress || 0}%</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No recent projects found</p>
                      <Button variant="link" asChild className="mt-2">
                        <Link href="/projects">Browse Projects</Link>
                      </Button>
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/projects">View All Projects</Link>
                  </Button>
                </CardFooter>
              </Card>

              {/* Upcoming Assignments */}
              <Card className="col-span-1">
                <CardHeader>
                  <CardTitle>Upcoming Assignments</CardTitle>
                  <CardDescription>Assignments due soon</CardDescription>
                </CardHeader>
                <CardContent>
                  {upcomingAssignments.length > 0 ? (
                    <div className="space-y-4">
                      {upcomingAssignments.map((assignment) => (
                        <div key={assignment.id} className="flex items-start gap-4">
                          <div className="mt-1">
                            <PenLine className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div className="flex-1 space-y-1">
                            <p className="font-medium leading-none">{assignment.title}</p>
                            <p className="text-sm text-muted-foreground">{assignment.resourceName}</p>
                          </div>
                          <div className="text-sm text-muted-foreground text-right">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>{assignment.dueDate?.toDate().toLocaleDateString() || 'No due date'}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No upcoming assignments</p>
                      <Button variant="link" asChild className="mt-2">
                        <Link href="/coursework">View Coursework</Link>
                      </Button>
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/coursework">View All Assignments</Link>
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="projects" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Your Projects</CardTitle>
                    <CardDescription>Projects you've created or joined</CardDescription>
                  </div>
                  <Button asChild>
                    <Link href="/projects/new">
                      <Plus className="h-4 w-4 mr-2" />
                      New Project
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {recentProjects.length > 0 ? (
                  <div className="grid sm:grid-cols-2 gap-6">
                    {recentProjects.map((project) => (
                      <Card key={project.id} className="overflow-hidden hover:shadow-md transition-shadow">
                        <div className={`h-24 ${project.coverColor || 'bg-primary/10'} relative`}></div>
                        <CardHeader>
                          <CardTitle className="line-clamp-1">{project.title}</CardTitle>
                          <CardDescription className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            <span>{project.collaborators?.length || 0} collaborators</span>
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <p className="text-muted-foreground text-sm line-clamp-2 mb-4">
                            {project.description}
                          </p>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Progress</span>
                            <span className="font-medium">{project.progress || 0}%</span>
                          </div>
                        </CardContent>
                        <CardFooter>
                          <Button className="w-full" asChild>
                            <Link href={`/projects/${project.id}`}>View Project</Link>
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-medium mb-2">No Projects Yet</h3>
                    <p className="text-muted-foreground mb-6">Start by creating a new project or joining an existing one</p>
                    <Button asChild>
                      <Link href="/projects">Browse Projects</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="coursework" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Your Courses</CardTitle>
                    <CardDescription>Courses and learning resources</CardDescription>
                  </div>
                  <Button asChild>
                    <Link href="/resources">
                      <BookOpen className="h-4 w-4 mr-2" />
                      View Resources
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {resources.length > 0 ? (
                  <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
                    {resources.map((resource) => (
                      <Card key={resource.id} className="hover:shadow-md transition-shadow">
                        <div className={`h-20 ${resource.coverColor || 'bg-primary/10'} relative`}></div>
                        <CardHeader>
                          <CardTitle className="text-lg">{resource.name}</CardTitle>
                          <CardDescription>{resource.subject}</CardDescription>
                        </CardHeader>
                        <CardContent className="text-sm">
                          <div className="flex justify-between mb-2">
                            <span className="text-muted-foreground">Students:</span>
                            <span>{resource.students || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Code:</span>
                            <span className="font-mono">{resource.code}</span>
                          </div>
                        </CardContent>
                        <CardFooter>
                          <Button variant="outline" className="w-full" asChild>
                            <Link href={`/resources/${resource.id}`}>View Resource</Link>
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-medium mb-2">No Resources Yet</h3>
                    <p className="text-muted-foreground mb-6">Create your first learning resource or join an existing one</p>
                    <Button asChild>
                      <Link href="/resources">Browse Resources</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}