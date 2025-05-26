"use client"

import type React from "react"
import { MessageSquare } from "lucide-react" // Import MessageSquare here

import { useState, useEffect, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Send, Bot, User, X, UserIcon, LogOut, Trash2, Plus } from "lucide-react"
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
const DEMO_ASSISTANTS = [
  {
    id: "asst_demo_1",
    name: "Asistente de Programación",
    description: "Especializado en desarrollo web, JavaScript, React y Node.js.",
    model: "gpt-4o",
  },
  {
    id: "asst_demo_2",
    name: "Consultor de Marketing",
    description: "Experto en estrategias de marketing digital, SEO, redes sociales.",
    model: "gpt-4o-mini",
  },
  {
    id: "asst_demo_3",
    name: "Tutor de Matemáticas",
    description: "Especialista en matemáticas desde nivel básico hasta avanzado.",
    model: "gpt-4o",
  },
  {
    id: "asst_demo_4",
    name: "Escritor Creativo",
    description: "Asistente para escritura creativa, storytelling, guiones.",
    model: "gpt-4o",
  },
  {
    id: "asst_demo_5",
    name: "Analista de Datos",
    description: "Especializado en análisis de datos, Python, SQL, visualizaciones.",
    model: "gpt-4o-mini",
  },
  {
    id: "asst_demo_6",
    name: "Diseñador UX/UI",
    description: "Experto en diseño de experiencia de usuario, interfaces.",
    model: "gpt-4o",
  },
  {
    id: "asst_demo_7",
    name: "Traductor Multiidioma",
    description: "Especialista en traducción y localización para múltiples idiomas.",
    model: "gpt-4o",
  },
  {
    id: "asst_demo_8",
    name: "Consultor Financiero",
    description: "Experto en finanzas personales, inversiones, presupuestos.",
    model: "gpt-4o-mini",
  },
  {
    id: "asst_demo_9",
    name: "Chef Virtual",
    description: "Especialista en cocina, recetas, técnicas culinarias.",
    model: "gpt-4o",
  },
  {
    id: "asst_demo_10",
    name: "Entrenador Personal",
    description: "Experto en fitness, rutinas de ejercicio, nutrición deportiva.",
    model: "gpt-4o-mini",
  },
]

// Respuestas demo por tipo de asistente
const DEMO_RESPONSES: Record<string, string[]> = {
  asst_demo_1: [
    "¡Hola! Soy tu asistente de programación. Puedo ayudarte con JavaScript, React, Node.js y desarrollo web en general. ¿En qué proyecto estás trabajando?",
    "Excelente pregunta. Para resolver esto, te recomiendo usar async/await para manejar las promesas de manera más limpia. ¿Te gustaría que te muestre un ejemplo?",
    "Ese error es común cuando trabajas con APIs. Asegúrate de manejar los casos de error con try/catch y validar las respuestas antes de procesarlas.",
    "Para optimizar el rendimiento de React, considera usar React.memo, useMemo y useCallback en los componentes que se renderizan frecuentemente.",
  ],
  asst_demo_2: [
    "¡Hola! Soy tu consultor de marketing digital. Puedo ayudarte con estrategias de SEO, redes sociales, análisis de mercado y campañas publicitarias. ¿Qué necesitas?",
    "Para mejorar tu SEO, te recomiendo enfocarte en contenido de calidad, palabras clave relevantes y optimización técnica. ¿Cuál es tu nicho de mercado?",
    "Las redes sociales son clave para el engagement. Instagram y TikTok funcionan bien para audiencias jóvenes, mientras que LinkedIn es ideal para B2B.",
    "El análisis de métricas es fundamental. Enfócate en CTR, conversiones y ROI más que en vanity metrics como likes o seguidores.",
  ],
  asst_demo_3: [
    "¡Hola! Soy tu tutor de matemáticas. Puedo ayudarte con álgebra, cálculo, estadística, geometría y más. ¿Qué tema te gustaría repasar?",
    "Para resolver ecuaciones cuadráticas, puedes usar la fórmula general: x = (-b ± √(b²-4ac)) / 2a. ¿Te gustaría que resolvamos un ejemplo juntos?",
    "El cálculo diferencial se basa en límites. La derivada representa la tasa de cambio instantánea de una función. ¿Qué función quieres derivar?",
    "En estadística, la media, mediana y moda son medidas de tendencia central. Cada una nos dice algo diferente sobre los datos.",
  ],
  asst_demo_4: [
    "¡Hola! Soy tu asistente de escritura creativa. Puedo ayudarte con cuentos, novelas, guiones, poesía y desarrollo de personajes. ¿Qué historia quieres contar?",
    "Para crear personajes memorables, piensa en sus motivaciones profundas, miedos y contradicciones. Los personajes perfectos son aburridos.",
    "La estructura de tres actos es clásica: planteamiento, confrontación y resolución. Pero no tengas miedo de experimentar con estructuras no lineales.",
    "El diálogo debe sonar natural pero ser más interesante que la conversación real. Cada personaje debe tener una voz única y reconocible.",
  ],
  asst_demo_5: [
    "¡Hola! Soy tu analista de datos. Puedo ayudarte con Python, SQL, visualizaciones, machine learning y análisis estadístico. ¿Qué datos quieres analizar?",
    "Para análisis exploratorio, comienza con pandas.describe() y visualizaciones básicas. Busca patrones, outliers y correlaciones en tus datos.",
    "SQL es fundamental para extraer datos. Las consultas JOIN te permiten combinar tablas relacionadas. ¿Qué tipo de consulta necesitas?",
    "Para machine learning, la limpieza de datos es el 80% del trabajo. Asegúrate de manejar valores nulos y normalizar las variables numéricas.",
  ],
  asst_demo_6: [
    "¡Hola! Soy tu diseñador UX/UI. Puedo ayudarte con wireframes, prototipos, research de usuarios y principios de usabilidad. ¿Qué proyecto tienes?",
    "El diseño centrado en el usuario es clave. Siempre pregúntate: ¿esto resuelve un problema real del usuario? ¿Es intuitivo y accesible?",
    "Para prototipos, Figma es excelente. Comienza con wireframes de baja fidelidad y ve añadiendo detalles progresivamente.",
    "La jerarquía visual guía al usuario. Usa tamaño, color y espaciado para dirigir la atención hacia los elementos más importantes.",
  ],
  asst_demo_7: [
    "¡Hola! Soy tu traductor multiidioma. Puedo ayudarte con traducciones precisas, localización cultural y adaptación de contenido. ¿Qué necesitas traducir?",
    "La traducción no es solo cambiar palabras, sino adaptar el mensaje cultural. ¿En qué contexto se usará esta traducción?",
    "Para traducciones técnicas, es importante mantener la terminología específica del sector. ¿Tienes un glosario de referencia?",
    "La localización incluye adaptar fechas, monedas, referencias culturales y humor. ¿Para qué mercado específico es esta traducción?",
  ],
  asst_demo_8: [
    "¡Hola! Soy tu consultor financiero. Puedo ayudarte con presupuestos, inversiones, planificación financiera y análisis de gastos. ¿Cuál es tu objetivo financiero?",
    "Para crear un presupuesto efectivo, usa la regla 50/30/20: 50% necesidades, 30% deseos, 20% ahorros e inversiones.",
    "La diversificación es clave en inversiones. No pongas todos los huevos en una canasta. ¿Cuál es tu tolerancia al riesgo?",
    "Para el fondo de emergencia, recomiendo tener entre 3-6 meses de gastos guardados en una cuenta de fácil acceso.",
  ],
  asst_demo_9: [
    "¡Hola! Soy tu chef virtual. Puedo ayudarte con recetas, técnicas culinarias, sustituciones de ingredientes y planificación de menús. ¿Qué quieres cocinar?",
    "Para una buena sazón, prueba mientras cocinas y ajusta gradualmente. La sal realza otros sabores, pero úsala con moderación.",
    "La mise en place (tener todo preparado) es fundamental. Corta, mide y organiza todos los ingredientes antes de empezar a cocinar.",
    "Para carnes jugosas, deja que alcancen temperatura ambiente antes de cocinar y déjalas reposar después para redistribuir los jugos.",
  ],
  asst_demo_10: [
    "¡Hola! Soy tu entrenador personal. Puedo ayudarte con rutinas de ejercicio, nutrición deportiva, técnicas de entrenamiento y motivación. ¿Cuál es tu objetivo fitness?",
    "Para principiantes, recomiendo empezar con 3 días de entrenamiento por semana, combinando cardio y fuerza. La consistencia es más importante que la intensidad.",
    "La progresión gradual previene lesiones. Aumenta peso, repeticiones o intensidad solo cuando puedas completar todas las series con buena forma.",
    "La recuperación es tan importante como el entrenamiento. Asegúrate de dormir 7-9 horas y tener al menos un día de descanso entre entrenamientos intensos.",
  ],
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [assistant, setAssistant] = useState<any>(null)
  const [isActive, setIsActive] = useState(true)
  const [sessionId, setSessionId] = useState<string>("")
  const [user, setUser] = useState<any>(null)
  const [responseIndex, setResponseIndex] = useState(0)
  const [chatHistory, setChatHistory] = useState<ChatSession[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()

  const assistantId = params.assistantId as string

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

    // Crear nueva sesión de chat
    const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    setSessionId(newSessionId)

    // Buscar asistente demo
    const foundAssistant = DEMO_ASSISTANTS.find((a) => a.id === assistantId)
    if (foundAssistant) {
      setAssistant(foundAssistant)
    } else {
      toast({
        title: "Error",
        description: "Asistente no encontrado",
        variant: "destructive",
      })
      router.push("/dashboard")
    }
  }, [assistantId, router, toast])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const loadChatHistory = () => {
    const history = JSON.parse(localStorage.getItem("chat_history") || "[]")
    const userHistory = history.filter(
      (session: ChatSession) => session.userId === user?.id || session.userId === "demo_user",
    )
    setChatHistory(userHistory.sort((a: ChatSession, b: ChatSession) => b.createdAt - a.createdAt))
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const getRandomResponse = (assistantId: string): string => {
    const responses = DEMO_RESPONSES[assistantId] || [
      "Gracias por tu mensaje. Como asistente demo, puedo responder de manera simulada.",
      "Entiendo tu consulta. En un entorno real, podría darte una respuesta más específica.",
      "Esa es una buena pregunta. Te ayudaría con más detalles si estuviera conectado a OpenAI.",
      "Perfecto, puedo ayudarte con eso. Esta es una respuesta de demostración.",
    ]

    const response = responses[responseIndex % responses.length]
    setResponseIndex((prev) => prev + 1)
    return response
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!input.trim() || !isActive) return

    const userMessage: Message = {
      id: `msg_${Date.now()}_user`,
      role: "user",
      content: input.trim(),
      timestamp: Date.now(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    // Simular delay de respuesta
    setTimeout(
      () => {
        const assistantMessage: Message = {
          id: `msg_${Date.now()}_assistant`,
          role: "assistant",
          content: getRandomResponse(assistantId),
          timestamp: Date.now(),
        }

        setMessages((prev) => [...prev, assistantMessage])
        setIsLoading(false)
      },
      1000 + Math.random() * 2000,
    ) // 1-3 segundos
  }

  const handleCloseChat = () => {
    if (messages.length > 0) {
      // Guardar sesión en historial
      const chatSession: ChatSession = {
        id: sessionId,
        assistantId,
        assistantName: assistant?.name || "Asistente",
        messages,
        isActive: false,
        createdAt: Date.now(),
        userId: user?.id || "demo_user",
      }

      const existingHistory = JSON.parse(localStorage.getItem("chat_history") || "[]")
      existingHistory.push(chatSession)
      localStorage.setItem("chat_history", JSON.stringify(existingHistory))

      loadChatHistory()

      toast({
        title: "Chat guardado",
        description: "La conversación se ha guardado en el historial",
      })
    }

    setIsActive(false)
  }

  const handleBackToDashboard = () => {
    router.push("/dashboard")
  }

  const handleSelectChat = (sessionId: string) => {
    router.push(`/chat/history/${sessionId}`)
  }

  const handleSelectAssistant = (assistantId: string) => {
    router.push(`/chat/${assistantId}`)
  }

  const handleDeleteSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const allHistory = JSON.parse(localStorage.getItem("chat_history") || "[]")
    const updatedHistory = allHistory.filter((session: ChatSession) => session.id !== sessionId)
    localStorage.setItem("chat_history", JSON.stringify(updatedHistory))

    loadChatHistory()

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

  if (!assistant) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Cargando asistente...</p>
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
              {DEMO_ASSISTANTS.map((assistantOption) => (
                <DropdownMenuItem
                  key={assistantOption.id}
                  className="flex items-start gap-3 p-3 cursor-pointer"
                  onClick={() => handleSelectAssistant(assistantOption.id)}
                >
                  <Bot className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {assistantOption.name}
                      </p>
                      <Badge variant="secondary" className="text-xs">
                        {assistantOption.model}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                      {assistantOption.description}
                    </p>
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

      {/* Área de Chat */}
      <div className="flex-1 flex flex-col">
        {/* Header del Chat */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bot className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-lg font-semibold text-gray-900 dark:text-white">{assistant.name}</h1>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{assistant.model}</Badge>
                  <Badge variant="outline" className="text-blue-600">
                    DEMO
                  </Badge>
                  {!isActive && (
                    <Badge variant="outline" className="text-orange-600">
                      Solo lectura
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            {isActive && (
              <Button variant="outline" size="sm" onClick={handleCloseChat}>
                <X className="w-4 h-4 mr-2" />
                Cerrar Chat
              </Button>
            )}
          </div>
        </div>

        {/* Área de Mensajes */}
        <div className="flex-1 flex flex-col">
          <ScrollArea className="flex-1 p-4">
            <div className="max-w-4xl mx-auto space-y-4">
              {messages.length === 0 ? (
                <div className="text-center py-12">
                  <Bot className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Comienza una conversación
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Envía un mensaje para comenzar a chatear con {assistant.name}
                  </p>
                  <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 max-w-md mx-auto">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      <strong>Modo Demo:</strong> Las respuestas son simuladas y no provienen de OpenAI.
                    </p>
                  </div>
                </div>
              ) : (
                messages.map((message) => (
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
                ))
              )}
              {isLoading && (
                <div className="flex gap-3 justify-start">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <Card className="bg-white dark:bg-gray-800">
                    <CardContent className="p-3">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.1s" }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        ></div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Área de Input */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800">
            <div className="max-w-4xl mx-auto">
              {!isActive ? (
                <div className="text-center py-4">
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    Este chat está en modo solo lectura. No puedes enviar más mensajes.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="flex gap-2">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Escribe tu mensaje..."
                    disabled={isLoading}
                    className="flex-1"
                  />
                  <Button type="submit" disabled={isLoading || !input.trim()}>
                    <Send className="w-4 h-4" />
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
