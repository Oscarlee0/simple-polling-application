"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Share2, Copy, Check, ExternalLink, Globe } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { DatabaseService } from "@/lib/database"

interface ShareButtonProps {
  pollId: string
  isPublic: boolean
  shareToken?: string
  onShareUpdate: (isPublic: boolean, shareToken?: string) => void
}

export function ShareButton({ pollId, isPublic, shareToken, onShareUpdate }: ShareButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [copied, setCopied] = useState(false)
  const [currentOrigin, setCurrentOrigin] = useState("")
  const { toast } = useToast()

  // Get the current origin on the client side
  useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrentOrigin(window.location.origin)
    }
  }, [])

  const shareUrl = shareToken && currentOrigin ? `${currentOrigin}/poll/${shareToken}` : ""

  const generateShareLink = async () => {
    try {
      setIsGenerating(true)

      // Generate a simple random token if the database function doesn't exist
      let newShareToken: string

      try {
        const result = await DatabaseService.generateShareLink(pollId)
        newShareToken = result.shareToken
      } catch (error) {
        console.warn("Database function not available, generating token locally:", error)
        // Fallback: generate token locally
        newShareToken = generateRandomToken()

        // Update the poll directly with our generated token
        await updatePollSharing(pollId, true, newShareToken)
      }

      onShareUpdate(true, newShareToken)
      toast({
        title: "Share Link Generated! 🎉",
        description: "Your poll is now publicly shareable.",
      })
    } catch (error) {
      console.error("Failed to generate share link:", error)
      toast({
        title: "Error",
        description: "Failed to generate share link. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const generateRandomToken = (): string => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
  }

  const updatePollSharing = async (pollId: string, isPublic: boolean, shareToken?: string) => {
    const { supabase } = await import("@/lib/supabase")

    const { error } = await supabase
      .from("polls")
      .update({
        is_public: isPublic,
        share_token: shareToken || null,
      })
      .eq("id", pollId)

    if (error) {
      throw new Error(`Failed to update poll sharing: ${error.message}`)
    }
  }

  const copyToClipboard = async () => {
    if (!shareUrl) {
      toast({
        title: "Error",
        description: "No share URL available to copy.",
        variant: "destructive",
      })
      return
    }

    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      toast({
        title: "Link Copied! 📋",
        description: "Share link has been copied to your clipboard.",
      })
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      // Fallback for browsers that don't support clipboard API
      try {
        const textArea = document.createElement("textarea")
        textArea.value = shareUrl
        document.body.appendChild(textArea)
        textArea.select()
        document.execCommand("copy")
        document.body.removeChild(textArea)

        setCopied(true)
        toast({
          title: "Link Copied! 📋",
          description: "Share link has been copied to your clipboard.",
        })
        setTimeout(() => setCopied(false), 2000)
      } catch (fallbackError) {
        toast({
          title: "Copy Failed",
          description: "Failed to copy link. Please copy it manually.",
          variant: "destructive",
        })
      }
    }
  }

  const disableSharing = async () => {
    try {
      setIsGenerating(true)
      await updatePollSharing(pollId, false)
      onShareUpdate(false, undefined)
      toast({
        title: "Sharing Disabled",
        description: "Your poll is no longer publicly accessible.",
      })
    } catch (error) {
      console.error("Failed to disable sharing:", error)
      toast({
        title: "Error",
        description: "Failed to disable sharing. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const openInNewTab = () => {
    if (shareUrl) {
      window.open(shareUrl, "_blank")
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-2 hover:bg-green-50 hover:text-green-600 transition-all duration-200"
        >
          <Share2 className="h-4 w-4" />
          {isPublic ? "Shared" : "Share"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md w-[95vw] max-w-[425px] backdrop-blur-sm bg-white/95">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Globe className="h-5 w-5 text-green-600" />
            Share Poll
          </DialogTitle>
          <DialogDescription className="text-sm sm:text-base">
            Generate a public link to share your poll with others. Anyone with the link can view and vote on your poll.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {!isPublic || !shareToken ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-blue-100 rounded-full flex items-center justify-center mx-auto">
                <Share2 className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Make Poll Public</h3>
                <p className="text-gray-600 text-sm">
                  Generate a shareable link that allows anyone to view and participate in your poll.
                </p>
              </div>
              <Button
                onClick={generateShareLink}
                disabled={isGenerating}
                className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
              >
                {isGenerating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Generating Link...
                  </>
                ) : (
                  <>
                    <Share2 className="h-4 w-4 mr-2" />
                    Generate Share Link
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
                <Globe className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium text-green-800">Poll is publicly shareable</span>
              </div>

              <div className="space-y-2">
                <Label htmlFor="share-url" className="text-sm font-medium">
                  Share URL
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="share-url"
                    value={shareUrl}
                    readOnly
                    className="font-mono text-sm"
                    onClick={(e) => e.currentTarget.select()}
                  />
                  <Button onClick={copyToClipboard} variant="outline" size="icon" className="shrink-0">
                    {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                  </Button>
                  <Button onClick={openInNewTab} variant="outline" size="icon" className="shrink-0">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  onClick={copyToClipboard}
                  className="flex-1 h-10 sm:h-11 text-sm sm:text-base bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Link
                    </>
                  )}
                </Button>
                <Button
                  onClick={disableSharing}
                  variant="outline"
                  disabled={isGenerating}
                  className="hover:bg-red-50 hover:text-red-600 hover:border-red-200 h-10 sm:h-11 text-sm sm:text-base"
                >
                  {isGenerating ? (
                    <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    "Disable"
                  )}
                </Button>
              </div>

              <p className="text-xs text-gray-500 text-center">Anyone with this link can view and vote on your poll</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
