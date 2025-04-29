"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Bold,
  Italic,
  Underline,
  List,
  Link2,
  FileUp,
  Youtube,
  Image as ImageIcon,
  MoreVertical,
  MessageSquare,
} from "lucide-react"

interface Announcement {
  id: string
  content: string
  author: {
    name: string
    avatar: string
  }
  createdAt: string
  comments: number
}

export function ResourceStream({ resourceId }: { resourceId: string }) {
  const [announcement, setAnnouncement] = useState("")
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [selectedAudience, setSelectedAudience] = useState("all")

  const handlePost = () => {
    if (!announcement.trim()) return

    const newAnnouncement: Announcement = {
      id: Date.now().toString(),
      content: announcement,
      author: {
        name: "You",
        avatar: "YO"
      },
      createdAt: "Just now",
      comments: 0
    }

    setAnnouncements([newAnnouncement, ...announcements])
    setAnnouncement("")
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex gap-4">
          <Avatar className="h-10 w-10">
            <span className="text-xs">YO</span>
          </Avatar>
          <div className="flex-1 space-y-4">
            <div className="flex gap-4">
              <Select value={selectedAudience} onValueChange={setSelectedAudience}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select audience" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All students</SelectItem>
                  <SelectItem value="individual">Individual students</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Textarea
              placeholder="Announce something to your class..."
              value={announcement}
              onChange={(e) => setAnnouncement(e.target.value)}
              className="min-h-[100px]"
            />
            <Separator className="my-4" />
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <Button variant="ghost" size="icon">
                  <Bold className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon">
                  <Italic className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon">
                  <Underline className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon">
                  <List className="h-4 w-4" />
                </Button>
                <Separator orientation="vertical" className="mx-2 h-6" />
                <Button variant="ghost" size="icon">
                  <Link2 className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon">
                  <FileUp className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon">
                  <Youtube className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon">
                  <ImageIcon className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setAnnouncement("")}>Cancel</Button>
                <Button onClick={handlePost} disabled={!announcement.trim()}>Post</Button>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {announcements.map((post) => (
        <Card key={post.id} className="p-6">
          <div className="flex gap-4">
            <Avatar className="h-10 w-10">
              <span className="text-xs">{post.author.avatar}</span>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">{post.author.name}</h3>
                  <p className="text-sm text-muted-foreground">{post.createdAt}</p>
                </div>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
              <p className="mt-4">{post.content}</p>
              <div className="mt-4 flex items-center gap-4">
                <Button variant="ghost" size="sm">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Add class comment
                </Button>
              </div>
            </div>
          </div>
        </Card>
      ))}

      {announcements.length === 0 && (
        <Card className="p-6">
          <div className="text-center">
            <h3 className="text-lg font-medium mb-2">This is where you can talk to your class</h3>
            <p className="text-muted-foreground">
              Use the stream to share announcements, post assignments and respond to student questions
            </p>
          </div>
        </Card>
      )}
    </div>
  )
}