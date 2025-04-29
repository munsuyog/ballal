// lib/services/coursework-service.ts
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
    Timestamp,
    limit
  } from 'firebase/firestore';
  import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
  import { db, auth, storage } from '@/lib/firebase';
  import { Assignment, Submission } from '@/lib/types';
  
  // Get assignments for a resource
  export const getAssignments = async (resourceId: string): Promise<Assignment[]> => {
    try {
      const q = query(
        collection(db, 'assignments'),
        where('resourceId', '==', resourceId),
        orderBy('dueDate', 'asc')
      );
      
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Assignment[];
    } catch (error) {
      console.error('Error getting assignments:', error);
      throw error;
    }
  };
  
  // Get assignment by ID
  export const getAssignmentById = async (assignmentId: string): Promise<Assignment | null> => {
    try {
      const docRef = doc(db, 'assignments', assignmentId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        } as Assignment;
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error getting assignment:', error);
      throw error;
    }
  };
  
  // Create a new assignment
  export const createAssignment = async (
    resourceId: string,
    title: string,
    description: string,
    dueDate: Date,
    points: number,
    attachments?: { type: 'file' | 'image' | 'youtube'; url: string; name: string; file?: File }[]
  ): Promise<string> => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');
  
      // Check if user is the resource owner
      const resourceDoc = await getDoc(doc(db, 'resources', resourceId));
      if (!resourceDoc.exists()) throw new Error('Resource not found');
      
      const resourceData = resourceDoc.data();
      if (resourceData.ownerId !== user.uid) {
        throw new Error('Only the resource owner can create assignments');
      }
  
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
            const filePath = `assignments/${resourceId}/${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
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
      
      const assignmentData = {
        resourceId,
        title,
        description,
        dueDate: Timestamp.fromDate(dueDate),
        points,
        attachments: processedAttachments,
        createdAt: serverTimestamp(),
        authorId: user.uid,
        authorName: user.displayName || user.email,
      };
      
      const docRef = await addDoc(collection(db, 'assignments'), assignmentData);
      
      return docRef.id;
    } catch (error) {
      console.error('Error creating assignment:', error);
      throw error;
    }
  };
  
  // Update an assignment
  export const updateAssignment = async (
    assignmentId: string,
    data: Partial<Pick<Assignment, 'title' | 'description' | 'dueDate' | 'points'>>
  ): Promise<void> => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');
      
      // Check if user is the assignment author
      const assignmentDoc = await getDoc(doc(db, 'assignments', assignmentId));
      if (!assignmentDoc.exists()) throw new Error('Assignment not found');
      
      const assignmentData = assignmentDoc.data();
      if (assignmentData.authorId !== user.uid) {
        throw new Error('Only the assignment creator can update it');
      }
      
      // Convert dueDate to Timestamp if provided
      let updateData = { ...data };
      if (data.dueDate && !(data.dueDate instanceof Timestamp)) {
        updateData.dueDate = Timestamp.fromDate(
          typeof data.dueDate === 'string' ? new Date(data.dueDate) : data.dueDate
        );
      }
      
      await updateDoc(doc(db, 'assignments', assignmentId), {
        ...updateData,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating assignment:', error);
      throw error;
    }
  };
  
  // Delete an assignment
  export const deleteAssignment = async (assignmentId: string): Promise<void> => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');
      
      // Check if user is the assignment author
      const assignmentDoc = await getDoc(doc(db, 'assignments', assignmentId));
      if (!assignmentDoc.exists()) throw new Error('Assignment not found');
      
      const assignmentData = assignmentDoc.data();
      if (assignmentData.authorId !== user.uid) {
        // Check if user is resource owner
        const resourceDoc = await getDoc(doc(db, 'resources', assignmentData.resourceId));
        if (!resourceDoc.exists() || resourceDoc.data().ownerId !== user.uid) {
          throw new Error('You do not have permission to delete this assignment');
        }
      }
      
      // Delete all submissions first
      const submissionsQuery = query(
        collection(db, 'submissions'),
        where('assignmentId', '==', assignmentId)
      );
      
      const submissionsSnapshot = await getDocs(submissionsQuery);
      
      const deletePromises = submissionsSnapshot.docs.map(submissionDoc => 
        deleteDoc(doc(db, 'submissions', submissionDoc.id))
      );
      
      await Promise.all(deletePromises);
      
      // Delete the assignment
      await deleteDoc(doc(db, 'assignments', assignmentId));
    } catch (error) {
      console.error('Error deleting assignment:', error);
      throw error;
    }
  };
  
  // Submit an assignment
  export const submitAssignment = async (
    assignmentId: string,
    content?: string,
    attachments?: { type: 'file' | 'image' | 'youtube'; url: string; name: string; file?: File }[]
  ): Promise<string> => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');
      
      // Check if assignment exists
      const assignmentDoc = await getDoc(doc(db, 'assignments', assignmentId));
      if (!assignmentDoc.exists()) throw new Error('Assignment not found');
      
      const assignmentData = assignmentDoc.data();
      
      // Check if assignment due date has passed
      const dueDate = assignmentData.dueDate?.toDate() || new Date();
      const now = new Date();
      
      if (now > dueDate) {
        throw new Error('This assignment is past its due date');
      }
      
      // Check if user is enrolled in the resource
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) throw new Error('User not found');
      
      const userData = userDoc.data();
      const enrolledResources = userData.enrolledResources || [];
      
      if (!enrolledResources.includes(assignmentData.resourceId)) {
        throw new Error('You are not enrolled in this course');
      }
      
      // Check if user has already submitted
      const existingSubmissionsQuery = query(
        collection(db, 'submissions'),
        where('assignmentId', '==', assignmentId),
        where('studentId', '==', user.uid)
      );
      
      const existingSubmissionsSnapshot = await getDocs(existingSubmissionsQuery);
      
      // If submission exists, update it instead of creating a new one
      if (!existingSubmissionsSnapshot.empty) {
        const existingSubmission = existingSubmissionsSnapshot.docs[0];
        
        // Process attachments if any
        let processedAttachments = [];
        
        if (attachments && attachments.length > 0) {
          processedAttachments = await Promise.all(
            attachments.map(async (attachment) => {
              if (attachment.type === 'youtube' || !attachment.file) {
                return {
                  type: attachment.type,
                  url: attachment.url,
                  name: attachment.name
                };
              }
              
              const file = attachment.file;
              const fileExt = file.name.split('.').pop();
              const filePath = `submissions/${assignmentId}/${user.uid}/${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
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
        
        await updateDoc(doc(db, 'submissions', existingSubmission.id), {
          content: content || "",
          attachments: processedAttachments,
          submittedAt: serverTimestamp(),
          // Remove grade and feedback when resubmitting
          grade: null,
          feedback: null,
          gradedAt: null,
          gradedBy: null
        });
        
        return existingSubmission.id;
      }
      
      // Process attachments for a new submission
      let processedAttachments = [];
      
      if (attachments && attachments.length > 0) {
        processedAttachments = await Promise.all(
          attachments.map(async (attachment) => {
            if (attachment.type === 'youtube' || !attachment.file) {
              return {
                type: attachment.type,
                url: attachment.url,
                name: attachment.name
              };
            }
            
            const file = attachment.file;
            const fileExt = file.name.split('.').pop();
            const filePath = `submissions/${assignmentId}/${user.uid}/${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
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
      
      const submissionData = {
        assignmentId,
        studentId: user.uid,
        studentName: user.displayName || user.email,
        content: content || "",
        attachments: processedAttachments,
        submittedAt: serverTimestamp()
      };
      
      const docRef = await addDoc(collection(db, 'submissions'), submissionData);
      
      return docRef.id;
    } catch (error) {
      console.error('Error submitting assignment:', error);
      throw error;
    }
  };
  
  // Get submissions for an assignment (for teachers)
  export const getAssignmentSubmissions = async (assignmentId: string): Promise<Submission[]> => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');
      
      // Get the assignment to check the resource
      const assignmentDoc = await getDoc(doc(db, 'assignments', assignmentId));
      if (!assignmentDoc.exists()) throw new Error('Assignment not found');
      
      const assignmentData = assignmentDoc.data();
      
      // Check if user is the resource owner
      const resourceDoc = await getDoc(doc(db, 'resources', assignmentData.resourceId));
      if (!resourceDoc.exists()) throw new Error('Resource not found');
      
      const resourceData = resourceDoc.data();
      if (resourceData.ownerId !== user.uid) {
        throw new Error('Only the resource owner can view all submissions');
      }
      
      const q = query(
        collection(db, 'submissions'),
        where('assignmentId', '==', assignmentId),
        orderBy('submittedAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Submission[];
    } catch (error) {
      console.error('Error getting submissions:', error);
      throw error;
    }
  };
  
  // Get submission by ID
  export const getSubmissionById = async (submissionId: string): Promise<Submission | null> => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');
      
      const docRef = doc(db, 'submissions', submissionId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const submissionData = docSnap.data() as Submission;
        
        // Check if user is the student who submitted or the resource owner
        if (submissionData.studentId === user.uid) {
          return {
            id: docSnap.id,
            ...submissionData
          };
        } else {
          // Get the assignment to check the resource
          const assignmentDoc = await getDoc(doc(db, 'assignments', submissionData.assignmentId));
          if (!assignmentDoc.exists()) throw new Error('Assignment not found');
          
          const assignmentData = assignmentDoc.data();
          
          // Check if user is the resource owner
          const resourceDoc = await getDoc(doc(db, 'resources', assignmentData.resourceId));
          if (!resourceDoc.exists()) throw new Error('Resource not found');
          
          const resourceData = resourceDoc.data();
          if (resourceData.ownerId !== user.uid) {
            throw new Error('You do not have permission to view this submission');
          }
          
          return {
            id: docSnap.id,
            ...submissionData
          };
        }
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error getting submission:', error);
      throw error;
    }
  };
  
  // Get a student's submission for an assignment
  export const getStudentSubmission = async (assignmentId: string): Promise<Submission | null> => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');
      
      const q = query(
        collection(db, 'submissions'),
        where('assignmentId', '==', assignmentId),
        where('studentId', '==', user.uid)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return null;
      }
      
      const submissionDoc = querySnapshot.docs[0];
      
      return {
        id: submissionDoc.id,
        ...submissionDoc.data()
      } as Submission;
    } catch (error) {
      console.error('Error getting student submission:', error);
      throw error;
    }
  };
  
  // Grade a submission
  export const gradeSubmission = async (
    submissionId: string,
    grade: number,
    feedback?: string
  ): Promise<void> => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');
      
      // Get the submission
      const submissionDoc = await getDoc(doc(db, 'submissions', submissionId));
      if (!submissionDoc.exists()) throw new Error('Submission not found');
      
      const submissionData = submissionDoc.data();
      
      // Get the assignment to check the resource
      const assignmentDoc = await getDoc(doc(db, 'assignments', submissionData.assignmentId));
      if (!assignmentDoc.exists()) throw new Error('Assignment not found');
      
      const assignmentData = assignmentDoc.data();
      
      // Check if user is the resource owner
      const resourceDoc = await getDoc(doc(db, 'resources', assignmentData.resourceId));
      if (!resourceDoc.exists()) throw new Error('Resource not found');
      
      const resourceData = resourceDoc.data();
      if (resourceData.ownerId !== user.uid) {
        throw new Error('Only the resource owner can grade submissions');
      }
      
      // Validate grade
      if (grade < 0 || grade > assignmentData.points) {
        throw new Error(`Grade must be between 0 and ${assignmentData.points}`);
      }
      
      await updateDoc(doc(db, 'submissions', submissionId), {
        grade,
        feedback: feedback || "",
        gradedAt: serverTimestamp(),
        gradedBy: user.uid
      });
    } catch (error) {
      console.error('Error grading submission:', error);
      throw error;
    }
  };
  
  // Get student grades for a resource
  export const getStudentGrades = async (resourceId: string): Promise<any[]> => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');
      
      // Get all assignments for the resource
      const assignmentsQuery = query(
        collection(db, 'assignments'),
        where('resourceId', '==', resourceId)
      );
      
      const assignmentsSnapshot = await getDocs(assignmentsQuery);
      const assignments = assignmentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Get submissions for each assignment
      const submissions = [];
      
      for (const assignment of assignments) {
        const submissionQuery = query(
          collection(db, 'submissions'),
          where('assignmentId', '==', assignment.id),
          where('studentId', '==', user.uid)
        );
        
        const submissionSnapshot = await getDocs(submissionQuery);
        
        if (!submissionSnapshot.empty) {
          const submission = submissionSnapshot.docs[0].data();
          
          submissions.push({
            assignment: {
              id: assignment.id,
              title: assignment.title,
              points: assignment.points,
              dueDate: assignment.dueDate
            },
            submission: {
              id: submissionSnapshot.docs[0].id,
              submittedAt: submission.submittedAt,
              grade: submission.grade,
              feedback: submission.feedback,
              gradedAt: submission.gradedAt
            }
          });
        } else {
          submissions.push({
            assignment: {
              id: assignment.id,
              title: assignment.title,
              points: assignment.points,
              dueDate: assignment.dueDate
            },
            submission: null
          });
        }
      }
      
      return submissions;
    } catch (error) {
      console.error('Error getting student grades:', error);
      throw error;
    }
  };
  
  // Get all grades for a resource (for teachers)
  export const getAllGrades = async (resourceId: string): Promise<any[]> => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');
      
      // Check if user is the resource owner
      const resourceDoc = await getDoc(doc(db, 'resources', resourceId));
      if (!resourceDoc.exists()) throw new Error('Resource not found');
      
      const resourceData = resourceDoc.data();
      if (resourceData.ownerId !== user.uid) {
        throw new Error('Only the resource owner can view all grades');
      }
      
      // Get all assignments for the resource
      const assignmentsQuery = query(
        collection(db, 'assignments'),
        where('resourceId', '==', resourceId)
      );
      
      const assignmentsSnapshot = await getDocs(assignmentsQuery);
      const assignments = assignmentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Get all enrolled students
      const studentsQuery = query(
        collection(db, 'users'),
        where('enrolledResources', 'array-contains', resourceId)
      );
      
      const studentsSnapshot = await getDocs(studentsQuery);
      const students = studentsSnapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().displayName || doc.data().email,
        email: doc.data().email
      }));
      
      // Get all submissions
      const submissionsQuery = query(
        collection(db, 'submissions'),
        where('assignmentId', 'in', assignments.map(a => a.id))
      );
      
      const submissionsSnapshot = await getDocs(submissionsQuery);
      const submissions = submissionsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Organize data by student
      const gradesByStudent = students.map(student => {
        const studentSubmissions = submissions.filter(sub => sub.studentId === student.id);
        
        const assignmentGrades = assignments.map(assignment => {
          const submission = studentSubmissions.find(sub => sub.assignmentId === assignment.id);
          
          return {
            assignmentId: assignment.id,
            title: assignment.title,
            points: assignment.points,
            dueDate: assignment.dueDate,
            submission: submission ? {
              id: submission.id,
              submittedAt: submission.submittedAt,
              grade: submission.grade,
              gradedAt: submission.gradedAt
            } : null
          };
        });
        
        // Calculate average grade
        const gradedAssignments = assignmentGrades.filter(ag => ag.submission && ag.submission.grade !== undefined);
        const totalPoints = gradedAssignments.reduce((sum, ag) => sum + ag.submission.grade, 0);
        const maxPoints = gradedAssignments.reduce((sum, ag) => sum + ag.points, 0);
        const averageGrade = maxPoints > 0 ? (totalPoints / maxPoints) * 100 : null;
        
        return {
          student: {
            id: student.id,
            name: student.name,
            email: student.email
          },
          assignments: assignmentGrades,
          averageGrade
        };
      });
      
      return gradesByStudent;
    } catch (error) {
      console.error('Error getting all grades:', error);
      throw error;
    }
  };