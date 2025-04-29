// lib/services/announcements-service.ts
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
    DocumentData,
    FirestoreError,
    limit
  } from 'firebase/firestore';
  import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
  import { db, auth, storage } from '@/lib/firebase';
  import { Announcement } from '@/lib/types';
  
  // Get announcements for a resource
  export const getAnnouncements = async (resourceId: string, limitCount: number = 10): Promise<Announcement[]> => {
    try {
      const q = query(
        collection(db, 'announcements'),
        where('resourceId', '==', resourceId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
      })) as Announcement[];
    } catch (error) {
      console.error('Error getting announcements:', error);
      throw error;
    }
  };
  
  // Get a single announcement by ID
  export const getAnnouncementById = async (id: string): Promise<Announcement | null> => {
    try {
      const docRef = doc(db, 'announcements', id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate?.() || new Date(),
        } as Announcement;
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error getting announcement:', error);
      throw error;
    }
  };
  
  // Create a new announcement
  export const createAnnouncement = async (
    resourceId: string, 
    content: string,
    attachments?: { type: 'file' | 'image' | 'youtube'; url: string; name: string; file?: File }[]
  ): Promise<string> => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');
  
      // Process attachments if any
      let processedAttachments = [];
      
      if (attachments && attachments.length > 0) {
        processedAttachments = await Promise.all(
          attachments.map(async (attachment) => {
            // YouTube and existing URLs don't need processing
            if (attachment.type === 'youtube' || !attachment.file) {
              return {
                type: attachment.type,
                url: attachment.url,
                name: attachment.name
              };
            }
            
            // Upload files to Firebase Storage
            const file = attachment.file;
            const fileExt = file.name.split('.').pop();
            const filePath = `announcements/${resourceId}/${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
            const fileRef = ref(storage, filePath);
            
            await uploadBytes(fileRef, file);
            const downloadUrl = await getDownloadURL(fileRef);
            
            return {
              type: attachment.type,
              url: downloadUrl,
              name: attachment.name || file.name
            };
          })
        );
      }
      
      const announcementData = {
        resourceId,
        content,
        authorId: user.uid,
        authorName: user.displayName || user.email,
        authorPhotoURL: user.photoURL,
        createdAt: serverTimestamp(),
        attachments: processedAttachments,
        comments: 0,
      };
      
      const docRef = await addDoc(collection(db, 'announcements'), announcementData);
      
      return docRef.id;
    } catch (error) {
      console.error('Error creating announcement:', error);
      throw error;
    }
  };
  
  // Update an announcement
  export const updateAnnouncement = async (id: string, content: string): Promise<void> => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');
      
      // Check if the current user is the author
      const announcementDoc = await getDoc(doc(db, 'announcements', id));
      if (!announcementDoc.exists()) throw new Error('Announcement not found');
      
      const announcementData = announcementDoc.data();
      if (announcementData.authorId !== user.uid) {
        throw new Error('You do not have permission to update this announcement');
      }
      
      await updateDoc(doc(db, 'announcements', id), {
        content,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating announcement:', error);
      throw error;
    }
  };
  
  // Delete an announcement
  export const deleteAnnouncement = async (id: string): Promise<void> => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');
      
      // Check if the current user is the author
      const announcementDoc = await getDoc(doc(db, 'announcements', id));
      if (!announcementDoc.exists()) throw new Error('Announcement not found');
      
      const announcementData = announcementDoc.data();
      
      // Check if user is the author or the resource owner
      if (announcementData.authorId !== user.uid) {
        // Check if user is the resource owner
        const resourceDoc = await getDoc(doc(db, 'resources', announcementData.resourceId));
        if (!resourceDoc.exists() || resourceDoc.data().ownerId !== user.uid) {
          throw new Error('You do not have permission to delete this announcement');
        }
      }
      
      await deleteDoc(doc(db, 'announcements', id));
      
      // Also delete all comments related to this announcement
      const commentsQuery = query(
        collection(db, 'comments'),
        where('announcementId', '==', id)
      );
      
      const commentsSnapshot = await getDocs(commentsQuery);
      
      const deletePromises = commentsSnapshot.docs.map(commentDoc => 
        deleteDoc(doc(db, 'comments', commentDoc.id))
      );
      
      await Promise.all(deletePromises);
      
    } catch (error) {
      console.error('Error deleting announcement:', error);
      throw error;
    }
  };
  
  // Get comments for an announcement
  export const getComments = async (announcementId: string): Promise<any[]> => {
    try {
      const q = query(
        collection(db, 'comments'),
        where('announcementId', '==', announcementId),
        orderBy('createdAt', 'asc')
      );
      
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
      }));
    } catch (error) {
      console.error('Error getting comments:', error);
      throw error;
    }
  };
  
  // Add a comment to an announcement
  export const addComment = async (announcementId: string, content: string): Promise<string> => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');
      
      // Get announcement to check if it exists
      const announcementDoc = await getDoc(doc(db, 'announcements', announcementId));
      if (!announcementDoc.exists()) {
        throw new Error('Announcement not found');
      }
      
      const commentData = {
        announcementId,
        content,
        authorId: user.uid,
        authorName: user.displayName || user.email,
        authorPhotoURL: user.photoURL,
        createdAt: serverTimestamp()
      };
      
      const docRef = await addDoc(collection(db, 'comments'), commentData);
      
      // Increment comment count on the announcement
      await updateDoc(doc(db, 'announcements', announcementId), {
        comments: increment(1)
      });
      
      return docRef.id;
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  };
  
  // Delete a comment
  export const deleteComment = async (id: string): Promise<void> => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');
      
      // Check if the current user is the author
      const commentDoc = await getDoc(doc(db, 'comments', id));
      if (!commentDoc.exists()) throw new Error('Comment not found');
      
      const commentData = commentDoc.data();
      
      // Check if user is the comment author
      if (commentData.authorId !== user.uid) {
        // Check if user is announcement author or resource owner
        const announcementDoc = await getDoc(doc(db, 'announcements', commentData.announcementId));
        if (!announcementDoc.exists()) throw new Error('Announcement not found');
        
        const announcementData = announcementDoc.data();
        
        if (announcementData.authorId !== user.uid) {
          // Last check: is the user the resource owner?
          const resourceDoc = await getDoc(doc(db, 'resources', announcementData.resourceId));
          if (!resourceDoc.exists() || resourceDoc.data().ownerId !== user.uid) {
            throw new Error('You do not have permission to delete this comment');
          }
        }
      }
      
      await deleteDoc(doc(db, 'comments', id));
      
      // Decrement comment count on the announcement
      await updateDoc(doc(db, 'announcements', commentData.announcementId), {
        comments: increment(-1)
      });
      
    } catch (error) {
      console.error('Error deleting comment:', error);
      throw error;
    }
  };