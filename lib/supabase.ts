import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://wjzpvwscenvdbyouqmyc.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqenB2d3NjZW52ZGJ5b3VxbXljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI2NTc0NzcsImV4cCI6MjA1ODIzMzQ3N30.vS37NsY--RxeBM6QysgOO4WGbYAD737tA16mSXyozfU";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
