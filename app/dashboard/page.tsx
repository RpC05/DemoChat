"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Bot, MessageSquare, LogOut, UserIcon, Trash2, Plus } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import { ChevronDown } from "lucide-react"

interface Assistant {
  id: string
  name: string
  description: string
  model: string
  created_at: number
}

interface UserData {
  id: string
  name: string
  email: string
}

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

// Datos demo de asistentes
const DEMO_ASSISTANTS: Assistant[] = [
  {
    id: "asst_demo_1",
    name: "Asistente de Programación",
    description:
      "Especializado en desarrollo web, JavaScript, React y Node.js. Puede ayudarte con código, debugging y mejores prácticas.",
    model: "gpt-4o",
    created_at: Date.now() - 86400000,
  },
  {
    id: "asst_demo_2",
    name: "Consultor de Marketing",
    description: "Experto en estrategias de marketing digital, SEO, redes sociales y análisis de mercado.",
    model: "gpt-4o-mini",
    created_at: Date.now() - 172800000,
  },
  {
    id: "asst_demo_3",
    name: "Tutor de Matemáticas",
    description: "Especialista en matemáticas desde nivel básico hasta avanzado. Álgebra, cálculo, estadística y más.",
    model: "gpt-4o",
    created_at: Date.now() - 259200000,
  },
  {
    id: "asst_demo_4",
    name: "Escritor Creativo",
    description: "Asistente para escritura creativa, storytelling, guiones y contenido literario.",
    model: "gpt-4o",
    created_at: Date.now() - 345600000,
  },
  {
    id: "asst_demo_5",
    name: "Analista de Datos",
    description: "Especializado en análisis de datos, Python, SQL, visualizaciones y machine learning.",
    model: "gpt-4o-mini",
    created_at: Date.now() - 432000000,
  },
  {
    id: "asst_demo_6",
    name: "Diseñador UX/UI",
    description: "Experto en diseño de experiencia de usuario, interfaces, prototipado y usabilidad.",
    model: "gpt-4o",
    created_at: Date.now() - 518400000,
  },
  {
    id: "asst_demo_7",
    name: "Traductor Multiidioma",
    description: "Especialista en traducción y localización para múltiples idiomas y culturas.",
    model: "gpt-4o",
    created_at: Date.now() - 604800000,
  },
  {
    id: "asst_demo_8",
    name: "Consultor Financiero",
    description: "Experto en finanzas personales, inversiones, presupuestos y planificación financiera.",
    model: "gpt-4o-mini",
    created_at: Date.now() - 691200000,
  },
  {
    id: "asst_demo_9",
    name: "Chef Virtual",
    description: "Especialista en cocina, recetas, técnicas culinarias y nutrición.",
    model: "gpt-4o",
    created_at: Date.now() - 777600000,
  },
  {
    id: "asst_demo_10",
    name: "Entrenador Personal",
    description: "Experto en fitness, rutinas de ejercicio, nutrición deportiva y bienestar.",
    model: "gpt-4o-mini",
    created_at: Date.now() - 864000000,
  },
]

export default function DashboardPage() {
  const [assistants, setAssistants] = useState<Assistant[]>([])
  const [user, setUser] = useState<UserData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [chatHistory, setChatHistory] = useState<ChatSession[]>([])
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

    // Simular carga de asistentes
    setTimeout(() => {
      setAssistants(DEMO_ASSISTANTS)
      setIsLoading(false)
    }, 1500)
  }, [router])

  const loadChatHistory = () => {
    const history = JSON.parse(localStorage.getItem("chat_history") || "[]")
    const userHistory = history.filter(
      (session: ChatSession) => session.userId === user?.id || session.userId === "demo_user",
    )
    setChatHistory(userHistory.sort((a: ChatSession, b: ChatSession) => b.createdAt - a.createdAt))
  }

  const handleSelectAssistant = (assistantId: string) => {
    router.push(`/chat/${assistantId}`)
  }

  const handleSelectChat = (sessionId: string) => {
    router.push(`/chat/history/${sessionId}`)
  }

  const handleDeleteSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const allHistory = JSON.parse(localStorage.getItem("chat_history") || "[]")
    const updatedHistory = allHistory.filter((session: ChatSession) => session.id !== sessionId)
    localStorage.setItem("chat_history", JSON.stringify(updatedHistory))

    const userHistory = updatedHistory.filter(
      (session: ChatSession) => session.userId === user?.id || session.userId === "demo_user",
    )
    setChatHistory(userHistory.sort((a: ChatSession, b: ChatSession) => b.createdAt - a.createdAt))

    toast({
      title: "Conversación eliminada",
      description: "La conversación se ha eliminado del historial",
    })
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
        {/* Sidebar Skeleton */}
        <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-4">
          <Skeleton className="h-10 w-full mb-4" />
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </div>
        {/* Main Content Skeleton */}
        <div className="flex-1 p-6">
          <Skeleton className="h-8 w-48 mb-8" />
          <Skeleton className="h-12 w-64 mb-4" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    )
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

          {/* Dropdown de Asistentes */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="w-full justify-between">
                <div className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  <span>Nueva conversación</span>
                </div>
                <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-80" align="start">
              <DropdownMenuLabel>Selecciona un asistente</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {assistants.map((assistant) => (
                <DropdownMenuItem
                  key={assistant.id}
                  className="flex items-start gap-3 p-3 cursor-pointer"
                  onClick={() => handleSelectAssistant(assistant.id)}
                >
                  <Bot className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{assistant.name}</p>
                      <Badge variant="secondary" className="text-xs">
                        {assistant.model}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">{assistant.description}</p>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Lista de Conversaciones */}
        <div className="flex-1 overflow-hidden">
          <div className="p-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Conversaciones recientes</h3>
          </div>
          <ScrollArea className="flex-1 px-4">
            {chatHistory.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-500 dark:text-gray-400">No hay conversaciones</p>
              </div>
            ) : (
              <div className="space-y-2 pb-4">
                {chatHistory.map((session) => (
                  <div
                    key={session.id}
                    className="group p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors"
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

      {/* Contenido Principal */}
      <div className="flex-1 flex flex-col">
        {/* Header Principal */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6">
          <div className="max-w-4xl mx-auto">
            {/* Banner Demo */}
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-blue-600" />
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Modo Demo:</strong> Esta es una versión de demostración con datos simulados. Los asistentes y
                  chats no son reales.
                </p>
              </div>
            </div>

            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard de Asistentes</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Usa el botón "Nueva conversación" en el sidebar para seleccionar un asistente y comenzar a chatear
              </p>
            </div>
          </div>
        </div>

        {/* Área Principal */}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto p-8">
            <div className="w-24 h-24 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <Bot className="w-12 h-12 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">¡Bienvenido a tu Dashboard!</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Tienes <strong>{assistants.length} asistentes</strong> disponibles para ayudarte con diferentes tareas.
              Selecciona "Nueva conversación" en el sidebar para comenzar.
            </p>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="font-semibold text-gray-900 dark:text-white">{assistants.length}</div>
                <div className="text-gray-600 dark:text-gray-400">Asistentes</div>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="font-semibold text-gray-900 dark:text-white">{chatHistory.length}</div>
                <div className="text-gray-600 dark:text-gray-400">Conversaciones</div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>💡 Tip:</strong> Puedes acceder a tus conversaciones anteriores desde el historial en el sidebar
                izquierdo.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
