import { NextResponse } from 'next/server';
import { GoogleGenerativeAI, GenerationConfig } from '@google/generative-ai';

const MODEL_NAME = 'gemini-2.0-flash'; // Corrigido para um modelo estável

const SYSTEM_PROMPT = `
Você é um Analista de Dados Sênior e um especialista em Manutenção Industrial SMT. Seu nome é SGM-AI.
Sua tarefa é analisar os dados de um dashboard de manutenção fornecidos em formato JSON e responder a perguntas do usuário de forma clara, objetiva e inteligente.

**Regras Obrigatórias:**
1.  **Seja um Analista, Não um Robô:** Não se limite a repetir os dados. Interprete-os. Forneça insights, identifique tendências, aponte riscos e sugira ações práticas.
2.  **Use Markdown:** Formate suas respostas usando markdown para melhor legibilidade (negrito, itálico, listas).
3.  **Seja Conciso:** Vá direto ao ponto, mas sem perder a profundidade da análise.
4.  **Baseie-se nos Dados:** Todas as suas respostas devem ser estritamente baseadas no contexto JSON fornecido. Não invente informações. Se a resposta não estiver nos dados, diga que não tem essa informação.
5.  **Tom de Voz:** Seja profissional, proativo e confiante. Você é um especialista auxiliando um gestor.

**Exemplo de como interpretar os dados:**
- Se "overduePreventives" > 0, isso é um **ponto crítico de atenção**.
- Se "complianceRate" < 80%, isso indica um **risco para a conformidade e eficiência**.
- Compare "totalPreventives" com "totalCorrectives". Um número alto de corretivas pode indicar que o plano preventivo é ineficaz.
- Analise "callTrend" para prever futuras demandas.

Você receberá os dados do dashboard e a pergunta do usuário. Forneça a melhor análise possível.
`.trim();

type DashboardInsightBody = {
  prompt?: string;
  context?: any; // Os dados do dashboard (objeto 'insights')
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as DashboardInsightBody;
    const userPrompt = body?.prompt?.trim();
    const context = body?.context;

    if (!userPrompt) {
      return NextResponse.json({ error: 'O prompt do usuário é obrigatório.' }, { status: 400 });
    }
    if (!context) {
      return NextResponse.json({ error: 'O contexto do dashboard é obrigatório.' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'A variável de ambiente GEMINI_API_KEY não está configurada.' },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: MODEL_NAME,
      systemInstruction: SYSTEM_PROMPT,
    });

    // Converte o objeto de contexto em uma string JSON formatada para incluir no prompt
    const contextString = JSON.stringify(context, null, 2);

    const finalPrompt = `
      **Dados do Dashboard (Contexto):**
      \`\`\`json
      ${contextString}
      \`\`\`

      **Pergunta do Usuário:**
      "${userPrompt}"
    `;

    const generationConfig: GenerationConfig = {
      temperature: 0.5,
      maxOutputTokens: 2048,
    };

    const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: finalPrompt }] }],
        generationConfig,
    });

    const responseText = result.response.text();

    return NextResponse.json({ response: responseText });

  } catch (error) {
    console.error('Erro ao gerar insight com Gemini:', error);
    const message =
      error instanceof Error ? error.message : 'Erro desconhecido ao comunicar com a IA.';
    return NextResponse.json(
      { error: 'Erro ao gerar insight do dashboard.', details: message },
      { status: 500 }
    );
  }
}
