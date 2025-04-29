// lib/services/projects-service.ts
import { 
    collection, 
    query, 
    where, 
    orderBy, 
    getDocs, 
    getDoc,
    setDoc,
    doc, 
    addDoc, 
    updateDoc, 
    deleteDoc, 
    serverTimestamp,
    arrayUnion,
    arrayRemove,
    increment,
    FirestoreError,
    limit
  } from 'firebase/firestore';
  import { db, auth } from '@/lib/firebase';
  
  // Project type
  export interface Project {
    id: string;
    title: string;
    description: string;
    category: string;
    tech: string[];
    ownerId: string;
    ownerName: string;
    college: string;
    branch: string;
    location: string;
    objective: string;
    status: 'Open' | 'In Progress' | 'Completed';
    collaborators: Array<{
      id: string;
      name: string;
      role: string;
      email: string;
      linkedin?: string;
    }>;
    supervisor?: {
      name: string;
      role: string;
      department: string;
      email: string;
    };
    startDate: string;
    deadline: string;
    progress: number;
    createdAt: any;
    updatedAt?: any;
    likes: number;
    views: number;
    milestones?: Array<{
      title: string;
      status: 'pending' | 'in-progress' | 'completed';
      date: string;
    }>;
    media?: Array<{
      type: 'image' | 'document' | 'video';
      url: string;
      title: string;
    }>;
  }
  
  // Get all projects (with optional filters)
  export const getProjects = async (filters?: {
    category?: string;
    tech?: string[];
    college?: string;
    status?: string;
    search?: string;
    ownerId?: string;
    collaboratorId?: string;
    limit?: number;
  }): Promise<Project[]> => {
    try {
      let projectsQuery = collection(db, 'projects');
      let constraints = [];
      
      // Apply filters
      if (filters?.category) {
        constraints.push(where('category', '==', filters.category));
      }
      
      if (filters?.status) {
        constraints.push(where('status', '==', filters.status));
      }
      
      if (filters?.college) {
        constraints.push(where('college', '==', filters.college));
      }
      
      if (filters?.ownerId) {
        constraints.push(where('ownerId', '==', filters.ownerId));
      }
      
      // Add ordering
      constraints.push(orderBy('createdAt', 'desc'));
      
      // Add limit if specified
      if (filters?.limit) {
        constraints.push(limit(filters.limit));
      }
      
      const q = query(projectsQuery, ...constraints);
      const querySnapshot = await getDocs(q);
      
      let projects = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Project[];
      
      // Post-query filtering for tech stack (because we can't do array-contains-any with other where clauses)
      if (filters?.tech && filters.tech.length > 0) {
        projects = projects.filter(project => 
          project.tech.some(tech => filters.tech?.includes(tech))
        );
      }
      
      // Filter by collaborator ID
      if (filters?.collaboratorId) {
        projects = projects.filter(project => 
          project.collaborators.some(collab => collab.id === filters.collaboratorId)
        );
      }
      
      // Text search in title and description
      if (filters?.search) {
        const searchLower = filters.search.toLowerCase();
        projects = projects.filter(project => 
          project.title.toLowerCase().includes(searchLower) ||
          project.description.toLowerCase().includes(searchLower) ||
          project.tech.some(tech => tech.toLowerCase().includes(searchLower))
        );
      }
      
      return projects;
    } catch (error) {
      console.error('Error getting projects:', error);
      throw error;
    }
  };
  
  // Get a single project by ID
  export const getProjectById = async (id: string): Promise<Project | null> => {
    try {
      const docRef = doc(db, 'projects', id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        // Increment view count
        await updateDoc(docRef, {
          views: increment(1)
        });
        
        return {
          id: docSnap.id,
          ...docSnap.data()
        } as Project;
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error getting project:', error);
      throw error;
    }
  };
  
  // Create a new project
  export const createProject = async (data: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'likes' | 'views' | 'ownerId' | 'ownerName'>): Promise<string> => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');
  
      const projectData = {
        ...data,
        ownerId: user.uid,
        ownerName: user.displayName || user.email,
        createdAt: serverTimestamp(),
        likes: 0,
        views: 0,
        // Add the current user as first collaborator
        collaborators: [
          {
            id: user.uid,
            name: user.displayName || user.email || 'Project Lead',
            role: 'Project Lead',
            email: user.email,
          },
          ...(data.collaborators || [])
        ]
      };
      
      const docRef = await addDoc(collection(db, 'projects'), projectData);
      
      // Add project to user's projects
      await updateDoc(doc(db, 'users', user.uid), {
        projects: arrayUnion(docRef.id)
      });
  
      return docRef.id;
    } catch (error) {
      console.error('Error creating project:', error);
      throw error;
    }
  };
  
  // Update a project
  export const updateProject = async (id: string, data: Partial<Project>): Promise<void> => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');
      
      // Check if the current user is the owner or a collaborator
      const projectDoc = await getDoc(doc(db, 'projects', id));
      if (!projectDoc.exists()) throw new Error('Project not found');
      
      const projectData = projectDoc.data();
      const isOwner = projectData.ownerId === user.uid;
      const isCollaborator = projectData.collaborators.some((c: any) => c.id === user.uid);
      
      if (!isOwner && !isCollaborator) {
        throw new Error('You do not have permission to update this project');
      }
      
      // Only owners can change certain fields
      if (!isOwner) {
        // Remove fields that only owners should be able to modify
        const { ownerId, ownerName, category, college, branch, ...allowedData } = data;
        
        await updateDoc(doc(db, 'projects', id), {
          ...allowedData,
          updatedAt: serverTimestamp()
        });
      } else {
        await updateDoc(doc(db, 'projects', id), {
          ...data,
          updatedAt: serverTimestamp()
        });
      }
    } catch (error) {
      console.error('Error updating project:', error);
      throw error;
    }
  };
  
  // Delete a project
  export const deleteProject = async (id: string): Promise<void> => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');
      
      // Check if the current user is the owner
      const projectDoc = await getDoc(doc(db, 'projects', id));
      if (!projectDoc.exists()) throw new Error('Project not found');
      
      const projectData = projectDoc.data();
      if (projectData.ownerId !== user.uid) {
        throw new Error('You do not have permission to delete this project');
      }
      
      // Remove project from user's projects
      await updateDoc(doc(db, 'users', user.uid), {
        projects: arrayRemove(id)
      });
      
      // Remove project from collaborators' lists
      const collaboratorIds = projectData.collaborators.map((c: any) => c.id);
      for (const collaboratorId of collaboratorIds) {
        if (collaboratorId !== user.uid) {
          await updateDoc(doc(db, 'users', collaboratorId), {
            collaboratingProjects: arrayRemove(id)
          });
        }
      }
      
      // Delete the project
      await deleteDoc(doc(db, 'projects', id));
      
      // Also delete all messages related to this project
      const messagesQuery = query(
        collection(db, 'messages'),
        where('projectId', '==', id)
      );
      
      const messagesSnapshot = await getDocs(messagesQuery);
      
      const deletePromises = messagesSnapshot.docs.map(messageDoc => 
        deleteDoc(doc(db, 'messages', messageDoc.id))
      );
      
      await Promise.all(deletePromises);
      
    } catch (error) {
      console.error('Error deleting project:', error);
      throw error;
    }
  };
  
  // Join a project as a collaborator
  export const joinProject = async (projectId: string, role: string): Promise<void> => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');
      
      // Get the project
      const projectDoc = await getDoc(doc(db, 'projects', projectId));
      if (!projectDoc.exists()) throw new Error('Project not found');
      
      const projectData = projectDoc.data();
      
      // Check if user is already a collaborator
      if (projectData.collaborators.some((c: any) => c.id === user.uid)) {
        throw new Error('You are already a collaborator on this project');
      }
      
      // Check if project is open for collaboration
      if (projectData.status !== 'Open') {
        throw new Error('This project is not open for new collaborators');
      }
      
      // Add user to project collaborators
      await updateDoc(doc(db, 'projects', projectId), {
        collaborators: arrayUnion({
          id: user.uid,
          name: user.displayName || user.email,
          role: role,
          email: user.email
        })
      });
      
      // Add project to user's collaborating projects
      await updateDoc(doc(db, 'users', user.uid), {
        collaboratingProjects: arrayUnion(projectId)
      });
    } catch (error) {
      console.error('Error joining project:', error);
      throw error;
    }
  };
  
  // Leave a project (as a collaborator)
  export const leaveProject = async (projectId: string): Promise<void> => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');
      
      // Get the project
      const projectDoc = await getDoc(doc(db, 'projects', projectId));
      if (!projectDoc.exists()) throw new Error('Project not found');
      
      const projectData = projectDoc.data();
      
      // Check if user is a collaborator
      const collaboratorInfo = projectData.collaborators.find((c: any) => c.id === user.uid);
      if (!collaboratorInfo) {
        throw new Error('You are not a collaborator on this project');
      }
      
      // Owner cannot leave their own project
      if (projectData.ownerId === user.uid) {
        throw new Error('As the owner, you cannot leave your own project. You can delete it instead.');
      }
      
      // Remove user from project collaborators
      await updateDoc(doc(db, 'projects', projectId), {
        collaborators: projectData.collaborators.filter((c: any) => c.id !== user.uid)
      });
      
      // Remove project from user's collaborating projects
      await updateDoc(doc(db, 'users', user.uid), {
        collaboratingProjects: arrayRemove(projectId)
      });
    } catch (error) {
      console.error('Error leaving project:', error);
      throw error;
    }
  };
  
  // Toggle like on a project
  export const toggleLikeProject = async (projectId: string): Promise<boolean> => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');
      
      // Get user document to check if project is already liked
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (!userDoc.exists()) {
        throw new Error('User document not found');
      }
      
      const userData = userDoc.data();
      const likedProjects = userData.likedProjects || [];
      
      // Check if project is already liked
      const isLiked = likedProjects.includes(projectId);
      
      if (isLiked) {
        // Unlike the project
        await updateDoc(doc(db, 'users', user.uid), {
          likedProjects: arrayRemove(projectId)
        });
        
        // Decrement like count
        await updateDoc(doc(db, 'projects', projectId), {
          likes: increment(-1)
        });
        
        return false;
      } else {
        // Like the project
        await updateDoc(doc(db, 'users', user.uid), {
          likedProjects: arrayUnion(projectId)
        });
        
        // Increment like count
        await updateDoc(doc(db, 'projects', projectId), {
          likes: increment(1)
        });
        
        return true;
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      throw error;
    }
  };
  
  // Add a message to project chat
  export const addProjectMessage = async (projectId: string, content: string): Promise<string> => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');
      
      // Check if user is a collaborator
      const projectDoc = await getDoc(doc(db, 'projects', projectId));
      if (!projectDoc.exists()) throw new Error('Project not found');
      
      const projectData = projectDoc.data();
      const isCollaborator = projectData.collaborators.some((c: any) => c.id === user.uid);
      
      if (!isCollaborator) {
        throw new Error('Only collaborators can send messages to this project');
      }
      
      const messageData = {
        projectId,
        content,
        authorId: user.uid,
        authorName: user.displayName || user.email,
        authorPhotoURL: user.photoURL,
        createdAt: serverTimestamp()
      };
      
      const docRef = await addDoc(collection(db, 'messages'), messageData);
      
      return docRef.id;
    } catch (error) {
      console.error('Error adding message:', error);
      throw error;
    }
  };
  
  // Get messages for a project
  export const getProjectMessages = async (projectId: string, limitCount: number = 50): Promise<any[]> => {
    try {
      const q = query(
        collection(db, 'messages'),
        where('projectId', '==', projectId),
        orderBy('createdAt', 'asc'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
      }));
    } catch (error) {
      console.error('Error getting messages:', error);
      throw error;
    }
  };
  
  // Update project milestone
  export const updateMilestone = async (
    projectId: string, 
    milestoneIndex: number, 
    status: 'pending' | 'in-progress' | 'completed'
  ): Promise<void> => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');
      
      // Check if user is a collaborator
      const projectDoc = await getDoc(doc(db, 'projects', projectId));
      if (!projectDoc.exists()) throw new Error('Project not found');
      
      const projectData = projectDoc.data();
      const isCollaborator = projectData.collaborators.some((c: any) => c.id === user.uid);
      
      if (!isCollaborator) {
        throw new Error('Only collaborators can update project milestones');
      }
      
      // Get the milestones
      const milestones = projectData.milestones || [];
      
      if (milestoneIndex >= milestones.length) {
        throw new Error('Milestone not found');
      }
      
      // Update the milestone status
      milestones[milestoneIndex].status = status;
      
      // Calculate new progress percentage based on completed milestones
      const completedCount = milestones.filter(m => m.status === 'completed').length;
      const progress = Math.round((completedCount / milestones.length) * 100);
      
      await updateDoc(doc(db, 'projects', projectId), {
        milestones,
        progress,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating milestone:', error);
      throw error;
    }
  };