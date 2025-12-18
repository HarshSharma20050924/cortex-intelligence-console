
import { supabase } from './lib/supabase';

// Use relative path for Vercel deployment (serverless functions)
// For local development, this falls back to localhost if not proxied
const getApiUrl = () => {
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
     return 'http://localhost:8000'; 
  }
  return '/api'; // Production Vercel Route
};

const API_URL = import.meta.env?.VITE_API_URL || getApiUrl();

const getAuthHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        // Return empty headers if no session, or handle error depending on policy
        return {};
    }
    return {
        'Authorization': `Bearer ${session.access_token}`
    };
};

export interface ChatResponse {
    response: string;
    sources: any[];
}

export const api = {
    async chat(message: string): Promise<ChatResponse> {
        const headers = await getAuthHeaders();
        const res = await fetch(`${API_URL}/chat`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                ...headers 
            },
            body: JSON.stringify({ message })
        });
        
        if (!res.ok) throw new Error('Network response was not ok');
        return res.json();
    },

    async upload(file: File) {
        const headers = await getAuthHeaders();
        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch(`${API_URL}/upload`, {
            method: 'POST',
            headers: {
                // FormData sets Content-Type automatically
                ...headers
            },
            body: formData
        });

        if (!res.ok) throw new Error('Upload failed');
        return res.json();
    },

    async crawl(url: string) {
        const headers = await getAuthHeaders();
        const res = await fetch(`${API_URL}/crawl`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                ...headers 
            },
            body: JSON.stringify({ url })
        });

        if (!res.ok) throw new Error('Crawl failed');
        return res.json();
    }
};
