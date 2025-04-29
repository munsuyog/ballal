// lib/services/user-service.ts
import { 
    collection, 
    query, 
    where, 
    getDocs, 
    getDoc,
    setDoc,
    doc, 
    updateDoc,
    arrayUnion,
    arrayRemove,
    serverTimestamp
  } from 'firebase/firestore';
  import { 
    updateProfile, 
    updatePassword, 
    EmailAuthProvider, 
    reauthenticateWithCredential,
    sendEmailVerification,
    updateEmail
  } from 'firebase/auth';
  import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
  import { db, auth, storage } from '@/lib/firebase';
  import { User } from '@/lib/types';
  
  // Get current user profile
  export const getCurrentUser = async (): Promise<User | null> => {
    try {
      const firebaseUser = auth.currentUser;
      if (!firebaseUser) return null;
      
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      
      if (userDoc.exists()) {
        return {
          ...userDoc.data(),
          uid: userDoc.id
        } as User;
      } else {
        // Create user document if it doesn't exist
        const userData = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          role: 'student', // Default role
          createdAt: serverTimestamp(),
          resources: [],
          enrolledResources: [],
          projects: [],
          collaboratingProjects: [],
          likedProjects: [],
          starredResources: []
        };
        
        await setDoc(doc(db, 'users', firebaseUser.uid), userData);
        
        return {
          ...userData,
          uid: firebaseUser.uid
        } as User;
      }
    } catch (error) {
      console.error('Error getting current user:', error);
      throw error;
    }
  };
  
  // Get user by ID
  export const getUserById = async (userId: string): Promise<User | null> => {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      
      if (userDoc.exists()) {
        return {
          ...userDoc.data(),
          uid: userDoc.id
        } as User;
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error getting user:', error);
      throw error;
    }
  };
  
  // Update user profile
  export const updateUserProfile = async (data: {
    displayName?: string;
    photoURL?: string;
    role?: 'student' | 'teacher';
    file?: File;
  }): Promise<void> => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');
      
      let photoURL = data.photoURL;
      
      // Upload profile photo if provided
      if (data.file) {
        const fileExt = data.file.name.split('.').pop();
        const filePath = `users/${user.uid}/profile.${fileExt}`;
        const fileRef = ref(storage, filePath);
        
        // Delete existing photo if it's from our storage
        if (user.photoURL && user.photoURL.includes('firebasestorage')) {
          try {
            const oldFileRef = ref(storage, user.photoURL);
            await deleteObject(oldFileRef);
          } catch (error) {
            console.warn('Error deleting old profile photo:', error);
            // Continue even if delete fails
          }
        }
        
        await uploadBytes(fileRef, data.file);
        photoURL = await getDownloadURL(fileRef);
      }
      
      // Update Auth profile
      const updateData: { displayName?: string; photoURL?: string } = {};
      if (data.displayName) updateData.displayName = data.displayName;
      if (photoURL) updateData.photoURL = photoURL;
      
      if (Object.keys(updateData).length > 0) {
        await updateProfile(user, updateData);
      }
      
      // Update Firestore document
      const firestoreData: any = {
        updatedAt: serverTimestamp()
      };
      
      if (data.displayName) firestoreData.displayName = data.displayName;
      if (photoURL) firestoreData.photoURL = photoURL;
      if (data.role) firestoreData.role = data.role;
      
      await updateDoc(doc(db, 'users', user.uid), firestoreData);
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  };
  
  // Update user password
  export const updateUserPassword = async (currentPassword: string, newPassword: string): Promise<void> => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');
      if (!user.email) throw new Error('User has no email');
      
      // Reauthenticate user
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      
      // Update password
      await updatePassword(user, newPassword);
    } catch (error) {
      console.error('Error updating password:', error);
      throw error;
    }
  };
  
  // Update user email
  export const updateUserEmail = async (newEmail: string, currentPassword: string): Promise<void> => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');
      if (!user.email) throw new Error('User has no email');
      
      // Reauthenticate user
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      
      // Update email
      await updateEmail(user, newEmail);
      
      // Send verification email
      await sendEmailVerification(user);
      
      // Update Firestore document
      await updateDoc(doc(db, 'users', user.uid), {
        email: newEmail,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating email:', error);
      throw error;
    }
  };
  
  // Send email verification
  export const sendVerificationEmail = async (): Promise<void> => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');
      
      await sendEmailVerification(user);
    } catch (error) {
      console.error('Error sending verification email:', error);
      throw error;
    }
  };
  
  // Get user's resources
  export const getUserResources = async (): Promise<any[]> => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');
      
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (!userDoc.exists()) {
        throw new Error('User document not found');
      }
      
      const userData = userDoc.data();
      const resourceIds = userData.resources || [];
      
      if (resourceIds.length === 0) {
        return [];
      }
      
      // Get resources in batches (Firestore has a limit of 10 items for 'in' queries)
      const batchSize = 10;
      const resources = [];
      
      for (let i = 0; i < resourceIds.length; i += batchSize) {
        const batch = resourceIds.slice(i, i + batchSize);
        
        const q = query(
          collection(db, 'resources'),
          where('__name__', 'in', batch)
        );
        
        const querySnapshot = await getDocs(q);
        
        resources.push(
          ...querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }))
        );
      }
      
      return resources;
    } catch (error) {
      console.error('Error getting user resources:', error);
      throw error;
    }
  };
  
  // Get user's enrolled resources
  export const getUserEnrolledResources = async (): Promise<any[]> => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');
      
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (!userDoc.exists()) {
        throw new Error('User document not found');
      }
      
      const userData = userDoc.data();
      const enrolledIds = userData.enrolledResources || [];
      
      if (enrolledIds.length === 0) {
        return [];
      }
      
      // Get resources in batches
      const batchSize = 10;
      const resources = [];
      
      for (let i = 0; i < enrolledIds.length; i += batchSize) {
        const batch = enrolledIds.slice(i, i + batchSize);
        
        const q = query(
          collection(db, 'resources'),
          where('__name__', 'in', batch)
        );
        
        const querySnapshot = await getDocs(q);
        
        resources.push(
          ...querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }))
        );
      }
      
      return resources;
    } catch (error) {
      console.error('Error getting enrolled resources:', error);
      throw error;
    }
  };
  
  // Get user's projects
  export const getUserProjects = async (): Promise<any[]> => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');
      
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (!userDoc.exists()) {
        throw new Error('User document not found');
      }
      
      const userData = userDoc.data();
      const projectIds = userData.projects || [];
      
      if (projectIds.length === 0) {
        return [];
      }
      
      // Get projects in batches
      const batchSize = 10;
      const projects = [];
      
      for (let i = 0; i < projectIds.length; i += batchSize) {
        const batch = projectIds.slice(i, i + batchSize);
        
        const q = query(
          collection(db, 'projects'),
          where('__name__', 'in', batch)
        );
        
        const querySnapshot = await getDocs(q);
        
        projects.push(
          ...querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }))
        );
      }
      
      return projects;
    } catch (error) {
      console.error('Error getting user projects:', error);
      throw error;
    }
  };
  
  // Get user's collaborating projects
  export const getUserCollaboratingProjects = async (): Promise<any[]> => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');
      
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (!userDoc.exists()) {
        throw new Error('User document not found');
      }
      
      const userData = userDoc.data();
      const projectIds = userData.collaboratingProjects || [];
      
      if (projectIds.length === 0) {
        return [];
      }
      
      // Get projects in batches
      const batchSize = 10;
      const projects = [];
      
      for (let i = 0; i < projectIds.length; i += batchSize) {
        const batch = projectIds.slice(i, i + batchSize);
        
        const q = query(
          collection(db, 'projects'),
          where('__name__', 'in', batch)
        );
        
        const querySnapshot = await getDocs(q);
        
        projects.push(
          ...querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }))
        );
      }
      
      return projects;
    } catch (error) {
      console.error('Error getting collaborating projects:', error);
      throw error;
    }
  };
  
  // Get user's liked projects
  export const getUserLikedProjects = async (): Promise<any[]> => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');
      
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (!userDoc.exists()) {
        throw new Error('User document not found');
      }
      
      const userData = userDoc.data();
      const likedIds = userData.likedProjects || [];
      
      if (likedIds.length === 0) {
        return [];
      }
      
      // Get projects in batches
      const batchSize = 10;
      const projects = [];
      
      for (let i = 0; i < likedIds.length; i += batchSize) {
        const batch = likedIds.slice(i, i + batchSize);
        
        const q = query(
          collection(db, 'projects'),
          where('__name__', 'in', batch)
        );
        
        const querySnapshot = await getDocs(q);
        
        projects.push(
          ...querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }))
        );
      }
      
      return projects;
    } catch (error) {
      console.error('Error getting liked projects:', error);
      throw error;
    }
  };
  
  // Get user's starred resources
  export const getUserStarredResources = async (): Promise<any[]> => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');
      
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (!userDoc.exists()) {
        throw new Error('User document not found');
      }
      
      const userData = userDoc.data();
      const starredIds = userData.starredResources || [];
      
      if (starredIds.length === 0) {
        return [];
      }
      
      // Get resources in batches
      const batchSize = 10;
      const resources = [];
      
      for (let i = 0; i < starredIds.length; i += batchSize) {
        const batch = starredIds.slice(i, i + batchSize);
        
        const q = query(
          collection(db, 'resources'),
          where('__name__', 'in', batch)
        );
        
        const querySnapshot = await getDocs(q);
        
        resources.push(
          ...querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }))
        );
      }
      
      return resources;
    } catch (error) {
      console.error('Error getting starred resources:', error);
      throw error;
    }
  };
  
  // Search for users
  export const searchUsers = async (query: string, limit: number = 10): Promise<any[]> => {
    try {
      if (!query || query.length < 3) {
        return [];
      }
      
      // Firebase doesn't support text search directly, so we'll search by prefix
      const queryLower = query.toLowerCase();
      
      // Search by displayName
      const nameQuery = query(
        collection(db, 'users'),
        where('displayName', '>=', queryLower),
        where('displayName', '<=', queryLower + '\uf8ff'),
        limit
      );
      
      const nameSnapshot = await getDocs(nameQuery);
      
      // Search by email
      const emailQuery = query(
        collection(db, 'users'),
        where('email', '>=', queryLower),
        where('email', '<=', queryLower + '\uf8ff'),
        limit
      );
      
      const emailSnapshot = await getDocs(emailQuery);
      
      // Combine results and remove duplicates
      const users = new Map();
      
      [...nameSnapshot.docs, ...emailSnapshot.docs].forEach(doc => {
        if (!users.has(doc.id)) {
          users.set(doc.id, {
            id: doc.id,
            displayName: doc.data().displayName,
            email: doc.data().email,
            photoURL: doc.data().photoURL,
            role: doc.data().role
          });
        }
      });
      
      return Array.from(users.values());
    } catch (error) {
      console.error('Error searching users:', error);
      throw error;
    }
  };