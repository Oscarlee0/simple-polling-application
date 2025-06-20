"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { BarChart3, TrendingUp, Users, Trophy, Calendar, Share2, Eye, Vote, Crown, Loader2 } from "lucide-react"
import { DatabaseService, type PollWithStats } from "@/lib/database"
import { useToast } from "@/hooks/use-toast"
import { ShareButton } from "./share-button"

interface UserDashboardProps {
  onNavigateToEdit: (pollId: string) => void
}

export function UserDashboard({ onNavigateToEdit }: UserDashboardProps) {
  const [polls, setPolls] = useState<PollWithStats[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    loadPollsWithStats()
  }, [])

  const loadPollsWithStats = async () => {
    try {
      setIsLoading(true)
      const pollsData = await DatabaseService.getUserPollsWithStats()
      setPolls(pollsData)
    } catch (error) {
      console.error("Failed to load polls with stats:", error)
      toast({
        title: "Error Loading Dashboard",
        description: "Failed to load your polls and statistics.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getWinningOption = (poll: PollWithStats) => {
    if (poll.statistics.length === 0) return null

    const maxVotes = Math.max(...poll.statistics.map((stat) => stat.vote_count))
    const winningStats = poll.statistics.find((stat) => stat.vote_count === maxVotes)

    if (!winningStats || maxVotes === 0) return null

    return {
      option: poll.options[winningStats.option_index],
      votes: winningStats.vote_count,
      percentage: winningStats.percentage,
    }
  }

  const handleShareUpdate = (pollId: string, isPublic: boolean, shareToken?: string) => {
    console.log("Share update:", { pollId, isPublic, shareToken }) // Debug log

    setPolls((prevPolls) =>
      prevPolls.map((poll) => {
        if (poll.id === pollId) {
          const updatedPoll = {
            ...poll,
            is_public: isPublic,
            share_token: shareToken,
          }
          console.log("Updated poll:", updatedPoll) // Debug log
          return updatedPoll
        }
        return poll
      }),
    )

    // Show a toast to confirm the update
    if (isPublic && shareToken) {
      toast({
        title: "Poll Status Updated! ✅",
        description: "Your poll is now publicly shareable and will show the 'Public' badge.",
      })
    } else if (!isPublic) {
      toast({
        title: "Sharing Disabled ❌",
        description: "Your poll is now private and the 'Public' badge has been removed.",
      })
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <Loader2 className="h-12 w-12 text-purple-600 animate-spin mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Loading Dashboard...</h3>
          <p className="text-gray-500">Fetching your polls and vote statistics</p>
        </div>
      </div>
    )
  }

  if (polls.length === 0) {
    return (
      <Card className="backdrop-blur-sm bg-white/90 border-0 shadow-xl">
        <CardContent className="py-16 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <BarChart3 className="h-10 w-10 text-purple-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">No Polls Yet</h3>
          <p className="text-gray-500 text-lg max-w-md mx-auto">
            Create your first poll to start seeing vote statistics and insights from your audience!
          </p>
        </CardContent>
      </Card>
    )
  }

  const totalVotes = polls.reduce((sum, poll) => sum + poll.total_votes, 0)
  const totalPolls = polls.length
  const activePolls = polls.filter((poll) => poll.is_public).length

  return (
    <div className="space-y-8">
      {/* Dashboard Overview */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="backdrop-blur-sm bg-white/90 border-0 shadow-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Polls</p>
                <p className="text-3xl font-bold text-gray-900">{totalPolls}</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full">
                <Vote className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-sm bg-white/90 border-0 shadow-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Votes</p>
                <p className="text-3xl font-bold text-gray-900">{totalVotes}</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-green-100 to-blue-100 rounded-full">
                <Users className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="backdrop-blur-sm bg-white/90 border-0 shadow-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Polls</p>
                <p className="text-3xl font-bold text-gray-900">{activePolls}</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Polls with Statistics */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Poll Statistics</h2>
            <p className="text-sm sm:text-base text-gray-600">Detailed insights for each of your polls</p>
          </div>
          <Button onClick={loadPollsWithStats} variant="outline" size="sm" className="w-full sm:w-auto">
            <TrendingUp className="h-4 w-4 mr-2" />
            Refresh Stats
          </Button>
        </div>

        <div className="space-y-6">
          {polls.map((poll) => {
            const winningOption = getWinningOption(poll)

            return (
              <Card key={poll.id} className="backdrop-blur-sm bg-white/90 border-0 shadow-xl">
                <CardHeader className="pb-4">
                  <div className="flex flex-col lg:flex-row items-start justify-between gap-4">
                    <div className="flex-1 w-full lg:pr-4">
                      <CardTitle className="text-lg sm:text-xl text-gray-900 mb-2 break-words">
                        {poll.question}
                      </CardTitle>
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {poll.created_at}
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {poll.total_votes} votes
                        </div>
                        <div className="flex items-center gap-2">
                          {poll.is_public && poll.share_token && (
                            <Badge variant="secondary" className="bg-green-100 text-green-700 border border-green-200">
                              <Share2 className="h-3 w-3 mr-1" />
                              Public
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-row lg:flex-col xl:flex-row gap-2 w-full lg:w-auto">
                      <ShareButton
                        pollId={poll.id}
                        isPublic={poll.is_public ?? false}
                        shareToken={poll.share_token}
                        onShareUpdate={(isPublic, shareToken) => handleShareUpdate(poll.id, isPublic, shareToken)}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onNavigateToEdit(poll.id)}
                        className="flex-1 lg:flex-none"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  {poll.total_votes === 0 ? (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Vote className="h-8 w-8 text-gray-400" />
                      </div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">No Votes Yet</h4>
                      <p className="text-gray-500">
                        Share your poll to start collecting votes and see statistics here.
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Winning Option */}
                      {winningOption && (
                        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full">
                              <Crown className="h-5 w-5 text-white" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                                <Trophy className="h-4 w-4 text-yellow-600" />
                                Leading Option
                              </h4>
                              <p className="text-gray-700">
                                <span className="font-medium">"{winningOption.option}"</span> with{" "}
                                <span className="font-bold text-yellow-700">
                                  {winningOption.votes} votes ({winningOption.percentage}%)
                                </span>
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      <Separator />

                      {/* Vote Breakdown */}
                      <div className="space-y-4">
                        <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                          <BarChart3 className="h-5 w-5 text-purple-600" />
                          Vote Breakdown
                        </h4>

                        <div className="space-y-4">
                          {poll.options.map((option, index) => {
                            const stats = poll.statistics.find((s) => s.option_index === index)
                            const votes = stats?.vote_count || 0
                            const percentage = stats?.percentage || 0
                            const isWinning = winningOption && winningOption.option === option && votes > 0

                            return (
                              <div
                                key={index}
                                className={`p-4 rounded-lg border transition-all duration-200 ${
                                  isWinning ? "border-yellow-300 bg-yellow-50" : "border-gray-200 bg-gray-50"
                                }`}
                              >
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center gap-3">
                                    <Badge
                                      variant="secondary"
                                      className={`text-xs ${
                                        isWinning ? "bg-yellow-200 text-yellow-800" : "bg-gray-200 text-gray-700"
                                      }`}
                                    >
                                      {index + 1}
                                    </Badge>
                                    <span className="font-medium text-gray-900">{option}</span>
                                    {isWinning && <Crown className="h-4 w-4 text-yellow-600" />}
                                  </div>
                                  <div className="text-right">
                                    <div className="text-sm font-semibold text-gray-900">{votes} votes</div>
                                    <div className="text-xs text-gray-600">{percentage.toFixed(1)}%</div>
                                  </div>
                                </div>
                                <Progress
                                  value={percentage}
                                  className={`h-2 ${isWinning ? "bg-yellow-200" : "bg-gray-200"}`}
                                />
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
