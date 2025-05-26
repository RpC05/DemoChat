import { type NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"

function verifyToken(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null
    }

    const token = authHeader.substring(7)
    return jwt.verify(token, process.env.JWT_SECRET || "fallback_secret")
  } catch (error) {
    console.error("Error verificando token:", error)
    return null
  }
}

export async function GET(request: NextRequest) {
  console.log("=== INICIO GET /api/assistants ===")

  try {
    // Verificar autenticación
    const user = verifyToken(request)
    if (!user) {
      console.log("Usuario no autorizado")
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }
    console.log("Usuario autorizado:", user)

    // Verificar API Key
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      console.error("OPENAI_API_KEY no está configurada")
      return NextResponse.json(
        {
          error: "API Key de OpenAI no configurada en el servidor",
        },
        { status: 500 },
      )
    }
    console.log("API Key encontrada, longitud:", apiKey.length)

    // Verificar que la API Key tenga el formato correcto
    if (!apiKey.startsWith("sk-")) {
      console.error("API Key no tiene el formato correcto")
      return NextResponse.json(
        {
          error: "API Key de OpenAI tiene formato inválido",
        },
        { status: 500 },
      )
    }

    console.log("Haciendo request a OpenAI...")

    const response = await fetch("https://api.openai.com/v1/assistants", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "OpenAI-Beta": "assistants=v2",
      },
    })

    console.log("Respuesta de OpenAI - Status:", response.status)
    console.log("Respuesta de OpenAI - Headers:", Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Error de OpenAI:", {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
      })

      if (response.status === 401) {
        return NextResponse.json(
          {
            error: "API Key de OpenAI inválida o sin permisos",
          },
          { status: 500 },
        )
      }

      if (response.status === 429) {
        return NextResponse.json(
          {
            error: "Límite de rate de OpenAI excedido. Intenta más tarde.",
          },
          { status: 500 },
        )
      }

      return NextResponse.json(
        {
          error: `Error de OpenAI: ${response.status} - ${errorText}`,
        },
        { status: 500 },
      )
    }

    const data = await response.json()
    console.log("Datos recibidos de OpenAI:", {
      dataType: typeof data,
      hasData: !!data.data,
      assistantsCount: data.data?.length || 0,
    })

    const assistants = data.data.map((assistant: any) => ({
      id: assistant.id,
      name: assistant.name || "Sin nombre",
      description: assistant.description || "",
      model: assistant.model,
      created_at: assistant.created_at,
    }))

    console.log("Asistentes procesados:", assistants.length)
    console.log("=== FIN GET /api/assistants ===")

    return NextResponse.json({ assistants })
  } catch (error) {
    console.error("Error completo en /api/assistants:", error)
    console.error("Stack trace:", error instanceof Error ? error.stack : "No stack available")

    return NextResponse.json(
      {
        error: "Error interno del servidor",
        details: error instanceof Error ? error.message : "Error desconocido",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
