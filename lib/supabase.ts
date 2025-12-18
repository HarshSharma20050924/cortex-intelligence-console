import { createClient } from '@supabase/supabase-js';

// Helper to safely get env vars without crashing in browser if process is undefined
const getEnv = (key: string) => {
    try {
        // Check for Vite
        // @ts-ignore
        if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
            // @ts-ignore
            return import.meta.env[key];
        }
        // Check for Node/Webpack
        if (typeof process !== 'undefined' && process.env && process.env[key]) {
            return process.env[key];
        }
    } catch (e) {
        // Ignore errors
    }
    return null;
};

// !!! IMPORTANT: Replace strings below with your actual Supabase URL and Key from your dashboard !!!
// If you are using a .env file, ensure your build tool injects them.
const SUPABASE_URL = getEnv('REACT_APP_SUPABASE_URL') || getEnv('VITE_SUPABASE_URL') || 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = getEnv('REACT_APP_SUPABASE_ANON_KEY') || getEnv('VITE_SUPABASE_ANON_KEY') || 'your-anon-key';

if (SUPABASE_URL === 'https://your-project.supabase.co') {
    console.error('Cortex Error: Supabase credentials are not set. Please update lib/supabase.ts with your URL and Key.');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
