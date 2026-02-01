
import { createClient } from '@supabase/supabase-js';

// Credentials provided by the user
const supabaseUrl = 'https://wcfocpdjfsemxpadfjsr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndjZm9jcGRqZnNlbXhwYWRmanNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4MDc3NDUsImV4cCI6MjA4NTM4Mzc0NX0.z3sp75NbBclAXhMKbAzBsLROvSKh7FRsHGgFAhCPqpA';

/**
 * Checks if the Supabase configuration is valid.
 */
export const isSupabaseConfigured = !!(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl.startsWith('https://') &&
  !supabaseUrl.includes('placeholder')
);

/**
 * Initializes the Supabase client.
 * Using the verified credentials to prevent "supabaseUrl is required" errors.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
