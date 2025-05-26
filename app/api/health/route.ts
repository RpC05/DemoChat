import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  console.log("=== HEALTH CHECK ===")

  try {
    const checks = {
      timestamp: new Date().toISOString(),
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
      },
      envVars: {
        hasOpenAIKey: !!process.env.OPENAI_API_KEY,
        openAIKeyLength: process.env.OPENAI_API_KEY?.length || 0,
        openAIKeyFormat: process.env.OPENAI_API_KEY?.startsWith("sk-") || false,
        hasJWTSecret: !!process.env.JWT_SECRET,
        jwtSecretLength: process.env.JWT_SECRET?.length || 0,
      },
      apis: {
        openai: null as any,
      },
    }

    // Test OpenAI API connection
    if (process.env.OPENAI_API_KEY) {
      try {
        console.log("Probando conexión con OpenAI...")
        const openaiResponse = await fetch("https://api.openai.com/v1/models", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            "Content-Type": "application/json",
          },
        })

        checks.apis.openai = {
          status: openaiResponse.status,
          statusText: openaiResponse.statusText,
          ok: openaiResponse.ok,
          headers: Object.fromEntries(openaiResponse.headers.entries()),
        }

        if (!openaiResponse.ok) {
          const errorText = await openaiResponse.text()
          checks.apis.openai.error = errorText
        }
      } catch (error) {
        checks.apis.openai = {
          error: error instanceof Error ? error.message : "Error desconocido",
          type: "connection_error",
        }
      }
    }

    console.log("Health check results:", checks)
    return NextResponse.json(checks)
  } catch (error) {
    console.error("Error en health check:", error)
    return NextResponse.json(
      {
        error: "Error en health check",
        details: error instanceof Error ? error.message : "Error desconocido",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
