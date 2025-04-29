"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import Link from "next/link"
import {
  Calendar,
  GraduationCap,
  MapPin,
  MessageSquare,
  Target,
  Users,
  Video,
  FileText,
  Image as ImageIcon,
  ExternalLink,
  Mail
} from "lucide-react"

// This would come from your database in a real app
const projectData = {
  id: 1,
  title: "AI-Powered Study Assistant",
  description: "Building an intelligent chatbot that helps students with their coursework and study planning.",
  category: "Artificial Intelligence",
  tech: ["Python", "TensorFlow", "NLP", "React", "Node.js"],
  collaborators: [
    {
      name: "Sarah Chen",
      role: "Project Lead",
      avatar: "SC",
      email: "sarah.chen@stanford.edu",
      linkedin: "https://linkedin.com/in/sarahchen"
    },
    {
      name: "Alex Kumar",
      role: "ML Engineer",
      avatar: "AK",
      email: "alex.k@stanford.edu"
    },
    {
      name: "Emily Zhang",
      role: "Frontend Developer",
      avatar: "EZ",
      email: "emily.z@stanford.edu"
    }
  ],
  supervisor: {
    name: "Dr. James Wilson",
    role: "Associate Professor",
    department: "Computer Science",
    avatar: "JW",
    email: "j.wilson@stanford.edu"
  },
  startDate: "2024-01-15",
  deadline: "2024-05-30",
  status: "In Progress",
  progress: 65,
  college: "Stanford University",
  branch: "Computer Science",
  location: "Stanford, CA",
  objective: "Develop an AI-powered chatbot that can understand and respond to student queries about their coursework, provide study recommendations, and help with academic planning. The system will use natural language processing to interpret student questions and machine learning to improve its responses over time.",
  milestones: [
    {
      title: "Project Planning & Requirements",
      status: "completed",
      date: "Jan 2024"
    },
    {
      title: "ML Model Development",
      status: "completed",
      date: "Feb 2024"
    },
    {
      title: "Frontend Implementation",
      status: "in-progress",
      date: "Mar 2024"
    },
    {
      title: "Testing & Optimization",
      status: "pending",
      date: "Apr 2024"
    }
  ],
  media: [
    {
      type: "image",
      url: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=2070",
      title: "System Architecture"
    },
    {
      type: "document",
      url: "#",
      title: "Project Proposal"
    },
    {
      type: "video",
      url: "#",
      title: "Demo Video"
    }
  ]
}

export default function ProjectPage({ params }: { params: { id: string } }) {
  const [activeTab, setActiveTab] = useState("overview")
  const [message, setMessage] = useState("")

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container mx-auto px-4 pt-24 pb-12">
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-2xl">{projectData.title}</CardTitle>
                    <CardDescription className="mt-2">
                      <div className="flex items-center gap-2 text-sm">
                        <GraduationCap className="h-4 w-4" />
                        <span>{projectData.college}</span>
                        <span>•</span>
                        <span>{projectData.branch}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm mt-1">
                        <MapPin className="h-4 w-4" />
                        <span>{projectData.location}</span>
                      </div>
                    </CardDescription>
                  </div>
                  <Badge variant={projectData.status === "In Progress" ? "secondary" : "default"}>
                    {projectData.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                  <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="team">Team</TabsTrigger>
                    <TabsTrigger value="media">Media</TabsTrigger>
                    <TabsTrigger value="chat">Group Chat</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="space-y-6">
                    <div>
                      <h3 className="font-semibold mb-2">Project Objective</h3>
                      <p className="text-muted-foreground">{projectData.objective}</p>
                    </div>

                    <Separator />

                    <div>
                      <h3 className="font-semibold mb-4">Progress</h3>
                      <Progress value={projectData.progress} className="mb-2" />
                      <p className="text-sm text-muted-foreground">{projectData.progress}% completed</p>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-4">Milestones</h3>
                      <div className="space-y-4">
                        {projectData.milestones.map((milestone, index) => (
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

                    <div>
                      <h3 className="font-semibold mb-2">Technologies Used</h3>
                      <div className="flex flex-wrap gap-2">
                        {projectData.tech.map((tech, index) => (
                          <Badge key={index} variant="secondary">{tech}</Badge>
                        ))}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="team" className="space-y-6">
                    <div>
                      <h3 className="font-semibold mb-4">Project Supervisor</h3>
                      <Card>
                        <CardContent className="pt-6">
                          <div className="flex items-start gap-4">
                            <Avatar className="h-12 w-12">
                              <span className="text-lg">{projectData.supervisor.avatar}</span>
                            </Avatar>
                            <div>
                              <p className="font-medium">{projectData.supervisor.name}</p>
                              <p className="text-sm text-muted-foreground">{projectData.supervisor.role}</p>
                              <p className="text-sm text-muted-foreground">{projectData.supervisor.department}</p>
                              <Button variant="link" className="px-0" asChild>
                                <Link href={`mailto:${projectData.supervisor.email}`}>
                                  <Mail className="h-4 w-4 mr-2" />
                                  Contact
                                </Link>
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-4">Team Members</h3>
                      <div className="grid gap-4">
                        {projectData.collaborators.map((member, index) => (
                          <Card key={index}>
                            <CardContent className="pt-6">
                              <div className="flex items-start gap-4">
                                <Avatar className="h-12 w-12">
                                  <span className="text-lg">{member.avatar}</span>
                                </Avatar>
                                <div>
                                  <p className="font-medium">{member.name}</p>
                                  <p className="text-sm text-muted-foreground">{member.role}</p>
                                  <div className="flex gap-4 mt-2">
                                    <Button variant="link" className="px-0" asChild>
                                      <Link href={`mailto:${member.email}`}>
                                        <Mail className="h-4 w-4 mr-2" />
                                        Contact
                                      </Link>
                                    </Button>
                                    {member.linkedin && (
                                      <Button variant="link" className="px-0" asChild>
                                        <Link href={member.linkedin} target="_blank">
                                          <ExternalLink className="h-4 w-4 mr-2" />
                                          LinkedIn
                                        </Link>
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="media" className="space-y-6">
                    <div className="grid gap-6">
                      {projectData.media.map((item, index) => (
                        <Card key={index}>
                          <CardContent className="pt-6">
                            <div className="flex items-center gap-4">
                              {item.type === 'image' && <ImageIcon className="h-6 w-6 text-muted-foreground" />}
                              {item.type === 'video' && <Video className="h-6 w-6 text-muted-foreground" />}
                              {item.type === 'document' && <FileText className="h-6 w-6 text-muted-foreground" />}
                              <div>
                                <p className="font-medium">{item.title}</p>
                                <p className="text-sm text-muted-foreground capitalize">{item.type}</p>
                              </div>
                              <Button className="ml-auto" asChild>
                                <Link href={item.url} target="_blank">View</Link>
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="chat" className="space-y-6">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="h-[400px] flex flex-col">
                          <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            <p className="text-center text-sm text-muted-foreground">
                              This is the beginning of the project group chat
                            </p>
                          </div>
                          <Separator />
                          <div className="p-4">
                            <div className="flex gap-2">
                              <input
                                type="text"
                                placeholder="Type your message..."
                                className="flex-1 px-3 py-2 rounded-md border"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                              />
                              <Button>Send</Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
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
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Started: {new Date(projectData.startDate).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Target className="h-4 w-4 text-muted-foreground" />
                  <span>Deadline: {new Date(projectData.deadline).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>{projectData.collaborators.length} team members</span>
                </div>
                <Separator />
                <div className="space-y-2">
                  <Button className="w-full" asChild>
                    <Link href="#chat">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Join Discussion
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}