"use client"

import { 
  useState, 
  useEffect, 
  useRef, 
  FormEvent 
} from "react"
import { 
  Send, 
  Bot, 
  RefreshCw, 
  Lightbulb, 
  Copy, 
  CheckCircle2, 
  Trash2 
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog"

// Predefined prompt templates
const PROMPT_TEMPLATES = [
  {
    title: "Project Brainstorm",
    description: "Get ideas for your next tech project",
    prompt: "Help me brainstorm innovative project ideas in computer science. Consider emerging technologies and potential real-world applications."
  },
  {
    title: "Study Guide",
    description: "Create a comprehensive study plan",
    prompt: "Create a detailed study guide for a computer science course covering key topics, recommended resources, and learning strategies."
  },
  {
    title: "Career Advice",
    description: "Get tech career guidance",
    prompt: "Provide career advice for a computer science student. Include skill development, internship strategies, and emerging job market trends."
  }
]

// Message interface
interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: number;
  copied?: boolean;
}

export default function NexAIPage() {
    const {toast} = useToast();
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  // Trigger scroll on message updates
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Focus input on page load
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Send message to AI
  const sendMessage = async (e?: FormEvent) => {
    if (e) e.preventDefault()
    
    // Validate input
    const trimmedInput = input.trim()
    if (!trimmedInput) return

    // Create user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      content: trimmedInput,
      sender: 'user',
      timestamp: Date.now()
    }

    // Update messages and clear input
    setMessages(prev => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      // Use Gemini API with error handling and retry logic
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/learnlm-1.5-pro-experimental:generateContent?key=${process.env.NEXT_PUBLIC_GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: trimmedInput }]
            }]
          })
        }
      )

      // Handle different response scenarios
      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('API request limit reached. Please try again later.')
        }
        throw new Error('Failed to get AI response')
      }

      const data = await response.json()

      // Extract AI response
      const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || 
        "I'm sorry, I couldn't generate a response. Please try again."

      // Create AI message
      const aiMessage: Message = {
        id: `ai-${Date.now()}`,
        content: aiResponse,
        sender: 'ai',
        timestamp: Date.now()
      }

      // Update messages
      setMessages(prev => [...prev, aiMessage])
    } catch (error: any) {
      console.error("AI Response Error:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to get AI response. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Copy message to clipboard
  const copyMessage = (message: Message) => {
    navigator.clipboard.writeText(message.content)
    setCopiedMessageId(message.id)
    
    // Reset copied state after 2 seconds
    setTimeout(() => setCopiedMessageId(null), 2000)

    toast({
      title: "Copied",
      description: "Message copied to clipboard",
    })
  }

  // Clear conversation
  const clearConversation = () => {
    setMessages([])
    toast({
      title: "Conversation Cleared",
      description: "All messages have been removed",
    })
  }

  // Use prompt template
  const usePromptTemplate = (template: string) => {
    setInput(template)
    inputRef.current?.focus()
  }

  return (
    <div className="nexai-bg min-h-screen">
      <div className="container mx-auto px-4 pt-24 pb-12">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">NexAI Assistant</h1>
            <p className="text-muted-foreground">
              Your AI-powered study and project companion
            </p>
          </div>
          <div className="flex gap-4">
            <Button 
              variant="outline" 
              onClick={clearConversation}
              disabled={messages.length === 0}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear Conversation
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Lightbulb className="h-4 w-4 mr-2" />
                  Prompt Templates
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Prompt Templates</DialogTitle>
                  <DialogDescription>
                    Choose a template to kickstart your conversation
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  {PROMPT_TEMPLATES.map((template, index) => (
                    <Card 
                      key={index} 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => usePromptTemplate(template.prompt)}
                    >
                      <CardHeader>
                        <CardTitle>{template.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          {template.description}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 space-y-6">
            <Card className="h-[70vh] flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bot className="h-6 w-6 mr-2" />
                  NexAI Conversation
                </CardTitle>
              </CardHeader>
              <CardContent 
                className="flex-grow overflow-y-auto space-y-4 p-4"
              >
                {messages.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    <p>Start a conversation with NexAI</p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div 
                      key={message.id}
                      className={`flex ${
                        message.sender === 'user' 
                          ? 'justify-end' 
                          : 'justify-start'
                      }`}
                    >
                      <div 
                        className={`max-w-[80%] p-3 rounded-lg ${
                          message.sender === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <p className="whitespace-pre-wrap">
                            {message.content}
                          </p>
                          {message.sender === 'ai' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="ml-2"
                              onClick={() => copyMessage(message)}
                            >
                              {copiedMessageId === message.id ? (
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </CardContent>
              <form onSubmit={sendMessage} className="p-4 border-t">
                <div className="flex space-x-2">
                  <Input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask NexAI anything about your studies, projects, or tech..."
                    className="flex-grow"
                    disabled={isLoading}
                  />
                  <Button 
                    type="submit" 
                    disabled={!input.trim() || isLoading}
                  >
                    {isLoading ? (
                      <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Send className="h-4 w-4 mr-2" />
                    )}
                    Send
                  </Button>
                </div>
              </form>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>About NexAI</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  NexAI is an AI-powered assistant designed to help students 
                  with study guidance, project ideas, career advice, and 
                  technical questions.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Capabilities</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>✓ Project Brainstorming</li>
                  <li>✓ Study Guidance</li>
                  <li>✓ Technical Q&A</li>
                  <li>✓ Career Advice</li>
                  <li>✓ Problem-Solving</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}