'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { 
  FileText, 
  Share2,
  Users,
  Link2,
  Loader2,
  MessageSquare,
  PenLine
} from "lucide-react";
import { doc, getDoc, addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { useToast } from "@/components/ui/use-toast";

export default function ResourcePage({ params }: { params: { id: string } }) {
  const resourceId = params.id;
  const [resource, setResource] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("stream");
  const [newPost, setNewPost] = useState("");
  const [isPosting, setIsPosting] = useState(false);

  console.log(resource)
  
  const { toast } = useToast();

  // Fetch the resource
  useEffect(() => {
    const fetchResource = async () => {
      try {
        setLoading(true);
        const docRef = doc(db, "resources", resourceId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setResource({
            id: docSnap.id,
            ...docSnap.data()
          });
        } else {
          toast({
            title: "Resource not found",
            description: "The requested resource could not be found",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error fetching resource:", error);
        toast({
          title: "Error",
          description: "Failed to load resource data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchResource();
  }, [resourceId, toast]);

  // Post an announcement
  const handlePostAnnouncement = async () => {
    if (!newPost.trim()) return;
    
    try {
      setIsPosting(true);
      const user = auth.currentUser;
      
      if (!user) {
        toast({
          title: "Authentication required",
          description: "You must be signed in to post",
          variant: "destructive",
        });
        return;
      }
      
      // Check if user is the resource owner
      if (resource.ownerId !== user.uid) {
        toast({
          title: "Permission denied",
          description: "Only the resource owner can post announcements",
          variant: "destructive",
        });
        return;
      }
      
      // Create announcement
      const announcementData = {
        resourceId,
        content: newPost,
        authorId: user.uid,
        authorName: user.displayName || user.email,
        authorPhotoURL: user.photoURL,
        createdAt: serverTimestamp(),
        comments: 0
      };
      
      await addDoc(collection(db, "announcements"), announcementData);
      
      // Clear input and show success message
      setNewPost("");
      toast({
        title: "Posted",
        description: "Your announcement has been posted successfully",
      });
    } catch (error) {
      console.error("Error posting announcement:", error);
      toast({
        title: "Error",
        description: "Failed to post announcement",
        variant: "destructive",
      });
    } finally {
      setIsPosting(false);
    }
  };

  // Loading state
  // if (loading) {
  //   return (
  //     <div className="flex justify-center items-center min-h-screen">
  //       <Loader2 className="h-8 w-8 animate-spin text-primary" />
  //     </div>
  //   );
  // }

  // Error state - resource not found
  if (!resource) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <h1 className="text-2xl font-bold">Resource not found</h1>
        <p className="text-muted-foreground">The resource you're looking for doesn't exist or has been removed.</p>
        <Button asChild>
          <Link href="/resources">Back to Resources</Link>
        </Button>
      </div>
    );
  }

  const isOwner = resource.ownerId === auth.currentUser?.uid;

  // Share class code
  const copyClassCode = () => {
    navigator.clipboard.writeText(resource.code);
    toast({
      title: "Copied",
      description: "Class code copied to clipboard",
    });
  };

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 pt-24 pb-12">
        {/* Header */}
        <div className="mb-8 flex justify-between items-start flex-wrap gap-4">
          <div>
            <h1 className="text-4xl font-bold mb-2">{resource.name}</h1>
            <p className="text-muted-foreground">{resource.subject} • {resource.ownerName}</p>
          </div>
          <div>
            <Card className="p-4">
              <p className="text-sm font-medium mb-1">Class Code</p>
              <div className="flex items-center gap-2">
                <code className="bg-muted px-2 py-1 rounded text-sm">{resource.code}</code>
                <Button variant="ghost" size="icon" onClick={copyClassCode}>
                  <Link2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          </div>
        </div>

        {/* Main content */}
        <div className="grid lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
              <TabsList>
                <TabsTrigger value="stream">Stream</TabsTrigger>
                <TabsTrigger value="classwork">Classwork</TabsTrigger>
                <TabsTrigger value="people">People</TabsTrigger>
                <TabsTrigger value="grades">Grades</TabsTrigger>
              </TabsList>

              {/* Stream Tab */}
              <TabsContent value="stream" className="space-y-6">
                {isOwner && (
                  <Card className="p-6">
                    <div className="space-y-4">
                      <textarea 
                        className="w-full p-3 border rounded-md"
                        rows={4}
                        placeholder="Announce something to your class..."
                        value={newPost}
                        onChange={(e) => setNewPost(e.target.value)}
                      ></textarea>
                      <div className="flex justify-end">
                        <Button 
                          onClick={handlePostAnnouncement} 
                          disabled={isPosting || !newPost.trim()}
                        >
                          {isPosting ? "Posting..." : "Post"}
                        </Button>
                      </div>
                    </div>
                  </Card>
                )}

                <Card className="p-6">
                  <div className="text-center">
                    <h3 className="text-lg font-medium mb-2">Announcements</h3>
                    <p className="text-muted-foreground">
                      {isOwner 
                        ? "Post an announcement to get started"
                        : "There are no announcements for this resource yet"
                      }
                    </p>
                  </div>
                </Card>
              </TabsContent>

              {/* Classwork Tab */}
              <TabsContent value="classwork" className="space-y-6">
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">No Assignments Yet</h3>
                  <p className="text-muted-foreground mb-6">
                    {isOwner 
                      ? "Create assignments, quizzes, and materials for your students"
                      : "There are no assignments for this resource yet"
                    }
                  </p>
                  {isOwner && (
                    <Button>Create Assignment</Button>
                  )}
                </div>
              </TabsContent>

              {/* People Tab */}
              <TabsContent value="people" className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Teachers</CardTitle>
                        <CardDescription>Course instructors</CardDescription>
                      </div>
                      {isOwner && (
                        <Button variant="outline">Invite Teacher</Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 p-4 border-b">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="font-semibold text-primary">
                          {resource.ownerName?.charAt(0) || "U"}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{resource.ownerName}</p>
                        <p className="text-sm text-muted-foreground">Course Owner</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Students</CardTitle>
                        <CardDescription>{resource.students || 0} students</CardDescription>
                      </div>
                      {isOwner && (
                        <Button variant="outline">Invite Students</Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                      {isOwner 
                        ? "Share the class code with your students to let them join"
                        : "Student list is only visible to the course owner"
                      }
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Grades Tab */}
              <TabsContent value="grades">
                <div className="text-center py-12">
                  <PenLine className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">No Grades Yet</h3>
                  <p className="text-muted-foreground mb-6">
                    {isOwner 
                      ? "Grades will appear here once you start grading assignments"
                      : "There are no grades available at this time"
                    }
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Resource Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Created by</p>
                  <p>{resource.ownerName}</p>
                </div>
                <Separator />
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Subject</p>
                  <p>{resource.subject}</p>
                </div>
                <Separator />
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Students</p>
                  <p>{resource.students || 0} enrolled</p>
                </div>
                <Separator />
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Description</p>
                  <p>{resource.description || "No description provided"}</p>
                </div>
              </CardContent>
            </Card>

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

            {/* Action buttons */}
            <div className="space-y-2">
              <Button 
                variant="outline" 
                className="w-full flex gap-2"
                onClick={copyClassCode}
              >
                <Share2 className="h-4 w-4" />
                Share Class Code
              </Button>
              
              {isOwner && (
                <Button 
                  variant="outline" 
                  className="w-full flex gap-2 text-destructive hover:text-destructive"
                >
                  <span className="text-destructive">Delete Resource</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}