import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bzwgwndwmmaxdmuktasf.supabase.co';
const supabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6d2d3bmR3bW1heGRtdWt0YXNmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MzUxNDEsImV4cCI6MjA2ODMxMTE0MX0.PONnFiudQc_tvwFd2kGJ7MPF9F-f40N-QpwVIu92Nlc';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
