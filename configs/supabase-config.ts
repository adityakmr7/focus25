import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient, processLock } from "@supabase/supabase-js";
import "react-native-url-polyfill/auto";
// Supabase configuration
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!; // Replace with your Supabase project URL
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_KEY!; // Replace with your Supabase anon key

// Create Supabase client with AsyncStorage for persistence
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    lock: processLock,
  },
});

export default supabase;
