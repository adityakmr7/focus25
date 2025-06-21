import { Platform } from 'react-native';
import { localDatabaseService } from './localDatabase';
import { supabaseDatabaseService } from './supabaseDatabase';

// Hybrid database service that uses Supabase when authenticated, local storage otherwise
class HybridDatabaseService {
  private isAuthenticated = false;
  private userId: string | null = null;

  setAuthState(isAuthenticated: boolean, userId?: string) {
    this.isAuthenticated = isAuthenticated;
    this.userId = userId || null;
  }

  private useSupabase(): boolean {
    return this.isAuthenticated && !!this.userId;
  }

  private getService() {
    return this.useSupabase() ? supabaseDatabaseService : localDatabaseService;
  }

  async initializeDatabase(): Promise<void> {
    // Always initialize local database as fallback
    await localDatabaseService.initializeDatabase();
  }

  // Goals operations
  async saveGoal(goal: any): Promise<void> {
    const service = this.getService();
    await service.saveGoal(goal);
    
    // If using local storage but authenticated, also sync to Supabase
    if (!this.useSupabase() && this.isAuthenticated) {
      try {
        await supabaseDatabaseService.saveGoal(goal);
      } catch (error) {
        console.warn('Failed to sync goal to Supabase:', error);
      }
    }
  }

  async getGoals(): Promise<any[]> {
    const service = this.getService();
    return await service.getGoals();
  }

  async updateGoal(id: string, updates: any): Promise<void> {
    const service = this.getService();
    await service.updateGoal(id, updates);
    
    // If using local storage but authenticated, also sync to Supabase
    if (!this.useSupabase() && this.isAuthenticated) {
      try {
        await supabaseDatabaseService.updateGoal(id, updates);
      } catch (error) {
        console.warn('Failed to sync goal update to Supabase:', error);
      }
    }
  }

  async deleteGoal(id: string): Promise<void> {
    const service = this.getService();
    await service.deleteGoal(id);
    
    // If using local storage but authenticated, also sync to Supabase
    if (!this.useSupabase() && this.isAuthenticated) {
      try {
        await supabaseDatabaseService.deleteGoal(id);
      } catch (error) {
        console.warn('Failed to sync goal deletion to Supabase:', error);
      }
    }
  }

  // Statistics operations
  async saveStatistics(stats: any): Promise<void> {
    const service = this.getService();
    await service.saveStatistics(stats);
    
    // If using local storage but authenticated, also sync to Supabase
    if (!this.useSupabase() && this.isAuthenticated) {
      try {
        await supabaseDatabaseService.saveStatistics(stats);
      } catch (error) {
        console.warn('Failed to sync statistics to Supabase:', error);
      }
    }
  }

  async getStatistics(date?: string): Promise<any> {
    const service = this.getService();
    return await service.getStatistics(date);
  }

  async getStatisticsRange(startDate: string, endDate: string): Promise<any[]> {
    const service = this.getService();
    return await service.getStatisticsRange(startDate, endDate);
  }

  // Flow metrics operations
  async saveFlowMetrics(metrics: any): Promise<void> {
    const service = this.getService();
    await service.saveFlowMetrics(metrics);
    
    // If using local storage but authenticated, also sync to Supabase
    if (!this.useSupabase() && this.isAuthenticated) {
      try {
        await supabaseDatabaseService.saveFlowMetrics(metrics);
      } catch (error) {
        console.warn('Failed to sync flow metrics to Supabase:', error);
      }
    }
  }

  async getFlowMetrics(): Promise<any> {
    const service = this.getService();
    return await service.getFlowMetrics();
  }

  // Settings operations
  async saveSettings(settings: any): Promise<void> {
    const service = this.getService();
    await service.saveSettings(settings);
    
    // If using local storage but authenticated, also sync to Supabase
    if (!this.useSupabase() && this.isAuthenticated) {
      try {
        await supabaseDatabaseService.saveSettings(settings);
      } catch (error) {
        console.warn('Failed to sync settings to Supabase:', error);
      }
    }
  }

  async getSettings(): Promise<any> {
    const service = this.getService();
    return await service.getSettings();
  }

  // Theme operations (only local for now)
  async saveTheme(theme: any): Promise<void> {
    return await localDatabaseService.saveTheme(theme);
  }

  async getTheme(): Promise<any> {
    return await localDatabaseService.getTheme();
  }

  // Export operations
  async exportAllData(): Promise<string> {
    const service = this.getService();
    return await service.exportAllData();
  }

  async clearAllData(): Promise<void> {
    const service = this.getService();
    await service.clearAllData();
  }

  // Sync operations
  async syncToSupabase(): Promise<void> {
    if (!this.isAuthenticated) {
      throw new Error('User not authenticated for Supabase sync');
    }

    try {
      // Get all local data
      const [goals, flowMetrics, settings] = await Promise.all([
        localDatabaseService.getGoals(),
        localDatabaseService.getFlowMetrics(),
        localDatabaseService.getSettings(),
      ]);

      // Get today's statistics
      const today = new Date().toISOString().split('T')[0];
      const statistics = await localDatabaseService.getStatistics(today);

      // Save to Supabase
      await Promise.all([
        ...goals.map(goal => supabaseDatabaseService.saveGoal(goal)),
        supabaseDatabaseService.saveFlowMetrics(flowMetrics),
        supabaseDatabaseService.saveSettings(settings),
        supabaseDatabaseService.saveStatistics(statistics),
      ]);

      console.log('Successfully synced local data to Supabase');
    } catch (error) {
      console.error('Failed to sync to Supabase:', error);
      throw error;
    }
  }

  async syncFromSupabase(): Promise<void> {
    if (!this.isAuthenticated) {
      throw new Error('User not authenticated for Supabase sync');
    }

    try {
      // Get all Supabase data
      const [goals, flowMetrics, settings] = await Promise.all([
        supabaseDatabaseService.getGoals(),
        supabaseDatabaseService.getFlowMetrics(),
        supabaseDatabaseService.getSettings(),
      ]);

      // Get today's statistics
      const today = new Date().toISOString().split('T')[0];
      const statistics = await supabaseDatabaseService.getStatistics(today);

      // Save to local database
      await Promise.all([
        ...goals.map(goal => localDatabaseService.saveGoal(goal)),
        localDatabaseService.saveFlowMetrics(flowMetrics),
        localDatabaseService.saveSettings(settings),
        localDatabaseService.saveStatistics(statistics),
      ]);

      console.log('Successfully synced Supabase data to local storage');
    } catch (error) {
      console.error('Failed to sync from Supabase:', error);
      throw error;
    }
  }
}

export const hybridDatabaseService = new HybridDatabaseService();