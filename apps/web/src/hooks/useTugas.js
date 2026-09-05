import { useCallback, useEffect, useState } from 'react';
import pb from '@/lib/pocketbaseClient';

export function useTugas() {
  const [tugas, setTugas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const reload = useCallback(async () => {
    try {
      const list = await pb.collection('tugas').getFullList({
        sort: '-updated',
        expand: 'assignee',
      });
      setTugas(list);
      setError(null);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();

    void pb
      .collection('tugas')
      .subscribe('*', () => {
        reload();
      })
      .catch((err) => console.error('Langganan realtime tugas gagal', err));

    return () => {
      void pb
        .collection('tugas')
        .unsubscribe('*')
        .catch(() => {});
    };
  }, [reload]);

  return { tugas, loading, error, reload };
}

export default useTugas;
