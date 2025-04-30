"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  MessageSquare, 
  Heart, 
  Share2, 
  UserPlus, 
  Users, 
  Search 
} from "lucide-react"

import { useAuth } from "@/lib/hooks/use-auth"
import { useToast } from "@/components/ui/use-toast"
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  serverTimestamp,
  orderBy,
  limit
} from "firebase/firestore"
import { db } from "@/lib/firebase"

export default function NetworkPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("feed")
  
  // State management
  const [posts, setPosts] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [postContent, setPostContent] = useState("")

  // Fetch posts
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const postsRef = collection(db, 'network_posts')
        const postsQuery = query(
          postsRef, 
          orderBy('createdAt', 'desc'),
          limit(20)
        )
        
        const querySnapshot = await getDocs(postsQuery)
        
        const fetchedPosts = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        
        setPosts(fetchedPosts)
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load posts",
          variant: "destructive"
        })
      }
    }

    // Fetch users
    const fetchUsers = async () => {
      try {
        const usersRef = collection(db, 'users')
        const usersQuery = query(
          usersRef, 
          limit(20)
        )
        
        const querySnapshot = await getDocs(usersQuery)
        
        const fetchedUsers = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        
        setUsers(fetchedUsers)
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load users",
          variant: "destructive"
        })
      }
    }

    fetchPosts()
    fetchUsers()
  }, [])

  // Create a post
  const handleCreatePost = async () => {
    if (!user || !postContent.trim()) {
      toast({
        title: "Invalid Post",
        description: "Please enter some content",
        variant: "destructive"
      })
      return
    }

    try {
      const postRef = collection(db, 'network_posts')
      const newPostDoc = await addDoc(postRef, {
        content: postContent,
        authorId: user.uid,
        authorName: user.displayName || 'Anonymous',
        authorPhotoURL: user.photoURL,
        likes: 0,
        comments: 0,
        createdAt: serverTimestamp()
      })

      // Optimistically update local state
      const newPost = {
        id: newPostDoc.id,
        content: postContent,
        authorId: user.uid,
        authorName: user.displayName || 'Anonymous',
        authorPhotoURL: user.photoURL,
        likes: 0,
        comments: 0,
        createdAt: new Date()
      }

      setPosts([newPost, ...posts])
      setPostContent("")

      toast({
        title: "Post Created",
        description: "Your post has been shared",
      })
    } catch (error) {
      toast({
        title: "Post Failed",
        description: "Could not create post",
        variant: "destructive"
      })
    }
  }

  // Search users
  const handleSearchUsers = async () => {
    if (!searchQuery.trim()) {
      toast({
        title: "Invalid Search",
        description: "Please enter a search term",
        variant: "destructive"
      })
      return
    }

    try {
      const usersRef = collection(db, 'users')
      
      // Create a query that searches by name or email
      const searchQueryLower = searchQuery.toLowerCase()
      const nameQuery = query(
        usersRef, 
        where('displayName', '>=', searchQueryLower),
        where('displayName', '<=', searchQueryLower + '\uf8ff'),
        limit(10)
      )

      const querySnapshot = await getDocs(nameQuery)
      
      const searchResults = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))

      setUsers(searchResults)
    } catch (error) {
      toast({
        title: "Search Failed",
        description: "Could not complete user search",
        variant: "destructive"
      })
    }
  }

  return (
    <div className="network-bg min-h-screen">
      <div className="container mx-auto px-4 pt-24">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <div className="flex justify-between items-center">
            <TabsList>
              <TabsTrigger value="feed">Feed</TabsTrigger>
              <TabsTrigger value="people">People</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="feed" className="space-y-8">
            {/* Create Post */}
            {user && (
              <Card className="p-6">
                <div className="flex gap-4 mb-6">
                  <Avatar>
                    <AvatarImage src={user.photoURL || undefined} />
                    <AvatarFallback>
                      {user.displayName?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <Textarea 
                      placeholder="Share your thoughts, projects, or achievements..." 
                      className="mb-4"
                      value={postContent}
                      onChange={(e) => setPostContent(e.target.value)}
                    />
                    <Button 
                      onClick={handleCreatePost}
                      disabled={!postContent.trim()}
                    >
                      Post
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {/* Post List */}
            {posts.map((post) => (
              <Card key={post.id} className="p-6 space-y-4">
                <div className="flex gap-4">
                  <Avatar>
                    <AvatarImage src={post.authorPhotoURL || undefined} />
                    <AvatarFallback>{post.authorName?.charAt(0) || 'U'}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">{post.authorName}</h3>
                    <p className="text-sm text-muted-foreground">
                      {post.createdAt?.toDate?.()?.toLocaleString() || 'Recent'}
                    </p>
                  </div>
                </div>
                <p>{post.content}</p>
                <div className="flex gap-4">
                  <Button variant="ghost" size="sm">
                    <Heart className="h-4 w-4 mr-2" />
                    {post.likes} Likes
                  </Button>
                  <Button variant="ghost" size="sm">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    {post.comments} Comments
                  </Button>
                </div>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="people" className="space-y-8">
            <div className="flex gap-4 mb-6">
              <Input 
                placeholder="Search people by name"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearchUsers()}
              />
              <Button onClick={handleSearchUsers}>
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {users.map((person) => (
                <Card key={person.id} className="p-6">
                  <div className="flex gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={person.photoURL || undefined} />
                      <AvatarFallback>{person.displayName?.charAt(0) || 'U'}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="font-semibold">{person.displayName}</h3>
                      <p className="text-sm text-muted-foreground">
                        {person.role === 'student' ? 'Student' : 'Teacher'}
                      </p>
                      <div className="flex gap-2 mt-2">
                        <Button size="sm" variant="outline">
                          <UserPlus className="h-4 w-4 mr-2" />
                          Connect
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}