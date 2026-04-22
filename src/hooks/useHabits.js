import { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../services/firebase';
import { format } from 'date-fns';

export function useHabits() {
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Listen to all habits. We will filter them in the UI component based on `active` and `days`.
    const habitsRef = collection(db, 'habits');
    
    const unsubscribe = onSnapshot(habitsRef, 
      (snapshot) => {
        let habitsData = [];
        snapshot.forEach((doc) => {
          habitsData.push({ id: doc.id, ...doc.data() });
        });
        
        // Sort habits: startTime asc, then createdAt asc
        habitsData = habitsData.sort((a, b) => {
          if (a.startTime && b.startTime) {
            if (a.startTime !== b.startTime) return a.startTime.localeCompare(b.startTime);
          } else if (a.startTime) return -1;
          else if (b.startTime) return 1;

          const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return timeA - timeB;
        });

        setHabits(habitsData);
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching habits:", err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const toggleHabit = async (habitId, isCurrentlyDone, dateStr = format(new Date(), 'yyyy-MM-dd')) => {
    try {
      const habitRef = doc(db, 'habits', habitId);
      if (isCurrentlyDone) {
        await updateDoc(habitRef, {
          completedDays: arrayRemove(dateStr)
        });
      } else {
        await updateDoc(habitRef, {
          completedDays: arrayUnion(dateStr)
        });
      }
    } catch (err) {
      console.error("Error toggling habit:", err);
      // Let the UI handle the error or just log it
      throw err;
    }
  };

  return { habits, loading, error, toggleHabit };
}
