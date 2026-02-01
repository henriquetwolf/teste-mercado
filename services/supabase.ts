
import { createClient } from '@supabase/supabase-js';

// Função auxiliar para obter variáveis de ambiente de forma segura no navegador
const getEnv = (key: string, fallback: string) => {
  try {
    return (typeof process !== 'undefined' && process.env && process.env[key]) || fallback;
  } catch {
    return fallback;
  }
};

const supabaseUrl = getEnv('SUPABASE_URL', 'https://wcfocpdjfsemxpadfjsr.supabase.co');
const supabaseAnonKey = getEnv('SUPABASE_ANON_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndjZm9jcGRqZnNlbXhwYWRmanNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4MDc3NDUsImV4cCI6MjA4NTM4Mzc0NX0.z3sp75NbBclAXhMKbAzBsLROvSKh7FRsHGgFAhCPqpA');

/**
 * Verifica se a configuração é válida.
 */
export const isSupabaseConfigured = !!(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl.startsWith('https://') &&
  !supabaseUrl.includes('placeholder')
);

/**
 * Inicializa o cliente Supabase.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
