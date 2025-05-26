"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Bot, User, UserIcon, LogOut, Trash2, Plus } from "lucide-react"
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

export default function HistoryChatPage() {
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null)
  const [chatHistory, setChatHistory] = useState<ChatSession[]>([])
  const [user, setUser] = useState<any>(null)
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()

  const sessionId = params.sessionId as string

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

  useEffect(() => {
    if (chatHistory.length > 0 && sessionId) {
      const session = chatHistory.find((s) => s.id === sessionId)
      if (session) {
        setSelectedSession(session)
      } else {
        toast({
          title: "Error",
          description: "Conversación no encontrada",
          variant: "destructive",
        })
        router.push("/dashboard")
      }
    }
  }, [chatHistory, sessionId, router, toast])

  const loadChatHistory = () => {
    const history = JSON.parse(localStorage.getItem("chat_history") || "[]")
    const userHistory = history.filter(
      (session: ChatSession) => session.userId === user?.id || session.userId === "demo_user",
    )
    setChatHistory(userHistory.sort((a: ChatSession, b: ChatSession) => b.createdAt - a.createdAt))
  }

  const handleSelectChat = (sessionId: string) => {
    router.push(`/chat/history/${sessionId}`)
  }

  const handleDeleteSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const allHistory = JSON.parse(localStorage.getItem("chat_history") || "[]")
    const updatedHistory = allHistory.filter((session: ChatSession) => session.id !== sessionId)
    localStorage.setItem("chat_history", JSON.stringify(updatedHistory))

    loadChatHistory()

    // Si estamos viendo la sesión que se eliminó, redirigir
    if (selectedSession?.id === sessionId) {
      router.push("/dashboard")
    }

    toast({
      title: "Conversación eliminada",
      description: "La conversación se ha eliminado del historial",
    })
  }

  const handleBackToDashboard = () => {
    router.push("/dashboard")
  }

  const handleLogout = () => {
    localStorage.removeItem("auth_token")
    localStorage.removeItem("user_data")
    router.push("/")
  }

  const formatDate = (timestamp: number) => {
    const now = Date.now()
    const diff = now - timestamp
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days === 0) return "Hoy"
    if (days === 1) return "Ayer"
    if (days < 7) return `Hace ${days} días`
    return new Date(timestamp).toLocaleDateString("es-ES", {
      month: "short",
      day: "numeric",
    })
  }

  const getPreviewText = (messages: Message[]) => {
    const lastUserMessage = messages.filter((m) => m.role === "user").pop()
    return lastUserMessage?.content.substring(0, 50) + "..." || "Nueva conversación"
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      {/* Sidebar - Historial */}
      <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        {/* Header del Sidebar */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Avatar className="w-8 h-8">
                <AvatarFallback>
                  <UserIcon className="w-4 h-4" />
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">{user?.name}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>

          <Button className="w-full justify-start" onClick={handleBackToDashboard}>
            <Plus className="w-4 h-4 mr-2" />
            Nueva conversación
          </Button>
        </div>

        {/* Lista de Conversaciones */}
        <div className="flex-1 overflow-hidden">
          <div className="p-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Conversaciones recientes</h3>
          </div>
          <ScrollArea className="flex-1 px-4">
            {chatHistory.length === 0 ? (
              <div className="text-center py-8">
                <Bot className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-500 dark:text-gray-400">No hay conversaciones</p>
              </div>
            ) : (
              <div className="space-y-2 pb-4">
                {chatHistory.map((session) => (
                  <div
                    key={session.id}
                    className={`group p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedSession?.id === session.id
                        ? "bg-blue-100 dark:bg-blue-900/30"
                        : "hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`}
                    onClick={() => handleSelectChat(session.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Bot className="w-3 h-3 text-blue-600 flex-shrink-0" />
                          <p className="text-xs font-medium text-gray-900 dark:text-white truncate">
                            {session.assistantName}
                          </p>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mb-1">
                          {getPreviewText(session.messages)}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500">{formatDate(session.createdAt)}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-auto text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                        onClick={(e) => handleDeleteSession(session.id, e)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </div>

      {/* Área de Chat */}
      <div className="flex-1 flex flex-col">
        {selectedSession ? (
          <>
            {/* Header del Chat */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Bot className="w-8 h-8 text-blue-600" />
                  <div>
                    <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {selectedSession.assistantName}
                    </h1>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-orange-600">
                        Solo lectura
                      </Badge>
                      <Badge variant="outline" className="text-blue-600">
                        DEMO
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">{formatDate(selectedSession.createdAt)}</div>
              </div>
            </div>

            {/* Área de Mensajes */}
            <ScrollArea className="flex-1 p-4">
              <div className="max-w-4xl mx-auto space-y-4">
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

            {/* Footer */}
            <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800">
              <div className="max-w-4xl mx-auto text-center">
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  Esta conversación está en modo solo lectura. No puedes enviar más mensajes.
                </p>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Bot className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Cargando conversación...</h3>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
