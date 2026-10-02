import { StrictMode } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';

import AuditLog from './AuditLog.jsx';
import { apiFetch } from '../../lib/api';
import { sharedFlight } from '../../lib/singleFlight';

vi.mock('../../lib/api', () => ({ apiFetch: vi.fn() }));
vi.mock('../../context/AuthContext', () => ({ useAuth: () => ({ token: 'tok', user: { role: 'admin' } }) }));

const ROWS = [
  {
    id: 1,
    action: 'approve_submission',
    entity: 'SubmissionItem',
    entityId: 42,
    alasan: '-',
    createdAt: '2026-09-29T03:00:00.000Z',
    ipAddress: '127.0.0.1',
    user: { name: 'Admin Kemenag' },
  },
];

describe('AuditLog — single-flight', () => {
  beforeEach(() => {
    sharedFlight.reset();
    apiFetch.mockReset();
    apiFetch.mockResolvedValue({ data: ROWS, total: 1 });
  });

  it('memuat log SEKALI walau effect berjalan dobel (StrictMode)', async () => {
    render(
      <StrictMode>
        <AuditLog />
      </StrictMode>
    );

    await waitFor(() => expect(document.querySelectorAll('tbody tr')).toHaveLength(1));

    const calls = apiFetch.mock.calls.filter(([p]) => p.startsWith('/api/admin/audit-log?'));
    expect(calls).toHaveLength(1);
  });

  it('dua instance konkuren berbagi satu request query yang sama', async () => {
    render(
      <>
        <AuditLog />
        <AuditLog />
      </>
    );

    await waitFor(() => expect(document.querySelectorAll('tbody tr')).toHaveLength(2));

    const calls = apiFetch.mock.calls.filter(([p]) => p.startsWith('/api/admin/audit-log?'));
    expect(calls).toHaveLength(1);
  });
});
