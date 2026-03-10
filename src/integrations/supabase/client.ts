import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

const SUPABASE_URL = "https://cyqpasgbhapjkjjdyrum.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5cXBhc2diaGFwamtqamR5cnVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxMDk2NjEsImV4cCI6MjA4ODY4NTY2MX0.4idkECkThrhrheYqMbu6nGShebmhb8LWKPVlgC1r7xg";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);
