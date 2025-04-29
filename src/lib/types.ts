// lib/types.ts
import { Timestamp } from 'firebase/firestore';

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: 'student' | 'teacher';
  createdAt: Timestamp;
  resources: string[]; // Array of resource IDs
  enrolledResources?: string[]; // Resources the user is enrolled in
  projects?: string[]; // Projects created by the user
  collaboratingProjects?: string[]; // Projects the user is collaborating on
  likedProjects?: string[]; // Projects liked by the user
  starredResources?: string[]; // Resources starred by the user
}

export interface Resource {
  id: string;
  name: string;
  subject: string;
  description: string;
  code: string;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  ownerId: string;
  ownerName: string;
  students: number;
  coverColor?: string;
}

export interface Announcement {
  id: string;
  resourceId: string;
  content: string;
  authorId: string;
  authorName: string;
  authorPhotoURL?: string | null;
  createdAt: Timestamp | Date;
  updatedAt?: Timestamp | Date;
  attachments?: {
    type: 'file' | 'image' | 'youtube';
    url: string;
    name: string;
  }[];
  comments: number;
}

export interface Comment {
  id: string;
  announcementId: string;
  content: string;
  authorId: string;
  authorName: string;
  authorPhotoURL?: string | null;
  createdAt: Timestamp | Date;
}

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
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  likes: number;
  views: number;
  coverColor?: string;
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

export interface Message {
  id: string;
  projectId: string;
  content: string;
  authorId: string;
  authorName: string;
  authorPhotoURL?: string | null;
  createdAt: Timestamp | Date;
}

export interface Assignment {
  id: string;
  resourceId: string;
  title: string;
  description: string;
  dueDate: Timestamp;
  points: number;
  attachments?: {
    type: 'file' | 'image' | 'youtube';
    url: string;
    name: string;
  }[];
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  authorId: string;
  authorName: string;
}

export interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  studentName: string;
  content?: string;
  attachments?: {
    type: 'file' | 'image' | 'youtube';
    url: string;
    name: string;
  }[];
  submittedAt: Timestamp;
  grade?: number;
  feedback?: string;
  gradedAt?: Timestamp;
  gradedBy?: string;
}