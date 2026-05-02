import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()

const SYSTEM = `Eres un sistema de inteligencia anticorrupción especializado en SECOP Colombia. Eres preciso, técnico y orientado a la acción investigativa. Citas normativa colombiana cuando es relevante (Ley 80, 1150, 1474, etc.). Responde en español.`

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json()
    if (!prompt) {
      return NextResponse.json({ error: 'Prompt requerido' }, { status: 400 })
    }

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: SYSTEM,
      messages: [{ role: 'user', content: prompt }],
    })

    const text =
      message.content.find((b): b is Anthropic.TextBlock => b.type === 'text')?.text ??
      'Sin respuesta.'

    return NextResponse.json({ text })
  } catch (error) {
    console.error('Anthropic API error:', error)
    return NextResponse.json({ error: 'Error al procesar la consulta.' }, { status: 500 })
  }
}
