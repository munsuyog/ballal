"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FilterSidebar } from "@/components/ui/filter-sidebar"
import { Avatar } from "@/components/ui/avatar"
import { 
  BookOpen, 
  Calendar,
  Clock, 
  FileText, 
  FolderPlus, 
  GraduationCap,
  MessageSquare,
  MoreVertical,
  PenLine,
  Plus,
  Search,
  Settings,
  Users,
  Filter 
} from "lucide-react"

export default function CourseworkPage() {
  const [activeTab, setActiveTab] = useState("stream")
  const [showFilters, setShowFilters] = useState(false)
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({})
  const [searchQuery, setSearchQuery] = useState("")

  const courses = [
    {
      id: 1,
      name: "Advanced Database Systems",
      code: "CS401",
      instructor: "Dr. Emily Parker",
      coverColor: "bg-primary/10",
      nextAssignment: "Database Normalization Project",
      dueDate: "Feb 10, 2024",
    },
    {
      id: 2,
      name: "Software Engineering",
      code: "CS402",
      instructor: "Prof. David Kim",
      coverColor: "bg-secondary/10",
      nextAssignment: "System Design Document",
      dueDate: "Feb 12, 2024",
    },
    {
      id: 3,
      name: "Computer Networks",
      code: "CS403",
      instructor: "Dr. Lisa Thompson",
      coverColor: "bg-primary/5",
      nextAssignment: "Network Protocol Implementation",
      dueDate: "Feb 15, 2024",
    },
  ]

  const announcements = [
    {
      id: 1,
      course: "Advanced Database Systems",
      instructor: "Dr. Emily Parker",
      content: "Guest lecture on NoSQL databases this Thursday. Attendance is mandatory.",
      date: "2 hours ago",
      comments: 5,
    },
    {
      id: 2,
      course: "Software Engineering",
      instructor: "Prof. David Kim",
      content: "Project presentations have been rescheduled to next week. Updated schedule posted.",
      date: "1 day ago",
      comments: 8,
    },
  ]

  const assignments = [
    {
      id: 1,
      title: "Database Normalization Project",
      course: "Advanced Database Systems",
      dueDate: "Feb 10, 2024",
      status: "Not submitted",
      points: 100,
    },
    {
      id: 2,
      title: "System Design Document",
      course: "Software Engineering",
      dueDate: "Feb 12, 2024",
      status: "Draft saved",
      points: 150,
    },
    {
      id: 3,
      title: "Network Protocol Implementation",
      course: "Computer Networks",
      dueDate: "Feb 15, 2024",
      status: "Not started",
      points: 120,
    },
  ]

  const filterSections = [
    {
      id: "department",
      title: "Department",
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
      id: "courseLevel",
      title: "Course Level",
      type: "checkbox" as const,
      options: [
        { id: "100", label: "100 Level", count: 45 },
        { id: "200", label: "200 Level", count: 56 },
        { id: "300", label: "300 Level", count: 78 },
        { id: "400", label: "400 Level", count: 67 },
      ]
    },
    {
      id: "semester",
      title: "Semester",
      type: "checkbox" as const,
      options: [
        { id: "fall-2023", label: "Fall 2023", count: 234 },
        { id: "spring-2024", label: "Spring 2024", count: 345 },
        { id: "summer-2024", label: "Summer 2024", count: 123 },
      ]
    },
    {
      id: "assignmentType",
      title: "Assignment Type",
      type: "checkbox" as const,
      options: [
        { id: "homework", label: "Homework", count: 189 },
        { id: "project", label: "Project", count: 145 },
        { id: "quiz", label: "Quiz", count: 167 },
        { id: "exam", label: "Exam", count: 98 },
      ]
    },
    {
      id: "dueDate",
      title: "Due Date",
      type: "checkbox" as const,
      options: [
        { id: "overdue", label: "Overdue", count: 23 },
        { id: "due-today", label: "Due Today", count: 12 },
        { id: "due-this-week", label: "Due This Week", count: 45 },
        { id: "due-next-week", label: "Due Next Week", count: 67 },
        { id: "later", label: "Later", count: 89 },
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

  return (
    <div className="coursework-bg min-h-screen">
      <div className="container mx-auto px-4 pt-24 pb-12">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Coursework</h1>
            <p className="text-muted-foreground">Manage your courses, assignments, and academic progress</p>
          </div>
          <div className="flex gap-4">
            <Button>
              <FolderPlus className="h-4 w-4 mr-2" />
              Join Course
            </Button>
            <Button variant="outline">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </div>
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
                    placeholder="Search courses, assignments, or announcements..."
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

            <div className="grid lg:grid-cols-4 gap-6 mb-8">
              <Card className="lg:col-span-3">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-5 w-5 text-primary" />
                    <CardTitle>Current Semester</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {courses.map((course) => (
                      <Card key={course.id} className="hover:shadow-md transition-shadow">
                        <div className={`h-20 ${course.coverColor} relative`}>
                          <Button variant="ghost" size="icon" className="absolute right-2 top-2">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </div>
                        <CardHeader>
                          <CardTitle className="text-lg">{course.name}</CardTitle>
                          <CardDescription>{course.code} • {course.instructor}</CardDescription>
                        </CardHeader>
                        <CardContent className="text-sm">
                          <p className="text-muted-foreground mb-1">Next Assignment:</p>
                          <p className="font-medium">{course.nextAssignment}</p>
                          <p className="text-sm text-muted-foreground mt-2">Due: {course.dueDate}</p>
                        </CardContent>
                        <CardFooter>
                          <Button variant="outline" className="w-full">Join Course</Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Upcoming</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {assignments.slice(0, 3).map((assignment) => (
                    <div key={assignment.id} className="flex items-start gap-3">
                      <div className="h-2 w-2 rounded-full bg-primary mt-2" />
                      <div>
                        <p className="font-medium">{assignment.title}</p>
                        <p className="text-sm text-muted-foreground">{assignment.course}</p>
                        <p className="text-sm text-muted-foreground">Due: {assignment.dueDate}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
              <TabsList>
                <TabsTrigger value="stream">Stream</TabsTrigger>
                <TabsTrigger value="assignments">Assignments</TabsTrigger>
                <TabsTrigger value="grades">Grades</TabsTrigger>
              </TabsList>

              <TabsContent value="stream" className="space-y-6">
                <div className="grid lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 space-y-6">
                    {announcements.map((announcement) => (
                      <Card key={announcement.id}>
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex gap-4">
                              <Avatar />
                              <div>
                                <CardTitle className="text-base">{announcement.instructor}</CardTitle>
                                <CardDescription>{announcement.course} • {announcement.date}</CardDescription>
                              </div>
                            </div>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p>{announcement.content}</p>
                        </CardContent>
                        <CardFooter>
                          <Button variant="ghost" size="sm">
                            <MessageSquare className="h-4 w-4 mr-2" />
                            {announcement.comments} comments
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>

                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>To-Do</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {assignments.map((assignment) => (
                          <div key={assignment.id} className="flex items-start gap-3">
                            <PenLine className="h-4 w-4 text-muted-foreground mt-1" />
                            <div>
                              <p className="font-medium">{assignment.title}</p>
                              <p className="text-sm text-muted-foreground">{assignment.course}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Clock className="h-3 w-3 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">Due {assignment.dueDate}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="assignments" className="space-y-6">
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {assignments.map((assignment) => (
                    <Card key={assignment.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle>{assignment.title}</CardTitle>
                            <CardDescription>{assignment.course}</CardDescription>
                          </div>
                          <FileText className="h-5 w-5 text-muted-foreground" />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Due Date:</span>
                            <span>{assignment.dueDate}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Status:</span>
                            <span>{assignment.status}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Points:</span>
                            <span>{assignment.points}</span>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Button className="w-full">View Assignment</Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="grades">
                <Card>
                  <CardHeader>
                    <CardTitle>Grade Summary</CardTitle>
                    <CardDescription>View your academic performance across all courses</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {courses.map((course) => (
                        <div key={course.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <h4 className="font-medium">{course.name}</h4>
                            <p className="text-sm text-muted-foreground">{course.code}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">92%</p>
                            <p className="text-sm text-muted-foreground">A</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}