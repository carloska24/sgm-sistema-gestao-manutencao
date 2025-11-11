const express = require('express');
const router = express.Router();
const { z } = require('zod');
const { query, run, get } = require('../database');
const { authenticate, authorize } = require('../middleware/auth');

// Schema de validação
const createPlanSchema = z.object({
  name: z.string().min(1, 'Nome do plano é obrigatório'),
  equipment_id: z.number().int().positive('Equipamento é obrigatório'),
  frequency_type: z.enum(['days', 'weeks', 'months', 'hours', 'cycles']),
  frequency_value: z.number().int().positive('Valor da frequência deve ser positivo'),
  start_date: z.string(),
  end_date: z.string().optional().nullable(),
  instructions: z.string().optional(),
  estimated_duration: z.number().int().positive().optional().nullable(),
  tools_required: z.string().optional().nullable(),
  materials_required: z.string().optional().nullable(),
  safety_procedures: z.string().optional().nullable(),
  manual_reference: z.string().optional().nullable(),
  assigned_to: z.number().int().positive().optional().nullable(),
});

const updatePlanSchema = createPlanSchema.partial();

// Listar planos preventivos
router.get('/', authenticate, authorize('admin', 'manager', 'technician'), async (req, res, next) => {
  try {
    const { equipment_id, is_active, page = 1, limit = 20 } = req.query;

    const { include_demo } = req.query;
    const realEquipmentCount = await get('SELECT COUNT(*) as count FROM equipment WHERE (is_demo = 0 OR is_demo IS NULL)');
    const hasRealData = realEquipmentCount?.count > 0;
    const shouldIncludeDemo = include_demo === 'true' || (!hasRealData && include_demo !== 'false');
    
    const ordersDemoFilter = shouldIncludeDemo ? '' : 'AND (is_demo = 0 OR is_demo IS NULL)';
    
    let sql = `
      SELECT 
        pp.*,
        e.name as equipment_name,
        e.code as equipment_code,
        u1.username as assigned_to_name,
        u2.username as created_by_name,
        (SELECT COUNT(*) FROM maintenance_orders WHERE plan_id = pp.id ${ordersDemoFilter}) as total_orders,
        (SELECT COUNT(*) FROM maintenance_orders WHERE plan_id = pp.id AND status = 'completed' ${ordersDemoFilter}) as completed_orders
      FROM preventive_plans pp
      LEFT JOIN equipment e ON pp.equipment_id = e.id
      LEFT JOIN users u1 ON pp.assigned_to = u1.id
      LEFT JOIN users u2 ON pp.created_by = u2.id
    `;
    const params = [];
    const whereConditions = [];
    
    if (!shouldIncludeDemo) {
      whereConditions.push('(pp.is_demo = 0 OR pp.is_demo IS NULL)');
    }

    if (equipment_id) {
      whereConditions.push('pp.equipment_id = ?');
      params.push(equipment_id);
    }

    if (is_active !== undefined) {
      whereConditions.push('pp.is_active = ?');
      params.push(is_active === 'true' ? 1 : 0);
    }
    
    // Adicionar WHERE se houver condições
    if (whereConditions.length > 0) {
      sql += ' WHERE ' + whereConditions.join(' AND ');
    }

    sql += ' ORDER BY pp.created_at DESC LIMIT ? OFFSET ?';
    const offset = (parseInt(page) - 1) * parseInt(limit);
    params.push(parseInt(limit), offset);

    const plans = await query(sql, params);

    // Contar total
    let countSql = `SELECT COUNT(*) as count FROM preventive_plans`;
    const countParams = [];
    const countWhereConditions = [];
    
    if (!shouldIncludeDemo) {
      countWhereConditions.push('(is_demo = 0 OR is_demo IS NULL)');
    }
    
    if (equipment_id) {
      countWhereConditions.push('equipment_id = ?');
      countParams.push(equipment_id);
    }
    if (is_active !== undefined) {
      countWhereConditions.push('is_active = ?');
      countParams.push(is_active === 'true' ? 1 : 0);
    }
    
    // Adicionar WHERE se houver condições
    if (countWhereConditions.length > 0) {
      countSql += ' WHERE ' + countWhereConditions.join(' AND ');
    }

    const countResult = await get(countSql, countParams);

    res.json({
      success: true,
      data: plans,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult?.count || 0,
        totalPages: Math.ceil((countResult?.count || 0) / parseInt(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
});

// Rotas de IA devem vir ANTES das rotas com parâmetros dinâmicos (/:id)
// Rota para gerar recursos (ferramentas e materiais) usando IA
router.post('/ai-generate-resources', authenticate, async (req, res, next) => {
  try {
    const { 
      equipment_id, 
      equipment_name, 
      equipment_code, 
      manufacturer,
      model,
      instructions
    } = req.body;

    if (!equipment_name) {
      return res.status(400).json({
        success: false,
        error: 'Nome do equipamento é obrigatório',
      });
    }

    // Buscar informações completas do equipamento
    let equipmentDetails = {};
    if (equipment_id) {
      try {
        const equipment = await get('SELECT * FROM equipment WHERE id = ?', [equipment_id]);
        if (equipment) {
          equipmentDetails = {
            power: equipment.power,
            capacity: equipment.capacity,
            voltage: equipment.voltage,
            fuel_type: equipment.fuel_type,
          };
        }
      } catch (dbError) {
        console.warn('Erro ao buscar detalhes do equipamento:', dbError);
      }
    }

    const geminiApiKey = process.env.GEMINI_API_KEY;
    let toolsRequired = '';
    let materialsRequired = '';

    if (geminiApiKey) {
      try {
        const { GoogleGenerativeAI } = require('@google/generative-ai');
        const genAI = new GoogleGenerativeAI(geminiApiKey);
        
        // Tentar usar modelos disponíveis no free tier primeiro
        let model;
        let modelName = 'gemini-1.5-flash';
        try {
          model = genAI.getGenerativeModel({ model: modelName });
          console.log(`[AI-RESOURCES] Modelo Gemini inicializado: ${modelName}`);
        } catch (modelError) {
          try {
            modelName = 'gemini-pro';
            model = genAI.getGenerativeModel({ model: modelName });
            console.log(`[AI-RESOURCES] Modelo Gemini inicializado: ${modelName}`);
          } catch (modelError2) {
            try {
              modelName = 'gemini-1.5-pro';
              model = genAI.getGenerativeModel({ model: modelName });
              console.log(`[AI-RESOURCES] Modelo Gemini inicializado: ${modelName}`);
            } catch (modelError3) {
              try {
                modelName = 'gemini-2.0-pro';
                model = genAI.getGenerativeModel({ model: modelName });
                console.log(`[AI-RESOURCES] Modelo Gemini inicializado: ${modelName}`);
              } catch (modelError4) {
                modelName = 'gemini-2.0-pro-exp';
                model = genAI.getGenerativeModel({ model: modelName });
                console.log(`[AI-RESOURCES] Modelo Gemini inicializado: ${modelName}`);
              }
            }
          }
        }

        const equipmentInfo = [
          `Nome: ${equipment_name}`,
          equipment_code ? `Código: ${equipment_code}` : '',
          manufacturer ? `Fabricante: ${manufacturer}` : '',
          model ? `Modelo: ${model}` : '',
          equipmentDetails.power ? `Potência: ${equipmentDetails.power}` : '',
          equipmentDetails.capacity ? `Capacidade: ${equipmentDetails.capacity}` : '',
          equipmentDetails.voltage ? `Tensão: ${equipmentDetails.voltage}` : '',
        ].filter(Boolean).join('\n');

        const prompt = `Você é um especialista técnico em manutenção industrial. Use seu conhecimento técnico para gerar listas específicas de ferramentas e materiais necessários para manutenção preventiva do equipamento abaixo.

INFORMAÇÕES DO EQUIPAMENTO:
${equipmentInfo}

${instructions ? `INSTRUÇÕES DE MANUTENÇÃO (para contexto):\n${instructions.substring(0, 1000)}` : ''}

TAREFA: Gere duas listas em português brasileiro.

FORMATO OBRIGATÓRIO - Responda EXATAMENTE neste formato:

FERRAMENTAS:
[lista de ferramentas específicas, separadas por vírgula ou uma por linha]

MATERIAIS:
[lista de materiais específicos, separados por vírgula ou uma por linha]

INSTRUÇÕES:
1. FERRAMENTAS NECESSÁRIAS: Liste ferramentas específicas necessárias para este tipo de equipamento e manutenção preventiva. Seja específico (ex: "Multímetro digital", "Chave de fenda Phillips #2", "Alicate de corte diagonal", etc.).

2. MATERIAIS NECESSÁRIOS: Liste materiais específicos necessários (lubrificantes, filtros, vedações, produtos de limpeza, etc.). Inclua quantidades quando relevante (ex: "Óleo hidráulico ISO 46 - 5L", "Filtro de ar - 1 unidade").

IMPORTANTE:
- Seja específico e técnico
- Baseie-se no tipo de equipamento e fabricante
- Inclua ferramentas e materiais comuns para este tipo de manutenção
- Se não conhecer o modelo específico, use conhecimento sobre equipamentos similares
- RESPONDA APENAS COM O FORMATO SOLICITADO (FERRAMENTAS: ... MATERIAIS: ...)`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const generatedText = response.text();

        console.log('📝 [DEBUG] Resposta completa do Gemini:', generatedText);

        // Função auxiliar para limpar e formatar texto
        const cleanList = (text) => {
          return text
            .trim()
            .replace(/^[-•*]\s*/gm, '') // Remove marcadores de lista
            .replace(/^\d+[\.\)]\s*/gm, '') // Remove numeração
            .replace(/\n+/g, ', ') // Substitui quebras de linha por vírgula
            .replace(/,\s*,/g, ',') // Remove vírgulas duplicadas
            .replace(/\s+/g, ' ') // Normaliza espaços
            .replace(/,\s*$/, '') // Remove vírgula final
            .trim();
        };

        // Tentar múltiplos padrões de extração
        // Padrão 1: FERRAMENTAS: ... MATERIAIS: ...
        let toolsMatch = generatedText.match(/FERRAMENTAS?:?\s*([\s\S]*?)(?=MATERIAIS?:|$)/i);
        let materialsMatch = generatedText.match(/MATERIAIS?:?\s*([\s\S]*?)$/i);

        // Padrão 2: Ferramentas: ... Materiais: ...
        if (!toolsMatch || !materialsMatch) {
          toolsMatch = generatedText.match(/Ferramentas?:?\s*([\s\S]*?)(?=Materiais?:|$)/i);
          materialsMatch = generatedText.match(/Materiais?:?\s*([\s\S]*?)$/i);
        }

        // Padrão 3: 1. FERRAMENTAS ... 2. MATERIAIS
        if (!toolsMatch || !materialsMatch) {
          toolsMatch = generatedText.match(/(?:1\.|1-)\s*FERRAMENTAS?:?\s*([\s\S]*?)(?=(?:2\.|2-)\s*MATERIAIS?:|MATERIAIS?:)/i);
          materialsMatch = generatedText.match(/(?:2\.|2-)\s*MATERIAIS?:?\s*([\s\S]*?)$/i);
        }

        // Padrão 4: Dividir por linhas que começam com "FERRAMENTAS" e "MATERIAIS"
        if (!toolsMatch || !materialsMatch) {
          const lines = generatedText.split('\n');
          let toolsStart = -1;
          let materialsStart = -1;
          
          for (let i = 0; i < lines.length; i++) {
            if (lines[i].match(/FERRAMENTAS?:?/i) && toolsStart === -1) {
              toolsStart = i;
            }
            if (lines[i].match(/MATERIAIS?:?/i) && materialsStart === -1) {
              materialsStart = i;
            }
          }
          
          if (toolsStart !== -1 && materialsStart !== -1) {
            toolsMatch = { 1: lines.slice(toolsStart + 1, materialsStart).join('\n') };
            materialsMatch = { 1: lines.slice(materialsStart + 1).join('\n') };
          }
        }

        if (toolsMatch && toolsMatch[1]) {
          toolsRequired = cleanList(toolsMatch[1]);
          console.log('✅ [DEBUG] Ferramentas extraídas:', toolsRequired);
        }

        if (materialsMatch && materialsMatch[1]) {
          materialsRequired = cleanList(materialsMatch[1]);
          console.log('✅ [DEBUG] Materiais extraídos:', materialsRequired);
        }

        // Se não conseguiu extrair, tentar segunda tentativa com prompt mais direto
        if (!toolsRequired || !materialsRequired) {
          console.log('⚠️ [DEBUG] Tentando segunda tentativa...');
          const retryPrompt = `Você é um especialista técnico. Liste APENAS ferramentas e materiais para manutenção preventiva de ${manufacturer || ''} ${model || equipment_name}.

FORMATO OBRIGATÓRIO (responda EXATAMENTE assim):
FERRAMENTAS:
[lista de ferramentas separadas por vírgula]

MATERIAIS:
[lista de materiais separados por vírgula]`;

          const retryResult = await model.generateContent(retryPrompt);
          const retryResponse = await retryResult.response;
          const retryText = retryResponse.text();
          
          console.log('📝 [DEBUG] Resposta da segunda tentativa:', retryText);

          // Tentar extrair novamente
          const retryToolsMatch = retryText.match(/FERRAMENTAS?:?\s*([\s\S]*?)(?=MATERIAIS?:|$)/i);
          const retryMaterialsMatch = retryText.match(/MATERIAIS?:?\s*([\s\S]*?)$/i);

          if (!toolsRequired && retryToolsMatch && retryToolsMatch[1]) {
            toolsRequired = cleanList(retryToolsMatch[1]);
            console.log('✅ [DEBUG] Ferramentas extraídas (retry):', toolsRequired);
          }
          
          if (!materialsRequired && retryMaterialsMatch && retryMaterialsMatch[1]) {
            materialsRequired = cleanList(retryMaterialsMatch[1]);
            console.log('✅ [DEBUG] Materiais extraídos (retry):', materialsRequired);
          }
        }
      } catch (geminiError) {
        console.error('Erro ao usar Gemini API:', geminiError);
      }
    }

    // Fallback baseado no tipo de equipamento
    // Garantir que sempre temos ferramentas e materiais, mesmo que a IA não tenha gerado
    if (!toolsRequired || toolsRequired.trim() === '' || !materialsRequired || materialsRequired.trim() === '') {
      console.log('⚠️ [DEBUG] Usando fallback - toolsRequired:', toolsRequired, 'materialsRequired:', materialsRequired);
      const equipmentType = equipment_name.toLowerCase();
      
      if (equipmentType.includes('versaflow') || equipmentType.includes('selective') || equipmentType.includes('solda')) {
        if (!toolsRequired || toolsRequired.trim() === '') {
          toolsRequired = 'Multímetro digital, Chave de fenda Phillips, Chave de fenda plana, Alicate de corte diagonal, Escova de aço inox macia, Termômetro infravermelho, Lupa de aumento, Chave inglesa ajustável';
        }
        if (!materialsRequired || materialsRequired.trim() === '') {
          materialsRequired = 'Isopropanol (álcool isopropílico), Limpa-bicos específico ERSA, Fluxo de solda (conforme especificação), Estanho para solda, Pano limpo sem fiapos, Escova de limpeza para componentes eletrônicos';
        }
      } else if (equipmentType.includes('siplace') || equipmentType.includes('pick') || equipmentType.includes('place')) {
        if (!toolsRequired || toolsRequired.trim() === '') {
          toolsRequired = 'Multímetro digital, Chave de fenda Phillips, Chave de fenda plana, Alicate antiestático, Chave hex (jogo completo), Nível de precisão, Escova macia, Lupa de aumento';
        }
        if (!materialsRequired || materialsRequired.trim() === '') {
          materialsRequired = 'Álcool isopropílico, Lubrificante para gantries (conforme especificação), Filtros de vácuo, Pano limpo antiestático, Produto de limpeza para lentes';
        }
      } else if (equipmentType.includes('compressor') || equipmentType.includes('compress')) {
        if (!toolsRequired || toolsRequired.trim() === '') {
          toolsRequired = 'Chave de fenda, Chave inglesa ajustável, Manômetro, Termômetro, Multímetro, Chave de dreno';
        }
        if (!materialsRequired || materialsRequired.trim() === '') {
          materialsRequired = 'Óleo do compressor (conforme especificação), Filtro de ar, Filtro de óleo, Veda rosca, Lubrificante';
        }
      } else {
        if (!toolsRequired || toolsRequired.trim() === '') {
          toolsRequired = 'Multímetro digital, Chave de fenda (jogo completo), Chave inglesa ajustável, Alicate universal, Alicate de corte, Nível de bolha, Termômetro';
        }
        if (!materialsRequired || materialsRequired.trim() === '') {
          materialsRequired = 'Lubrificante (conforme especificação do fabricante), Filtros (ar/óleo conforme aplicável), Veda rosca, Produtos de limpeza adequados, Pano limpo';
        }
      }
    }

    // Garantir que sempre temos valores (última linha de defesa)
    if (!toolsRequired || toolsRequired.trim() === '') {
      toolsRequired = 'Multímetro digital, Chave de fenda, Chave inglesa ajustável, Alicate universal, Alicate de corte, Nível de bolha';
      console.log('⚠️ [DEBUG] Usando fallback genérico para ferramentas');
    }
    if (!materialsRequired || materialsRequired.trim() === '') {
      materialsRequired = 'Lubrificante (conforme especificação do fabricante), Filtros conforme aplicável, Veda rosca, Produtos de limpeza adequados, Pano limpo';
      console.log('⚠️ [DEBUG] Usando fallback genérico para materiais');
    }

    console.log('✅ [DEBUG] Valores finais - Ferramentas:', toolsRequired, 'Materiais:', materialsRequired);

    res.json({
      success: true,
      data: {
        tools_required: toolsRequired,
        materials_required: materialsRequired,
        equipment_name,
      },
    });
  } catch (error) {
    console.error('Erro ao gerar recursos com IA:', error);
    next(error);
  }
});

// Rota para gerar procedimentos de segurança usando IA
router.post('/ai-generate-safety', authenticate, async (req, res, next) => {
  try {
    const { 
      equipment_id, 
      equipment_name, 
      equipment_code, 
      manufacturer,
      model,
      instructions
    } = req.body;

    if (!equipment_name) {
      return res.status(400).json({
        success: false,
        error: 'Nome do equipamento é obrigatório',
      });
    }

    // Buscar informações completas do equipamento
    let equipmentDetails = {};
    if (equipment_id) {
      try {
        const equipment = await get('SELECT * FROM equipment WHERE id = ?', [equipment_id]);
        if (equipment) {
          equipmentDetails = {
            power: equipment.power,
            voltage: equipment.voltage,
            criticality: equipment.criticality,
          };
        }
      } catch (dbError) {
        console.warn('Erro ao buscar detalhes do equipamento:', dbError);
      }
    }

    const geminiApiKey = process.env.GEMINI_API_KEY;
    let safetyProcedures = '';

    if (geminiApiKey) {
      try {
        const { GoogleGenerativeAI } = require('@google/generative-ai');
        const genAI = new GoogleGenerativeAI(geminiApiKey);
        
        // Tentar usar modelos disponíveis no free tier primeiro
        let model;
        let modelName = 'gemini-1.5-flash';
        try {
          model = genAI.getGenerativeModel({ model: modelName });
          console.log(`[AI-RESOURCES] Modelo Gemini inicializado: ${modelName}`);
        } catch (modelError) {
          try {
            modelName = 'gemini-pro';
            model = genAI.getGenerativeModel({ model: modelName });
            console.log(`[AI-RESOURCES] Modelo Gemini inicializado: ${modelName}`);
          } catch (modelError2) {
            try {
              modelName = 'gemini-1.5-pro';
              model = genAI.getGenerativeModel({ model: modelName });
              console.log(`[AI-RESOURCES] Modelo Gemini inicializado: ${modelName}`);
            } catch (modelError3) {
              try {
                modelName = 'gemini-2.0-pro';
                model = genAI.getGenerativeModel({ model: modelName });
                console.log(`[AI-RESOURCES] Modelo Gemini inicializado: ${modelName}`);
              } catch (modelError4) {
                modelName = 'gemini-2.0-pro-exp';
                model = genAI.getGenerativeModel({ model: modelName });
                console.log(`[AI-RESOURCES] Modelo Gemini inicializado: ${modelName}`);
              }
            }
          }
        }

        const equipmentInfo = [
          `Nome: ${equipment_name}`,
          equipment_code ? `Código: ${equipment_code}` : '',
          manufacturer ? `Fabricante: ${manufacturer}` : '',
          model ? `Modelo: ${model}` : '',
          equipmentDetails.voltage ? `Tensão: ${equipmentDetails.voltage}` : '',
          equipmentDetails.power ? `Potência: ${equipmentDetails.power}` : '',
          equipmentDetails.criticality ? `Criticidade: ${equipmentDetails.criticality}` : '',
        ].filter(Boolean).join('\n');

        const prompt = `Você é um especialista em segurança industrial. Use seu conhecimento técnico para gerar procedimentos de segurança específicos e detalhados para manutenção preventiva do equipamento abaixo.

INFORMAÇÕES DO EQUIPAMENTO:
${equipmentInfo}

${instructions ? `INSTRUÇÕES DE MANUTENÇÃO (para contexto):\n${instructions.substring(0, 1000)}` : ''}

TAREFA: Gere procedimentos de segurança específicos e detalhados em português brasileiro para este equipamento.

INCLUA:
1. EPIs obrigatórios específicos para este tipo de equipamento
2. Procedimentos de lockout/tagout específicos
3. Riscos específicos deste equipamento (elétrico, térmico, mecânico, químico, etc.)
4. Medidas de proteção específicas
5. Procedimentos de emergência
6. Verificações pré-operacionais obrigatórias

FORMATO: Use uma lista numerada ou com marcadores, seja claro e específico. Organize em seções se necessário.

IMPORTANTE: Seja técnico, específico e prático. Foque em procedimentos reais e aplicáveis para este equipamento ${manufacturer ? 'do fabricante ' + manufacturer : ''}${model ? ' modelo ' + model : ''}.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        safetyProcedures = response.text();

        // Se a resposta estiver muito curta, tentar novamente
        if (!safetyProcedures || safetyProcedures.trim().length < 200) {
          const retryPrompt = `Gere procedimentos de segurança detalhados para manutenção preventiva de ${manufacturer || ''} ${model || equipment_name}.

Inclua:
- EPIs obrigatórios
- Procedimentos de segurança
- Riscos específicos
- Medidas de proteção`;

          const retryResult = await model.generateContent(retryPrompt);
          const retryResponse = await retryResult.response;
          const retryText = retryResponse.text();
          
          if (retryText && retryText.trim().length >= 200) {
            safetyProcedures = retryText;
          }
        }
      } catch (geminiError) {
        console.error('Erro ao usar Gemini API:', geminiError);
      }
    }

    // Fallback baseado no tipo de equipamento
    if (!safetyProcedures || safetyProcedures.trim().length < 200) {
      const equipmentType = equipment_name.toLowerCase();
      
      if (equipmentType.includes('versaflow') || equipmentType.includes('selective') || equipmentType.includes('solda')) {
        safetyProcedures = `⚠️ PROCEDIMENTOS DE SEGURANÇA PARA MÁQUINAS DE SOLDAGEM

ANTES DE INICIAR:
1. Desligar completamente a máquina e aguardar resfriamento dos bicos (< 50°C)
2. Seguir procedimento de lockout/tagout elétrico e pneumático
3. Verificar que não há placas em processamento
4. Aguardar descarga completa de capacitores (mínimo 5 minutos)

EPIs OBRIGATÓRIOS:
- Óculos de proteção UV/IR (proteção contra radiação de soldagem)
- Luvas térmicas resistentes a altas temperaturas
- Avental de proteção contra respingos de estanho
- Calçados de segurança com biqueira de aço
- Máscara de proteção respiratória (durante limpeza com produtos químicos)

RISCOS ESPECÍFICOS:
- Queimaduras por contato com bicos quentes (temperatura até 300°C)
- Exposição a fumos de soldagem e fluxo
- Risco elétrico (tensão de alimentação dos bicos)
- Risco de respingos de estanho quente
- Produtos químicos de limpeza (isopropanol, limpa-bicos)

MEDIDAS DE PROTEÇÃO:
- Nunca tocar nos bicos sem verificar temperatura
- Usar sempre ferramentas adequadas para manipulação
- Trabalhar em área bem ventilada
- Manter extintor classe C (incêndios elétricos) próximo
- Sinalizar área de trabalho durante manutenção

PROCEDIMENTOS DE EMERGÊNCIA:
- Em caso de queimadura: resfriar imediatamente com água corrente
- Em caso de incêndio: usar extintor adequado, nunca água
- Em caso de contato com produtos químicos: lavar abundantemente com água`;
      } else if (equipmentType.includes('siplace') || equipmentType.includes('pick') || equipmentType.includes('place')) {
        safetyProcedures = `⚠️ PROCEDIMENTOS DE SEGURANÇA PARA MÁQUINAS PICK-AND-PLACE

ANTES DE INICIAR:
1. Colocar máquina em modo de manutenção
2. Desligar ar comprimido e energia elétrica (lockout/tagout)
3. Aguardar descarga completa de capacitores
4. Verificar que não há placas em processamento

EPIs OBRIGATÓRIOS:
- Óculos de proteção
- Luvas antiestáticas
- Calçados de segurança
- Avental antiestático (se aplicável)

RISCOS ESPECÍFICOS:
- Risco elétrico (alta tensão)
- Partes móveis (gantries, heads)
- Ar comprimido sob pressão
- Componentes pequenos que podem ser aspirados

MEDIDAS DE PROTEÇÃO:
- Verificar sempre que máquina está desligada
- Trabalhar com ar comprimido despressurizado
- Cuidado com partes móveis durante limpeza
- Usar ferramentas antiestáticas`;
      } else {
        safetyProcedures = `⚠️ PROCEDIMENTOS DE SEGURANÇA

ANTES DE INICIAR A MANUTENÇÃO:
1. Desligar o equipamento completamente e seguir procedimento de lockout/tagout
2. Aguardar descarga completa de energia (elétrica, pneumática, hidráulica)
3. Verificar que não há operações em andamento que possam interferir
4. Isolar e sinalizar a área de trabalho

EPIs OBRIGATÓRIOS:
- Óculos de proteção
- Luvas apropriadas (conforme tipo de trabalho)
- Calçados de segurança
- Avental ou uniforme de proteção (se aplicável)

RISCOS GERAIS:
- Risco elétrico
- Partes móveis
- Temperaturas elevadas (se aplicável)
- Produtos químicos (se aplicável)

MEDIDAS DE PROTEÇÃO:
- Verificar sempre que equipamento está desligado
- Usar ferramentas adequadas e em bom estado
- Trabalhar em área bem iluminada
- Manter área de trabalho organizada

PROCEDIMENTOS DE EMERGÊNCIA:
- Conhecer localização dos extintores
- Saber procedimento de evacuação
- Ter números de emergência à disposição`;
      }
    }

    res.json({
      success: true,
      data: {
        safety_procedures: safetyProcedures.trim(),
        equipment_name,
      },
    });
  } catch (error) {
    console.error('Erro ao gerar procedimentos de segurança com IA:', error);
    next(error);
  }
});

// Obter plano específico
router.get('/:id', authenticate, authorize('admin', 'manager', 'technician'), async (req, res, next) => {
  try {
    const plan = await get(
      `SELECT 
        pp.*,
        e.name as equipment_name,
        e.code as equipment_code,
        u1.username as assigned_to_name,
        u2.username as created_by_name
       FROM preventive_plans pp
       LEFT JOIN equipment e ON pp.equipment_id = e.id
       LEFT JOIN users u1 ON pp.assigned_to = u1.id
       LEFT JOIN users u2 ON pp.created_by = u2.id
       WHERE pp.id = ?`,
      [req.params.id]
    );

    if (!plan) {
      return res.status(404).json({
        success: false,
        error: 'Plano não encontrado',
      });
    }

    // Buscar OS geradas a partir deste plano
    const orders = await query(
      `SELECT 
        mo.*,
        e.name as equipment_name,
        e.code as equipment_code,
        u.username as assigned_to_name
       FROM maintenance_orders mo
       LEFT JOIN equipment e ON mo.equipment_id = e.id
       LEFT JOIN users u ON mo.assigned_to = u.id
       WHERE mo.plan_id = ?
       ORDER BY mo.scheduled_date DESC`,
      [req.params.id]
    );

    // Calcular estatísticas detalhadas
    const totalOrders = orders.length;
    const completedOrders = orders.filter(o => o.status === 'completed').length;
    const pendingOrders = orders.filter(o => o.status === 'pending').length;
    const inProgressOrders = orders.filter(o => o.status === 'in_progress').length;
    const overdueOrders = orders.filter(o => 
      o.status === 'pending' && new Date(o.scheduled_date) < new Date()
    ).length;
    
    // Calcular tempo médio de execução
    const completedWithTime = orders.filter(o => 
      o.status === 'completed' && o.execution_time
    );
    const avgExecutionTime = completedWithTime.length > 0
      ? Math.round(
          completedWithTime.reduce((sum, o) => sum + (o.execution_time || 0), 0) / 
          completedWithTime.length
        )
      : null;

    // Última OS concluída
    const lastCompleted = orders
      .filter(o => o.status === 'completed' && o.completed_date)
      .sort((a, b) => new Date(b.completed_date) - new Date(a.completed_date))[0];

    // Próxima OS agendada
    const nextScheduled = orders
      .filter(o => o.status === 'pending' || o.status === 'in_progress')
      .sort((a, b) => new Date(a.scheduled_date) - new Date(b.scheduled_date))[0];

    // Taxa de conformidade (concluídas no prazo)
    const onTimeCompleted = orders.filter(o => 
      o.status === 'completed' && 
      o.completed_date && 
      o.scheduled_date &&
      new Date(o.completed_date) <= new Date(o.scheduled_date)
    ).length;

    res.json({
      success: true,
      data: {
        ...plan,
        orders,
        total_orders: totalOrders,
        completed_orders: completedOrders,
        pending_orders: pendingOrders,
        in_progress_orders: inProgressOrders,
        overdue_orders: overdueOrders,
        avg_execution_time: avgExecutionTime,
        last_completed_date: lastCompleted?.completed_date || null,
        next_scheduled_date: nextScheduled?.scheduled_date || null,
        compliance_rate: completedOrders > 0 
          ? Math.round((onTimeCompleted / completedOrders) * 100)
          : null,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Criar novo plano
router.post('/', authenticate, authorize('admin', 'manager'), async (req, res, next) => {
  try {
    const data = createPlanSchema.parse(req.body);

    const result = await run(
      `INSERT INTO preventive_plans 
      (name, equipment_id, frequency_type, frequency_value, start_date, end_date, 
       instructions, estimated_duration, tools_required, materials_required, 
       safety_procedures, manual_reference, assigned_to, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.name,
        data.equipment_id,
        data.frequency_type,
        data.frequency_value,
        data.start_date,
        data.end_date || null,
        data.instructions || null,
        data.estimated_duration || null,
        data.tools_required || null,
        data.materials_required || null,
        data.safety_procedures || null,
        data.manual_reference || null,
        data.assigned_to || null,
        req.user.id,
      ]
    );

    // Gerar primeira OS automaticamente
    await generateNextOrder(result.lastID, data.start_date);

    const newPlan = await get(
      `SELECT 
        pp.*,
        e.name as equipment_name,
        e.code as equipment_code
       FROM preventive_plans pp
       LEFT JOIN equipment e ON pp.equipment_id = e.id
       WHERE pp.id = ?`,
      [result.lastID]
    );

    res.status(201).json({
      success: true,
      message: 'Plano criado com sucesso',
      data: newPlan,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Dados inválidos',
        details: error.errors,
      });
    }
    next(error);
  }
});

// Atualizar plano
router.put('/:id', authenticate, authorize('admin', 'manager'), async (req, res, next) => {
  try {
    const plan = await get('SELECT * FROM preventive_plans WHERE id = ?', [req.params.id]);

    if (!plan) {
      return res.status(404).json({
        success: false,
        error: 'Plano não encontrado',
      });
    }

    const data = updatePlanSchema.parse(req.body);
    const updates = [];
    const values = [];

    Object.keys(data).forEach((key) => {
      if (data[key] !== undefined) {
        updates.push(`${key} = ?`);
        values.push(data[key]);
      }
    });

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(req.params.id);

    if (updates.length > 1) {
      await run(
        `UPDATE preventive_plans SET ${updates.join(', ')} WHERE id = ?`,
        values
      );
    }

    const updatedPlan = await get(
      `SELECT 
        pp.*,
        e.name as equipment_name,
        e.code as equipment_code
       FROM preventive_plans pp
       LEFT JOIN equipment e ON pp.equipment_id = e.id
       WHERE pp.id = ?`,
      [req.params.id]
    );

    res.json({
      success: true,
      message: 'Plano atualizado com sucesso',
      data: updatedPlan,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Dados inválidos',
        details: error.errors,
      });
    }
    next(error);
  }
});

// Deletar plano
router.delete('/:id', authenticate, authorize('admin', 'manager'), async (req, res, next) => {
  try {
    const result = await run('DELETE FROM preventive_plans WHERE id = ?', [req.params.id]);

    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        error: 'Plano não encontrado',
      });
    }

    res.json({
      success: true,
      message: 'Plano deletado com sucesso',
    });
  } catch (error) {
    next(error);
  }
});

// Ativar/Desativar plano
router.post('/:id/toggle', authenticate, authorize('admin', 'manager'), async (req, res, next) => {
  try {
    const plan = await get('SELECT is_active FROM preventive_plans WHERE id = ?', [req.params.id]);

    if (!plan) {
      return res.status(404).json({
        success: false,
        error: 'Plano não encontrado',
      });
    }

    const newStatus = plan.is_active === 1 ? 0 : 1;

    await run(
      'UPDATE preventive_plans SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [newStatus, req.params.id]
    );

    res.json({
      success: true,
      message: `Plano ${newStatus === 1 ? 'ativado' : 'desativado'} com sucesso`,
    });
  } catch (error) {
    next(error);
  }
});

// Gerar próxima OS manualmente
router.post('/:id/generate-order', authenticate, authorize('admin', 'manager'), async (req, res, next) => {
  try {
    const plan = await get('SELECT * FROM preventive_plans WHERE id = ?', [req.params.id]);

    if (!plan) {
      return res.status(404).json({
        success: false,
        error: 'Plano não encontrado',
      });
    }

    // Buscar última OS gerada
    const lastOrder = await get(
      'SELECT scheduled_date FROM maintenance_orders WHERE plan_id = ? ORDER BY scheduled_date DESC LIMIT 1',
      [req.params.id]
    );

    let nextDate;
    if (lastOrder) {
      nextDate = calculateNextDate(lastOrder.scheduled_date, plan.frequency_type, plan.frequency_value);
    } else {
      nextDate = plan.start_date;
    }

    const orderId = await generateNextOrder(plan.id, nextDate);

    res.json({
      success: true,
      message: 'Ordem de serviço gerada com sucesso',
      data: { order_id: orderId },
    });
  } catch (error) {
    next(error);
  }
});

// Função auxiliar para gerar próxima OS
async function generateNextOrder(planId, scheduledDate) {
  const plan = await get('SELECT * FROM preventive_plans WHERE id = ?', [planId]);

  if (!plan || plan.is_active === 0) {
    return null;
  }

  // Verificar se já existe OS para esta data
  const existing = await get(
    'SELECT id FROM maintenance_orders WHERE plan_id = ? AND scheduled_date = ?',
    [planId, scheduledDate]
  );

  if (existing) {
    return existing.id;
  }

  const result = await run(
    `INSERT INTO maintenance_orders 
    (plan_id, equipment_id, type, description, instructions, scheduled_date, assigned_to, created_by)
    VALUES (?, ?, 'preventive', ?, ?, ?, ?, ?)`,
    [
      planId,
      plan.equipment_id,
      `Preventiva: ${plan.name}`,
      plan.instructions || null,
      scheduledDate,
      plan.assigned_to || null,
      plan.created_by,
    ]
  );

  // Atualizar próxima preventiva do equipamento
  await run(
    `UPDATE equipment 
     SET next_preventive_date = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [scheduledDate, plan.equipment_id]
  );

  return result.lastID;
}

// Função auxiliar para calcular próxima data
function calculateNextDate(currentDate, frequencyType, frequencyValue) {
  const date = new Date(currentDate);

  switch (frequencyType) {
    case 'days':
      date.setDate(date.getDate() + frequencyValue);
      break;
    case 'weeks':
      date.setDate(date.getDate() + (frequencyValue * 7));
      break;
    case 'months':
      date.setMonth(date.getMonth() + frequencyValue);
      break;
    case 'hours':
      // Para horas, assumimos frequência diária
      date.setDate(date.getDate() + Math.ceil(frequencyValue / 24));
      break;
    case 'cycles':
      // Para ciclos, assumimos frequência mensal
      date.setMonth(date.getMonth() + frequencyValue);
      break;
  }

  return date.toISOString().split('T')[0];
}

// Job para gerar OS automaticamente (deve ser chamado periodicamente)
router.post('/generate-orders', authenticate, authorize('admin', 'manager'), async (req, res, next) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Buscar planos ativos
    const activePlans = await query(
      'SELECT * FROM preventive_plans WHERE is_active = 1'
    );

    let generated = 0;

    for (const plan of activePlans) {
      // Buscar última OS gerada
      const lastOrder = await get(
        'SELECT scheduled_date FROM maintenance_orders WHERE plan_id = ? ORDER BY scheduled_date DESC LIMIT 1',
        [plan.id]
      );

      let nextDate;
      if (lastOrder) {
        nextDate = calculateNextDate(lastOrder.scheduled_date, plan.frequency_type, plan.frequency_value);
      } else {
        nextDate = plan.start_date;
      }

      // Verificar se precisa gerar nova OS
      if (nextDate <= today || (plan.end_date && nextDate <= plan.end_date)) {
        await generateNextOrder(plan.id, nextDate);
        generated++;
      }
    }

    res.json({
      success: true,
      message: `${generated} ordem(ns) de serviço gerada(s)`,
      data: { generated },
    });
  } catch (error) {
    next(error);
  }
});

// Rota para gerar instruções de manutenção usando IA com busca na web
router.post('/ai-generate-instructions', authenticate, async (req, res, next) => {
  try {
    const { 
      equipment_id, 
      equipment_name, 
      equipment_code, 
      equipment_description,
      manufacturer,
      model,
      search_query 
    } = req.body;

    if (!equipment_name) {
      return res.status(400).json({
        success: false,
        error: 'Nome do equipamento é obrigatório',
      });
    }

    // Buscar informações completas do equipamento do banco de dados
    let equipmentDetails = {};
    if (equipment_id) {
      try {
        const equipment = await get('SELECT * FROM equipment WHERE id = ?', [equipment_id]);
        if (equipment) {
          equipmentDetails = {
            power: equipment.power,
            capacity: equipment.capacity,
            voltage: equipment.voltage,
            fuel_type: equipment.fuel_type,
            dimensions: equipment.dimensions,
            criticality: equipment.criticality,
            location: equipment.location,
          };
        }
      } catch (dbError) {
        console.warn('Erro ao buscar detalhes do equipamento:', dbError);
      }
    }

    const geminiApiKey = process.env.GEMINI_API_KEY;
    let instructions = '';

    // Construir query de busca mais específica
    let searchQuery = search_query;
    if (!searchQuery) {
      const parts = [];
      if (manufacturer) parts.push(manufacturer);
      if (model) parts.push(model);
      if (equipment_name) parts.push(equipment_name);
      // Adicionar termos específicos baseados no tipo de equipamento
      const equipmentType = equipment_name.toLowerCase();
      if (equipmentType.includes('versaflow') || equipmentType.includes('solda') || equipmentType.includes('selective')) {
        parts.push('selective soldering machine', 'wave soldering', 'SMT');
      } else if (equipmentType.includes('siplace') || equipmentType.includes('pick') || equipmentType.includes('place')) {
        parts.push('pick and place machine', 'SMT placement', 'component placement');
      } else if (equipmentType.includes('reflow') || equipmentType.includes('forno')) {
        parts.push('reflow oven', 'SMT reflow');
      }
      searchQuery = `${parts.join(' ')} preventive maintenance manual instructions procedures`.trim();
    } else {
      searchQuery = `${manufacturer || ''} ${model || ''} ${equipment_name} ${searchQuery} preventive maintenance`.trim();
    }

    if (geminiApiKey) {
      try {
        // Usar Gemini API com Google Search para buscar informações na web
        const { GoogleGenerativeAI } = require('@google/generative-ai');
        const genAI = new GoogleGenerativeAI(geminiApiKey);
        
        // Tentar usar modelos disponíveis no free tier primeiro
        let model;
        let modelName = 'gemini-1.5-flash';
        try {
          model = genAI.getGenerativeModel({ model: modelName });
          console.log(`[AI-INSTRUCTIONS] Modelo Gemini inicializado: ${modelName}`);
        } catch (modelError) {
          try {
            modelName = 'gemini-pro';
            model = genAI.getGenerativeModel({ model: modelName });
            console.log(`[AI-INSTRUCTIONS] Modelo Gemini inicializado: ${modelName}`);
          } catch (modelError2) {
            try {
              modelName = 'gemini-1.5-pro';
              model = genAI.getGenerativeModel({ model: modelName });
              console.log(`[AI-INSTRUCTIONS] Modelo Gemini inicializado: ${modelName}`);
            } catch (modelError3) {
              try {
                modelName = 'gemini-2.0-pro';
                model = genAI.getGenerativeModel({ model: modelName });
                console.log(`[AI-INSTRUCTIONS] Modelo Gemini inicializado: ${modelName}`);
              } catch (modelError4) {
                modelName = 'gemini-2.0-pro-exp';
                model = genAI.getGenerativeModel({ model: modelName });
                console.log(`[AI-INSTRUCTIONS] Modelo Gemini inicializado: ${modelName}`);
              }
            }
          }
        }

        // Construir prompt mais detalhado e específico usando conhecimento interno do Gemini
        const equipmentInfo = [
          `Nome: ${equipment_name}`,
          equipment_code ? `Código: ${equipment_code}` : '',
          manufacturer ? `Fabricante: ${manufacturer}` : '',
          model ? `Modelo: ${model}` : '',
          equipment_description ? `Descrição: ${equipment_description}` : '',
          equipmentDetails.power ? `Potência: ${equipmentDetails.power}` : '',
          equipmentDetails.capacity ? `Capacidade: ${equipmentDetails.capacity}` : '',
          equipmentDetails.voltage ? `Tensão: ${equipmentDetails.voltage}` : '',
          equipmentDetails.fuel_type ? `Tipo de Combustível: ${equipmentDetails.fuel_type}` : '',
          equipmentDetails.dimensions ? `Dimensões: ${equipmentDetails.dimensions}` : '',
        ].filter(Boolean).join('\n');

        const prompt = `Você é um especialista técnico em manutenção industrial com conhecimento profundo sobre equipamentos de manufatura eletrônica e industrial.

TAREFA: Gerar instruções detalhadas e específicas de manutenção preventiva para o equipamento abaixo usando seu conhecimento técnico sobre este tipo de equipamento.

INFORMAÇÕES DO EQUIPAMENTO:
${equipmentInfo}

INSTRUÇÕES IMPORTANTES:
1. Use seu conhecimento técnico sobre este modelo específico e fabricante
2. Se conhecer o equipamento ${manufacturer ? manufacturer + ' ' : ''}${model || equipment_name}, use informações técnicas específicas deste modelo
3. Se não conhecer o modelo específico, use conhecimento técnico sobre equipamentos similares do mesmo fabricante ou categoria
4. Seja ESPECÍFICO sobre componentes, procedimentos e valores (pressões, temperaturas, tempos, frequências, etc.)
5. Inclua procedimentos específicos para este tipo de equipamento

FORMATO DAS INSTRUÇÕES:
Gere instruções profissionais em português brasileiro, organizadas em seções:

1. PROCEDIMENTOS DE SEGURANÇA
   - EPIs obrigatórios específicos para este equipamento
   - Procedimentos de lockout/tagout específicos
   - Riscos específicos deste tipo de equipamento

2. INSPEÇÃO VISUAL E VERIFICAÇÕES PRÉ-OPERACIONAIS
   - Componentes específicos a verificar
   - Sinais de desgaste ou problemas comuns deste equipamento
   - Valores de referência (pressões, temperaturas, etc.)

3. LIMPEZA E CONSERVAÇÃO
   - Procedimentos específicos de limpeza
   - Produtos recomendados pelo fabricante
   - Áreas críticas que requerem atenção especial

4. LUBRIFICAÇÃO E MANUTENÇÃO MECÂNICA
   - Pontos de lubrificação específicos
   - Tipos de lubrificantes recomendados
   - Frequências de lubrificação

5. VERIFICAÇÕES ELÉTRICAS E ELETRÔNICAS
   - Verificações específicas de sistemas elétricos
   - Calibração de sensores e atuadores
   - Testes de sistemas de controle

6. TESTES FUNCIONAIS
   - Procedimentos de teste específicos
   - Parâmetros de operação normais
   - Como verificar se o equipamento está funcionando corretamente

7. OBSERVAÇÕES E RECOMENDAÇÕES
   - Informações importantes do fabricante
   - Referências a manuais técnicos
   - Contatos de suporte técnico (se conhecidos)

IMPORTANTE: Seja técnico, específico e prático. Evite instruções genéricas. Foque em procedimentos reais e aplicáveis para este equipamento específico ${manufacturer ? 'do fabricante ' + manufacturer : ''}${model ? 'modelo ' + model : ''}.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        instructions = response.text();

        // Se a resposta estiver vazia ou muito curta, usar fallback
        if (!instructions || instructions.trim().length < 200) {
          throw new Error('Resposta da IA muito curta ou genérica');
        }
      } catch (geminiError) {
        console.error('Erro ao usar Gemini API (primeira tentativa):', geminiError);
        
        // Segunda tentativa com prompt mais direto e específico
        if (geminiApiKey) {
          try {
            const { GoogleGenerativeAI } = require('@google/generative-ai');
            const genAI = new GoogleGenerativeAI(geminiApiKey);
            const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

            const retryPrompt = `Você é um especialista técnico em manutenção industrial. Use seu conhecimento técnico para gerar instruções detalhadas de manutenção preventiva para:

FABRICANTE: ${manufacturer || 'Desconhecido'}
MODELO: ${model || equipment_name}
TIPO: ${equipment_name}
${equipment_description ? `DESCRIÇÃO: ${equipment_description}` : ''}

Gere instruções detalhadas de manutenção preventiva em português brasileiro baseadas em:
1. Seu conhecimento técnico sobre este equipamento específico
2. Procedimentos padrão recomendados para este tipo de máquina
3. Práticas comuns de manutenção industrial para equipamentos similares

Seja ESPECÍFICO: inclua valores de temperatura, pressão, tempos, frequências, produtos recomendados, etc.

Formato: Use markdown com seções claras (Segurança, Inspeção, Limpeza, Lubrificação, Testes).`;

            const retryResult = await model.generateContent(retryPrompt);
            const retryResponse = await retryResult.response;
            const retryInstructions = retryResponse.text();

            if (retryInstructions && retryInstructions.trim().length >= 200) {
              instructions = retryInstructions;
              console.log('Instruções geradas com sucesso na segunda tentativa');
            }
          } catch (retryError) {
            console.error('Erro na segunda tentativa com Gemini:', retryError);
          }
        }
      }
    }

    // Fallback: gerar instruções baseadas em padrões conhecidos apenas se não conseguir usar IA
    if (!instructions || instructions.trim().length < 200) {
      const equipmentType = equipment_name.toLowerCase();
      const manufacturerLower = (manufacturer || '').toLowerCase();
      
      // Detectar tipo específico de equipamento
      const isSelectiveSoldering = equipmentType.includes('versaflow') || 
                                   equipmentType.includes('selective') || 
                                   equipmentType.includes('solda seletiva') ||
                                   (manufacturerLower.includes('ersa') && equipmentType.includes('solda'));
      const isPickAndPlace = equipmentType.includes('siplace') || 
                            equipmentType.includes('pick') || 
                            equipmentType.includes('place') ||
                            equipmentType.includes('smt');
      const isReflowOven = equipmentType.includes('reflow') || 
                          equipmentType.includes('forno');
      const isCompressor = equipmentType.includes('compressor') || 
                          equipmentType.includes('compress');
      const isPump = equipmentType.includes('bomba') || 
                    equipmentType.includes('pump');
      const isMotor = equipmentType.includes('motor');
      
      if (isSelectiveSoldering) {
        instructions = `# Instruções de Manutenção Preventiva - ${equipment_name} (${manufacturer || 'ERSA'} ${model || ''})

## ⚠️ PROCEDIMENTOS DE SEGURANÇA ESPECÍFICOS PARA MÁQUINAS DE SOLDAGEM SELETIVA

ANTES DE INICIAR:
1. Desligar completamente a máquina e aguardar resfriamento dos bicos de solda (temperatura < 50°C)
2. Seguir procedimento de lockout/tagout elétrico e pneumático
3. Usar EPIs: óculos de proteção UV/IR, luvas térmicas, avental de proteção
4. Verificar que não há placas em processamento
5. Aguardar descarga completa de capacitores (mínimo 5 minutos após desligamento)

## 🔧 MANUTENÇÃO DOS BICOS DE SOLDAGEM

1. Limpeza diária dos bicos:
   - Remover resíduos de fluxo e estanho dos bicos usando escova de aço inox macia
   - Limpar com solvente apropriado (isopropanol ou limpa-bicos específico ERSA)
   - Verificar desgaste e trocar bicos danificados (vida útil típica: 50.000-100.000 ciclos)
   - Inspecionar orifícios dos bicos quanto a obstruções (diâmetro crítico)
   - Verificar alinhamento dos bicos

2. Verificação de temperatura:
   - Calibrar termopares e sensores de temperatura (verificar a cada 3 meses)
   - Verificar temperatura de trabalho (250-300°C para solda seletiva, conforme especificação)
   - Testar sistema de controle de temperatura (PID)
   - Verificar uniformidade de aquecimento entre bicos (variação máxima ±5°C)

## 💧 SISTEMA DE FLUXO

1. Verificação do sistema de aplicação de fluxo:
   - Verificar nível e qualidade do fluxo no reservatório (trocar a cada 2 semanas ou conforme uso)
   - Limpar bicos aplicadores de fluxo diariamente
   - Verificar pressão pneumática (normalmente 0,5-2 bar) e vazão
   - Inspecionar mangueiras e conexões do sistema de fluxo quanto a vazamentos
   - Verificar viscosidade do fluxo (conforme especificação do fabricante)

2. Manutenção do reservatório:
   - Trocar fluxo conforme especificação do fabricante (geralmente a cada 2-4 semanas)
   - Limpar reservatório mensalmente com solvente apropriado
   - Verificar filtros do sistema de fluxo (trocar mensalmente)

## 🌡️ SISTEMA DE AQUECIMENTO

1. Verificação dos elementos de aquecimento:
   - Inspecionar resistências de aquecimento quanto a desgaste ou queima
   - Verificar conexões elétricas dos elementos (torque recomendado: conforme manual)
   - Testar sistema de controle PID de temperatura (tempo de resposta < 30 segundos)
   - Verificar isolamento térmico e perdas de calor

2. Sistema de refrigeração:
   - Verificar funcionamento de ventiladores/coolers (limpar mensalmente)
   - Limpar filtros de ar (trocar a cada 3 meses)
   - Verificar sistema de resfriamento dos bicos (temperatura de resfriamento < 50°C)

## 🔌 SISTEMA ELÉTRICO E ELETRÔNICO

1. Verificações elétricas:
   - Inspecionar conexões elétricas e bornes (verificar a cada 6 meses)
   - Verificar cabos de alimentação dos bicos (substituir se danificados)
   - Testar sistema de controle e automação
   - Verificar sensores de posicionamento e calibração

2. Sistema pneumático:
   - Verificar pressão de ar comprimido (4-6 bar, conforme especificação)
   - Inspecionar mangueiras pneumáticas (substituir se rachadas ou desgastadas)
   - Verificar válvulas solenoides (testar funcionamento)
   - Limpar filtros de ar (trocar a cada 3 meses ou conforme indicador)

## 🧹 LIMPEZA GERAL

1. Limpeza da área de trabalho:
   - Remover resíduos de fluxo e estanho diariamente
   - Limpar guias e suportes de placas (verificar alinhamento)
   - Limpar sistema de exaustão de fumos (verificar eficiência mensalmente)
   - Verificar e limpar sistema de visão (se aplicável)

2. Limpeza de componentes críticos:
   - Limpar sensores ópticos com álcool isopropílico
   - Limpar área de aplicação de fluxo
   - Remover oxidação de componentes metálicos
   - Limpar sistema de transporte de placas

## ✅ TESTES FUNCIONAIS

1. Teste de temperatura:
   - Verificar tempo de aquecimento até temperatura de trabalho (< 2 minutos)
   - Testar estabilidade de temperatura (±2°C durante operação)
   - Verificar resposta do sistema de controle (overshoot < 5%)

2. Teste de aplicação:
   - Testar aplicação de fluxo (quantidade e uniformidade)
   - Verificar precisão de posicionamento dos bicos (±0,1mm)
   - Testar ciclo completo de soldagem
   - Verificar qualidade da solda (inspeção visual e/ou X-ray)

3. Teste de segurança:
   - Verificar funcionamento de sensores de segurança
   - Testar sistema de emergência (parada imediata)
   - Verificar intertravamentos e proteções

## 📝 OBSERVAÇÕES IMPORTANTES

- Consulte o manual técnico da ERSA VERSAFLOW para valores específicos de temperatura e pressão
${model ? `- Modelo específico: ${model}` : ''}
- Use apenas fluxos e produtos recomendados pelo fabricante ERSA
- Mantenha registro de todas as manutenções realizadas
- Em caso de dúvidas, consulte o suporte técnico da ERSA
- Frequência recomendada: manutenção diária (limpeza), semanal (inspeção), mensal (lubrificação e calibração)

## ⚠️ NOTA TÉCNICA

Estas instruções são baseadas em procedimentos padrão para máquinas de solda seletiva ERSA VERSAFLOW. 
Para procedimentos específicos do seu modelo ${model || equipment_name}, consulte o manual técnico oficial ERSA ou entre em contato com o suporte técnico da ERSA.`;
      } else if (isPickAndPlace) {
        instructions = `# Instruções de Manutenção Preventiva - ${equipment_name}

## ⚠️ PROCEDIMENTOS DE SEGURANÇA

ANTES DE INICIAR A MANUTENÇÃO:
1. Colocar a máquina em modo de manutenção
2. Desligar ar comprimido e energia elétrica seguindo procedimento de lockout/tagout
3. Aguardar descarga completa de capacitores
4. Usar EPIs: óculos de proteção, luvas antiestáticas, calçados de segurança
5. Verificar que não há placas em processamento

## 📋 PROCEDIMENTOS DE INSPEÇÃO

1. Sistema de vácuo: Verificar e limpar filtros, inspecionar mangueiras, verificar pressão
2. Heads de montagem: Inspecionar bicos, verificar alinhamento, testar pick-and-place
3. Sistema de visão: Limpar lentes, verificar iluminação, testar reconhecimento
4. Transportador: Verificar alinhamento, inspecionar guias, verificar sensores
5. Feeders: Inspecionar estado físico, verificar sistemas de avanço, limpar área de alimentação

## 🧹 LIMPEZA

- Limpar sistema de vácuo e filtros
- Limpar heads de montagem e bicos
- Limpar lentes das câmeras
- Limpar transportador e área de trabalho

## 🔧 LUBRIFICAÇÃO

- Lubrificar gantries conforme especificação
- Verificar e lubrificar componentes móveis

## ✅ TESTES

- Calibração do sistema de posicionamento
- Teste de funcionamento dos heads
- Verificação de precisão

## 📝 OBSERVAÇÕES

- Consulte o manual do fabricante ${manufacturer || 'SIPLACE'} para procedimentos específicos
${model ? `- Modelo: ${model}` : ''}`;
      } else if (isReflowOven) {
        instructions = `# Instruções de Manutenção Preventiva - ${equipment_name}

## ⚠️ PROCEDIMENTOS DE SEGURANÇA

ANTES DE INICIAR:
1. Desligar completamente o forno e aguardar resfriamento
2. Seguir procedimento de lockout/tagout
3. Usar EPIs: luvas térmicas, óculos de proteção
4. Verificar que não há placas no interior

## 📋 VERIFICAÇÕES

1. Sistema de aquecimento: Verificar elementos de aquecimento, sensores de temperatura
2. Sistema de transporte: Verificar esteiras, guias, velocidade
3. Sistema de resfriamento: Verificar ventiladores, trocadores de calor
4. Controle de atmosfera: Verificar sistema de nitrogênio (se aplicável)

## 🧹 LIMPEZA

- Limpar interior do forno
- Limpar esteiras de transporte
- Remover resíduos de fluxo
- Limpar filtros de ar

## ✅ TESTES

- Perfil de temperatura
- Velocidade de transporte
- Sistema de resfriamento

## 📝 OBSERVAÇÕES

- Consulte o manual do fabricante para perfis de temperatura específicos
${model ? `- Modelo: ${model}` : ''}`;
      } else if (isCompressor) {
        instructions = `# Instruções de Manutenção Preventiva - ${equipment_name}

## ⚠️ PROCEDIMENTOS DE SEGURANÇA

ANTES DE INICIAR:
1. Desligar compressor e seguir procedimento de lockout/tagout
2. Liberar pressão do sistema completamente
3. Usar EPIs: óculos de proteção, luvas, calçados de segurança
4. Verificar que não há operações dependentes do ar comprimido

## 📋 VERIFICAÇÕES

1. Sistema de compressão:
   - Verificar pressão de trabalho (normalmente 7-10 bar)
   - Verificar temperatura de operação (máximo 90°C)
   - Inspecionar elementos de compressão quanto a desgaste
   - Verificar vedações e juntas

2. Sistema de ar comprimido:
   - Drenar água do reservatório diariamente
   - Verificar e limpar filtros de ar de entrada (trocar a cada 3 meses)
   - Inspecionar mangueiras e conexões pneumáticas
   - Verificar nível de óleo do compressor (se aplicável)

3. Sistema de segurança:
   - Testar válvulas de segurança e alívio
   - Verificar pressostatos e termostatos
   - Testar sistema de desligamento automático

## 🧹 LIMPEZA

- Limpar filtros de ar
- Limpar reservatório de ar comprimido
- Remover condensado do sistema
- Limpar radiador e sistema de resfriamento

## 🔧 LUBRIFICAÇÃO

- Verificar nível de óleo (se aplicável)
- Trocar óleo conforme especificação do fabricante
- Lubrificar componentes móveis

## ✅ TESTES

- Teste de pressão
- Teste de temperatura
- Teste de válvulas de segurança

## 📝 OBSERVAÇÕES

- Consulte o manual do fabricante para valores específicos
${manufacturer ? `- Fabricante: ${manufacturer}` : ''}
${model ? `- Modelo: ${model}` : ''}`;
      } else if (isPump) {
        instructions = `# Instruções de Manutenção Preventiva - ${equipment_name}

## ⚠️ PROCEDIMENTOS DE SEGURANÇA

ANTES DE INICIAR:
1. Desligar bomba e isolar do sistema
2. Seguir procedimento de lockout/tagout
3. Liberar pressão do sistema
4. Usar EPIs adequados

## 📋 VERIFICAÇÕES

1. Sistema de bombeamento:
   - Verificar vedação e gaxetas
   - Inspecionar impelidor/rotor quanto a desgaste
   - Verificar conexões de entrada e saída
   - Testar funcionamento e vazão

2. Sistema de vedação:
   - Verificar gaxetas ou selos mecânicos
   - Inspecionar vazamentos
   - Verificar sistema de lubrificação da vedação

## 🧹 LIMPEZA

- Limpar impelidor e câmara de bombeamento
- Limpar filtros de entrada
- Remover depósitos e incrustações

## 🔧 LUBRIFICAÇÃO

- Lubrificar rolamentos conforme especificação
- Verificar nível de óleo (se aplicável)

## ✅ TESTES

- Teste de vazão
- Teste de pressão
- Teste de vedação

## 📝 OBSERVAÇÕES

- Consulte o manual do fabricante para valores específicos
${manufacturer ? `- Fabricante: ${manufacturer}` : ''}
${model ? `- Modelo: ${model}` : ''}`;
      } else if (isMotor) {
        instructions = `# Instruções de Manutenção Preventiva - ${equipment_name}

## ⚠️ PROCEDIMENTOS DE SEGURANÇA

ANTES DE INICIAR:
1. Desligar motor e seguir procedimento de lockout/tagout
2. Aguardar parada completa
3. Usar EPIs: óculos de proteção, luvas isolantes
4. Verificar descarga de capacitores (se aplicável)

## 📋 VERIFICAÇÕES

1. Sistema elétrico:
   - Verificar conexões elétricas e bornes
   - Inspecionar cabos e isolamento
   - Medir isolamento elétrico (mínimo 1 MΩ)
   - Verificar tensão de alimentação

2. Sistema mecânico:
   - Inspecionar rolamentos quanto a ruídos ou folgas
   - Verificar alinhamento e acoplamentos
   - Verificar vibração (máximo conforme especificação)

3. Sistema de resfriamento:
   - Verificar sistema de ventilação
   - Limpar aletas de resfriamento
   - Verificar temperatura de operação

## 🧹 LIMPEZA

- Limpar aletas de resfriamento
- Remover poeira e sujeira
- Limpar área ao redor do motor

## 🔧 LUBRIFICAÇÃO

- Lubrificar rolamentos conforme especificação
- Verificar nível de óleo (se aplicável)
- Trocar lubrificante conforme cronograma

## ✅ TESTES

- Teste de isolamento elétrico
- Teste de corrente de partida
- Teste de vibração
- Teste de temperatura

## 📝 OBSERVAÇÕES

- Consulte o manual do fabricante para valores específicos
${manufacturer ? `- Fabricante: ${manufacturer}` : ''}
${model ? `- Modelo: ${model}` : ''}`;
      } else {
        // Instruções genéricas profissionais
        instructions = `# Instruções de Manutenção Preventiva - ${equipment_name}

## ⚠️ PROCEDIMENTOS DE SEGURANÇA

ANTES DE INICIAR A MANUTENÇÃO:
1. Desligar o equipamento completamente e seguir procedimento de lockout/tagout
2. Aguardar descarga completa de energia (elétrica, pneumática, hidráulica)
3. Usar EPIs adequados: óculos de proteção, luvas apropriadas, calçados de segurança
4. Isolar a área de trabalho e sinalizar que manutenção está em andamento
5. Verificar que não há operações em andamento que possam interferir

## 📋 PROCEDIMENTOS DE INSPEÇÃO VISUAL

1. Inspecionar visualmente o equipamento quanto a:
   - Sinais de desgaste, corrosão ou danos físicos
   - Vazamentos de fluidos (óleo, ar comprimido, água)
   - Conexões soltas ou componentes mal fixados
   - Acúmulo de sujeira, poeira ou resíduos
   - Estado geral de conservação

2. Verificar componentes críticos:
   - Sistema elétrico: conexões, cabos, bornes
   - Sistema pneumático/hidráulico: mangueiras, conexões, válvulas
   - Componentes mecânicos: correias, engrenagens, rolamentos
   - Sensores e atuadores

## 🧹 LIMPEZA E CONSERVAÇÃO

1. Limpar superfícies externas do equipamento usando produtos adequados
2. Remover acúmulos de sujeira, poeira e resíduos de produção
3. Limpar áreas críticas como sensores, lentes, componentes ópticos
4. Verificar e limpar filtros de ar, óleo ou outros fluidos
5. Inspecionar e limpar sistemas de ventilação e resfriamento

## 🔧 LUBRIFICAÇÃO E AJUSTES

1. Verificar níveis de lubrificantes conforme especificação do fabricante
2. Aplicar lubrificantes nos pontos indicados no manual do equipamento
3. Verificar tensão e alinhamento de correias e componentes mecânicos
4. Ajustar parâmetros operacionais conforme necessário
5. Verificar folgas e tolerâncias de componentes móveis

## ✅ TESTES FUNCIONAIS

1. Realizar testes de funcionamento após a manutenção
2. Verificar resposta de sensores e atuadores
3. Testar ciclos operacionais básicos
4. Verificar indicadores e displays
5. Documentar quaisquer anomalias encontradas

## 📝 OBSERVAÇÕES IMPORTANTES

- Consulte sempre o manual do fabricante para procedimentos específicos
${manufacturer ? `- Fabricante: ${manufacturer}` : ''}
${model ? `- Modelo: ${model}` : ''}
- Registre todas as atividades realizadas e componentes verificados
- Se encontrar problemas que não possam ser resolvidos na manutenção preventiva, abra uma ordem de manutenção corretiva
- Mantenha o ambiente de trabalho organizado e limpo

## ⚠️ NOTA

Estas são instruções genéricas de manutenção preventiva. Para procedimentos específicos deste equipamento, consulte o manual do fabricante ou entre em contato com o suporte técnico.`;
      }
    }

    res.json({
      success: true,
      data: {
        instructions: instructions.trim(),
        search_query: searchQuery,
        equipment_name,
      },
    });
  } catch (error) {
    console.error('Erro ao gerar instruções com IA:', error);
    next(error);
  }
});

module.exports = router;
