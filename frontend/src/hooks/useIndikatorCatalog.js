import { useEffect, useState } from 'react';
import { apiGet } from '../lib/api';
import { sharedFlight, getKey } from '../lib/singleFlight';

export default function useIndikatorCatalog(periodeId) {
  const key = String(periodeId || 'master');
  const [state, setState] = useState({ data: [], loading: true, error: '', key: null });
  useEffect(() => {
    let ignore = false;
    const path = `/api/indikator${periodeId ? `?periodeId=${periodeId}` : ''}`;
    sharedFlight.run(getKey(path), () => apiGet(path)).then((r) => {
      if (!ignore) setState({ data: r.data || [], loading: false, error: '', key });
    }).catch((e) => { if (!ignore) setState({ data: [], loading: false, error: e.message || 'Gagal memuat indikator', key }); });
    return () => { ignore = true; };
  }, [periodeId, key]);
  return state.key === key ? state : { data: [], loading: true, error: '' };
}
