import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mnxvjscqqvpfutgdunrm.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ueHZqc2NxcXZwZnV0Z2R1bnJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzMTY5NjksImV4cCI6MjA2OTg5Mjk2OX0.oTv6-OXcPKupN_HaAB5p955xDFpwc4SLBVzCXfVekL4';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);