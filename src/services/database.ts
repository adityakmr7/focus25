import { supabase } from '../lib/supabase';
import { Database } from '../types/database.types';

type Tables = Database['public']['Tables'];

// Profile operations
export const profileService = {
  async getProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateProfile(userId: string, updates: Partial<Tables['profiles']['Update']>) {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};

// Session operations
export const sessionService = {
  async createSession(session: Tables['sessions']['Insert']) {
    const { data, error } = await supabase
      .from('sessions')
      .insert(session)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async getSessions(userId: string, startDate: string, endDate: string) {
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('user_id', userId)
      .gte('completed_at', startDate)
      .lte('completed_at', endDate)
      .order('completed_at', { ascending: false });
    
    if (error) throw error;
    return data;
  }
};

// Statistics operations
export const statisticsService = {
  async getStatistics(userId: string, date: string) {
    const { data, error } = await supabase
      .from('statistics')
      .select('*')
      .eq('user_id', userId)
      .eq('date', date)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "no rows returned"
    return data;
  },

  async updateStatistics(userId: string, date: string, updates: Partial<Tables['statistics']['Update']>) {
    const { data, error } = await supabase
      .from('statistics')
      .upsert({
        user_id: userId,
        date,
        ...updates
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};

// Settings operations
export const settingsService = {
  async getSettings(userId: string) {
    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async updateSettings(userId: string, updates: Partial<Tables['settings']['Update']>) {
    const { data, error } = await supabase
      .from('settings')
      .upsert({
        user_id: userId,
        ...updates
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
}; 