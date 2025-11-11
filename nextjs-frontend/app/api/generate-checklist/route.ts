import { NextResponse } from 'next/server';
import { GoogleGenerativeAI, GenerationConfig } from '@google/generative-ai';

const MODEL_NAME = 'gemini-2.0-flash';

const SYSTEM_PROMPT = `Voce e um Especialista em Manutencao de Maquinas Industriais e SMT, com profundo conhecimento em equipamentos ASMPT (incluindo SIPLACE SX1, SX2, SX4), Yamaha, Panasonic e outras plataformas SMT.

Sua tarefa e criar checklists de manutencao extremamente praticos, detalhados e estruturados. Voce deve:

1. Analisar o prompt do usuario cuidadosamente - pode conter instrucoes especificas sobre persona, estrutura, componentes, frequencias, etc.
2. Seguir todas as instrucoes fornecidas no prompt do usuario (ex: agrupar por frequencia, organizar por componentes, nivel de detalhe, etc.)
3. Gerar itens praticos e acionaveis que um tecnico possa executar facilmente.

FORMATO DE RESPOSTA OBRIGATORIO:

Voce DEVE responder EXCLUSIVAMENTE em JSON valido, sem texto adicional, comentarios ou explicacoes. Use SEMPRE este formato:

{
  "titulo_sugerido": "Titulo conciso e descritivo para o checklist",
  "itens": [
    { 
      "titulo": "Nome claro e acionavel do item", 
      "obrigatorio": true, 
      "instrucoes": "Instrucoes detalhadas de como executar a tarefa. Seja especifico e inclua contexto relevante."
    }
  ]
}

REGRAS IMPORTANTES:

- titulo_sugerido: Nome apropriado baseado no escopo do checklist
- itens: Lista de tarefas de verificacao e manutencao
  - titulo: Acao clara (ex: Verificar pressao de ar, Limpar cameras do cabecote)
  - obrigatorio: true para verificacoes criticas, false para verificacoes complementares
  - instrucoes: Detalhes sobre como executar, onde esta localizado, o que observar, valores de referencia

QUANTIDADE DE ITENS:
- Para checklists simples: 5-10 itens
- Para checklists completos: 10-20 itens
- Para checklists muito complexos: 15-30 itens
- Se o usuario solicitar estrutura por categorias ou frequencias, organize os itens seguindo essa logica nos titulos

QUALIDADE DOS ITENS:
- Titulos devem ser verbos de acao mais objeto
- Instrucoes devem incluir detalhes praticos: localizacao, metodo, ferramentas, valores esperados
- Priorize clareza e utilidade para o tecnico em campo

LEMBRE-SE: Responda APENAS com JSON valido. Nenhum texto antes ou depois do JSON.`.trim();

type GenerateChecklistBody = {
  prompt?: string;
  entityType?: string;
  entityId?: number | null;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as GenerateChecklistBody;
    const userPrompt = body?.prompt?.trim();
    const entityType = body?.entityType;

    if (!userPrompt) {
      return NextResponse.json({ error: 'Prompt é obrigatório.' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Variável de ambiente GEMINI_API_KEY não configurada.' },
        { status: 500 }
      );
    }

    // CORREÇÃO 1: Inicialização correta do cliente
    const genAI = new GoogleGenerativeAI(apiKey);

    const model = genAI.getGenerativeModel({
      model: MODEL_NAME,
      systemInstruction: SYSTEM_PROMPT,
    });

    // CORREÇÃO 3: Incluindo contexto no prompt
    const finalPrompt = `
      Contexto da Tarefa:
      - Tipo de Associação: ${entityType || 'Não especificado'}
      
      Prompt do Usuário:
      "${userPrompt}"
    `;

    const generationConfig: GenerationConfig = {
      temperature: 0.5, // Um pouco mais de criatividade para seguir instruções complexas
      maxOutputTokens: 8192, // Mais tokens para checklists grandes e detalhados
      responseMimeType: 'application/json',
    };

    // CORREÇÃO 2: Chamada correta do generateContent
    const generation = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: finalPrompt }] }],
      generationConfig,
    });

    const rawText = generation.response.text().trim();
    console.log('🔍 [DEBUG] Resposta bruta do modelo:', rawText);

    let parsed: any;
    try {
      parsed = JSON.parse(rawText);
      console.log('✅ [DEBUG] JSON parseado com sucesso:', JSON.stringify(parsed, null, 2));
    } catch {
      console.log('⚠️ [DEBUG] Erro ao parsear JSON diretamente, tentando sanitizar...');
      const sanitized = rawText
        .replace(/```json/gi, '')
        .replace(/```/g, '')
        .trim();

      try {
        parsed = JSON.parse(sanitized);
        console.log('✅ [DEBUG] JSON sanitizado parseado:', JSON.stringify(parsed, null, 2));
      } catch (e) {
        console.error('❌ [DEBUG] Falha ao parsear JSON sanitizado:', e);
        return NextResponse.json(
          {
            error: 'Resposta do modelo em formato JSON inválido.',
            raw: rawText,
          },
          { status: 502 }
        );
      }
    }

    console.log('🔎 [DEBUG] Procurando array de itens...');
    console.log('  parsed.itens é Array?', Array.isArray(parsed?.itens));
    console.log('  parsed.items é Array?', Array.isArray(parsed?.items));
    console.log('  parsed.checklist?.itens é Array?', Array.isArray(parsed?.checklist?.itens));
    console.log('  parsed.checklist?.items é Array?', Array.isArray(parsed?.checklist?.items));

    const itens =
      (Array.isArray(parsed?.itens) && parsed.itens) ||
      (Array.isArray(parsed?.items) && parsed.items) ||
      (Array.isArray(parsed?.checklist?.itens) && parsed.checklist.itens) ||
      (Array.isArray(parsed?.checklist?.items) && parsed.checklist.items);

    if (!Array.isArray(itens)) {
      console.error('❌ [DEBUG] Nenhum array de itens encontrado!');
      console.error('   Estrutura do objeto parseado:', Object.keys(parsed || {}));
      return NextResponse.json(
        {
          error: 'Resposta do modelo não contém lista de itens.',
          raw: parsed,
        },
        { status: 502 }
      );
    }

    console.log('✅ [DEBUG] Array de itens encontrado com', itens.length, 'elementos');

    const normalizedItems = itens.map((item: any, index: number) => ({
      titulo:
        typeof item?.titulo === 'string'
          ? item.titulo
          : typeof item?.title === 'string'
            ? item.title
            : typeof item?.nome === 'string'
              ? item.nome
              : `Item ${index + 1}`,
      obrigatorio:
        typeof item?.obrigatorio === 'boolean'
          ? item.obrigatorio
          : typeof item?.obrigatório === 'boolean'
            ? item.obrigatório
            : typeof item?.required === 'boolean'
              ? item.required
              : true,
      instrucoes:
        typeof item?.instrucoes === 'string'
          ? item.instrucoes
          : typeof item?.instruções === 'string'
            ? item.instruções
            : typeof item?.instructions === 'string'
              ? item.instructions
              : '',
      requer_foto:
        typeof item?.requer_foto === 'boolean'
          ? item.requer_foto
          : typeof item?.requiresPhoto === 'boolean'
            ? item.requiresPhoto
            : typeof item?.requires_photo === 'boolean'
              ? item.requires_photo
              : false,
      requer_assinatura:
        typeof item?.requer_assinatura === 'boolean'
          ? item.requer_assinatura
          : typeof item?.requiresSignature === 'boolean'
            ? item.requiresSignature
            : typeof item?.requires_signature === 'boolean'
              ? item.requires_signature
              : false,
    }));

    return NextResponse.json({
      titulo_sugerido:
        typeof parsed.titulo_sugerido === 'string'
          ? parsed.titulo_sugerido
          : typeof parsed.titulo === 'string'
            ? parsed.titulo
            : typeof parsed.title === 'string'
              ? parsed.title
              : '',
      itens: normalizedItems,
    });
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
