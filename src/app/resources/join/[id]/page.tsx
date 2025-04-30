"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Plus, LogIn } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { collection, query, where, getDocs, updateDoc, arrayUnion, doc, increment } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";

export default function JoinResourceDialog() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [classCode, setClassCode] = useState('')
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('You must be logged in to join a resource');
      }

      const trimmedCode = classCode.trim().toUpperCase();
      if (!trimmedCode) {
        throw new Error('Please enter a valid class code');
      }
      
      // Find resource by code
      const resourceQuery = query(
        collection(db, 'resources'),
        where('code', '==', trimmedCode)
      );
      
      const resourceSnapshot = await getDocs(resourceQuery);
      
      if (resourceSnapshot.empty) {
        throw new Error('Invalid class code. Please check and try again.');
      }
      
      const resourceDoc = resourceSnapshot.docs[0];
      const resourceId = resourceDoc.id;
      const resourceData = resourceDoc.data();
      
      // Check if user is the owner (cannot join their own resource)
      if (resourceData.ownerId === user.uid) {
        throw new Error('You cannot join your own resource as a student.');
      }
      
      // Check if user is already enrolled
      const userDoc = await getDocs(query(
        collection(db, 'users'),
        where('enrolledResources', 'array-contains', resourceId)
      ));
      
      if (!userDoc.empty && userDoc.docs[0].id === user.uid) {
        throw new Error('You are already enrolled in this resource.');
      }
      
      // Add resource to user's enrolled resources
      await updateDoc(doc(db, 'users', user.uid), {
        enrolledResources: arrayUnion(resourceId)
      });
      
      // Increment student count
      await updateDoc(doc(db, 'resources', resourceId), {
        students: increment(1)
      });
      
      toast({
        title: "Joined successfully",
        description: `You have joined ${resourceData.name}`,
      });
      
      setOpen(false)
      router.push(`/resources/${resourceId}`)
    } catch (error: any) {
      console.error('Error joining resource:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to join resource",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <LogIn className="h-4 w-4 mr-2" />
          Join Resource
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Join a Resource</DialogTitle>
            <DialogDescription>
              Enter the class code provided by your instructor to join a resource.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="classCode">Class Code</Label>
              <Input
                id="classCode"
                placeholder="Enter class code (e.g., ABC123)"
                value={classCode}
                onChange={(e) => setClassCode(e.target.value)}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Joining...
                </>
              ) : (
                "Join Resource"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}