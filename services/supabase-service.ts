import { supabase } from "@/configs/supabase-config";

export interface Todo {
  id: string;
  title: string;
  description: string;
  icon: string;
  isCompleted: boolean;
  created_at: string;
  completedAt: string | null;
  user_id: string;
}

export interface Session {
  id: string;
  duration: number;
  type: "focus" | "break";
  completedAt: string;
  user_id: string;
}

export interface UserSettings {
  id: string;
  focusDuration: number;
  breakDuration: number;
  notifications: boolean;
  theme: string;
  userName: string;
  onboardingCompleted: boolean;
  user_id: string;
}

export class SupabaseService {
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  // Todo operations
  async getTodos(): Promise<Todo[]> {
    const { data, error } = await supabase
      .from("todos")
      .select("*")
      .eq("user_id", this.userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async createTodo(
    todo: Omit<Todo, "id" | "createdAt" | "isCompleted" | "user_id">
  ): Promise<string> {
    const { data, error } = await supabase
      .from("todos")
      .insert({
        ...todo,
        user_id: this.userId,
        isCompleted: false,
        created_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (error) throw error;
    return data.id;
  }

  async updateTodo(id: string, updates: Partial<Todo>): Promise<void> {
    const { error } = await supabase
      .from("todos")
      .update(updates)
      .eq("id", id)
      .eq("user_id", this.userId);

    if (error) throw error;
  }

  async deleteTodo(id: string): Promise<void> {
    const { error } = await supabase
      .from("todos")
      .delete()
      .eq("id", id)
      .eq("user_id", this.userId);

    if (error) throw error;
  }

  // Session operations
  async getSessions(): Promise<Session[]> {
    const { data, error } = await supabase
      .from("sessions")
      .select("*")
      .eq("user_id", this.userId)
      .order("completedAt", { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async createSession(
    session: Omit<Session, "id" | "user_id">
  ): Promise<string> {
    const { data, error } = await supabase
      .from("sessions")
      .insert({
        ...session,
        user_id: this.userId,
      })
      .select("id")
      .single();

    if (error) throw error;
    return data.id;
  }

  // Settings operations
  async getSettings(): Promise<UserSettings | null> {
    const { data, error } = await supabase
      .from("user_settings")
      .select("*")
      .eq("user_id", this.userId)
      .single();

    if (error && error.code !== "PGRST116") throw error; // PGRST116 = no rows found
    return data;
  }

  async updateSettings(settings: Partial<UserSettings>): Promise<void> {
    const { error } = await supabase.from("user_settings").upsert({
      ...settings,
      user_id: this.userId,
    });

    if (error) throw error;
  }
}

// Factory function to create service instance
export const createSupabaseService = (userId: string) =>
  new SupabaseService(userId);
