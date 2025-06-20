"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Trash2, Vote, Sparkles, Loader2, LogIn, BarChart3 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { DatabaseService, type Poll } from "@/lib/database"
import { useAuth } from "@/lib/auth-context"
import { AuthModal } from "@/components/auth/auth-modal"
import { UserMenu } from "@/components/auth/user-menu"
import { UserDashboard } from "@/components/user-dashboard"

export default function PollingApp() {
  const [polls, setPolls] = useState<Poll[]>([])
  const [question, setQuestion] = useState("")
  const [options, setOptions] = useState(["", ""])
  const [errors, setErrors] = useState<{ question?: string; options?: string[] }>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [activeTab, setActiveTab] = useState("create")
  const { toast } = useToast()
  const router = useRouter()
  const { user, loading: authLoading, isConfigured } = useAuth()
  const [pollUpdates, setPollUpdates] = useState<{ [key: string]: { isPublic: boolean; shareToken?: string } }>({})

  // Load polls from database on component mount
  useEffect(() => {
    if (!authLoading && isConfigured) {
      loadPolls()
    } else if (!authLoading) {
      setIsLoading(false)
    }
  }, [authLoading, user, isConfigured])

  // Set default tab based on user authentication
  useEffect(() => {
    if (user) {
      setActiveTab("dashboard")
    } else {
      setActiveTab("create")
    }
  }, [user])

  const loadPolls = async () => {
    if (!isConfigured) {
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      const pollsData = user ? await DatabaseService.getUserPolls() : await DatabaseService.getAllPolls()
      setPolls(pollsData)
    } catch (error) {
      console.error("Failed to load polls:", error)
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"

      if (errorMessage.includes("Supabase is not configured")) {
        toast({
          title: "Configuration Required",
          description: "Please configure your Supabase environment variables.",
          variant: "destructive",
        })
      } else if (
        errorMessage.includes("table not found") ||
        errorMessage.includes("relation") ||
        errorMessage.includes("does not exist")
      ) {
        toast({
          title: "Database Setup Required",
          description: "Please run the database setup script first to create the polls table.",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Error Loading Polls",
          description: "Failed to load polls from database. Please try again.",
          variant: "destructive",
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  const validateForm = () => {
    const newErrors: { question?: string; options?: string[] } = {}

    // Validate question
    if (!question.trim()) {
      newErrors.question = "Question is required"
    } else if (question.trim().length < 5) {
      newErrors.question = "Question must be at least 5 characters long"
    }

    // Validate options
    const validOptions = options.filter((option) => option.trim() !== "")
    const optionErrors: string[] = []

    options.forEach((option, index) => {
      if (index < 2 && !option.trim()) {
        optionErrors[index] = "This option is required"
      }
    })

    if (validOptions.length < 2) {
      newErrors.options = optionErrors
      if (!newErrors.question) {
        toast({
          title: "Validation Error",
          description: "At least 2 answer options are required",
          variant: "destructive",
        })
      }
    } else {
      newErrors.options = optionErrors
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0 || (newErrors.options && newErrors.options.every((error) => !error))
  }

  const addOption = () => {
    if (options.length < 6) {
      setOptions([...options, ""])
    }
  }

  const removeOption = (index: number) => {
    if (options.length > 2) {
      const newOptions = options.filter((_, i) => i !== index)
      setOptions(newOptions)

      // Clear errors for removed option
      if (errors.options) {
        const newOptionErrors = [...errors.options]
        newOptionErrors.splice(index, 1)
        setErrors({ ...errors, options: newOptionErrors })
      }
    }
  }

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options]
    newOptions[index] = value
    setOptions(newOptions)

    // Clear error for this option if it now has a value
    if (errors.options && errors.options[index] && value.trim()) {
      const newOptionErrors = [...errors.options]
      newOptionErrors[index] = ""
      setErrors({ ...errors, options: newOptionErrors })
    }
  }

  const createPoll = async () => {
    if (!isConfigured) {
      toast({
        title: "Configuration Required",
        description: "Please configure your Supabase environment variables to create polls.",
        variant: "destructive",
      })
      return
    }

    if (!user) {
      setShowAuthModal(true)
      return
    }

    if (!validateForm()) {
      return
    }

    try {
      setIsCreating(true)
      const validOptions = options.filter((option) => option.trim() !== "")

      const newPoll = await DatabaseService.createPoll(question, validOptions)

      setPolls([newPoll, ...polls])
      setQuestion("")
      setOptions(["", ""])
      setErrors({})

      toast({
        title: "Poll Created! 🎉",
        description: "Your poll has been successfully created and saved.",
      })

      // Switch to dashboard tab after creating a poll
      setActiveTab("dashboard")
    } catch (error) {
      console.error("Failed to create poll:", error)
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"

      if (errorMessage.includes("User not authenticated")) {
        setShowAuthModal(true)
      } else if (errorMessage.includes("Supabase is not configured")) {
        toast({
          title: "Configuration Required",
          description: "Please configure your Supabase environment variables.",
          variant: "destructive",
        })
      } else if (
        errorMessage.includes("table not found") ||
        errorMessage.includes("relation") ||
        errorMessage.includes("does not exist")
      ) {
        toast({
          title: "Database Setup Required",
          description: "Please run the database setup script first to create the polls table.",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Error Creating Poll",
          description: "Failed to create poll. Please try again.",
          variant: "destructive",
        })
      }
    } finally {
      setIsCreating(false)
    }
  }

  const deletePoll = async (id: string) => {
    if (!isConfigured) {
      toast({
        title: "Configuration Required",
        description: "Please configure your Supabase environment variables.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsDeleting(id)
      await DatabaseService.deletePoll(id)
      setPolls(polls.filter((poll) => poll.id !== id))
      toast({
        title: "Poll Deleted",
        description: "The poll has been permanently removed.",
      })
    } catch (error) {
      console.error("Failed to delete poll:", error)
      toast({
        title: "Error Deleting Poll",
        description: "Failed to delete poll. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(null)
    }
  }

  const handleShareUpdate = (pollId: string, isPublic: boolean, shareToken?: string) => {
    setPollUpdates((prev) => ({
      ...prev,
      [pollId]: { isPublic, shareToken },
    }))

    // Update the poll in the polls array
    setPolls((prevPolls) =>
      prevPolls.map((poll) => (poll.id === pollId ? { ...poll, is_public: isPublic, share_token: shareToken } : poll)),
    )
  }

  const handleNavigateToEdit = (pollId: string) => {
    router.push(`/edit/${pollId}`)
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto" />
          <p className="text-lg text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isConfigured) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="max-w-2xl mx-auto backdrop-blur-sm bg-white/90 border-0 shadow-xl">
          <CardContent className="py-16 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-yellow-100 to-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Vote className="h-10 w-10 text-yellow-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Ready to Go!</h3>
            <p className="text-gray-500 text-lg mb-6 max-w-md mx-auto">
              Your polling application is configured and ready to use with real voting functionality.
            </p>
            <p className="text-gray-600 text-sm">Make sure to run the database setup scripts to enable all features.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000"></div>
        <div className="absolute top-40 left-1/2 w-80 h-80 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-4000"></div>
      </div>

      <div className="relative z-10 py-12 px-4">
        <div className="max-w-6xl mx-auto space-y-12">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="flex justify-between items-center mb-8">
              <div className="flex-1"></div>
              <div className="flex-1 flex justify-center">
                <div className="inline-flex items-center gap-3 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full border border-white/20 shadow-lg">
                  <Sparkles className="h-5 w-5 text-purple-600" />
                  <span className="text-sm font-medium text-gray-700">
                    {user ? "Your Personal Polls" : "Database-Powered Polls"}
                  </span>
                </div>
              </div>
              <div className="flex-1 flex justify-end">
                {user ? (
                  <UserMenu />
                ) : (
                  <Button
                    onClick={() => setShowAuthModal(true)}
                    variant="outline"
                    className="bg-white/80 backdrop-blur-sm border-white/20 shadow-lg hover:bg-white/90"
                  >
                    <LogIn className="h-4 w-4 mr-2" />
                    Sign In
                  </Button>
                )}
              </div>
            </div>

            <h1 className="text-5xl font-bold bg-gradient-to-r from-gray-900 via-purple-900 to-violet-900 bg-clip-text text-transparent">
              Polling Studio
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {user
                ? `Welcome back! Create and manage your personal polls with real-time vote statistics.`
                : "Create engaging polls and gather insights from your audience with real voting functionality"}
            </p>
          </div>

          {/* Main Content */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 lg:w-[400px] mx-auto">
              <TabsTrigger value="create" className="flex items-center gap-2">
                <Vote className="h-4 w-4" />
                Create Poll
              </TabsTrigger>
              <TabsTrigger value="dashboard" className="flex items-center gap-2" disabled={!user}>
                <BarChart3 className="h-4 w-4" />
                Dashboard
              </TabsTrigger>
            </TabsList>

            <TabsContent value="create" className="space-y-8">
              {/* Create Poll Form */}
              <Card className="backdrop-blur-sm bg-white/90 border-0 shadow-2xl shadow-purple-500/10">
                <CardHeader className="pb-6">
                  <CardTitle className="flex items-center gap-3 text-2xl">
                    <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
                      <Vote className="h-6 w-6 text-white" />
                    </div>
                    Create New Poll
                  </CardTitle>
                  <CardDescription className="text-base text-gray-600">
                    {user
                      ? "Craft your question and provide compelling answer options to engage your audience"
                      : "Sign in to create and manage your own polls with real-time statistics"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                  {/* Question Input */}
                  <div className="space-y-3">
                    <Label htmlFor="question" className="text-base font-semibold text-gray-700">
                      Poll Question *
                    </Label>
                    <Textarea
                      id="question"
                      placeholder={user ? "What would you like to ask your audience?" : "Sign in to create polls"}
                      value={question}
                      onChange={(e) => {
                        setQuestion(e.target.value)
                        if (errors.question && e.target.value.trim()) {
                          setErrors({ ...errors, question: undefined })
                        }
                      }}
                      className={`min-h-[100px] text-base transition-all duration-200 ${
                        errors.question
                          ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                          : "border-gray-200 focus:border-purple-500 focus:ring-purple-500/20"
                      }`}
                      disabled={isCreating || !user}
                    />
                    {errors.question && (
                      <p className="text-sm text-red-500 flex items-center gap-1">
                        <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                        {errors.question}
                      </p>
                    )}
                  </div>

                  {/* Options */}
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <Label className="text-base font-semibold text-gray-700">Answer Options *</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addOption}
                        disabled={options.length >= 6 || isCreating || !user}
                        className="flex items-center gap-2 hover:bg-purple-50 hover:border-purple-300 hover:text-purple-700 transition-all duration-200"
                      >
                        <Plus className="h-4 w-4" />
                        Add Option
                      </Button>
                    </div>

                    <div className="space-y-4">
                      {options.map((option, index) => (
                        <div key={index} className="group">
                          <div className="flex items-center gap-3">
                            <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center text-sm font-semibold text-purple-700">
                              {index + 1}
                            </div>
                            <div className="flex-1">
                              <Input
                                placeholder={
                                  user
                                    ? `Option ${index + 1}${index < 2 ? " (required)" : ""}`
                                    : "Sign in to create polls"
                                }
                                value={option}
                                onChange={(e) => updateOption(index, e.target.value)}
                                className={`text-base transition-all duration-200 ${
                                  errors.options?.[index]
                                    ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                                    : "border-gray-200 focus:border-purple-500 focus:ring-purple-500/20"
                                }`}
                                disabled={isCreating || !user}
                              />
                              {errors.options?.[index] && (
                                <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
                                  <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                                  {errors.options[index]}
                                </p>
                              )}
                            </div>
                            {options.length > 2 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeOption(index)}
                                className="opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-red-50 hover:text-red-600"
                                disabled={isCreating || !user}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button
                    onClick={createPoll}
                    disabled={isCreating}
                    className="w-full h-12 text-base font-semibold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {isCreating ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Creating Poll...
                      </>
                    ) : user ? (
                      <>
                        <Sparkles className="h-5 w-5 mr-2" />
                        Create Poll
                      </>
                    ) : (
                      <>
                        <LogIn className="h-5 w-5 mr-2" />
                        Sign In to Create Poll
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="dashboard" className="space-y-8">
              {user ? (
                <UserDashboard onNavigateToEdit={handleNavigateToEdit} />
              ) : (
                <Card className="backdrop-blur-sm bg-white/90 border-0 shadow-xl">
                  <CardContent className="py-16 text-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <BarChart3 className="h-10 w-10 text-purple-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">Sign In Required</h3>
                    <p className="text-gray-500 text-lg max-w-md mx-auto mb-6">
                      Sign in to access your personal dashboard with detailed vote statistics and poll management.
                    </p>
                    <Button
                      onClick={() => setShowAuthModal(true)}
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                    >
                      <LogIn className="h-4 w-4 mr-2" />
                      Sign In to View Dashboard
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
  )
}
