
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

// --- MOCK DATA FOR UI TESTING ---
const MOCK_DELAY = 2000;
const mockChatResponse = {
    response: "I've analyzed the provided context. Based on the documentation in your knowledge base, the architecture uses a vector-based retrieval system (RAG) coupled with a Gemini 1.5 Pro inference layer. This ensures high-fidelity data synthesis while maintaining strict privacy boundaries.",
    sources: ["Architecture_Overview.pdf", "Security_Protocols.md"]
};

// Helper to simulate delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const api = {
    async chat(message: string): Promise<ChatResponse> {
        try {
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
        } catch (error) {
            console.warn("API Unreachable - Switching to DEMO MODE");
            await delay(MOCK_DELAY); // Simulate thinking
            return mockChatResponse;
        }
    },

    async upload(file: File) {
        try {
            const headers = await getAuthHeaders();
            const formData = new FormData();
            formData.append('file', file);

            const res = await fetch(`${API_URL}/upload`, {
                method: 'POST',
                headers: {
                    ...headers
                },
                body: formData
            });

            if (!res.ok) throw new Error('Upload failed');
            return res.json();
        } catch (error) {
            console.warn("API Unreachable - Switching to DEMO MODE");
            await delay(MOCK_DELAY); // Simulate processing
            return { message: "File uploaded successfully (Demo)", filename: file.name };
        }
    },

    async crawl(url: string) {
        try {
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
        } catch (error) {
            console.warn("API Unreachable - Switching to DEMO MODE");
            await delay(3500); // Longer delay to show off the crawl animation
            return { message: "URL crawled successfully (Demo)", url };
        }
    }
};
