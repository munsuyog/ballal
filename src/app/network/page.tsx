"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Avatar } from "@/components/ui/avatar"
import { MessageSquare, Heart, Share2, UserPlus, Users } from "lucide-react"
import { useState } from "react"

export default function NetworkPage() {
  const [activeTab, setActiveTab] = useState("feed")

  return (
    <div className="network-bg min-h-screen">
      <div className="container mx-auto px-4 pt-24">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <div className="flex justify-between items-center">
            <TabsList>
              <TabsTrigger value="feed">Feed</TabsTrigger>
              <TabsTrigger value="connections">Connections</TabsTrigger>
              <TabsTrigger value="profile">Profile</TabsTrigger>
            </TabsList>
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Connect
            </Button>
          </div>

          <TabsContent value="feed" className="space-y-8">
            <Card className="p-6">
              <div className="flex gap-4 mb-6">
                <Avatar className="h-10 w-10" />
                <div className="flex-1">
                  <Textarea placeholder="Share your thoughts, projects, or achievements..." className="mb-4" />
                  <Button>Post</Button>
                </div>
              </div>
            </Card>

            {/* Example Posts */}
            <Card className="p-6 space-y-4">
              <div className="flex gap-4">
                <Avatar className="h-10 w-10" />
                <div>
                  <h3 className="font-semibold">John Doe</h3>
                  <p className="text-sm text-muted-foreground">Computer Science Student</p>
                </div>
              </div>
              <p>Just completed my final year project on AI-powered image recognition! 🎉 #AI #ComputerVision #FinalYear</p>
              <div className="flex gap-4">
                <Button variant="ghost" size="sm">
                  <Heart className="h-4 w-4 mr-2" />
                  Like
                </Button>
                <Button variant="ghost" size="sm">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Comment
                </Button>
                <Button variant="ghost" size="sm">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="connections" className="space-y-8">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="p-6">
                  <div className="flex gap-4">
                    <Avatar className="h-16 w-16" />
                    <div>
                      <h3 className="font-semibold">Student Name</h3>
                      <p className="text-sm text-muted-foreground mb-2">Computer Science • Year 3</p>
                      <div className="flex gap-2">
                        <Button size="sm">View Profile</Button>
                        <Button size="sm" variant="outline">Message</Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="profile" className="space-y-8">
            <Card className="p-6">
              <div className="flex gap-6 mb-8">
                <Avatar className="h-24 w-24" />
                <div>
                  <h2 className="text-2xl font-bold mb-2">Your Name</h2>
                  <p className="text-muted-foreground mb-4">Computer Science Student • Year 3</p>
                  <div className="flex gap-4">
                    <Button>Edit Profile</Button>
                    <Button variant="outline">
                      <Users className="h-4 w-4 mr-2" />
                      120 Connections
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">About</h3>
                  <p className="text-muted-foreground">
                    Passionate computer science student with interests in AI, web development, and cybersecurity.
                    Currently working on projects that combine these areas.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {["Python", "JavaScript", "React", "Node.js", "Machine Learning", "Web Development"].map((skill) => (
                      <div key={skill} className="bg-secondary px-3 py-1 rounded-full text-sm">
                        {skill}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">Education</h3>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium">Bachelor of Computer Science</h4>
                      <p className="text-sm text-muted-foreground">University Name • 2021 - Present</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}