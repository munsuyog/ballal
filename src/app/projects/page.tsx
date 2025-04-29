"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FilterSidebar } from "@/components/ui/filter-sidebar"
import { Avatar } from "@/components/ui/avatar"
import Link from "next/link"
import { 
  BookOpen,
  Code2,
  FileCode2,
  Filter,
  GitBranch,
  Globe,
  GraduationCap,
  Heart,
  MapPin,
  Plus,
  Search,
  Share2,
  Tags,
  Users,
  X 
} from "lucide-react"

export default function ProjectsPage() {
  const [activeTab, setActiveTab] = useState("discover")
  const [likedProjects, setLikedProjects] = useState<number[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({})
  const [searchQuery, setSearchQuery] = useState("")

  const projects = [
    {
      id: 1,
      title: "AI-Powered Study Assistant",
      description: "Building an intelligent chatbot that helps students with their coursework and study planning.",
      category: "Artificial Intelligence",
      tech: ["Python", "TensorFlow", "NLP"],
      collaborators: 4,
      views: 256,
      likes: 45,
      status: "In Progress",
      deadline: "Apr 15, 2024",
      coverColor: "bg-primary/10",
      owner: {
        name: "Sarah Chen",
        role: "CS Student",
        avatar: "SC"
      },
      college: "Stanford University",
      branch: "Computer Science",
      location: "Stanford, CA"
    },
    {
      id: 2,
      title: "Sustainable Campus Initiative",
      description: "Developing a mobile app to track and reduce campus energy consumption through student engagement.",
      category: "Mobile Development",
      tech: ["React Native", "Node.js", "IoT"],
      collaborators: 3,
      views: 189,
      likes: 32,
      status: "Open",
      deadline: "May 1, 2024",
      coverColor: "bg-secondary/10",
      owner: {
        name: "Michael Park",
        role: "Environmental Science",
        avatar: "MP"
      },
      college: "MIT",
      branch: "Environmental Engineering",
      location: "Cambridge, MA"
    },
    {
      id: 3,
      title: "Virtual Lab Simulator",
      description: "Creating an interactive 3D environment for conducting virtual chemistry experiments.",
      category: "Virtual Reality",
      tech: ["Unity", "C#", "WebGL"],
      collaborators: 5,
      views: 312,
      likes: 67,
      status: "Open",
      deadline: "Apr 30, 2024",
      coverColor: "bg-primary/5",
      owner: {
        name: "Emma Wilson",
        role: "Chemistry Student",
        avatar: "EW"
      },
      college: "UC Berkeley",
      branch: "Chemistry",
      location: "Berkeley, CA"
    }
  ]

  const myProjects = [
    {
      id: 4,
      title: "Student Portfolio Generator",
      description: "A web app that helps students create professional portfolios from their academic projects.",
      category: "Web Development",
      tech: ["React", "Next.js", "Tailwind"],
      collaborators: 2,
      views: 145,
      likes: 28,
      status: "In Progress",
      deadline: "Apr 20, 2024",
      coverColor: "bg-secondary/10",
      owner: {
        name: "You",
        role: "Project Lead",
        avatar: "YO"
      },
      college: "Your University",
      branch: "Computer Science",
      location: "Your Location"
    }
  ]

  const filterSections = [
    {
      id: "college",
      title: "College",
      type: "search" as const,
      searchPlaceholder: "Search colleges...",
      options: [
        { id: "stanford", label: "Stanford University", count: 45 },
        { id: "mit", label: "MIT", count: 32 },
        { id: "berkeley", label: "UC Berkeley", count: 28 },
      ]
    },
    {
      id: "category",
      title: "Category",
      type: "checkbox" as const,
      options: [
        { id: "web-dev", label: "Web Development", count: 128 },
        { id: "ai-ml", label: "AI & Machine Learning", count: 95 },
        { id: "mobile", label: "Mobile Development", count: 76 },
        { id: "research", label: "Research", count: 64 },
        { id: "iot", label: "IoT", count: 45 },
      ]
    },
    {
      id: "skills",
      title: "Skills & Technologies",
      type: "search" as const,
      searchPlaceholder: "Search skills...",
      options: [
        { id: "react", label: "React", count: 156 },
        { id: "python", label: "Python", count: 142 },
        { id: "javascript", label: "JavaScript", count: 128 },
        { id: "node", label: "Node.js", count: 98 },
      ]
    },
    {
      id: "rating",
      title: "Project Rating",
      type: "rating" as const,
    },
    {
      id: "status",
      title: "Project Status",
      type: "checkbox" as const,
      options: [
        { id: "open", label: "Open for Collaboration", count: 245 },
        { id: "in-progress", label: "In Progress", count: 189 },
        { id: "completed", label: "Completed", count: 124 },
      ]
    }
  ]

  const handleFilterChange = (sectionId: string, values: string[]) => {
    setSelectedFilters(prev => ({
      ...prev,
      [sectionId]: values
    }))
  }

  const clearAllFilters = () => {
    setSelectedFilters({})
    setSearchQuery("")
  }

  const filterProjects = (projectsList: typeof projects) => {
    return projectsList.filter(project => {
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase()
        const matchesSearch = 
          project.title.toLowerCase().includes(searchLower) ||
          project.description.toLowerCase().includes(searchLower) ||
          project.tech.some(tech => tech.toLowerCase().includes(searchLower)) ||
          project.college.toLowerCase().includes(searchLower) ||
          project.location.toLowerCase().includes(searchLower)
        
        if (!matchesSearch) return false
      }

      if (selectedFilters.category?.length > 0) {
        if (!selectedFilters.category.includes(project.category.toLowerCase().replace(" ", "-"))) {
          return false
        }
      }

      if (selectedFilters.status?.length > 0) {
        if (!selectedFilters.status.includes(project.status.toLowerCase().replace(" ", "-"))) {
          return false
        }
      }

      if (selectedFilters.skills?.length > 0) {
        const hasMatchingSkill = project.tech.some(tech =>
          selectedFilters.skills.includes(tech.toLowerCase())
        )
        if (!hasMatchingSkill) return false
      }

      if (selectedFilters.college?.length > 0) {
        if (!selectedFilters.college.includes(project.college.toLowerCase().replace(/\s+/g, "-"))) {
          return false
        }
      }

      return true
    })
  }

  const toggleLike = (id: number, e: React.MouseEvent) => {
    e.preventDefault() // Prevent event bubbling
    e.stopPropagation() // Stop event from propagating to parent elements
    setLikedProjects(prev => 
      prev.includes(id) 
        ? prev.filter(projectId => projectId !== id)
        : [...prev, id]
    )
  }

  const filteredProjects = filterProjects(projects)

  const ProjectCard = ({ project }: { project: any }) => (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className={`h-32 ${project.coverColor} relative p-4`}>
        <div className="flex justify-between">
          <span className="bg-background/90 text-foreground px-3 py-1 rounded-full text-sm">
            {project.category}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="text-background hover:text-primary"
            onClick={(e) => toggleLike(project.id, e)}
          >
            <Heart className={`h-5 w-5 ${likedProjects.includes(project.id) ? 'fill-primary text-primary' : ''}`} />
          </Button>
        </div>
      </div>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="line-clamp-1">{project.title}</CardTitle>
            <CardDescription className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <span className="text-xs">{project.owner.avatar}</span>
              </Avatar>
              <span>{project.owner.name}</span>
              <span>•</span>
              <span>{project.owner.role}</span>
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
          <GraduationCap className="h-4 w-4" />
          <span>{project.college}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <MapPin className="h-4 w-4" />
          <span>{project.location}</span>
        </div>
        <p className="text-muted-foreground text-sm line-clamp-2 mb-4">
          {project.description}
        </p>
        <div className="flex flex-wrap gap-2 mb-4">
          {project.tech.map((tech: string) => (
            <span key={tech} className="bg-muted px-2 py-1 rounded-md text-xs">
              {tech}
            </span>
          ))}
        </div>
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {project.collaborators}
            </span>
            <span className="flex items-center gap-1">
              <Heart className="h-4 w-4" />
              {project.likes}
            </span>
          </div>
          <span className={`px-2 py-1 rounded-full text-xs ${
            project.status === "Open" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
          }`}>
            {project.status}
          </span>
        </div>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button className="flex-1" asChild>
          <Link href={`/projects/${project.id}`}>View Project</Link>
        </Button>
        <Button variant="outline" onClick={(e) => e.preventDefault()}>
          <Share2 className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  )

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container mx-auto px-4 pt-24 pb-12">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Projects</h1>
            <p className="text-muted-foreground">Discover, collaborate, and showcase your academic projects</p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Project
          </Button>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {showFilters && (
            <div className="lg:col-span-1">
              <FilterSidebar
                sections={filterSections}
                selectedFilters={selectedFilters}
                onFilterChange={handleFilterChange}
                onClearAll={clearAllFilters}
              />
            </div>
          )}

          <div className={`${showFilters ? 'lg:col-span-3' : 'lg:col-span-4'}`}>
            <div className="flex gap-4 mb-8">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search projects by title, skills, or keywords..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <Button 
                variant={showFilters ? "default" : "outline"}
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
                {Object.keys(selectedFilters).length > 0 && (
                  <span className="ml-2 bg-primary/20 px-2 py-0.5 rounded-full text-xs">
                    {Object.values(selectedFilters).flat().length}
                  </span>
                )}
              </Button>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
              <TabsList>
                <TabsTrigger value="discover">Discover</TabsTrigger>
                <TabsTrigger value="my-projects">My Projects</TabsTrigger>
                <TabsTrigger value="collaborating">Collaborating</TabsTrigger>
                <TabsTrigger value="liked">Liked</TabsTrigger>
              </TabsList>

              <TabsContent value="discover" className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-6">
                  {filteredProjects.map((project) => (
                    <ProjectCard key={project.id} project={project} />
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="my-projects">
                {myProjects.length > 0 ? (
                  <div className="grid sm:grid-cols-2 gap-6">
                    {myProjects.map((project) => (
                      <ProjectCard key={project.id} project={project} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FileCode2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-medium mb-2">No Projects Created</h3>
                    <p className="text-muted-foreground mb-6">Start your first project and showcase your work</p>
                    <Button>Create Project</Button>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="collaborating">
                <div className="text-center py-12">
                  <GitBranch className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">No Active Collaborations</h3>
                  <p className="text-muted-foreground mb-6">Join projects to start collaborating with others</p>
                  <Button onClick={() => setActiveTab("discover")}>Browse Projects</Button>
                </div>
              </TabsContent>

              <TabsContent value="liked">
                {likedProjects.length > 0 ? (
                  <div className="grid sm:grid-cols-2 gap-6">
                    {projects.filter(p => likedProjects.includes(p.id)).map((project) => (
                      <ProjectCard key={project.id} project={project} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Heart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-medium mb-2">No Liked Projects</h3>
                    <p className="text-muted-foreground mb-6">Like projects to save them for later</p>
                    <Button onClick={() => setActiveTab("discover")}>Browse Projects</Button>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}