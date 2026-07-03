import { supabase } from './supabaseClient.js';

export function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function validatePassword(pw) {
  if (pw.length < 8) return "Password must be at least 8 characters.";
  if (!/[A-Z]/.test(pw)) return "Must contain at least one uppercase letter.";
  if (!/[a-z]/.test(pw)) return "Must contain at least one lowercase letter.";
  if (!/[0-9]/.test(pw)) return "Must contain at least one number.";
  if (!/[!@#$%^&*()\-_=+[\]{};:'",.<>/?\\|`~]/.test(pw)) return "Must contain at least one special character (!@#$…).";
  return null;
}

export const normalizeProfile = (p) => ({
  ...p,
  firstName: p?.first_name || '',
  lastName:  p?.last_name  || '',
  middleName: p?.middle_name || '',
});

export async function fetchProfile(userId) {
  const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
  return data ? normalizeProfile(data) : null;
}
