"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Trash2, ArrowLeft, Vote, Save, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Poll {
  id: string
  question: string
  options: string[]
  createdAt: string
}

export default function EditPoll({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { toast } = useToast()
  const [poll, setPoll] = useState<Poll | null>(null)
  const [question, setQuestion] = useState("")
  const [options, setOptions] = useState<string[]>([])
  const [errors, setErrors] = useState<{ question?: string; options?: string[] }>({})
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Load polls from localStorage
    const savedPolls = localStorage.getItem("polls")
    if (savedPolls) {
      const parsedPolls: Poll[] = JSON.parse(savedPolls)
      const foundPoll = parsedPolls.find((p) => p.id === params.id)

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
    } else {
      router.push("/")
    }
    setIsLoading(false)
  }, [params.id, router, toast])

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

  const updatePoll = () => {
    if (!validateForm() || !poll) {
      return
    }

    const validOptions = options.filter((option) => option.trim() !== "")

    // Get all polls
    const savedPolls = localStorage.getItem("polls")
    if (savedPolls) {
      const parsedPolls: Poll[] = JSON.parse(savedPolls)

      // Update the poll
      const updatedPolls = parsedPolls.map((p) => {
        if (p.id === poll.id) {
          return {
            ...p,
            question: question.trim(),
            options: validOptions,
          }
        }
        return p
      })

      // Save back to localStorage
      localStorage.setItem("polls", JSON.stringify(updatedPolls))

      toast({
        title: "Poll Updated! 🎉",
        description: "Your poll has been successfully updated.",
      })

      // Navigate back to the main page
      router.push("/")
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000"></div>
      </div>

      <div className="relative z-10 py-12 px-4">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => router.push("/")}
              className="flex items-center gap-2 hover:bg-white/80 backdrop-blur-sm border border-white/20 shadow-lg transition-all duration-200"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Polls
            </Button>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-purple-900 to-violet-900 bg-clip-text text-transparent">
                Edit Poll
              </h1>
              <p className="text-gray-600 mt-1">Make changes to your poll question and options</p>
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
                Update your poll question and answer options to better engage your audience
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
                    disabled={options.length >= 6}
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
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  onClick={updatePoll}
                  className="flex-1 h-12 text-base font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
                >
                  <Save className="h-5 w-5 mr-2" />
                  Update Poll
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push("/")}
                  className="flex-1 h-12 text-base font-semibold hover:bg-gray-50 transition-all duration-200"
                >
                  <X className="h-5 w-5 mr-2" />
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
