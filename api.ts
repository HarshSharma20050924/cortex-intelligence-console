import { supabase } from './lib/supabase';

const API_URL = 'http://localhost:8000';

const getAuthHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("No active session");
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
                // FormData sets Content-Type automatically, do not set it manually here
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
