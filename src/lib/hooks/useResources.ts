import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import type { Resource } from '@/lib/types';

export function useResources() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchResources = async () => {
      try {
        const q = query(
          collection(db, 'resources'),
          orderBy('createdAt', 'desc')
        );
        
        const querySnapshot = await getDocs(q);
        const resourcesData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Resource[];
        
        setResources(resourcesData);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch resources');
        setLoading(false);
      }
    };

    fetchResources();
  }, []);

  const createResource = async (data: Omit<Resource, 'id' | 'createdAt' | 'ownerId' | 'ownerName' | 'students'>) => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');

      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      const docRef = await addDoc(collection(db, 'resources'), {
        ...data,
        code,
        ownerId: user.uid,
        ownerName: user.displayName || user.email,
        createdAt: serverTimestamp(),
        students: 0,
      });

      return docRef.id;
    } catch (err) {
      throw new Error('Failed to create resource');
    }
  };

  return { resources, loading, error, createResource };
}