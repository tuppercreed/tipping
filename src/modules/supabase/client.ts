import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (supabaseUrl === undefined) { throw new Error('Supabase Url undefined: define NEXT_PULIC_SUPABASE_URL') };
if (supabaseAnonKey === undefined) { throw new Error('Supabase Anon Key undefined: define NEXT_PUBLIC_SUPABASE_ANON_KEY') };

export const supabase = createClient(supabaseUrl, supabaseAnonKey);