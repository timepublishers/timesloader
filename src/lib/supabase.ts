import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          phone: string | null
          company: string | null
          is_admin: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          phone?: string | null
          company?: string | null
          is_admin?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          phone?: string | null
          company?: string | null
          is_admin?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      hosting_packages: {
        Row: {
          id: string
          name: string
          description: string
          price: number
          storage: string
          bandwidth: string
          email_accounts: number
          databases: number
          features: string[]
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description: string
          price: number
          storage: string
          bandwidth: string
          email_accounts: number
          databases: number
          features: string[]
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          price?: number
          storage?: string
          bandwidth?: string
          email_accounts?: number
          databases?: number
          features?: string[]
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      domain_pricing: {
        Row: {
          id: string
          extension: string
          price: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          extension: string
          price: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          extension?: string
          price?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      user_domains: {
        Row: {
          id: string
          user_id: string
          domain_name: string
          extension: string
          price_paid: number
          registration_date: string
          expiry_date: string
          payment_due_date: string
          status: 'active' | 'expired' | 'pending'
          auto_renew: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          domain_name: string
          extension: string
          price_paid: number
          registration_date: string
          expiry_date: string
          payment_due_date: string
          status?: 'active' | 'expired' | 'pending'
          auto_renew?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          domain_name?: string
          extension?: string
          price_paid?: number
          registration_date?: string
          expiry_date?: string
          payment_due_date?: string
          status?: 'active' | 'expired' | 'pending'
          auto_renew?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      user_hosting: {
        Row: {
          id: string
          user_id: string
          package_id: string
          domain_name: string
          price_paid: number
          start_date: string
          expiry_date: string
          payment_due_date: string
          status: 'active' | 'suspended' | 'expired'
          auto_renew: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          package_id: string
          domain_name: string
          price_paid: number
          start_date: string
          expiry_date: string
          payment_due_date: string
          status?: 'active' | 'suspended' | 'expired'
          auto_renew?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          package_id?: string
          domain_name?: string
          price_paid?: number
          start_date?: string
          expiry_date?: string
          payment_due_date?: string
          status?: 'active' | 'suspended' | 'expired'
          auto_renew?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      complaints: {
        Row: {
          id: string
          user_id: string
          subject: string
          description: string
          category: 'domain' | 'hosting' | 'billing' | 'technical' | 'other'
          status: 'open' | 'in_progress' | 'resolved' | 'closed'
          priority: 'low' | 'medium' | 'high' | 'urgent'
          admin_response: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          subject: string
          description: string
          category: 'domain' | 'hosting' | 'billing' | 'technical' | 'other'
          status?: 'open' | 'in_progress' | 'resolved' | 'closed'
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          admin_response?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          subject?: string
          description?: string
          category?: 'domain' | 'hosting' | 'billing' | 'technical' | 'other'
          status?: 'open' | 'in_progress' | 'resolved' | 'closed'
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          admin_response?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      contact_inquiries: {
        Row: {
          id: string
          name: string
          email: string
          phone: string | null
          company: string | null
          subject: string
          message: string
          status: 'new' | 'contacted' | 'resolved'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          email: string
          phone?: string | null
          company?: string | null
          subject: string
          message: string
          status?: 'new' | 'contacted' | 'resolved'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          phone?: string | null
          company?: string | null
          subject?: string
          message?: string
          status?: 'new' | 'contacted' | 'resolved'
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}