"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Plus, Trash2, Vote, Edit, Sparkles, TrendingUp } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

interface Poll {
  id: string
  question: string
  options: string[]
  createdAt: string
}

export default function PollingApp() {
  const [polls, setPolls] = useState<Poll[]>([])
  const [question, setQuestion] = useState("")
  const [options, setOptions] = useState(["", ""])
  const [errors, setErrors] = useState<{ question?: string; options?: string[] }>({})
  const { toast } = useToast()
  const router = useRouter()

  // Load polls from localStorage on component mount
  useEffect(() => {
    const savedPolls = localStorage.getItem("polls")
    if (savedPolls) {
      setPolls(JSON.parse(savedPolls))
    }
  }, [])

  // Save polls to localStorage whenever polls change
  useEffect(() => {
    localStorage.setItem("polls", JSON.stringify(polls))
  }, [polls])

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

  const createPoll = () => {
    if (!validateForm()) {
      return
    }

    const validOptions = options.filter((option) => option.trim() !== "")

    const newPoll: Poll = {
      id: Date.now().toString(),
      question: question.trim(),
      options: validOptions,
      createdAt: new Date().toLocaleDateString(),
    }

    setPolls([newPoll, ...polls])
    setQuestion("")
    setOptions(["", ""])
    setErrors({})

    toast({
      title: "Poll Created! 🎉",
      description: "Your poll has been successfully created.",
    })
  }

  const deletePoll = (id: string) => {
    setPolls(polls.filter((poll) => poll.id !== id))
    toast({
      title: "Poll Deleted",
      description: "The poll has been removed.",
    })
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
            <div className="inline-flex items-center gap-3 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full border border-white/20 shadow-lg">
              <Sparkles className="h-5 w-5 text-purple-600" />
              <span className="text-sm font-medium text-gray-700">Create Amazing Polls</span>
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-gray-900 via-purple-900 to-violet-900 bg-clip-text text-transparent">
              Polling Studio
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Create engaging polls and gather insights from your audience with our beautiful, intuitive platform
            </p>
          </div>

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
                Craft your question and provide compelling answer options to engage your audience
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
                        <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center text-sm font-semibold text-purple-700">
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

              <Button
                onClick={createPoll}
                className="w-full h-12 text-base font-semibold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
              >
                <Sparkles className="h-5 w-5 mr-2" />
                Create Poll
              </Button>
            </CardContent>
          </Card>

          <Separator className="bg-gradient-to-r from-transparent via-gray-300 to-transparent" />

          {/* Polls List */}
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">Your Polls</h2>
                <p className="text-gray-600 mt-1">Manage and track all your created polls</p>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full border border-white/20 shadow-lg">
                <TrendingUp className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium text-gray-700">{polls.length} Total Polls</span>
              </div>
            </div>

            {polls.length === 0 ? (
              <Card className="backdrop-blur-sm bg-white/90 border-0 shadow-xl">
                <CardContent className="py-16 text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Vote className="h-10 w-10 text-purple-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">No polls yet</h3>
                  <p className="text-gray-500 text-lg max-w-md mx-auto">
                    Create your first poll using the form above and start gathering valuable insights!
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {polls.map((poll, pollIndex) => (
                  <Card
                    key={poll.id}
                    className="group backdrop-blur-sm bg-white/90 border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] relative overflow-hidden"
                  >
                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                    <CardHeader className="pb-4 relative z-10">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 pr-4">
                          <CardTitle className="text-lg leading-tight text-gray-900 group-hover:text-purple-900 transition-colors duration-200">
                            {poll.question}
                          </CardTitle>
                          <CardDescription className="mt-2 flex items-center gap-2">
                            <div className="w-2 h-2 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full"></div>
                            Created on {poll.createdAt}
                          </CardDescription>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.push(`/edit/${poll.id}`)}
                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-blue-50 hover:text-blue-600"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-red-50 hover:text-red-600"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="backdrop-blur-sm bg-white/95">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="text-xl">Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription className="text-base">
                                  This action cannot be undone. This will permanently delete the poll and all associated
                                  data.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="hover:bg-gray-50">Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deletePoll(poll.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Delete Poll
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="relative z-10">
                      <div className="space-y-3">
                        <p className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                          <div className="w-1 h-4 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full"></div>
                          Answer Options
                        </p>
                        <div className="space-y-2">
                          {poll.options.map((option, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-3 p-2 rounded-lg hover:bg-purple-50/50 transition-colors duration-200"
                            >
                              <Badge
                                variant="secondary"
                                className="text-xs bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 border-0"
                              >
                                {index + 1}
                              </Badge>
                              <span className="text-sm text-gray-700">{option}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
