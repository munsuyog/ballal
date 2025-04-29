"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FilterSidebar } from "@/components/ui/filter-sidebar"
import { CreateResourceDialog } from "@/components/resources/create-resource-dialog"
import { BookOpen, Plus, Search, FileText, Users, Clock, Star, Filter } from "lucide-react"

export default function ResourcesPage() {
  const [activeTab, setActiveTab] = useState("explore")
  const [starredResources, setStarredResources] = useState<number[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({})
  const [searchQuery, setSearchQuery] = useState("")

  const classrooms = [
    {
      id: 1,
      name: "Data Structures & Algorithms",
      instructor: "Dr. Sarah Chen",
      students: 156,
      lastUpdated: "2 days ago",
      coverColor: "bg-primary/10",
    },
    {
      id: 2,
      name: "Web Development",
      instructor: "Prof. Michael Rodriguez",
      students: 128,
      lastUpdated: "1 day ago",
      coverColor: "bg-secondary/10",
    },
    {
      id: 3,
      name: "Machine Learning Fundamentals",
      instructor: "Dr. James Wilson",
      students: 142,
      lastUpdated: "3 hours ago",
      coverColor: "bg-primary/5",
    },
  ]

  const myResources = [
    {
      id: 4,
      name: "Introduction to Python Programming",
      instructor: "You",
      students: 45,
      lastUpdated: "1 hour ago",
      coverColor: "bg-secondary/10",
    },
    {
      id: 5,
      name: "Web Security Fundamentals",
      instructor: "You",
      students: 32,
      lastUpdated: "1 day ago",
      coverColor: "bg-primary/10",
    },
  ]

  const filterSections = [
    {
      id: "subject",
      title: "Subject Area",
      type: "checkbox" as const,
      options: [
        { id: "computer-science", label: "Computer Science", count: 156 },
        { id: "engineering", label: "Engineering", count: 124 },
        { id: "mathematics", label: "Mathematics", count: 98 },
        { id: "physics", label: "Physics", count: 87 },
        { id: "chemistry", label: "Chemistry", count: 76 },
      ]
    },
    {
      id: "resourceType",
      title: "Resource Type",
      type: "checkbox" as const,
      options: [
        { id: "lecture-notes", label: "Lecture Notes", count: 245 },
        { id: "practice-problems", label: "Practice Problems", count: 189 },
        { id: "study-guides", label: "Study Guides", count: 167 },
        { id: "past-papers", label: "Past Papers", count: 134 },
        { id: "research-papers", label: "Research Papers", count: 98 },
      ]
    },
    {
      id: "level",
      title: "Difficulty Level",
      type: "checkbox" as const,
      options: [
        { id: "beginner", label: "Beginner", count: 234 },
        { id: "intermediate", label: "Intermediate", count: 189 },
        { id: "advanced", label: "Advanced", count: 145 },
      ]
    },
    {
      id: "rating",
      title: "Rating",
      type: "rating" as const,
    },
    {
      id: "lastUpdated",
      title: "Last Updated",
      type: "checkbox" as const,
      options: [
        { id: "last-week", label: "Last Week", count: 145 },
        { id: "last-month", label: "Last Month", count: 234 },
        { id: "last-3-months", label: "Last 3 Months", count: 367 },
        { id: "last-year", label: "Last Year", count: 589 },
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

  const toggleStar = (id: number) => {
    setStarredResources(prev => 
      prev.includes(id) 
        ? prev.filter(resourceId => resourceId !== id)
        : [...prev, id]
    )
  }

  const starredItems = [...classrooms, ...myResources].filter(item => starredResources.includes(item.id))

  const ResourceCard = ({ resource, showStar = true }: { resource: any, showStar?: boolean }) => (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className={`h-24 ${resource.coverColor} relative`}>
        {showStar && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-2"
            onClick={() => toggleStar(resource.id)}
          >
            <Star 
              className={`h-5 w-5 ${starredResources.includes(resource.id) ? 'fill-yellow-400 text-yellow-400' : 'text-white'}`}
            />
          </Button>
        )}
      </div>
      <CardHeader>
        <CardTitle>{resource.name}</CardTitle>
        <CardDescription>{resource.instructor}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center">
            <Users className="h-4 w-4 mr-1" />
            {resource.students} students
          </div>
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-1" />
            {resource.lastUpdated}
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button className="w-full">View Materials</Button>
      </CardFooter>
    </Card>
  )

  return (
    <div className="resources-bg min-h-screen">
      <div className="container mx-auto px-4 pt-24 pb-12">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Learning Resources</h1>
            <p className="text-muted-foreground">Access study materials and join virtual classrooms</p>
          </div>
          <CreateResourceDialog />
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
                    placeholder="Search resources by title, subject, or type..."
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
                <TabsTrigger value="explore">Explore</TabsTrigger>
                <TabsTrigger value="my-resources">My Resources</TabsTrigger>
                <TabsTrigger value="starred">Starred</TabsTrigger>
              </TabsList>

              <TabsContent value="explore" className="space-y-6">
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {classrooms.map((classroom) => (
                    <ResourceCard key={classroom.id} resource={classroom} />
                  ))}
                  <Card className="border-dashed hover:border-primary/50 hover:bg-primary/5 transition-colors cursor-pointer">
                    <CardHeader className="text-center">
                      <Plus className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <CardTitle>Create New Resource</CardTitle>
                      <CardDescription>Share your study materials</CardDescription>
                    </CardHeader>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="my-resources">
                {myResources.length > 0 ? (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {myResources.map((resource) => (
                      <ResourceCard key={resource.id} resource={resource} showStar={false} />
                    ))}
                    <Card className="border-dashed hover:border-primary/50 hover:bg-primary/5 transition-colors cursor-pointer">
                      <CardHeader className="text-center">
                        <Plus className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        <CardTitle>Create New Resource</CardTitle>
                        <CardDescription>Share your study materials</CardDescription>
                      </CardHeader>
                    </Card>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-medium mb-2">No Resources Created</h3>
                    <p className="text-muted-foreground mb-6">Create your first resource to start sharing materials</p>
                    <Button>Create Resource</Button>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="starred">
                {starredItems.length > 0 ? (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {starredItems.map((resource) => (
                      <ResourceCard key={resource.id} resource={resource} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Star className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-medium mb-2">No Starred Resources</h3>
                    <p className="text-muted-foreground mb-6">Star your favorite resources to access them quickly</p>
                    <Button onClick={() => setActiveTab("explore")}>Browse Resources</Button>
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