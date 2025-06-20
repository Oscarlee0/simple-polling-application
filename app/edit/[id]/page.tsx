"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Trash2, ArrowLeft, Vote, Save, X, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { DatabaseService, type Poll } from "@/lib/database"

export default function EditPoll({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { toast } = useToast()
  const [poll, setPoll] = useState<Poll | null>(null)
  const [question, setQuestion] = useState("")
  const [options, setOptions] = useState<string[]>([])
  const [errors, setErrors] = useState<{ question?: string; options?: string[] }>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    loadPoll()
  }, [params.id])

  const loadPoll = async () => {
    try {
      setIsLoading(true)
      const foundPoll = await DatabaseService.getPollById(params.id)

      if (foundPoll) {
        setPoll(foundPoll)
        setQuestion(foundPoll.question)
        setOptions([...foundPoll.options])
      } else {
        toast({
          title: "Poll not found",
          description: "The poll you're trying to edit doesn't exist.",
          variant: "destructive",
        })
        router.push("/")
      }
    } catch (error) {
      console.error("Failed to load poll:", error)
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"

      if (
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
          title: "Error Loading Poll",
          description: "Failed to load poll from database. Please try again.",
          variant: "destructive",
        })
      }
      router.push("/")
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

  const updatePoll = async () => {
    if (!validateForm() || !poll) {
      return
    }

    try {
      setIsUpdating(true)
      const validOptions = options.filter((option) => option.trim() !== "")

      await DatabaseService.updatePoll(poll.id, question, validOptions)

      toast({
        title: "Poll Updated! 🎉",
        description: "Your poll has been successfully updated in the database.",
      })

      // Navigate back to the main page
      router.push("/")
    } catch (error) {
      console.error("Failed to update poll:", error)
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"

      if (
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
          title: "Error Updating Poll",
          description: "Failed to update poll. Please try again.",
          variant: "destructive",
        })
      }
    } finally {
      setIsUpdating(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto" />
          <p className="text-lg text-gray-600">Loading poll from database...</p>
        </div>
      </div>
    )
  }

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
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Button
              variant="ghost"
              onClick={() => router.push("/")}
              className="flex items-center gap-2 hover:bg-white/80 backdrop-blur-sm border border-white/20 shadow-lg transition-all duration-200 self-start"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back to Polls</span>
              <span className="sm:hidden">Back</span>
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 via-purple-900 to-violet-900 bg-clip-text text-transparent">
                Edit Poll
              </h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1">Make changes to your poll in the database</p>
            </div>
          </div>

          {/* Edit Poll Form */}
          <Card className="backdrop-blur-sm bg-white/90 border-0 shadow-2xl shadow-purple-500/10">
            <CardHeader className="pb-6">
              <CardTitle className="flex items-center gap-3 text-2xl">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg">
                  <Vote className="h-6 w-6 text-white" />
                </div>
                Edit Your Poll
              </CardTitle>
              <CardDescription className="text-base text-gray-600">
                Update your poll question and answer options. Changes will be saved to the database.
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
                  placeholder="What would you like to ask your audience?"
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
                  disabled={isUpdating}
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
                    disabled={options.length >= 6 || isUpdating}
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
                        <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center text-sm font-semibold text-blue-700">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <Input
                            placeholder={`Option ${index + 1}${index < 2 ? " (required)" : ""}`}
                            value={option}
                            onChange={(e) => updateOption(index, e.target.value)}
                            className={`text-base transition-all duration-200 ${
                              errors.options?.[index]
                                ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                                : "border-gray-200 focus:border-purple-500 focus:ring-purple-500/20"
                            }`}
                            disabled={isUpdating}
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
                            disabled={isUpdating}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button
                  onClick={updatePoll}
                  disabled={isUpdating}
                  className="w-full sm:flex-1 h-12 text-sm sm:text-base font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isUpdating ? (
                    <>
                      <Loader2 className="h-4 sm:h-5 w-4 sm:w-5 mr-2 animate-spin" />
                      <span className="text-sm sm:text-base">Updating Poll...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 sm:h-5 w-4 sm:w-5 mr-2" />
                      <span className="text-sm sm:text-base">Update Poll</span>
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push("/")}
                  disabled={isUpdating}
                  className="w-full sm:flex-1 h-12 text-sm sm:text-base font-semibold hover:bg-gray-50 transition-all duration-200"
                >
                  <X className="h-4 sm:h-5 w-4 sm:w-5 mr-2" />
                  <span className="text-sm sm:text-base">Cancel</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
