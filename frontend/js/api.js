// GunnasTV - API Calls
import { API } from './config.js';

export async function loginRequest(dns, username, password) {
    const res = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dns, username, password })
    });
    return { res, data: await res.json() };
}

export async function fetchStreams(token) {
    const res = await fetch(`${API}/xtream/live`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to fetch streams');
    return await res.json();
}

export async function fetchAccountInfo(token) {
    const res = await fetch(`${API}/xtream/account`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to fetch account info');
    return await res.json();
}

export async function fetchStreamUrl(streamId, token) {
    const res = await fetch(`${API}/xtream/play/${streamId}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return await res.json();
}

export async function fetchEPGData(streamId, token) {
    const res = await fetch(`${API}/xtream/epg/${streamId}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    const contentType = res.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
        console.warn('EPG endpoint did not return JSON');
        return null;
    }
    return await res.json();
}

export async function fetchEPGBatch(streamIds, token) {
    const res = await fetch(`${API}/xtream/epg-batch`, {
        method: 'POST',
        headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ streamIds })
    });
    return await res.json();
}
