import { type NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"

function verifyToken(request: NextRequest) {
  const authHeader = request.headers.get("authorization")
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null
  }

  const token = authHeader.substring(7)
  try {
    return jwt.verify(token, process.env.JWT_SECRET || "fallback_secret")
  } catch (error) {
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const user = verifyToken(request)
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { assistantId, message, threadId } = await request.json()

    if (!assistantId || !message) {
      return NextResponse.json({ error: "Faltan parámetros requeridos" }, { status: 400 })
    }

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      console.error("OPENAI_API_KEY no está configurada")
      return NextResponse.json({ error: "API Key de OpenAI no configurada" }, { status: 500 })
    }

    let currentThreadId = threadId

    // Crear thread si no existe
    if (!currentThreadId) {
      console.log("Creando nuevo thread...")
      const threadResponse = await fetch("https://api.openai.com/v1/threads", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "OpenAI-Beta": "assistants=v2",
        },
        body: JSON.stringify({}),
      })

      if (!threadResponse.ok) {
        const errorText = await threadResponse.text()
        console.error("Error creando thread:", errorText)
        throw new Error(`Error al crear thread: ${threadResponse.status}`)
      }

      const threadData = await threadResponse.json()
      currentThreadId = threadData.id
      console.log("Thread creado:", currentThreadId)
    }

    // Agregar mensaje al thread
    console.log("Agregando mensaje al thread...")
    const messageResponse = await fetch(`https://api.openai.com/v1/threads/${currentThreadId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "OpenAI-Beta": "assistants=v2",
      },
      body: JSON.stringify({
        role: "user",
        content: message,
      }),
    })

    if (!messageResponse.ok) {
      const errorText = await messageResponse.text()
      console.error("Error agregando mensaje:", errorText)
      throw new Error(`Error al agregar mensaje: ${messageResponse.status}`)
    }

    // Ejecutar el asistente
    console.log("Ejecutando asistente...")
    const runResponse = await fetch(`https://api.openai.com/v1/threads/${currentThreadId}/runs`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "OpenAI-Beta": "assistants=v2",
      },
      body: JSON.stringify({
        assistant_id: assistantId,
      }),
    })

    if (!runResponse.ok) {
      const errorText = await runResponse.text()
      console.error("Error ejecutando asistente:", errorText)
      throw new Error(`Error al ejecutar asistente: ${runResponse.status}`)
    }

    const runData = await runResponse.json()
    const runId = runData.id
    console.log("Run iniciado:", runId)

    // Esperar a que termine la ejecución
    let runStatus = "queued"
    let attempts = 0
    const maxAttempts = 30 // 30 segundos máximo

    while ((runStatus === "queued" || runStatus === "in_progress") && attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      attempts++

      const statusResponse = await fetch(`https://api.openai.com/v1/threads/${currentThreadId}/runs/${runId}`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "OpenAI-Beta": "assistants=v2",
        },
      })

      if (!statusResponse.ok) {
        const errorText = await statusResponse.text()
        console.error("Error verificando status:", errorText)
        throw new Error(`Error al verificar status: ${statusResponse.status}`)
      }

      const statusData = await statusResponse.json()
      runStatus = statusData.status
      console.log(`Status del run (intento ${attempts}):`, runStatus)
    }

    if (runStatus !== "completed") {
      console.error("Run no completado:", runStatus)
      throw new Error(`El asistente no pudo completar la respuesta. Status: ${runStatus}`)
    }

    // Obtener mensajes del thread
    console.log("Obteniendo mensajes...")
    const messagesResponse = await fetch(`https://api.openai.com/v1/threads/${currentThreadId}/messages`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "OpenAI-Beta": "assistants=v2",
      },
    })

    if (!messagesResponse.ok) {
      const errorText = await messagesResponse.text()
      console.error("Error obteniendo mensajes:", errorText)
      throw new Error(`Error al obtener mensajes: ${messagesResponse.status}`)
    }

    const messagesData = await messagesResponse.json()
    const lastMessage = messagesData.data[0]

    if (!lastMessage || !lastMessage.content || !lastMessage.content[0]) {
      throw new Error("No se pudo obtener la respuesta del asistente")
    }

    console.log("Respuesta obtenida exitosamente")

    return NextResponse.json({
      threadId: currentThreadId,
      content: lastMessage.content[0].text.value,
    })
  } catch (error) {
    console.error("Error completo en chat:", error)
    return NextResponse.json(
      {
        error: "Error interno del servidor",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    )
  }
}
