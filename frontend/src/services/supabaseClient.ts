// frontend/src/services/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';

const env = (import.meta as any).env || {};
const supabaseUrl = env.VITE_SUPABASE_URL || 'https://yleoqalxncxbwkfefqcp.supabase.co';
const supabaseKey = env.VITE_SUPABASE_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseKey);
