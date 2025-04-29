"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { 
  Users, 
  FileText, 
  Settings,
  Link2,
  FileUp,
  Youtube,
  Image as ImageIcon,
  Bold,
  Italic,
  Underline,
  List,
  MoreVertical,
  Calendar
} from "lucide-react"
import { ResourceStream } from "@/components/resources/resource-stream"
import { ResourceSettings } from "@/components/resources/resource-settings"

export function ResourcePageClient({ id }: { id: string }) {
  const [activeTab, setActiveTab] = useState("stream")
  const [resourceData, setResourceData] = useState({
    name: "Advanced Web Development",
    subject: "Computer Science",
    instructor: "Dr. Sarah Chen",
    code: "getv6zz",
    students: 32,
    createdAt: "2024-02-08",
  })

  return (
    <div className="resources-bg min-h-screen">
      <div className="container mx-auto px-4 pt-24 pb-12">
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold mb-2">{resourceData.name}</h1>
              <p className="text-muted-foreground">{resourceData.subject} • {resourceData.instructor}</p>
            </div>
            <div className="flex items-center gap-4">
              <Card className="p-4">
                <p className="text-sm font-medium mb-1">Class Code</p>
                <div className="flex items-center gap-2">
                  <code className="bg-muted px-2 py-1 rounded text-sm">{resourceData.code}</code>
                  <Button variant="ghost" size="icon">
                    <Link2 className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
              <Button variant="outline" size="icon">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
              <TabsList>
                <TabsTrigger value="stream">Stream</TabsTrigger>
                <TabsTrigger value="classwork">Classwork</TabsTrigger>
                <TabsTrigger value="people">People</TabsTrigger>
                <TabsTrigger value="grades">Grades</TabsTrigger>
              </TabsList>

              <TabsContent value="stream">
                <ResourceStream resourceId={id} />
              </TabsContent>

              <TabsContent value="classwork">
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">No Assignments Yet</h3>
                  <p className="text-muted-foreground mb-6">Create assignments, quizzes, and materials for your students</p>
                  <Button>Create Assignment</Button>
                </div>
              </TabsContent>

              <TabsContent value="people">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Teachers</CardTitle>
                        <CardDescription>Manage course instructors</CardDescription>
                      </div>
                      <Button variant="outline">Invite Teacher</Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 p-4 border-b">
                      <Avatar />
                      <div>
                        <p className="font-medium">{resourceData.instructor}</p>
                        <p className="text-sm text-muted-foreground">Course Owner</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="mt-6">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Students</CardTitle>
                        <CardDescription>{resourceData.students} students</CardDescription>
                      </div>
                      <Button variant="outline">Invite Students</Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                      Share the class code with your students to let them join
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="grades">
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">No Grades Yet</h3>
                  <p className="text-muted-foreground mb-6">Grades will appear here once you start grading assignments</p>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Upcoming</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-4 text-muted-foreground text-sm">
                  No work due soon
                </div>
              </CardContent>
            </Card>

            <ResourceSettings resourceData={resourceData} />
          </div>
        </div>
      </div>
    </div>
  )
}