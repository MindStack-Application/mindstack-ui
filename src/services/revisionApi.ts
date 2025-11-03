import { USER_TZ } from '../config/timezone';

// Helper function to get auth headers
function getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem('authToken');
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
}

export async function completeRevision(id: number, rating: 1 | 2 | 3 | 4 | 5) {
    const res = await fetch(`/api/revision/revision-items/${id}/complete?tz=${encodeURIComponent(USER_TZ)}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ rating }),
    });
    if (!res.ok) throw new Error('Failed to complete revision');
    return res.json();
}

export async function listRevisions(userId: string, params: { from?: string; to?: string; includePast?: boolean }) {
    const qs = new URLSearchParams();
    if (params.from) qs.set('from', params.from);
    if (params.to) qs.set('to', params.to);
    if (params.includePast) qs.set('includePast', 'true');
    qs.set('tz', USER_TZ);
    const res = await fetch(`/api/revision/users/${userId}/revision-items?${qs.toString()}`, {
        headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch revisions');
    return res.json();
}
