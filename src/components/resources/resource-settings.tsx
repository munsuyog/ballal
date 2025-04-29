"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, Users, Trash2, Edit, Share } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { formatDistanceToNow } from "date-fns"
import { deleteDoc, doc } from "firebase/firestore"
import { db, auth } from "@/lib/firebase"
import { useRouter } from "next/navigation"
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/components/ui/use-toast"

interface ResourceSettingsProps {
  resourceData: {
    id: string;
    name: string;
    subject: string;
    code: string;
    ownerId: string;
    students: number;
    createdAt: any;
  }
}

export function ResourceSettings({ resourceData }: ResourceSettingsProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleDeleteResource = async () => {
    try {
      setIsDeleting(true);
      const user = auth.currentUser;
      
      if (!user || user.uid !== resourceData.ownerId) {
        throw new Error("You don't have permission to delete this resource");
      }
      
      await deleteDoc(doc(db, 'resources', resourceData.id));
      
      toast({
        title: "Resource deleted",
        description: "The resource has been deleted successfully",
      });
      
      router.push('/resources');
    } catch (error: any) {
      console.error('Error deleting resource:', error);
      toast({
        title: "Deletion failed",
        description: error.message || "Failed to delete resource",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const copyClassCode = () => {
    navigator.clipboard.writeText(resourceData.code);
    toast({
      title: "Class code copied",
      description: "Class code has been copied to clipboard",
    });
  };

  // Format the creation date nicely
  const formattedDate = resourceData.createdAt?.toDate 
    ? formatDistanceToNow(resourceData.createdAt.toDate(), { addSuffix: true })
    : 'Unknown date';

  return (
    <Card>
      <CardHeader>
        <CardTitle>Resource Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span>{resourceData.students} students</span>
        </div>
        <div className="flex items-center gap-3">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span>Created {formattedDate}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Class Code:</span>
          <div className="flex items-center gap-2">
            <code className="bg-muted px-2 py-1 rounded text-sm">{resourceData.code}</code>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={copyClassCode}
              title="Copy class code"
            >
              <Share className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <Separator className="my-4" />
        
        {auth.currentUser?.uid === resourceData.ownerId && (
          <div className="space-y-2">
            <Button variant="outline" className="w-full justify-start" asChild>
              <a href={`/resources/${resourceData.id}/edit`}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Resource
              </a>
            </Button>
            
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-destructive hover:text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Resource
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete this resource,
                    along with all associated content, assignments, and student data.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleDeleteResource}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    disabled={isDeleting}
                  >
                    {isDeleting ? "Deleting..." : "Delete Resource"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </CardContent>
    </Card>
  )
}