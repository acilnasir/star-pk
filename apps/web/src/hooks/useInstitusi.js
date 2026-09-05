import { useCallback, useEffect, useState } from 'react';
import pb from '@/lib/pocketbaseClient';

export function useInstitusi() {
  const [institusi, setInstitusi] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const reload = useCallback(async () => {
    try {
      const list = await pb.collection('institusi').getFullList({ sort: 'nama_kantor' });
      setInstitusi(list);
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
      .collection('institusi')
      .subscribe('*', () => {
        reload();
      })
      .catch((err) => console.error('Langganan realtime institusi gagal', err));

    return () => {
      void pb
        .collection('institusi')
        .unsubscribe('*')
        .catch(() => {});
    };
  }, [reload]);

  return { institusi, loading, error, reload };
}

export default useInstitusi;
