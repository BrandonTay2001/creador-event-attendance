import { createClient } from '@supabase/supabase-js'
import { Database } from '../types/database'

const supabaseUrl = 'https://lgxzqlxlkzvzyybsubxj.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxneHpxbHhsa3p2enl5YnN1YnhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5OTIxOTcsImV4cCI6MjA3NDU2ODE5N30.5yCh0tTi51Ve2A1N9MAA9cZXnw-_QdViRDLaunwWTlQ'

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)