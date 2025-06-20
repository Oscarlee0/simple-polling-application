"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, Vote, Users, Calendar, ExternalLink, Crown, Trophy } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { DatabaseService, type PollWithStats } from "@/lib/database"

export default function PublicPollPage({ params }: { params: { token: string } }) {
  const [poll, setPoll] = useState<PollWithStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [hasVoted, setHasVoted] = useState(false)
  const [isVoting, setIsVoting] = useState(false)
  const [voterSession, setVoterSession] = useState<string>("")
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    // Generate a unique session ID for this voter
    const sessionId = `voter_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    setVoterSession(sessionId)
    loadPoll(sessionId)
  }, [params.token])

  const loadPoll = async (sessionId: string) => {
    try {
      setIsLoading(true)
      const pollData = await DatabaseService.getPollByShareTokenWithStats(params.token, sessionId)

      if (!pollData) {
        toast({
          title: "Poll Not Found",
          description: "This poll doesn't exist or is no longer available.",
          variant: "destructive",
        })
        return
      }

      setPoll(pollData)

      // Check if user has already voted
      if (pollData.user_vote !== null && pollData.user_vote !== undefined) {
        setHasVoted(true)
        setSelectedOption(pollData.user_vote)
      }
    } catch (error) {
      console.error("Failed to load poll:", error)
      toast({
        title: "Error Loading Poll",
        description: "Failed to load the poll. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleVote = async () => {
    if (selectedOption === null || !poll || !voterSession) return

    try {
      setIsVoting(true)
      await DatabaseService.castVote(poll.id, selectedOption, voterSession)

      // Reload poll data to get updated statistics
      const updatedPoll = await DatabaseService.getPollByShareTokenWithStats(params.token, voterSession)
      if (updatedPoll) {
        setPoll(updatedPoll)
      }

      setHasVoted(true)
      toast({
        title: "Vote Recorded! 🗳️",
        description: "Thank you for participating in this poll.",
      })
    } catch (error) {
      console.error("Failed to cast vote:", error)
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"

      if (errorMessage.includes("already voted")) {
        toast({
          title: "Already Voted",
          description: "You have already voted on this poll.",
          variant: "destructive",
        })
        setHasVoted(true)
      } else {
        toast({
          title: "Voting Failed",
          description: "Failed to record your vote. Please try again.",
          variant: "destructive",
        })
      }
    } finally {
      setIsVoting(false)
    }
  }

  const getWinningOption = () => {
    if (!poll || poll.statistics.length === 0) return null

    const maxVotes = Math.max(...poll.statistics.map((stat) => stat.vote_count))
    const winningStats = poll.statistics.find((stat) => stat.vote_count === maxVotes)

    if (!winningStats || maxVotes === 0) return null

    return {
      option: poll.options[winningStats.option_index],
      optionIndex: winningStats.option_index,
      votes: winningStats.vote_count,
      percentage: winningStats.percentage,
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full animate-pulse mx-auto"></div>
          <p className="text-lg text-gray-600">Loading poll...</p>
        </div>
      </div>
    )
  }

  if (!poll) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="max-w-md mx-auto backdrop-blur-sm bg-white/90 border-0 shadow-xl">
          <CardContent className="py-16 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-red-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Vote className="h-8 w-8 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Poll Not Found</h3>
            <p className="text-gray-500 mb-6">This poll doesn't exist or is no longer available for public viewing.</p>
            <Button onClick={() => router.push("/")} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const winningOption = getWinningOption()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000"></div>
      </div>

      <div className="relative z-10 py-6 sm:py-12 px-4">
        <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <Button
              variant="ghost"
              onClick={() => router.push("/")}
              className="flex items-center gap-2 hover:bg-white/80 backdrop-blur-sm border border-white/20 shadow-lg transition-all duration-200"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back to Home</span>
              <span className="sm:hidden">Back</span>
            </Button>
            <div className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full border border-white/20 shadow-lg">
              <Vote className="h-4 w-4 text-purple-600" />
              <span className="text-xs sm:text-sm font-medium text-gray-700">Public Poll</span>
            </div>
          </div>

          {/* Poll Card */}
          <Card className="backdrop-blur-sm bg-white/90 border-0 shadow-2xl shadow-purple-500/10">
            <CardHeader className="pb-4 sm:pb-6">
              <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                <div className="flex-1">
                  <CardTitle className="text-xl sm:text-2xl leading-tight text-gray-900 mb-3">
                    {poll.question}
                  </CardTitle>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Created on {poll.created_at}
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {poll.total_votes} votes
                    </div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open("/", "_blank")}
                  className="flex items-center gap-2 w-full sm:w-auto"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span className="sm:hidden">Create Poll</span>
                  <span className="hidden sm:inline">Create Your Own</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {!hasVoted ? (
                <>
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-gray-900">Choose your answer:</h3>
                    <div className="space-y-2">
                      {poll.options.map((option, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedOption(index)}
                          className={`w-full p-4 text-left rounded-lg border-2 transition-all duration-200 ${
                            selectedOption === index
                              ? "border-purple-500 bg-purple-50"
                              : "border-gray-200 hover:border-purple-300 hover:bg-purple-50/50"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-5 h-5 rounded-full border-2 transition-all duration-200 ${
                                selectedOption === index ? "border-purple-500 bg-purple-500" : "border-gray-300"
                              }`}
                            >
                              {selectedOption === index && (
                                <div className="w-full h-full rounded-full bg-white scale-50"></div>
                              )}
                            </div>
                            <span className="text-base font-medium text-gray-900">{option}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <Button
                    onClick={handleVote}
                    disabled={selectedOption === null || isVoting}
                    className="w-full h-12 sm:h-12 text-sm sm:text-base font-semibold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {isVoting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Recording Vote...
                      </>
                    ) : (
                      <>
                        <Vote className="h-5 w-5 mr-2" />
                        Cast Your Vote
                      </>
                    )}
                  </Button>
                </>
              ) : (
                <div className="space-y-6">
                  <div className="text-center p-6 bg-green-50 rounded-lg border border-green-200">
                    <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Vote className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-green-800 mb-1">Vote Recorded!</h3>
                    <p className="text-green-700">Thank you for participating in this poll.</p>
                  </div>

                  {poll.total_votes > 0 && (
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
                                  {winningOption.votes} votes ({winningOption.percentage.toFixed(1)}%)
                                </span>
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900">Poll Results:</h3>
                        <div className="space-y-3">
                          {poll.options.map((option, index) => {
                            const stats = poll.statistics.find((s) => s.option_index === index)
                            const votes = stats?.vote_count || 0
                            const percentage = stats?.percentage || 0
                            const isSelected = selectedOption === index
                            const isWinning = winningOption && winningOption.optionIndex === index && votes > 0

                            return (
                              <div
                                key={index}
                                className={`p-4 rounded-lg border transition-all duration-200 ${
                                  isWinning
                                    ? "border-yellow-300 bg-yellow-50"
                                    : isSelected
                                      ? "border-purple-500 bg-purple-50"
                                      : "border-gray-200 bg-gray-50"
                                }`}
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-gray-900">{option}</span>
                                    {isSelected && (
                                      <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                                        Your Vote
                                      </Badge>
                                    )}
                                    {isWinning && <Crown className="h-4 w-4 text-yellow-600" />}
                                  </div>
                                  <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <span>{votes} votes</span>
                                    <span className="font-semibold">{percentage.toFixed(1)}%</span>
                                  </div>
                                </div>
                                <Progress
                                  value={percentage}
                                  className={`h-2 ${
                                    isWinning ? "bg-yellow-200" : isSelected ? "bg-purple-200" : "bg-gray-200"
                                  }`}
                                />
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="text-center">
            <p className="text-gray-600 mb-4">Want to create your own polls? Join Polling Studio today!</p>
            <Button
              onClick={() => router.push("/")}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              <Vote className="h-4 w-4 mr-2" />
              Get Started
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
