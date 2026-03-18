export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: number
          email: string
          name: string | null
          created_at: string | null
          subscription_tier: string | null
        }
        Insert: {
          id?: number
          email: string
          name?: string | null
          created_at?: string
          subscription_tier?: string
        }
        Update: {
          id?: number
          email?: string
          name?: string | null
          created_at?: string
          subscription_tier?: string
        }
      }
      broker_configs: {
        Row: {
          id: number
          user_id: number | null
          broker_type: string
          encrypted_api_key: string | null
          encrypted_secret: string | null
          is_active: boolean | null
        }
        Insert: {
          id?: number
          user_id?: number | null
          broker_type: string
          encrypted_api_key?: string | null
          encrypted_secret?: string | null
          is_active?: boolean
        }
        Update: {
          id?: number
          user_id?: number | null
          broker_type?: string
          encrypted_api_key?: string | null
          encrypted_secret?: string | null
          is_active?: boolean
        }
      }
      strategies: {
        Row: {
          id: number
          user_id: number | null
          name: string | null
          type: string | null
          params: Json | null
          broker_config_id: number | null
          is_active: boolean | null
          is_paper: boolean | null
        }
        Insert: {
          id?: number
          user_id?: number | null
          name?: string | null
          type?: string | null
          params?: Json | null
          broker_config_id?: number | null
          is_active?: boolean
          is_paper?: boolean
        }
        Update: {
          id?: number
          user_id?: number | null
          name?: string | null
          type?: string | null
          params?: Json | null
          broker_config_id?: number | null
          is_active?: boolean
          is_paper?: boolean
        }
      }
      orders: {
        Row: {
          id: number
          user_id: number | null
          strategy_id: number | null
          broker_type: string | null
          symbol: string | null
          side: string | null
          quantity: string | null
          price: string | null
          status: string | null
          created_at: string | null
        }
        Insert: {
          id?: number
          user_id?: number | null
          strategy_id?: number | null
          broker_type?: string | null
          symbol?: string | null
          side?: string | null
          quantity?: string | null
          price?: string | null
          status?: string
          created_at?: string
        }
        Update: {
          id?: number
          user_id?: number | null
          strategy_id?: number | null
          broker_type?: string | null
          symbol?: string | null
          side?: string | null
          quantity?: string | null
          price?: string | null
          status?: string
          created_at?: string
        }
      }
      positions: {
        Row: {
          id: number
          user_id: number | null
          broker_type: string | null
          symbol: string | null
          quantity: string | null
          avg_price: string | null
          current_price: string | null
          pnl: string | null
        }
        Insert: {
          id?: number
          user_id?: number | null
          broker_type?: string | null
          symbol?: string | null
          quantity?: string | null
          avg_price?: string | null
          current_price?: string | null
          pnl?: string | null
        }
        Update: {
          id?: number
          user_id?: number | null
          broker_type?: string | null
          symbol?: string | null
          quantity?: string | null
          avg_price?: string | null
          current_price?: string | null
          pnl?: string | null
        }
      }
      backtest_results: {
        Row: {
          id: number
          user_id: number | null
          strategy_id: number | null
          params: Json | null
          result_json: Json | null
          created_at: string | null
        }
        Insert: {
          id?: number
          user_id?: number | null
          strategy_id?: number | null
          params?: Json | null
          result_json?: Json | null
          created_at?: string
        }
        Update: {
          id?: number
          user_id?: number | null
          strategy_id?: number | null
          params?: Json | null
          result_json?: Json | null
          created_at?: string
        }
      }
      subscriptions: {
        Row: {
          id: number
          user_id: number | null
          plan: string | null
          status: string | null
          toss_customer_key: string | null
          current_period_end: string | null
        }
        Insert: {
          id?: number
          user_id?: number | null
          plan?: string
          status?: string
          toss_customer_key?: string | null
          current_period_end?: string | null
        }
        Update: {
          id?: number
          user_id?: number | null
          plan?: string
          status?: string
          toss_customer_key?: string | null
          current_period_end?: string | null
        }
      }
      notifications: {
        Row: {
          id: number
          user_id: number | null
          type: string | null
          message: string | null
          is_read: boolean | null
          created_at: string | null
        }
        Insert: {
          id?: number
          user_id?: number | null
          type?: string | null
          message?: string | null
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: number
          user_id?: number | null
          type?: string | null
          message?: string | null
          is_read?: boolean
          created_at?: string
        }
      }
      trade_logs: {
        Row: {
          id: number
          user_id: number | null
          strategy_id: number | null
          action: string | null
          details: Json | null
          timestamp: string | null
        }
        Insert: {
          id?: number
          user_id?: number | null
          strategy_id?: number | null
          action?: string | null
          details?: Json | null
          timestamp?: string
        }
        Update: {
          id?: number
          user_id?: number | null
          strategy_id?: number | null
          action?: string | null
          details?: Json | null
          timestamp?: string
        }
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
