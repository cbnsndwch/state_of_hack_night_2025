import { createClient } from '@supabase/supabase-js';

/**
 * Supabase client for authentication and file storage ONLY.
 *
 * IMPORTANT: Do NOT use this client for data storage.
 * All application data (profiles, projects, badges, attendance)
 * is stored in MongoDB. Use the server-side data layer in app/lib/db/.
 *
 * This client is used for:
 * - Authentication (GitHub OAuth via supabase.auth)
 * - File uploads (supabase.storage for project images)
 */

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase credentials missing. Check your .env file.');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');
