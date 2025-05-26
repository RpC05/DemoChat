"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ArrowLeft, MessageSquare, Bot, User, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: number
}

interface ChatSession {
  id: string
  assistantId: string
  assistantName: string
  messages: Message[]
  isActive: boolean
  createdAt: number
  userId: string
}

export default function HistoryPage() {
  const [chatHistory, setChatHistory] = useState<ChatSession[]>([])
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null)
  const [user, setUser] = useState<any>(null)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const token = localStorage.getItem("auth_token")
    const userData = localStorage.getItem("user_data")

    if (!token) {
      router.push("/")
      return
    }

    if (userData) {
      setUser(JSON.parse(userData))
    }

    loadChatHistory()
  }, [router])

  const loadChatHistory = () => {
    const history = JSON.parse(localStorage.getItem("chat_history") || "[]")
    const userHistory = history.filter(
      (session: ChatSession) => session.userId === user?.id || session.userId === "unknown",
    )
    setChatHistory(userHistory.sort((a: ChatSession, b: ChatSession) => b.createdAt - a.createdAt))
  }

  const handleDeleteSession = (sessionId: string) => {
    const allHistory = JSON.parse(localStorage.getItem("chat_history") || "[]")
    const updatedHistory = allHistory.filter((session: ChatSession) => session.id !== sessionId)
    localStorage.setItem("chat_history", JSON.stringify(updatedHistory))

    const userHistory = updatedHistory.filter(
      (session: ChatSession) => session.userId === user?.id || session.userId === "unknown",
    )
    setChatHistory(userHistory.sort((a: ChatSession, b: ChatSession) => b.createdAt - a.createdAt))

    if (selectedSession?.id === sessionId) {
      setSelectedSession(null)
    }

    toast({
      title: "Conversación eliminada",
      description: "La conversación se ha eliminado del historial",
    })
  }

  const handleBackToDashboard = () => {
    router.push("/dashboard")
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={handleBackToDashboard}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver al Dashboard
            </Button>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Historial de Conversaciones</h1>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lista de conversaciones */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Mis Conversaciones</CardTitle>
                <CardDescription>
                  {chatHistory.length} conversación{chatHistory.length !== 1 ? "es" : ""} guardada
                  {chatHistory.length !== 1 ? "s" : ""}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[600px]">
                  {chatHistory.length === 0 ? (
                    <div className="text-center py-12 px-4">
                      <MessageSquare className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                      <p className="text-gray-600 dark:text-gray-400">No hay conversaciones guardadas</p>
                    </div>
                  ) : (
                    <div className="space-y-2 p-4">
                      {chatHistory.map((session) => (
                        <Card
                          key={session.id}
                          className={`cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 ${
                            selectedSession?.id === session.id ? "ring-2 ring-blue-500" : ""
                          }`}
                          onClick={() => setSelectedSession(session)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2">
                                  <Bot className="w-4 h-4 text-blue-600 flex-shrink-0" />
                                  <p className="font-medium text-sm truncate">{session.assistantName}</p>
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                                  {formatDate(session.createdAt)}
                                </p>
                                <Badge variant="secondary" className="text-xs">
                                  {session.messages.length} mensaje{session.messages.length !== 1 ? "s" : ""}
                                </Badge>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDeleteSession(session.id)
                                }}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Conversación seleccionada */}
          <div className="lg:col-span-2">
            <Card className="h-[700px] flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {selectedSession ? (
                    <>
                      <Bot className="w-5 h-5 text-blue-600" />
                      {selectedSession.assistantName}
                      <Badge variant="outline" className="ml-auto">
                        Solo lectura
                      </Badge>
                    </>
                  ) : (
                    "Selecciona una conversación"
                  )}
                </CardTitle>
                {selectedSession && (
                  <CardDescription>Conversación del {formatDate(selectedSession.createdAt)}</CardDescription>
                )}
              </CardHeader>
              <CardContent className="flex-1 p-0">
                {selectedSession ? (
                  <ScrollArea className="h-full p-4">
                    <div className="space-y-4">
                      {selectedSession.messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                        >
                          {message.role === "assistant" && (
                            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                              <Bot className="w-4 h-4 text-white" />
                            </div>
                          )}
                          <Card
                            className={`max-w-[70%] ${
                              message.role === "user" ? "bg-blue-600 text-white" : "bg-white dark:bg-gray-800"
                            }`}
                          >
                            <CardContent className="p-3">
                              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                              <p
                                className={`text-xs mt-2 ${
                                  message.role === "user" ? "text-blue-100" : "text-gray-500 dark:text-gray-400"
                                }`}
                              >
                                {new Date(message.timestamp).toLocaleTimeString()}
                              </p>
                            </CardContent>
                          </Card>
                          {message.role === "user" && (
                            <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                              <User className="w-4 h-4 text-white" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <MessageSquare className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        Selecciona una conversación
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        Elige una conversación de la lista para ver su contenido
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
