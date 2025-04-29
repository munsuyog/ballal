import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import type { Announcement } from '@/lib/types';

export function useAnnouncements(resourceId: string) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const q = query(
          collection(db, 'announcements'),
          where('resourceId', '==', resourceId),
          orderBy('createdAt', 'desc')
        );
        
        const querySnapshot = await getDocs(q);
        const announcementsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Announcement[];
        
        setAnnouncements(announcementsData);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch announcements');
        setLoading(false);
      }
    };

    fetchAnnouncements();
  }, [resourceId]);

  const createAnnouncement = async (content: string, attachments?: Announcement['attachments']) => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');

      const docRef = await addDoc(collection(db, 'announcements'), {
        resourceId,
        content,
        authorId: user.uid,
        authorName: user.displayName || user.email,
        createdAt: serverTimestamp(),
        attachments,
        comments: 0,
      });

      return docRef.id;
    } catch (err) {
      throw new Error('Failed to create announcement');
    }
  };

  return { announcements, loading, error, createAnnouncement };
}