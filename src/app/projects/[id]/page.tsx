"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, MapPin, GraduationCap } from "lucide-react"

// Firebase imports
import { db } from "@/lib/firebase"
import { 
  doc, 
  getDoc
} from "firebase/firestore"

// Type definition for Project
interface Project {
  id: string;
  title: string;
  college?: string;
  branch?: string;
  location?: string;
  status?: string;
  objective?: string;
  progress?: number;
  milestones?: Array<{
    title: string;
    date: string;
    status: string;
  }>;
  tech?: string[];
  supervisor?: {
    name: string;
    role: string;
    department: string;
    email: string;
  };
  collaborators?: Array<{
    name: string;
    role: string;
    email?: string;
  }>;
  startDate?: string;
  deadline?: string;
  ownerId: string;
  ownerName?: string;
  likes?: number;
  views?: number;
  description?: string;
}

export default function ProjectPage() {
  const params = useParams();
  const projectId = params?.id as string;
  const [project, setProject] = useState<Project | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  
  const router = useRouter()
  const { toast } = useToast()

  // Fetch project data from Firestore
  useEffect(() => {
    const fetchProject = async () => {
      // Check if projectId exists
      if (!projectId) {
        toast({
          title: "Invalid Project",
          description: "No project ID provided",
          variant: "destructive",
        });
        router.push('/projects');
        return;
      }

      try {
        setIsLoading(true);

        // Fetch project document
        const projectDocRef = doc(db, 'projects', projectId);
        const projectDocSnap = await getDoc(projectDocRef);

        // Check if project exists
        if (!projectDocSnap.exists()) {
          toast({
            title: "Project Not Found",
            description: "The requested project does not exist",
            variant: "destructive",
          });
          router.push('/projects');
          return;
        }

        // Extract project data
        const projectData = {
          id: projectDocSnap.id,
          ...projectDocSnap.data()
        } as Project;

        // Set project state
        setProject(projectData);
      } catch (error) {
        console.error('Error fetching project:', error);
        toast({
          title: "Error",
          description: "Failed to load project data",
          variant: "destructive",
        });
        router.push('/projects');
      } finally {
        setIsLoading(false);
      }
    };
    
    // Call fetch project function
    fetchProject();
  }, [projectId, router, toast]);


  if (!project) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <div className="text-center">
          <p className="mb-4">Project not found</p>
          <Button asChild>
            <Link href="/projects">Back to Projects</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container mx-auto px-4 pt-24 pb-12">
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-2xl">{project.title}</CardTitle>
                    <CardDescription className="mt-2">
                      <div className="flex items-center gap-2 text-sm mb-1">
                        <GraduationCap className="h-4 w-4" />
                        <span>{project.college || 'No college specified'}</span>
                        <span>•</span>
                        <span>{project.branch || 'No department specified'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4" />
                        <span>{project.location || 'No location specified'}</span>
                      </div>
                    </CardDescription>
                  </div>
                  <Badge variant={project.status === "In Progress" ? "secondary" : "default"}>
                    {project.status || 'Status unknown'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                  <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="team">Team</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="space-y-6">
                    <div>
                      <h3 className="font-semibold mb-2">Description</h3>
                      <p className="text-muted-foreground">{project.description || project.objective || 'No description provided'}</p>
                    </div>

                    <Separator />

                    {project.progress !== undefined && (
                      <div>
                        <h3 className="font-semibold mb-4">Progress</h3>
                        <Progress value={project.progress} className="mb-2" />
                        <p className="text-sm text-muted-foreground">{project.progress}% completed</p>
                      </div>
                    )}

                    {project.milestones && project.milestones.length > 0 && (
                      <div>
                        <h3 className="font-semibold mb-4">Milestones</h3>
                        <div className="space-y-4">
                          {project.milestones.map((milestone, index) => (
                            <div key={index} className="flex items-center gap-4">
                              <div className={`h-3 w-3 rounded-full ${
                                milestone.status === 'completed' ? 'bg-green-500' :
                                milestone.status === 'in-progress' ? 'bg-yellow-500' :
                                'bg-gray-300'
                              }`} />
                              <div className="flex-1">
                                <p className="font-medium">{milestone.title}</p>
                                <p className="text-sm text-muted-foreground">{milestone.date}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {project.tech && project.tech.length > 0 && (
                      <div>
                        <h3 className="font-semibold mb-2">Technologies Used</h3>
                        <div className="flex flex-wrap gap-2">
                          {project.tech.map((tech, index) => (
                            <Badge key={index} variant="secondary">{tech}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="team" className="space-y-6">
                    {project.supervisor && (
                      <div>
                        <h3 className="font-semibold mb-4">Project Supervisor</h3>
                        <Card>
                          <CardContent className="pt-6">
                            <div className="flex items-start gap-4">
                              <Avatar className="h-12 w-12">
                                <AvatarFallback>{project.supervisor.name.charAt(0) || 'S'}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{project.supervisor.name}</p>
                                <p className="text-sm text-muted-foreground">{project.supervisor.role || 'Supervisor'}</p>
                                <p className="text-sm text-muted-foreground">{project.supervisor.department || 'Department not specified'}</p>
                                {project.supervisor.email && (
                                  <Button variant="link" className="px-0" asChild>
                                    <a href={`mailto:${project.supervisor.email}`}>
                                      Contact
                                    </a>
                                  </Button>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    )}

                    {project.collaborators && project.collaborators.length > 0 ? (
                      <div>
                        <h3 className="font-semibold mb-4">Team Members</h3>
                        <div className="grid gap-4">
                          {project.collaborators.map((member, index) => (
                            <Card key={index}>
                              <CardContent className="pt-6">
                                <div className="flex items-start gap-4">
                                  <Avatar className="h-12 w-12">
                                    <AvatarFallback>{member.name?.charAt(0) || 'M'}</AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="font-medium">{member.name}</p>
                                    <p className="text-sm text-muted-foreground">{member.role || 'Team Member'}</p>
                                    {member.email && (
                                      <Button variant="link" className="px-0" asChild>
                                        <a href={`mailto:${member.email}`}>
                                          Contact
                                        </a>
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center">No team members yet</p>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Project Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 text-sm">
                  <span>Started: {project.startDate || 'Not specified'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span>Deadline: {project.deadline || 'Not specified'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span>{project.collaborators?.length || 0} team members</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span>{project.likes || 0} likes</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span>{project.views || 0} views</span>
                </div>
              </CardContent>
            </Card>
            
            {project.ownerId && (
              <Card>
                <CardHeader>
                  <CardTitle>Owner</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback>{project.ownerName?.charAt(0) || 'O'}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{project.ownerName || 'Unknown'}</p>
                      <p className="text-sm text-muted-foreground">Project Owner</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}