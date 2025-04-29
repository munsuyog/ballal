// lib/services/resources-service.ts
import { 
    collection, 
    query, 
    where, 
    orderBy, 
    getDocs, 
    getDoc,
    doc, 
    addDoc, 
    updateDoc, 
    deleteDoc, 
    serverTimestamp,
    increment,
    arrayUnion,
    arrayRemove,
    DocumentData,
    FirestoreError
  } from 'firebase/firestore';
  import { db, auth } from '@/lib/firebase';
  import { Resource } from '@/lib/types';
  
  // Get all resources (with optional filters)
  export const getResources = async (filters?: {
    subject?: string;
    ownerId?: string;
    resourceType?: string;
    starred?: boolean;
  }): Promise<Resource[]> => {
    try {
      let q = collection(db, 'resources');
      
      // Convert to query with filters if needed
      if (filters) {
        q = query(
          collection(db, 'resources'),
          ...(filters.subject ? [where('subject', '==', filters.subject)] : []),
          ...(filters.ownerId ? [where('ownerId', '==', filters.ownerId)] : []),
          ...(filters.resourceType ? [where('resourceType', '==', filters.resourceType)] : []),
          orderBy('createdAt', 'desc')
        );
      }
      
      const querySnapshot = await getDocs(q);
      
      let resources = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Resource[];
      
      // Filter starred resources if needed
      if (filters?.starred && auth.currentUser) {
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        const userData = userDoc.data();
        
        if (userData && userData.starredResources) {
          resources = resources.filter(resource => 
            userData.starredResources.includes(resource.id)
          );
        } else {
          // If user has no starred resources, return empty array
          resources = [];
        }
      }
      
      return resources;
    } catch (error) {
      console.error('Error getting resources:', error);
      throw error;
    }
  };
  
  // Get a single resource by ID
  export const getResourceById = async (id: string): Promise<Resource | null> => {
    try {
      const docRef = doc(db, 'resources', id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        } as Resource;
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error getting resource:', error);
      throw error;
    }
  };
  
  // Create a new resource
  export const createResource = async (data: Omit<Resource, 'id' | 'createdAt' | 'ownerId' | 'ownerName' | 'students'>): Promise<string> => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');
  
      // Generate a random class code
      const code = generateClassCode();
      
      const docRef = await addDoc(collection(db, 'resources'), {
        ...data,
        code,
        ownerId: user.uid,
        ownerName: user.displayName || user.email,
        createdAt: serverTimestamp(),
        students: 0,
      });
      
      // Add resource ID to user's resources list
      await updateDoc(doc(db, 'users', user.uid), {
        resources: arrayUnion(docRef.id)
      });
  
      return docRef.id;
    } catch (error) {
      console.error('Error creating resource:', error);
      throw error;
    }
  };
  
  // Update a resource
  export const updateResource = async (id: string, data: Partial<Resource>): Promise<void> => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');
      
      // Check if the current user is the owner
      const resourceDoc = await getDoc(doc(db, 'resources', id));
      if (!resourceDoc.exists()) throw new Error('Resource not found');
      
      const resourceData = resourceDoc.data();
      if (resourceData.ownerId !== user.uid) {
        throw new Error('You do not have permission to update this resource');
      }
      
      await updateDoc(doc(db, 'resources', id), {
        ...data,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating resource:', error);
      throw error;
    }
  };
  
  // Delete a resource
  export const deleteResource = async (id: string): Promise<void> => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');
      
      // Check if the current user is the owner
      const resourceDoc = await getDoc(doc(db, 'resources', id));
      if (!resourceDoc.exists()) throw new Error('Resource not found');
      
      const resourceData = resourceDoc.data();
      if (resourceData.ownerId !== user.uid) {
        throw new Error('You do not have permission to delete this resource');
      }
      
      // Remove resource from user's resources list
      await updateDoc(doc(db, 'users', user.uid), {
        resources: arrayRemove(id)
      });
      
      // Delete the resource
      await deleteDoc(doc(db, 'resources', id));
    } catch (error) {
      console.error('Error deleting resource:', error);
      throw error;
    }
  };
  
  // Join a resource as a student
  export const joinResource = async (code: string): Promise<string> => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');
      
      // Find resource by code
      const q = query(collection(db, 'resources'), where('code', '==', code));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        throw new Error('Invalid class code');
      }
      
      const resourceDoc = querySnapshot.docs[0];
      const resourceId = resourceDoc.id;
      
      // Add user to resource's students
      await updateDoc(doc(db, 'resources', resourceId), {
        students: increment(1)
      });
      
      // Add resource to user's enrolled resources
      await updateDoc(doc(db, 'users', user.uid), {
        enrolledResources: arrayUnion(resourceId)
      });
      
      return resourceId;
    } catch (error) {
      console.error('Error joining resource:', error);
      throw error;
    }
  };
  
  // Star/unstar a resource
  export const toggleStarResource = async (resourceId: string): Promise<boolean> => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');
      
      // Get user document to check if resource is already starred
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (!userDoc.exists()) {
        throw new Error('User document not found');
      }
      
      const userData = userDoc.data();
      const starredResources = userData.starredResources || [];
      
      // Check if resource is already starred
      const isStarred = starredResources.includes(resourceId);
      
      if (isStarred) {
        // Unstar the resource
        await updateDoc(doc(db, 'users', user.uid), {
          starredResources: arrayRemove(resourceId)
        });
        return false;
      } else {
        // Star the resource
        await updateDoc(doc(db, 'users', user.uid), {
          starredResources: arrayUnion(resourceId)
        });
        return true;
      }
    } catch (error) {
      console.error('Error toggling star:', error);
      throw error;
    }
  };
  
  // Helper function to generate a random class code
  const generateClassCode = (): string => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };