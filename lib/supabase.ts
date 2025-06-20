import { createClient } from "@supabase/supabase-js"

// Your Supabase configuration
const supabaseUrl = "https://dlowaqxdjnsqplpnlyyk.supabase.co"
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsb3dhcXhkam5zcXBscG5seXlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwMDE3MDUsImV4cCI6MjA2NTU3NzcwNX0.jZmIIoKau5eIOwOAmsCq7n31FxZubctqN5ewCnexYlc"

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      polls: {
        Row: {
          id: string
          question: string
          options: string[]
          created_at: string
          user_id?: string
          is_public?: boolean
          share_token?: string
        }
        Insert: {
          id?: string
          question: string
          options: string[]
          created_at?: string
          user_id?: string
          is_public?: boolean
          share_token?: string
        }
        Update: {
          id?: string
          question?: string
          options?: string[]
          created_at?: string
          user_id?: string
          is_public?: boolean
          share_token?: string
        }
      }
    }
  }
}
