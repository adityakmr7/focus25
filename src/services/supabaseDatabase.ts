import { supabase } from '../lib/supabase';

export interface SupabaseGoal {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category: string;
  type: string;
  target: number;
  current: number;
  unit: string;
  is_completed: boolean;
  created_at: string;
  completed_at?: string;
  deadline?: string;
  reward?: string;
}

export interface SupabaseStatistics {
  id: string;
  user_id: string;
  date: string;
  total_flows: number;
  started_flows: number;
  completed_flows: number;
  total_focus_time: number;
  total_breaks: number;
  total_break_time: number;
  interruptions: number;
  created_at: string;
  updated_at: string;
}

export interface SupabaseFlowMetrics {
  id: string;
  user_id: string;
  consecutive_sessions: number;
  current_streak: number;
  longest_streak: number;
  flow_intensity: string;
  distraction_count: number;
  session_start_time?: number;
  total_focus_time: number;
  average_session_length: number;
  best_flow_duration: number;
  last_session_date?: string;
  updated_at: string;
}

export interface SupabaseSettings {
  id: string;
  user_id: string;
  time_duration: number;
  break_duration: number;
  sound_effects: boolean;
  notifications: boolean;
  dark_mode: boolean;
  auto_break: boolean;
  focus_reminders: boolean;
  weekly_reports: boolean;
  data_sync: boolean;
  notification_status?: string;
  updated_at: string;
}

class SupabaseDatabaseService {
  // Goals operations
  async saveGoal(goal: any): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const goalData: Partial<SupabaseGoal> = {
      id: goal.id,
      user_id: user.id,
      title: goal.title,
      description: goal.description || '',
      category: goal.category,
      type: goal.type,
      target: goal.target,
      current: goal.current || 0,
      unit: goal.unit,
      is_completed: goal.isCompleted || false,
      created_at: goal.createdAt,
      completed_at: goal.completedAt || null,
      deadline: goal.deadline || null,
      reward: goal.reward || null,
    };

    const { error } = await supabase
      .from('goals')
      .upsert(goalData);

    if (error) throw error;
  }

  async getGoals(): Promise<any[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((row: SupabaseGoal) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      category: row.category,
      type: row.type,
      target: row.target,
      current: row.current,
      unit: row.unit,
      isCompleted: row.is_completed,
      createdAt: row.created_at,
      completedAt: row.completed_at,
      deadline: row.deadline,
      reward: row.reward,
    }));
  }

  async updateGoal(id: string, updates: any): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const updateData: Partial<SupabaseGoal> = {};
    
    if (updates.current !== undefined) updateData.current = updates.current;
    if (updates.isCompleted !== undefined) updateData.is_completed = updates.isCompleted;
    if (updates.completedAt !== undefined) updateData.completed_at = updates.completedAt;

    const { error } = await supabase
      .from('goals')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;
  }

  async deleteGoal(id: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('goals')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;
  }

  // Statistics operations
  async saveStatistics(stats: any): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const now = new Date().toISOString();
    const statsData: Partial<SupabaseStatistics> = {
      user_id: user.id,
      date: stats.date || new Date().toISOString().split('T')[0],
      total_flows: stats.totalCount || 0,
      started_flows: stats.flows?.started || 0,
      completed_flows: stats.flows?.completed || 0,
      total_focus_time: stats.flows?.minutes || 0,
      total_breaks: stats.breaks?.completed || 0,
      total_break_time: stats.breaks?.minutes || 0,
      interruptions: stats.interruptions || 0,
      created_at: now,
      updated_at: now,
    };

    const { error } = await supabase
      .from('statistics')
      .upsert(statsData, { onConflict: 'user_id,date' });

    if (error) throw error;
  }

  async getStatistics(date?: string): Promise<any> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const targetDate = date || new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('statistics')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', targetDate)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "not found"

    if (!data) {
      return {
        totalCount: 0,
        flows: { started: 0, completed: 0, minutes: 0 },
        breaks: { started: 0, completed: 0, minutes: 0 },
        interruptions: 0,
      };
    }

    return {
      totalCount: data.total_flows,
      flows: {
        started: data.started_flows,
        completed: data.completed_flows,
        minutes: data.total_focus_time,
      },
      breaks: {
        started: data.total_breaks,
        completed: data.total_breaks,
        minutes: data.total_break_time,
      },
      interruptions: data.interruptions,
    };
  }

  async getStatisticsRange(startDate: string, endDate: string): Promise<any[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('statistics')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date');

    if (error) throw error;

    return (data || []).map((row: SupabaseStatistics) => ({
      date: row.date,
      totalCount: row.total_flows,
      flows: {
        started: row.started_flows,
        completed: row.completed_flows,
        minutes: row.total_focus_time,
      },
      breaks: {
        started: row.total_breaks,
        completed: row.total_breaks,
        minutes: row.total_break_time,
      },
      interruptions: row.interruptions,
    }));
  }

  // Flow metrics operations
  async saveFlowMetrics(metrics: any): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const now = new Date().toISOString();
    const metricsData: Partial<SupabaseFlowMetrics> = {
      user_id: user.id,
      consecutive_sessions: metrics.consecutiveSessions || 0,
      current_streak: metrics.currentStreak || 0,
      longest_streak: metrics.longestStreak || 0,
      flow_intensity: metrics.flowIntensity || 'medium',
      distraction_count: metrics.distractionCount || 0,
      session_start_time: metrics.sessionStartTime || null,
      total_focus_time: metrics.totalFocusTime || 0,
      average_session_length: metrics.averageSessionLength || 25.0,
      best_flow_duration: metrics.bestFlowDuration || 0,
      last_session_date: metrics.lastSessionDate || null,
      updated_at: now,
    };

    const { error } = await supabase
      .from('flow_metrics')
      .upsert(metricsData, { onConflict: 'user_id' });

    if (error) throw error;
  }

  async getFlowMetrics(): Promise<any> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('flow_metrics')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    if (!data) {
      return {
        consecutiveSessions: 0,
        currentStreak: 0,
        longestStreak: 0,
        flowIntensity: 'medium',
        distractionCount: 0,
        sessionStartTime: null,
        totalFocusTime: 0,
        averageSessionLength: 25.0,
        bestFlowDuration: 0,
        lastSessionDate: null,
      };
    }

    return {
      consecutiveSessions: data.consecutive_sessions,
      currentStreak: data.current_streak,
      longestStreak: data.longest_streak,
      flowIntensity: data.flow_intensity,
      distractionCount: data.distraction_count,
      sessionStartTime: data.session_start_time,
      totalFocusTime: data.total_focus_time,
      averageSessionLength: data.average_session_length,
      bestFlowDuration: data.best_flow_duration,
      lastSessionDate: data.last_session_date,
    };
  }

  // Settings operations
  async saveSettings(settings: any): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const now = new Date().toISOString();
    const settingsData: Partial<SupabaseSettings> = {
      user_id: user.id,
      time_duration: settings.timeDuration || 25,
      break_duration: settings.breakDuration || 5,
      sound_effects: settings.soundEffects ?? true,
      notifications: settings.notifications ?? true,
      dark_mode: settings.darkMode ?? false,
      auto_break: settings.autoBreak ?? false,
      focus_reminders: settings.focusReminders ?? true,
      weekly_reports: settings.weeklyReports ?? true,
      data_sync: settings.dataSync ?? true,
      notification_status: settings.notificationStatus || null,
      updated_at: now,
    };

    const { error } = await supabase
      .from('settings')
      .upsert(settingsData, { onConflict: 'user_id' });

    if (error) throw error;
  }

  async getSettings(): Promise<any> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    if (!data) {
      return {
        timeDuration: 25,
        breakDuration: 5,
        soundEffects: true,
        notifications: true,
        darkMode: false,
        autoBreak: false,
        focusReminders: true,
        weeklyReports: true,
        dataSync: true,
        notificationStatus: null,
      };
    }

    return {
      timeDuration: data.time_duration,
      breakDuration: data.break_duration,
      soundEffects: data.sound_effects,
      notifications: data.notifications,
      darkMode: data.dark_mode,
      autoBreak: data.auto_break,
      focusReminders: data.focus_reminders,
      weeklyReports: data.weekly_reports,
      dataSync: data.data_sync,
      notificationStatus: data.notification_status,
    };
  }

  // Export operations
  async exportAllData(): Promise<string> {
    const [goals, flowMetrics, settings] = await Promise.all([
      this.getGoals(),
      this.getFlowMetrics(),
      this.getSettings(),
    ]);

    // Get statistics for the last year
    const startDate = new Date();
    startDate.setFullYear(startDate.getFullYear() - 1);
    const endDate = new Date();
    
    const statistics = await this.getStatisticsRange(
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0]
    );

    const exportData = {
      goals,
      statistics,
      flowMetrics,
      settings,
      exportedAt: new Date().toISOString(),
      version: '1.0',
    };

    return JSON.stringify(exportData, null, 2);
  }

  async clearAllData(): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Delete all user data
    await Promise.all([
      supabase.from('goals').delete().eq('user_id', user.id),
      supabase.from('statistics').delete().eq('user_id', user.id),
      supabase.from('flow_metrics').delete().eq('user_id', user.id),
      supabase.from('settings').delete().eq('user_id', user.id),
    ]);
  }
}

export const supabaseDatabaseService = new SupabaseDatabaseService();