'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FilterSidebar } from "@/components/ui/filter-sidebar";
import { useToast } from "@/components/ui/use-toast";
import { 
  BookOpen, 
  Plus, 
  Search, 
  Star, 
  Filter,
  Loader2
} from "lucide-react";
import { collection, query, where, getDocs, orderBy, addDoc, serverTimestamp, updateDoc, doc, arrayUnion, arrayRemove } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { Resource } from "@/lib/types";

export default function ResourcesPage() {
  const [activeTab, setActiveTab] = useState("explore");
  const [resources, setResources] = useState<Resource[]>([]);
  const [myResources, setMyResources] = useState<Resource[]>([]);
  const [enrolledResources, setEnrolledResources] = useState<Resource[]>([]);
  const [starredResources, setStarredResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newResourceData, setNewResourceData] = useState({
    name: "",
    subject: "",
    description: ""
  });
  const [creatingResource, setCreatingResource] = useState(false);
  const [starredIds, setStarredIds] = useState<string[]>([]);

  const router = useRouter();
  const { toast } = useToast();

  // Filter sections for the sidebar
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
    }
  ];

  // Fetch all resources
  const fetchResources = async () => {
    try {
      setLoading(true);
      
      // Apply filters if any
      let constraints = [orderBy("createdAt", "desc")];
      if (selectedFilters.subject?.length) {
        constraints = [where("subject", "in", selectedFilters.subject), ...constraints];
      }

      const q = query(collection(db, "resources"), ...constraints);
      const querySnapshot = await getDocs(q);
      
      const fetchedResources = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Resource[];
      
      // Apply search filter
      let filteredResources = fetchedResources;
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        filteredResources = fetchedResources.filter(resource => 
          resource.name.toLowerCase().includes(searchLower) ||
          resource.subject.toLowerCase().includes(searchLower) ||
          resource.description?.toLowerCase().includes(searchLower)
        );
      }
      
      setResources(filteredResources);
    } catch (error) {
      console.error("Error fetching resources:", error);
      toast({
        title: "Error",
        description: "Failed to fetch resources",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch user's created resources
  const fetchUserResources = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;
      
      const q = query(collection(db, "resources"), where("ownerId", "==", user.uid), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      
      const fetchedResources = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Resource[];
      
      setMyResources(fetchedResources);
    } catch (error) {
      console.error("Error fetching user resources:", error);
      toast({
        title: "Error",
        description: "Failed to fetch your resources",
        variant: "destructive",
      });
    }
  };

  // Fetch resources the user is enrolled in
  const fetchEnrolledResources = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;
      
      // First get user doc to get enrolled resource IDs
      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDocs(query(collection(db, "users"), where("__name__", "==", user.uid)));

      if (userDocSnap.empty) return;
      
      const userData = userDocSnap.docs[0].data();
      const enrolledIds = userData.enrolledResources || [];

      if (enrolledIds.length === 0) {
        setEnrolledResources([]);
        return;
      }

      // Firestore "in" queries can only have up to 10 values
      // So we need to batch the requests if necessary
      const batchSize = 10;
      let fetchedResources: Resource[] = [];

      for (let i = 0; i < enrolledIds.length; i += batchSize) {
        const batch = enrolledIds.slice(i, i + batchSize);
        const q = query(collection(db, "resources"), where("__name__", "in", batch));
        const querySnapshot = await getDocs(q);
        
        const batchResources = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Resource[];
        
        fetchedResources = [...fetchedResources, ...batchResources];
      }
      
      setEnrolledResources(fetchedResources);
    } catch (error) {
      console.error("Error fetching enrolled resources:", error);
      toast({
        title: "Error",
        description: "Failed to fetch enrolled resources",
        variant: "destructive",
      });
    }
  };

  // Fetch starred resources
  const fetchStarredResources = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;
      
      // First get user doc to get starred resource IDs
      const userDocSnap = await getDocs(query(collection(db, "users"), where("__name__", "==", user.uid)));

      if (userDocSnap.empty) return;
      
      const userData = userDocSnap.docs[0].data();
      const starred = userData.starredResources || [];
      
      setStarredIds(starred);

      if (starred.length === 0) {
        setStarredResources([]);
        return;
      }

      // Fetch starred resources in batches
      const batchSize = 10;
      let fetchedResources: Resource[] = [];

      for (let i = 0; i < starred.length; i += batchSize) {
        const batch = starred.slice(i, i + batchSize);
        const q = query(collection(db, "resources"), where("__name__", "in", batch));
        const querySnapshot = await getDocs(q);
        
        const batchResources = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Resource[];
        
        fetchedResources = [...fetchedResources, ...batchResources];
      }
      
      setStarredResources(fetchedResources);
    } catch (error) {
      console.error("Error fetching starred resources:", error);
      toast({
        title: "Error",
        description: "Failed to fetch starred resources",
        variant: "destructive",
      });
    }
  };

  // Toggle star on a resource
  const toggleStarResource = async (resourceId: string) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please sign in to star resources",
          variant: "destructive",
        });
        return;
      }
      
      const userRef = doc(db, "users", user.uid);
      const isCurrentlyStarred = starredIds.includes(resourceId);
      
      if (isCurrentlyStarred) {
        // Remove the star
        await updateDoc(userRef, {
          starredResources: arrayRemove(resourceId)
        });
        
        // Update local state
        setStarredIds(starredIds.filter(id => id !== resourceId));
        setStarredResources(starredResources.filter(r => r.id !== resourceId));
        
        toast({
          title: "Resource unstarred",
          description: "Resource removed from your starred list",
        });
      } else {
        // Add the star
        await updateDoc(userRef, {
          starredResources: arrayUnion(resourceId)
        });
        
        // Update local state
        setStarredIds([...starredIds, resourceId]);
        
        // Find the resource in our existing lists to add to starred
        const resourceToStar = 
          resources.find(r => r.id === resourceId) ||
          myResources.find(r => r.id === resourceId) ||
          enrolledResources.find(r => r.id === resourceId);
          
        if (resourceToStar) {
          setStarredResources([...starredResources, resourceToStar]);
        }
        
        toast({
          title: "Resource starred",
          description: "Resource added to your starred list",
        });
      }
    } catch (error) {
      console.error("Error toggling star:", error);
      toast({
        title: "Error",
        description: "Failed to update star status",
        variant: "destructive",
      });
    }
  };

  // Create a new resource
  const createResource = async () => {
    try {
      setCreatingResource(true);
      const user = auth.currentUser;
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please sign in to create resources",
          variant: "destructive",
        });
        return;
      }
      
      // Generate a random class code
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      const resourceData = {
        name: newResourceData.name,
        subject: newResourceData.subject,
        description: newResourceData.description,
        code,
        ownerId: user.uid,
        ownerName: user.displayName || user.email,
        createdAt: serverTimestamp(),
        students: 0,
        coverColor: getRandomColor()
      };
      
      const docRef = await addDoc(collection(db, "resources"), resourceData);
      
      // Add resource to user's resources list
      await updateDoc(doc(db, "users", user.uid), {
        resources: arrayUnion(docRef.id)
      });
      
      toast({
        title: "Resource created",
        description: "Your resource has been created successfully",
      });
      
      // Reset form
      setNewResourceData({
        name: "",
        subject: "",
        description: ""
      });
      
      // Close dialog and refresh resources
      setShowCreateDialog(false);
      fetchUserResources();
      
      // Navigate to the resource page
      router.push(`/resources/${docRef.id}`);
    } catch (error) {
      console.error("Error creating resource:", error);
      toast({
        title: "Error",
        description: "Failed to create resource",
        variant: "destructive",
      });
    } finally {
      setCreatingResource(false);
    }
  };

  // Fetch data when component mounts
  useEffect(() => {
    fetchResources();
    fetchUserResources();
    fetchEnrolledResources();
    fetchStarredResources();
  }, []);

  // Re-fetch when filters or search query changes
  useEffect(() => {
    fetchResources();
  }, [selectedFilters, searchQuery]);

  // Helper function for filter changes
  const handleFilterChange = (sectionId: string, values: string[]) => {
    setSelectedFilters(prev => ({
      ...prev,
      [sectionId]: values
    }));
  };

  // Helper to clear all filters
  const clearAllFilters = () => {
    setSelectedFilters({});
    setSearchQuery("");
  };
  
  // Helper to get a random color for resource covers
  const getRandomColor = () => {
    const colors = [
      "bg-primary/10", 
      "bg-secondary/10", 
      "bg-primary/5", 
      "bg-secondary/5"
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  // Resource Card Component
  const ResourceCard = ({ resource, showStar = true }: { resource: Resource, showStar?: boolean }) => (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className={`h-24 ${resource.coverColor || getRandomColor()} relative`}>
        {showStar && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-2"
            onClick={() => toggleStarResource(resource.id)}
          >
            <Star 
              className={`h-5 w-5 ${starredIds.includes(resource.id) ? 'fill-yellow-400 text-yellow-400' : 'text-white'}`}
            />
          </Button>
        )}
      </div>
      <CardHeader>
        <CardTitle>{resource.name}</CardTitle>
        <CardDescription>{resource.ownerId === auth.currentUser?.uid ? "You" : resource.ownerName}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center">
            <Users className="h-4 w-4 mr-1" />
            {resource.students} students
          </div>
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-1" />
            {resource.createdAt?.toDate?.() ? new Date(resource.createdAt.toDate()).toLocaleDateString() : 'Recent'}
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button className="w-full" asChild>
          <Link href={`/resources/${resource.id}`}>View Materials</Link>
        </Button>
      </CardFooter>
    </Card>
  );

  // Create Resource Dialog
  const CreateResourceDialog = () => (
    <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Resource
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <form onSubmit={(e) => { e.preventDefault(); createResource(); }}>
          <DialogHeader>
            <DialogTitle>Create Resource</DialogTitle>
            <DialogDescription>
              Create a new classroom to share study materials and announcements.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Resource Name</Label>
              <Input
                id="name"
                placeholder="e.g., Advanced Web Development"
                value={newResourceData.name}
                onChange={(e) => setNewResourceData({ ...newResourceData, name: e.target.value })}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                placeholder="e.g., Computer Science"
                value={newResourceData.subject}
                onChange={(e) => setNewResourceData({ ...newResourceData, subject: e.target.value })}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe what students will learn in this classroom..."
                value={newResourceData.description}
                onChange={(e) => setNewResourceData({ ...newResourceData, description: e.target.value })}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={creatingResource}>
              {creatingResource ? "Creating..." : "Create Resource"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );

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
                <TabsTrigger value="enrolled">Enrolled</TabsTrigger>
                <TabsTrigger value="starred">Starred</TabsTrigger>
              </TabsList>

              <TabsContent value="explore" className="space-y-6">
                {loading ? (
                  <div className="flex justify-center items-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : resources.length > 0 ? (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {resources.map((resource) => (
                      <ResourceCard key={resource.id} resource={resource} />
                    ))}
                    <Card className="border-dashed hover:border-primary/50 hover:bg-primary/5 transition-colors cursor-pointer" onClick={() => setShowCreateDialog(true)}>
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
                    <h3 className="text-lg font-medium mb-2">No Resources Found</h3>
                    <p className="text-muted-foreground mb-6">Try adjusting your search or filters</p>
                    <Button onClick={clearAllFilters}>Clear Filters</Button>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="my-resources">
                {myResources.length > 0 ? (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {myResources.map((resource) => (
                      <ResourceCard key={resource.id} resource={resource} showStar={false} />
                    ))}
                    <Card className="border-dashed hover:border-primary/50 hover:bg-primary/5 transition-colors cursor-pointer" onClick={() => setShowCreateDialog(true)}>
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
                    <Button onClick={() => setShowCreateDialog(true)}>Create Resource</Button>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="enrolled">
                {enrolledResources.length > 0 ? (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {enrolledResources.map((resource) => (
                      <ResourceCard key={resource.id} resource={resource} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-medium mb-2">Not Enrolled in Any Resources</h3>
                    <p className="text-muted-foreground mb-6">Join a resource using a class code</p>
                    <Button variant="outline">Enter Class Code</Button>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="starred">
                {starredResources.length > 0 ? (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {starredResources.map((resource) => (
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
  );
}

// Import components needed for the dialog
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Users, Clock } from "lucide-react";