import { supabase } from "./supabase"

export interface Poll {
  id: string
  question: string
  options: string[]
  created_at: string
  user_id?: string
  is_public?: boolean
  share_token?: string
}

export interface Vote {
  id: string
  poll_id: string
  option_index: number
  voter_session: string
  created_at: string
}

export interface PollStatistics {
  option_index: number
  vote_count: number
  percentage: number
}

export interface PollWithStats extends Poll {
  total_votes: number
  statistics: PollStatistics[]
  user_vote?: number // The option index the current user voted for
}

export class DatabaseService {
  static async checkTableExists(): Promise<boolean> {
    try {
      const { error } = await supabase.from("polls").select("id").limit(1)
      return !error || error.code !== "42P01" // 42P01 is "relation does not exist"
    } catch (error) {
      return false
    }
  }

  static async checkSupabaseConnection(): Promise<boolean> {
    try {
      const { error } = await supabase.from("polls").select("id").limit(1)
      return !error || error.code !== "42P01" // 42P01 is "relation does not exist"
    } catch (error) {
      return false
    }
  }

  static async getAllPolls(): Promise<Poll[]> {
    try {
      // Check if table exists first
      const tableExists = await this.checkTableExists()
      if (!tableExists) {
        console.warn("Polls table does not exist. Please run the database setup script.")
        return []
      }

      const { data, error } = await supabase.from("polls").select("*").order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching polls:", error)
        if (error.code === "42P01") {
          throw new Error("Database table not found. Please run the setup script to create the polls table.")
        }
        throw new Error(`Failed to fetch polls: ${error.message}`)
      }

      return (data || []).map((poll) => ({
        id: poll.id,
        question: poll.question,
        options: poll.options,
        created_at: new Date(poll.created_at).toLocaleDateString(),
        user_id: poll.user_id,
        is_public: poll.is_public,
        share_token: poll.share_token,
      }))
    } catch (error) {
      console.error("Database error:", error)
      throw error
    }
  }

  static async getUserPolls(): Promise<Poll[]> {
    try {
      // Check if table exists first
      const tableExists = await this.checkTableExists()
      if (!tableExists) {
        console.warn("Polls table does not exist. Please run the database setup script.")
        return []
      }

      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        throw new Error("User not authenticated")
      }

      const { data, error } = await supabase
        .from("polls")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching user polls:", error)
        throw new Error(`Failed to fetch user polls: ${error.message}`)
      }

      return (data || []).map((poll) => ({
        id: poll.id,
        question: poll.question,
        options: poll.options,
        created_at: new Date(poll.created_at).toLocaleDateString(),
        user_id: poll.user_id,
        is_public: poll.is_public,
        share_token: poll.share_token,
      }))
    } catch (error) {
      console.error("Database error:", error)
      throw error
    }
  }

  static async getUserPollsWithStats(): Promise<PollWithStats[]> {
    try {
      const polls = await this.getUserPolls()

      const pollsWithStats = await Promise.all(
        polls.map(async (poll) => {
          const [totalVotes, statistics] = await Promise.all([
            this.getPollTotalVotes(poll.id),
            this.getPollStatistics(poll.id),
          ])

          return {
            ...poll,
            total_votes: totalVotes,
            statistics,
          }
        }),
      )

      return pollsWithStats
    } catch (error) {
      console.error("Database error:", error)
      throw error
    }
  }

  static async getPollStatistics(pollId: string): Promise<PollStatistics[]> {
    try {
      const { data, error } = await supabase.rpc("get_poll_statistics", {
        poll_uuid: pollId,
      })

      if (error) {
        console.error("Error fetching poll statistics:", error)
        return []
      }

      return data || []
    } catch (error) {
      console.error("Database error:", error)
      return []
    }
  }

  static async getPollTotalVotes(pollId: string): Promise<number> {
    try {
      const { data, error } = await supabase.rpc("get_poll_total_votes", {
        poll_uuid: pollId,
      })

      if (error) {
        console.error("Error fetching poll total votes:", error)
        return 0
      }

      return data || 0
    } catch (error) {
      console.error("Database error:", error)
      return 0
    }
  }

  static async castVote(pollId: string, optionIndex: number, voterSession: string): Promise<void> {
    try {
      const { error } = await supabase.from("votes").insert({
        poll_id: pollId,
        option_index: optionIndex,
        voter_session: voterSession,
      })

      if (error) {
        if (error.code === "23505") {
          // Unique constraint violation
          throw new Error("You have already voted on this poll")
        }
        console.error("Error casting vote:", error)
        throw new Error(`Failed to cast vote: ${error.message}`)
      }
    } catch (error) {
      console.error("Database error:", error)
      throw error
    }
  }

  static async getUserVote(pollId: string, voterSession: string): Promise<number | null> {
    try {
      const { data, error } = await supabase
        .from("votes")
        .select("option_index")
        .eq("poll_id", pollId)
        .eq("voter_session", voterSession)
        .single()

      if (error) {
        if (error.code === "PGRST116") {
          return null // No vote found
        }
        console.error("Error fetching user vote:", error)
        return null
      }

      return data.option_index
    } catch (error) {
      console.error("Database error:", error)
      return null
    }
  }

  static async getPollWithStats(pollId: string, voterSession?: string): Promise<PollWithStats | null> {
    try {
      const poll = await this.getPollById(pollId)
      if (!poll) return null

      const [totalVotes, statistics, userVote] = await Promise.all([
        this.getPollTotalVotes(pollId),
        this.getPollStatistics(pollId),
        voterSession ? this.getUserVote(pollId, voterSession) : Promise.resolve(null),
      ])

      return {
        ...poll,
        total_votes: totalVotes,
        statistics,
        user_vote: userVote,
      }
    } catch (error) {
      console.error("Database error:", error)
      throw error
    }
  }

  static async getPollByShareTokenWithStats(shareToken: string, voterSession?: string): Promise<PollWithStats | null> {
    try {
      const poll = await this.getPollByShareToken(shareToken)
      if (!poll) return null

      const [totalVotes, statistics, userVote] = await Promise.all([
        this.getPollTotalVotes(poll.id),
        this.getPollStatistics(poll.id),
        voterSession ? this.getUserVote(poll.id, voterSession) : Promise.resolve(null),
      ])

      return {
        ...poll,
        total_votes: totalVotes,
        statistics,
        user_vote: userVote,
      }
    } catch (error) {
      console.error("Database error:", error)
      throw error
    }
  }

  static async createPoll(question: string, options: string[]): Promise<Poll> {
    try {
      // Check if table exists first
      const tableExists = await this.checkTableExists()
      if (!tableExists) {
        throw new Error("Database table not found. Please run the setup script to create the polls table.")
      }

      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        throw new Error("User not authenticated")
      }

      const { data, error } = await supabase
        .from("polls")
        .insert({
          question: question.trim(),
          options: options.filter((option) => option.trim() !== ""),
          user_id: user.id,
        })
        .select()
        .single()

      if (error) {
        console.error("Error creating poll:", error)
        throw new Error(`Failed to create poll: ${error.message}`)
      }

      return {
        id: data.id,
        question: data.question,
        options: data.options,
        created_at: new Date(data.created_at).toLocaleDateString(),
        user_id: data.user_id,
        is_public: data.is_public,
        share_token: data.share_token,
      }
    } catch (error) {
      console.error("Database error:", error)
      throw error
    }
  }

  static async generateShareLink(pollId: string): Promise<{ shareToken: string }> {
    try {
      // Try to use the database function first
      const { data: tokenData, error: tokenError } = await supabase.rpc("generate_share_token")

      let shareToken: string

      if (tokenError) {
        console.warn("Database function not available, generating token locally:", tokenError)
        // Fallback: generate token locally
        shareToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
      } else {
        shareToken = tokenData
      }

      // Update the poll with the share token and make it public
      const { error } = await supabase
        .from("polls")
        .update({
          is_public: true,
          share_token: shareToken,
        })
        .eq("id", pollId)

      if (error) {
        console.error("Error generating share link:", error)
        throw new Error(`Failed to generate share link: ${error.message}`)
      }

      return { shareToken }
    } catch (error) {
      console.error("Database error:", error)
      throw error
    }
  }

  static async disableSharing(pollId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from("polls")
        .update({
          is_public: false,
          share_token: null,
        })
        .eq("id", pollId)

      if (error) {
        console.error("Error disabling sharing:", error)
        throw new Error(`Failed to disable sharing: ${error.message}`)
      }
    } catch (error) {
      console.error("Database error:", error)
      throw error
    }
  }

  static async getPollByShareToken(shareToken: string): Promise<Poll | null> {
    try {
      const { data, error } = await supabase
        .from("polls")
        .select("*")
        .eq("share_token", shareToken)
        .eq("is_public", true)
        .single()

      if (error) {
        if (error.code === "PGRST116") {
          return null // Poll not found
        }
        console.error("Error fetching poll by share token:", error)
        throw new Error(`Failed to fetch poll: ${error.message}`)
      }

      return {
        id: data.id,
        question: data.question,
        options: data.options,
        created_at: new Date(data.created_at).toLocaleDateString(),
        user_id: data.user_id,
        is_public: data.is_public,
        share_token: data.share_token,
      }
    } catch (error) {
      console.error("Database error:", error)
      throw error
    }
  }

  static async updatePoll(id: string, question: string, options: string[]): Promise<Poll> {
    try {
      // Check if table exists first
      const tableExists = await this.checkTableExists()
      if (!tableExists) {
        throw new Error("Database table not found. Please run the setup script to create the polls table.")
      }

      const { data, error } = await supabase
        .from("polls")
        .update({
          question: question.trim(),
          options: options.filter((option) => option.trim() !== ""),
        })
        .eq("id", id)
        .select()
        .single()

      if (error) {
        console.error("Error updating poll:", error)
        throw new Error(`Failed to update poll: ${error.message}`)
      }

      return {
        id: data.id,
        question: data.question,
        options: data.options,
        created_at: new Date(data.created_at).toLocaleDateString(),
        user_id: data.user_id,
        is_public: data.is_public,
        share_token: data.share_token,
      }
    } catch (error) {
      console.error("Database error:", error)
      throw error
    }
  }

  static async deletePoll(id: string): Promise<void> {
    try {
      // Check if table exists first
      const tableExists = await this.checkTableExists()
      if (!tableExists) {
        throw new Error("Database table not found. Please run the setup script to create the polls table.")
      }

      const { error } = await supabase.from("polls").delete().eq("id", id)

      if (error) {
        console.error("Error deleting poll:", error)
        throw new Error(`Failed to delete poll: ${error.message}`)
      }
    } catch (error) {
      console.error("Database error:", error)
      throw error
    }
  }

  static async getPollById(id: string): Promise<Poll | null> {
    try {
      // Check if table exists first
      const tableExists = await this.checkTableExists()
      if (!tableExists) {
        throw new Error("Database table not found. Please run the setup script to create the polls table.")
      }

      const { data, error } = await supabase.from("polls").select("*").eq("id", id).single()

      if (error) {
        if (error.code === "PGRST116") {
          return null // Poll not found
        }
        console.error("Error fetching poll:", error)
        throw new Error(`Failed to fetch poll: ${error.message}`)
      }

      return {
        id: data.id,
        question: data.question,
        options: data.options,
        created_at: new Date(data.created_at).toLocaleDateString(),
        user_id: data.user_id,
        is_public: data.is_public,
        share_token: data.share_token,
      }
    } catch (error) {
      console.error("Database error:", error)
      throw error
    }
  }
}
