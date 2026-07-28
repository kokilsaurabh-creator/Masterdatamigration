// frontend/src/services/authService.ts
import { supabase } from './supabaseClient';
import type { AppUser } from '../types';

export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function loginUser(username: string, password: string): Promise<{ user: AppUser | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('app_users')
      .select('*')
      .eq('username', username)
      .single();

    if (error || !data) {
      return { user: null, error: 'Invalid username or password.' };
    }

    if (data.is_locked) {
      return { user: null, error: 'Access Denied: Your account has been locked. Contact an Administrator.' };
    }

    const hashed = await hashPassword(password);
    if (hashed === data.password_hash) {
      const user: AppUser = {
        id: data.id,
        username: data.username,
        role: data.role,
        is_locked: data.is_locked,
        created_at: data.created_at
      };
      return { user, error: null };
    } else {
      return { user: null, error: 'Invalid username or password.' };
    }
  } catch (err: any) {
    return { user: null, error: err.message || 'Authentication failed.' };
  }
}

export async function fetchAllUsers(): Promise<AppUser[]> {
  const { data, error } = await supabase
    .from('app_users')
    .select('id, username, role, is_locked, created_at')
    .order('created_at', { ascending: false });

  if (error || !data) return [];
  return data as AppUser[];
}

export async function createUser(username: string, password: string, role: 'Admin' | 'User'): Promise<{ success: boolean; error: string | null }> {
  try {
    const password_hash = await hashPassword(password);
    const { error } = await supabase.from('app_users').insert({
      username,
      password_hash,
      role,
      is_locked: false
    });

    if (error) return { success: false, error: error.message };
    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function updateUserStatus(username: string, is_locked: boolean): Promise<boolean> {
  const { error } = await supabase
    .from('app_users')
    .update({ is_locked })
    .eq('username', username);

  return !error;
}

export async function resetUserPassword(username: string, newPassword: string): Promise<boolean> {
  const password_hash = await hashPassword(newPassword);
  const { error } = await supabase
    .from('app_users')
    .update({ password_hash })
    .eq('username', username);

  return !error;
}
