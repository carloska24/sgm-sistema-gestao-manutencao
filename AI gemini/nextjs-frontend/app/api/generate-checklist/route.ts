import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const MODEL_NAME = 'gemini-1.5-flash';

const SYSTEM_PROMPT = `
Você é um Especialista em Manutenção de Máquinas Industriais/SMT. Sua tarefa é criar checklists de manutenção extremamente práticos e objetivos.

Regras obrigatórias:
- Responda exclusivamente em JSON válido.
- Nunca inclua texto fora do JSON (sem comentários, sem explicações).
- Utilize o formato:
{
  "itens": [
    { "titulo": "Nome do item 1", "obrigatorio": true },
    { "titulo": "Nome do item 2", "obrigatorio": false }
  ]
}
- Gere entre 8 e 15 itens sempre que possível.
- Garanta que todos os títulos sejam claros e acionáveis.
- Defina "obrigatorio": true para verificações fundamentais e false para verificações complementares.
`.trim();

type GenerateChecklistBody = {
  prompt?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as GenerateChecklistBody;
    const prompt = body?.prompt?.trim();

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt é obrigatório.' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Variável de ambiente GEMINI_API_KEY não configurada.' },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI({
      apiKey,
      apiVersion: 'v1',
    });
    const model = genAI.getGenerativeModel({
      model: MODEL_NAME,
      systemInstruction: SYSTEM_PROMPT,
    });

    const generation = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 2048,
      },
    });

    const rawText = generation.response.text().trim();
    const sanitized = rawText
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim();

    let parsed: unknown;
    try {
      parsed = JSON.parse(sanitized);
    } catch {
      return NextResponse.json(
        {
          error: 'Resposta do modelo em formato inválido.',
          raw: rawText,
        },
        { status: 502 }
      );
    }

    const itens = (parsed as { itens?: unknown }).itens;
    if (!Array.isArray(itens)) {
      return NextResponse.json(
        {
          error: 'Resposta do modelo não contém lista de itens.',
          raw: parsed,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({ itens });
  } catch (error) {
    console.error('Erro ao gerar checklist com Gemini:', error);
    const message =
      error instanceof Error ? error.message : 'Erro desconhecido ao gerar checklist.';
    return NextResponse.json(
      { error: 'Erro ao gerar checklist.', details: message },
      { status: 500 }
    );
  }
}

