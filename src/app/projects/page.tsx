"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import Link from "next/link"
import { useAuth } from "@/lib/hooks/use-auth"
import { useToast } from "@/components/ui/use-toast"
import { db } from "@/lib/firebase"
import { 
  collection, 
  getDocs
} from "firebase/firestore"
import { 
  GraduationCap,
  Heart,
  Loader2,
  MapPin,
  Plus,
  Search,
  Users
} from "lucide-react"

// Project Type Definition
interface Project {
  id: string;
  title: string;
  description?: string;
  college?: string;
  location?: string;
  ownerName?: string;
  tech?: string[];
  collaborators?: Array<{id: string; name: string}>;
  likes?: number;
  status?: string;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  
  const { user } = useAuth()
  const { toast } = useToast()

  // Fetch projects directly
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setIsLoading(true)
        
        const projectsCollection = collection(db, 'projects')
        const projectsSnapshot = await getDocs(projectsCollection)
        
        const fetchedProjects = projectsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Project))
        
        setProjects(fetchedProjects)
        setFilteredProjects(fetchedProjects)
      } catch (error) {
        console.error('Error fetching projects:', error)
        toast({
          title: "Error",
          description: "Failed to fetch projects",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchProjects()
  }, [toast])

  // Search and filter projects
  useEffect(() => {
    if (!searchQuery) {
      setFilteredProjects(projects)
      return
    }

    const lowercaseQuery = searchQuery.toLowerCase()
    const filtered = projects.filter(project => 
      project.title.toLowerCase().includes(lowercaseQuery) ||
      project.description?.toLowerCase().includes(lowercaseQuery) ||
      project.college?.toLowerCase().includes(lowercaseQuery) ||
      project.tech?.some(tech => tech.toLowerCase().includes(lowercaseQuery))
    )

    setFilteredProjects(filtered)
  }, [searchQuery, projects])

  // Project Card Component
  const ProjectCard = ({ project }: { project: Project }) => (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium truncate">{project.title}</CardTitle>
        <Avatar className="h-6 w-6">
          <AvatarFallback>{project.ownerName?.[0] || 'U'}</AvatarFallback>
        </Avatar>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center text-sm text-muted-foreground">
            <GraduationCap className="mr-2 h-4 w-4" />
            <span className="truncate">{project.college || 'No college specified'}</span>
          </div>
          <div className="flex items-center text-sm text-muted-foreground">
            <MapPin className="mr-2 h-4 w-4" />
            <span className="truncate">{project.location || 'No location specified'}</span>
          </div>
          <p className="text-sm line-clamp-2">
            {project.description || 'No description provided'}
          </p>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>{project.collaborators?.length || 0} Collaborators</span>
            </div>
            <div className="flex items-center space-x-2">
              <Heart className="h-4 w-4" />
              <span>{project.likes || 0} Likes</span>
            </div>
          </div>
          <Button asChild className="w-full mt-2">
            <Link href={`/projects/${project.id}`}>
              View Project
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  // // Loading State
  // if (isLoading) {
  //   return (
  //     <div className="min-h-screen flex items-center justify-center">
  //       <div className="text-center">
  //         <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
  //         <p>Loading projects...</p>
  //       </div>
  //     </div>
  //   )
  // }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Projects</h1>
        {user && (
          <Button asChild>
            <Link href="/projects/new">
              <Plus className="mr-2 h-4 w-4" />
              Create Project
            </Link>
          </Button>
        )}
      </div>

      <div className="mb-6 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search projects..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {filteredProjects.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>No projects found</p>
          {searchQuery && (
            <Button 
              variant="link" 
              onClick={() => setSearchQuery("")}
            >
              Clear search
            </Button>
          )}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredProjects.map((project) => (
            <ProjectCard 
              key={project.id} 
              project={project} 
            />
          ))}
        </div>
      )}
    </div>
  )
}