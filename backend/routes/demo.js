const express = require('express');
const router = express.Router();
const { query, run, get } = require('../database');
const { authenticate, authorize } = require('../middleware/auth');

// Dados demo realistas de equipamentos
const demoEquipment = [
  {
    name: 'Compressor de Ar Parafuso',
    code: 'COMP-001',
    description: 'Compressor de ar comprimido tipo parafuso, 100 HP, capacidade de 500 m³/h',
    model: 'Sullair 100HP',
    manufacturer: 'Sullair',
    serial_number: 'SLR-2020-001234',
    acquisition_date: '2020-03-15',
    acquisition_cost: 125000.00,
    location: 'Linha 01 - Produção',
    status: 'active',
    criticality: 'high',
    power: '100 HP',
    capacity: '500 m³/h',
    voltage: '380V',
    fuel_type: 'Elétrico',
    dimensions: '2.5m x 1.8m x 2.0m',
  },
  {
    name: 'Bomba Centrífuga Multiestágio',
    code: 'BOMB-002',
    description: 'Bomba centrífuga multiestágio para água de processo, pressão de 80 bar',
    model: 'KSB Multitec 80',
    manufacturer: 'KSB',
    serial_number: 'KSB-2019-045678',
    acquisition_date: '2019-11-20',
    acquisition_cost: 85000.00,
    location: 'Estação de Tratamento',
    status: 'active',
    criticality: 'high',
    power: '75 HP',
    capacity: '200 m³/h',
    voltage: '380V',
    fuel_type: 'Elétrico',
    dimensions: '1.2m x 0.8m x 1.5m',
  },
  {
    name: 'Torno CNC',
    code: 'TORN-003',
    description: 'Torno CNC de 3 eixos, mesa de 1500mm, capacidade de 500kg',
    model: 'Mazak QT-250',
    manufacturer: 'Mazak',
    serial_number: 'MZK-2021-078901',
    acquisition_date: '2021-06-10',
    acquisition_cost: 350000.00,
    location: 'Usinagem - Setor A',
    status: 'active',
    criticality: 'high',
    power: '30 kW',
    capacity: '500kg',
    voltage: '380V',
    fuel_type: 'Elétrico',
    dimensions: '3.5m x 2.5m x 2.2m',
  },
  {
    name: 'Forno Elétrico Industrial',
    code: 'FORN-004',
    description: 'Forno elétrico de tratamento térmico, temperatura máxima 1200°C',
    model: 'Thermcraft 1200',
    manufacturer: 'Thermcraft',
    serial_number: 'THC-2020-023456',
    acquisition_date: '2020-08-05',
    acquisition_cost: 180000.00,
    location: 'Tratamento Térmico',
    status: 'active',
    criticality: 'medium',
    power: '150 kW',
    capacity: '2 toneladas',
    voltage: '380V',
    fuel_type: 'Elétrico',
    dimensions: '4.0m x 3.0m x 3.5m',
  },
  {
    name: 'Gerador Diesel',
    code: 'GEN-005',
    description: 'Gerador diesel de emergência, 500 kVA, sistema de partida automática',
    model: 'Cummins QSK19',
    manufacturer: 'Cummins',
    serial_number: 'CUM-2018-034567',
    acquisition_date: '2018-12-18',
    acquisition_cost: 220000.00,
    location: 'Subestação - Externa',
    status: 'active',
    criticality: 'high',
    power: '500 kVA',
    capacity: '500 kVA',
    voltage: '380V/220V',
    fuel_type: 'Diesel',
    dimensions: '5.0m x 2.0m x 2.5m',
  },
  {
    name: 'Chiller de Água Glicolada',
    code: 'CHIL-006',
    description: 'Chiller de água glicolada para refrigeração de processos, capacidade de 200 TR',
    model: 'Carrier 30XA',
    manufacturer: 'Carrier',
    serial_number: 'CAR-2019-056789',
    acquisition_date: '2019-04-22',
    acquisition_cost: 165000.00,
    location: 'Sala de Máquinas',
    status: 'active',
    criticality: 'medium',
    power: '150 HP',
    capacity: '200 TR',
    voltage: '380V',
    fuel_type: 'Elétrico',
    dimensions: '3.0m x 2.0m x 2.5m',
  },
  {
    name: 'Caldeira a Vapor',
    code: 'CALD-007',
    description: 'Caldeira a vapor aquatubular, capacidade de 5000 kg/h, pressão 10 bar',
    model: 'Cleaver-Brooks CB-5000',
    manufacturer: 'Cleaver-Brooks',
    serial_number: 'CLB-2020-067890',
    acquisition_date: '2020-01-30',
    acquisition_cost: 280000.00,
    location: 'Caldeiraria',
    status: 'active',
    criticality: 'high',
    power: '200 HP',
    capacity: '5000 kg/h',
    voltage: '380V',
    fuel_type: 'Gás Natural',
    dimensions: '4.5m x 3.0m x 4.0m',
  },
  {
    name: 'Extrusora de Plástico',
    code: 'EXTR-008',
    description: 'Extrusora de plástico mono parafuso, diâmetro 90mm, produção de 200 kg/h',
    model: 'Battenfeld BA 90',
    manufacturer: 'Battenfeld',
    serial_number: 'BAT-2021-089012',
    acquisition_date: '2021-09-15',
    acquisition_cost: 195000.00,
    location: 'Linha 02 - Extrusão',
    status: 'active',
    criticality: 'medium',
    power: '55 kW',
    capacity: '200 kg/h',
    voltage: '380V',
    fuel_type: 'Elétrico',
    dimensions: '8.0m x 1.5m x 2.0m',
  },
  {
    name: 'Empilhadeira Elétrica',
    code: 'EMP-009',
    description: 'Empilhadeira elétrica, capacidade de 3 toneladas, altura de elevação 6m',
    model: 'Toyota 8FBE30',
    manufacturer: 'Toyota',
    serial_number: 'TOY-2022-012345',
    acquisition_date: '2022-02-28',
    acquisition_cost: 95000.00,
    location: 'Almoxarifado',
    status: 'active',
    criticality: 'low',
    power: '48V',
    capacity: '3 toneladas',
    voltage: '48V',
    fuel_type: 'Bateria',
    dimensions: '2.5m x 1.2m x 2.2m',
  },
  {
    name: 'Triturador de Resíduos',
    code: 'TRIT-010',
    description: 'Triturador de resíduos sólidos, capacidade de 500 kg/h, sistema de peneiramento',
    model: 'Weima WL 15',
    manufacturer: 'Weima',
    serial_number: 'WMA-2020-078901',
    acquisition_date: '2020-07-10',
    acquisition_cost: 145000.00,
    location: 'Tratamento de Resíduos',
    status: 'active',
    criticality: 'low',
    power: '30 HP',
    capacity: '500 kg/h',
    voltage: '380V',
    fuel_type: 'Elétrico',
    dimensions: '2.8m x 1.8m x 2.5m',
  },
];

// Criar equipamentos demo
router.post('/create-equipment', authenticate, authorize('admin', 'manager'), async (req, res, next) => {
  try {
    const userId = req.user.id;
    const createdEquipment = [];

    // Criar equipamentos
    for (const eq of demoEquipment) {
      try {
        // Verificar se o equipamento já existe (por código)
        const existing = await get('SELECT id, is_demo FROM equipment WHERE code = ?', [eq.code]);
        
        if (existing) {
          // Se existe e é demo, atualizar. Se não é demo, pular (não sobrescrever dados reais)
          if (existing.is_demo === 1) {
            // Atualizar equipamento demo existente
            await run(
              `UPDATE equipment SET
                name = ?, description = ?, model = ?, manufacturer = ?, serial_number = ?,
                acquisition_date = ?, acquisition_cost = ?, location = ?, status = ?, criticality = ?,
                power = ?, capacity = ?, voltage = ?, fuel_type = ?, dimensions = ?, is_demo = 1
               WHERE id = ?`,
              [
                eq.name,
                eq.description,
                eq.model,
                eq.manufacturer,
                eq.serial_number,
                eq.acquisition_date,
                eq.acquisition_cost,
                eq.location,
                eq.status,
                eq.criticality,
                eq.power,
                eq.capacity,
                eq.voltage,
                eq.fuel_type,
                eq.dimensions,
                existing.id,
              ]
            );
            createdEquipment.push({
              id: existing.id,
              code: eq.code,
              name: eq.name,
              action: 'updated',
            });
            console.log(`✅ Equipamento ${eq.code} atualizado (já existia como demo)`);
          } else {
            // Equipamento existe mas não é demo - pular para não sobrescrever dados reais
            console.log(`⚠️  Equipamento ${eq.code} já existe (não é demo) - pulando`);
            continue;
          }
        } else {
          // Equipamento não existe - criar novo
          const result = await run(
            `INSERT INTO equipment 
            (name, code, description, model, manufacturer, serial_number, 
             acquisition_date, acquisition_cost, location, status, criticality,
             power, capacity, voltage, fuel_type, dimensions, is_demo)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
            [
              eq.name,
              eq.code,
              eq.description,
              eq.model,
              eq.manufacturer,
              eq.serial_number,
              eq.acquisition_date,
              eq.acquisition_cost,
              eq.location,
              eq.status,
              eq.criticality,
              eq.power,
              eq.capacity,
              eq.voltage,
              eq.fuel_type,
              eq.dimensions,
            ]
          );

          createdEquipment.push({
            id: result.lastID,
            code: eq.code,
            name: eq.name,
            action: 'created',
          });
          console.log(`✅ Equipamento ${eq.code} criado`);
        }
      } catch (insertError) {
        console.error(`❌ Erro ao processar equipamento ${eq.code}:`, insertError);
        // Continuar com os próximos equipamentos em vez de quebrar
      }
    }

    // Criar chamados de manutenção corretiva demo - distribuídos nos últimos 30 dias para preencher gráficos
    const demoCalls = [
      // Chamados concluídos (para MTTR e gráficos)
      {
        equipment_id: createdEquipment[0].id, // Compressor
        problem_type: 'Vazamento',
        description: 'Vazamento de óleo no sistema de refrigeração',
        priority: 'high',
        status: 'completed',
        occurrence_date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        completed_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        execution_time: 240,
      },
      {
        equipment_id: createdEquipment[1].id, // Bomba
        problem_type: 'Vibração excessiva',
        description: 'Vibração excessiva detectada durante operação normal',
        priority: 'medium',
        status: 'completed',
        occurrence_date: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
        completed_at: new Date(Date.now() - 24 * 24 * 60 * 60 * 1000).toISOString(),
        execution_time: 180,
      },
      {
        equipment_id: createdEquipment[4].id, // Gerador
        problem_type: 'Manutenção preventiva',
        description: 'Troca de óleo e filtros conforme programação',
        priority: 'medium',
        status: 'completed',
        occurrence_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        completed_at: new Date(Date.now() - 29 * 24 * 60 * 60 * 1000).toISOString(),
        execution_time: 180,
      },
      {
        equipment_id: createdEquipment[2].id, // Torno CNC
        problem_type: 'Ajuste de precisão',
        description: 'Calibração de eixos realizada com sucesso',
        priority: 'low',
        status: 'completed',
        occurrence_date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
        completed_at: new Date(Date.now() - 19 * 24 * 60 * 60 * 1000).toISOString(),
        execution_time: 120,
      },
      {
        equipment_id: createdEquipment[3].id, // Forno
        problem_type: 'Troca de resistência',
        description: 'Resistência elétrica substituída',
        priority: 'high',
        status: 'completed',
        occurrence_date: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(),
        completed_at: new Date(Date.now() - 17 * 24 * 60 * 60 * 1000).toISOString(),
        execution_time: 300,
      },
      {
        equipment_id: createdEquipment[5].id, // Chiller
        problem_type: 'Limpeza de trocador',
        description: 'Limpeza completa do trocador de calor',
        priority: 'medium',
        status: 'completed',
        occurrence_date: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
        completed_at: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000).toISOString(),
        execution_time: 210,
      },
      // Chamados em execução
      {
        equipment_id: createdEquipment[1].id, // Bomba
        problem_type: 'Vibração excessiva',
        description: 'Vibração excessiva detectada durante operação normal',
        priority: 'medium',
        status: 'execution',
        occurrence_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        equipment_id: createdEquipment[6].id, // Caldeira
        problem_type: 'Pressão irregular',
        description: 'Variações de pressão detectadas no sistema',
        priority: 'high',
        status: 'execution',
        occurrence_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      },
      // Chamados atribuídos
      {
        equipment_id: createdEquipment[2].id, // Torno CNC
        problem_type: 'Falha elétrica',
        description: 'Falha no sistema de controle, máquina parou durante operação',
        priority: 'urgent',
        status: 'assigned',
        occurrence_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        equipment_id: createdEquipment[7].id, // Extrusora
        problem_type: 'Desgaste de matriz',
        description: 'Matriz apresentando desgaste excessivo',
        priority: 'medium',
        status: 'assigned',
        occurrence_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      },
      // Chamados abertos
      {
        equipment_id: createdEquipment[5].id, // Chiller
        problem_type: 'Temperatura elevada',
        description: 'Temperatura de saída acima do normal, necessidade de verificação',
        priority: 'high',
        status: 'open',
        occurrence_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        equipment_id: createdEquipment[8].id, // Empilhadeira
        problem_type: 'Bateria descarregada',
        description: 'Bateria não está mantendo carga adequada',
        priority: 'medium',
        status: 'open',
        occurrence_date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        equipment_id: createdEquipment[9].id, // Triturador
        problem_type: 'Ruptura de lâmina',
        description: 'Lâmina de corte apresentou ruptura',
        priority: 'urgent',
        status: 'analysis',
        occurrence_date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ];

    // Buscar usuário admin para atribuir aos chamados
    const adminUser = await get('SELECT id FROM users WHERE role = ? LIMIT 1', ['admin']);
    const assignedUserId = adminUser?.id || userId;
    
    const createdCalls = [];
    for (const call of demoCalls) {
      // Garantir que completed_at seja sempre depois de occurrence_date
      let completedAt = call.completed_at;
      if (completedAt && call.occurrence_date) {
        const occurrenceDate = new Date(call.occurrence_date);
        const completedDate = new Date(completedAt);
        // Se completed_at for antes de occurrence_date, ajustar para pelo menos 1 hora depois
        if (completedDate <= occurrenceDate) {
          completedAt = new Date(occurrenceDate.getTime() + 60 * 60 * 1000).toISOString();
        }
      }
      
      // Garantir execution_time positivo e realista
      let executionTime = call.execution_time;
      if (executionTime && executionTime <= 0) {
        // Se negativo ou zero, usar um valor padrão baseado na prioridade
        const baseTime = call.priority === 'urgent' ? 60 : call.priority === 'high' ? 120 : 180;
        executionTime = baseTime + Math.floor(Math.random() * 60); // Variação de 0-60 minutos
      }
      
      // Se o chamado já vem atribuído, definir assigned_at
      const isAssigned = call.status === 'completed' || call.status === 'execution';
      let assignedAt = null;
      if (isAssigned && assignedUserId) {
        // Se tem occurrence_date, usar ela ou um pouco depois. Senão, usar data atual
        if (call.occurrence_date) {
          const occurrenceDate = new Date(call.occurrence_date);
          // assigned_at deve ser igual ou pouco depois de occurrence_date
          assignedAt = new Date(occurrenceDate.getTime() + 30 * 60 * 1000).toISOString(); // 30 min depois
        } else {
          assignedAt = new Date().toISOString();
        }
      }
      
      const callResult = await run(
        `INSERT INTO maintenance_calls 
        (equipment_id, type, problem_type, description, occurrence_date, priority, status, 
         completed_at, execution_time, assigned_to, assigned_at, created_by, is_demo)
        VALUES (?, 'corrective', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
        [
          call.equipment_id,
          call.problem_type,
          call.description,
          call.occurrence_date,
          call.priority,
          call.status || 'open',
          completedAt || null,
          executionTime || null,
          isAssigned ? assignedUserId : null,
          assignedAt,
          userId,
        ]
      );

      // Criar histórico do chamado
      await run(
        `INSERT INTO call_history (call_id, action, performed_by, notes)
         VALUES (?, 'created', ?, ?)`,
        [callResult.lastID, userId, 'Chamado demo criado']
      );

      if (call.status === 'completed') {
        await run(
          `INSERT INTO call_history (call_id, action, performed_by, notes)
           VALUES (?, 'completed', ?, ?)`,
          [callResult.lastID, userId, 'Chamado demo concluído']
        );
      }

      createdCalls.push(callResult.lastID);
    }

    // Criar alguns planos preventivos demo
    const demoPlans = [
      {
        equipment_id: createdEquipment[0].id, // Compressor
        name: 'Manutenção Preventiva Mensal - Compressor',
        frequency_type: 'months',
        frequency_value: 1,
        start_date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        instructions: 'Verificar pressão, temperatura, trocar filtros de ar, inspecionar correias',
        estimated_duration: 120,
        is_active: 1,
      },
      {
        equipment_id: createdEquipment[2].id, // Torno CNC
        name: 'Manutenção Preventiva Trimestral - Torno CNC',
        frequency_type: 'months',
        frequency_value: 3,
        start_date: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        instructions: 'Calibração de eixos, limpeza de guias, verificação de lubrificação',
        estimated_duration: 240,
        is_active: 1,
      },
      {
        equipment_id: createdEquipment[4].id, // Gerador
        name: 'Manutenção Preventiva Semestral - Gerador',
        frequency_type: 'months',
        frequency_value: 6,
        start_date: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        instructions: 'Troca de óleo, filtros de ar e combustível, teste de carga, verificação de baterias',
        estimated_duration: 360,
        is_active: 1,
      },
      {
        equipment_id: createdEquipment[6].id, // Caldeira
        name: 'Manutenção Preventiva Anual - Caldeira',
        frequency_type: 'months',
        frequency_value: 12,
        start_date: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        instructions: 'Inspeção interna, limpeza de tubos, calibração de instrumentos, teste de pressão',
        estimated_duration: 480,
        is_active: 1,
      },
    ];

    const createdPlans = [];
    for (const plan of demoPlans) {
      const planResult = await run(
        `INSERT INTO preventive_plans 
        (name, equipment_id, frequency_type, frequency_value, start_date, 
         instructions, estimated_duration, is_active, created_by, is_demo)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
        [
          plan.name,
          plan.equipment_id,
          plan.frequency_type,
          plan.frequency_value,
          plan.start_date,
          plan.instructions,
          plan.estimated_duration,
          plan.is_active,
          userId,
        ]
      );

      // Buscar usuário admin para atribuir às manutenções
      const adminUser = await get('SELECT id FROM users WHERE role = ? LIMIT 1', ['admin']);
      const assignedUserId = adminUser?.id || userId;
      
      // Gerar OS do plano: algumas no passado (concluídas/atrasadas), algumas no futuro (pendentes)
      const today = new Date();
      const scheduledDates = [];
      
      // Criar OS no passado (para preencher cards de conformidade e atrasadas)
      const pastDates = [];
      if (plan.frequency_type === 'months') {
        // Criar 3 OS no passado (algumas concluídas, algumas atrasadas)
        for (let i = 1; i <= 3; i++) {
          const pastDate = new Date(today);
          pastDate.setMonth(today.getMonth() - (i * plan.frequency_value));
          pastDate.setDate(15); // Dia 15 de cada mês anterior
          pastDates.push(pastDate.toISOString().split('T')[0]);
        }
      } else {
        // Para outros tipos: criar 2 OS no passado
        for (let i = 1; i <= 2; i++) {
          const pastDate = new Date(today);
          pastDate.setMonth(today.getMonth() - (i * plan.frequency_value));
          pastDate.setDate(10);
          pastDates.push(pastDate.toISOString().split('T')[0]);
        }
      }
      scheduledDates.push(...pastDates);
      
      // Criar OS no futuro (pendentes)
      if (plan.frequency_type === 'months') {
        // Para planos mensais: criar OS no mês atual e nos próximos 2 meses
        const daysInMonth = [5, 12, 20, 28];
        for (let i = 0; i < 3; i++) {
          const scheduledDate = new Date(today);
          scheduledDate.setMonth(today.getMonth() + i * plan.frequency_value);
          if (i === 0) {
            if (today.getDate() > 25) {
              scheduledDate.setMonth(today.getMonth() + 1);
              scheduledDate.setDate(daysInMonth[0]);
            } else {
              const futureDate = today.getDate() + 3;
              scheduledDate.setDate(Math.min(futureDate, 28));
            }
          } else {
            scheduledDate.setDate(daysInMonth[i] || 15);
          }
          scheduledDates.push(scheduledDate.toISOString().split('T')[0]);
        }
      } else if (plan.frequency_type === 'weeks') {
        // Para planos semanais: criar OS nas próximas 4 semanas
        for (let i = 1; i <= 4; i++) {
          const scheduledDate = new Date(today);
          scheduledDate.setDate(today.getDate() + (i * plan.frequency_value * 7));
          scheduledDates.push(scheduledDate.toISOString().split('T')[0]);
        }
      } else {
        // Para outros tipos: criar OS no mês atual e futuro
        if (today.getDate() < 20) {
          const scheduledDate1 = new Date(today);
          scheduledDate1.setDate(today.getDate() + 5);
          scheduledDates.push(scheduledDate1.toISOString().split('T')[0]);
        }
        const scheduledDate2 = new Date(today);
        scheduledDate2.setMonth(today.getMonth() + plan.frequency_value);
        scheduledDate2.setDate(15);
        scheduledDates.push(scheduledDate2.toISOString().split('T')[0]);
      }

      // Criar as OS com diferentes status para preencher todos os cards
      let orderIndex = 0;
      for (const scheduledDate of scheduledDates) {
        const scheduledDateObj = new Date(scheduledDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        scheduledDateObj.setHours(0, 0, 0, 0);
        
        // Determinar status baseado na data
        let status = 'pending';
        let completedDate = null;
        let startedAt = null;
        
        // Calcular execution_time baseado na duração estimada do plano
        const estimatedDuration = plan.estimated_duration || 120; // minutos padrão
        let executionTime = null;
        
        // Se a data já passou, algumas serão concluídas, outras atrasadas
        if (scheduledDateObj < today) {
          if (orderIndex % 2 === 0) {
            // 50% concluídas no prazo (para calcular conformidade)
            status = 'completed';
            // Concluída no prazo (na data agendada ou até 2 dias antes)
            completedDate = new Date(scheduledDateObj);
            const daysBefore = Math.floor(Math.random() * 3); // 0 a 2 dias antes
            completedDate.setDate(completedDate.getDate() - daysBefore);
            completedDate.setHours(14, 0, 0, 0); // Concluída às 14h
            
            // Iniciada 1 dia antes da conclusão ou na data agendada
            startedAt = new Date(completedDate);
            startedAt.setDate(startedAt.getDate() - (Math.random() > 0.5 ? 1 : 0));
            startedAt.setHours(8, 0, 0, 0); // Iniciada às 8h
            
            // Calcular execution_time: duração estimada com variação de ±20%
            const variation = 1 + (Math.random() * 0.4 - 0.2); // 0.8 a 1.2
            executionTime = Math.round(estimatedDuration * variation);
          } else {
            // 50% atrasadas (pending com data passada)
            status = 'pending';
          }
        } else if (orderIndex === 0 && scheduledDateObj <= new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)) {
          // Uma OS próxima será em progresso
          status = 'in_progress';
          startedAt = new Date();
          startedAt.setHours(8, 0, 0, 0);
          // Não tem execution_time ainda pois está em andamento
        }
        
        await run(
          `INSERT INTO maintenance_orders 
          (plan_id, equipment_id, type, description, instructions, scheduled_date, status,
           completed_date, started_at, execution_time, assigned_to, created_by, is_demo)
          VALUES (?, ?, 'preventive', ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
          [
            planResult.lastID,
            plan.equipment_id,
            `Preventiva: ${plan.name}`,
            plan.instructions,
            scheduledDate,
            status,
            completedDate ? completedDate.toISOString() : null,
            startedAt ? startedAt.toISOString() : null,
            executionTime,
            status === 'completed' || status === 'in_progress' ? assignedUserId : null,
            userId,
          ]
        );
        orderIndex++;
      }

      createdPlans.push(planResult.lastID);
    }

    // Contar total de OS criadas
    const totalOrders = await query(
      'SELECT COUNT(*) as count FROM maintenance_orders WHERE is_demo = 1'
    );

    // ========== CRIAR INVENTÁRIO COMPLETO ==========
    console.log('📦 [DEMO] Criando inventário completo...');
    
    // 1. Criar Locações de Inventário
    const demoLocations = [
      {
        name: 'Almoxarifado Principal',
        description: 'Almoxarifado central da fábrica',
        address: 'Prédio A - Térreo, Sala 101',
        is_active: true,
      },
      {
        name: 'Almoxarifado de Produção',
        description: 'Almoxarifado próximo à linha de produção',
        address: 'Linha 01 - Setor de Suprimentos',
        is_active: true,
      },
      {
        name: 'Estoque de Peças Críticas',
        description: 'Estoque reservado para peças críticas de alta prioridade',
        address: 'Prédio B - Sala 205',
        is_active: true,
      },
      {
        name: 'Almoxarifado de Usinagem',
        description: 'Almoxarifado específico para peças de usinagem',
        address: 'Setor de Usinagem - Armário 3',
        is_active: true,
      },
    ];

    const createdLocations = [];
    for (const loc of demoLocations) {
      const existingLoc = await get('SELECT id FROM inventory_locations WHERE name = ?', [loc.name]);
      if (existingLoc) {
        createdLocations.push({ id: existingLoc.id, name: loc.name });
      } else {
        const locResult = await run(
          `INSERT INTO inventory_locations (name, description, address, is_active, created_by)
           VALUES (?, ?, ?, ?, ?)`,
          [loc.name, loc.description, loc.address, loc.is_active ? 1 : 0, userId]
        );
        createdLocations.push({ id: locResult.lastID, name: loc.name });
      }
    }

    // 2. Criar Itens de Inventário Realistas
    const demoInventoryItems = [
      // Peças para Compressor
      {
        code: 'ROL-6205',
        name: 'Rolamento Axial 6205',
        description: 'Rolamento de esferas axial SKF 6205, para compressor de ar',
        category: 'Rolamentos',
        unit: 'un',
        min_quantity: 5,
        max_quantity: 20,
        current_quantity: 8,
        unit_cost: 45.50,
        supplier: 'SKF Brasil',
        location_id: createdLocations[0].id,
        is_active: true,
      },
      {
        code: 'FILT-AR-001',
        name: 'Filtro de Ar Compressor',
        description: 'Filtro de ar para compressor Sullair 100HP, elemento filtrante',
        category: 'Filtros',
        unit: 'un',
        min_quantity: 3,
        max_quantity: 12,
        current_quantity: 2, // Estoque baixo
        unit_cost: 125.00,
        supplier: 'Sullair',
        location_id: createdLocations[0].id,
        is_active: true,
      },
      {
        code: 'OLEO-ISO46',
        name: 'Óleo ISO 46 - Compressor',
        description: 'Óleo lubrificante ISO VG 46 para compressores de ar',
        category: 'Lubrificantes',
        unit: 'L',
        min_quantity: 50,
        max_quantity: 200,
        current_quantity: 35, // Estoque baixo
        unit_cost: 28.90,
        supplier: 'Shell',
        location_id: createdLocations[0].id,
        is_active: true,
      },
      // Peças para Bomba
      {
        code: 'SELO-MEC-80',
        name: 'Selo Mecânico 80mm',
        description: 'Selo mecânico para bomba centrífuga, diâmetro 80mm',
        category: 'Vedação',
        unit: 'un',
        min_quantity: 2,
        max_quantity: 8,
        current_quantity: 1, // Estoque baixo
        unit_cost: 320.00,
        supplier: 'John Crane',
        location_id: createdLocations[1].id,
        is_active: true,
      },
      {
        code: 'IMPULSOR-KSB',
        name: 'Impulsor Bomba KSB',
        description: 'Impulsor para bomba KSB Multitec 80, aço inox',
        category: 'Componentes',
        unit: 'un',
        min_quantity: 1,
        max_quantity: 3,
        current_quantity: 2,
        unit_cost: 1850.00,
        supplier: 'KSB',
        location_id: createdLocations[1].id,
        is_active: true,
      },
      // Peças para Torno CNC
      {
        code: 'FUSO-BOLA-25',
        name: 'Fuso de Esferas 25mm',
        description: 'Fuso de esferas recirculantes 25mm, para eixo Z do torno CNC',
        category: 'Componentes CNC',
        unit: 'un',
        min_quantity: 1,
        max_quantity: 4,
        current_quantity: 2,
        unit_cost: 1250.00,
        supplier: 'THK',
        location_id: createdLocations[3].id,
        is_active: true,
      },
      {
        code: 'PASTILHA-CNC',
        name: 'Pastilha de Corte CNC',
        description: 'Pastilha de corte para torno CNC, geometria CNMG 120408',
        category: 'Ferramentas',
        unit: 'un',
        min_quantity: 20,
        max_quantity: 100,
        current_quantity: 45,
        unit_cost: 18.50,
        supplier: 'Sandvik',
        location_id: createdLocations[3].id,
        is_active: true,
      },
      // Peças para Forno
      {
        code: 'RESIST-12KW',
        name: 'Resistência Elétrica 12kW',
        description: 'Resistência elétrica para forno industrial, 12kW, 380V',
        category: 'Componentes Elétricos',
        unit: 'un',
        min_quantity: 2,
        max_quantity: 8,
        current_quantity: 3,
        unit_cost: 450.00,
        supplier: 'Thermcraft',
        location_id: createdLocations[0].id,
        is_active: true,
      },
      // Peças para Gerador
      {
        code: 'FILT-OLEO-CUM',
        name: 'Filtro de Óleo Cummins',
        description: 'Filtro de óleo para gerador Cummins QSK19',
        category: 'Filtros',
        unit: 'un',
        min_quantity: 4,
        max_quantity: 12,
        current_quantity: 6,
        unit_cost: 85.00,
        supplier: 'Cummins',
        location_id: createdLocations[2].id,
        is_active: true,
      },
      {
        code: 'BATERIA-12V-200AH',
        name: 'Bateria 12V 200Ah',
        description: 'Bateria chumbo-ácido 12V 200Ah para sistema de partida do gerador',
        category: 'Componentes Elétricos',
        unit: 'un',
        min_quantity: 2,
        max_quantity: 6,
        current_quantity: 4,
        unit_cost: 680.00,
        supplier: 'Trojan',
        location_id: createdLocations[2].id,
        is_active: true,
      },
      // Peças para Chiller
      {
        code: 'REFRIG-R134A',
        name: 'Refrigerante R134A',
        description: 'Gás refrigerante R134A, cilindro 13.6kg',
        category: 'Refrigerantes',
        unit: 'kg',
        min_quantity: 50,
        max_quantity: 200,
        current_quantity: 75,
        unit_cost: 45.00,
        supplier: 'DuPont',
        location_id: createdLocations[0].id,
        is_active: true,
      },
      // Peças para Caldeira
      {
        code: 'VALV-SEGURANCA-10BAR',
        name: 'Válvula de Segurança 10 bar',
        description: 'Válvula de segurança para caldeira, pressão de abertura 10 bar',
        category: 'Válvulas',
        unit: 'un',
        min_quantity: 1,
        max_quantity: 4,
        current_quantity: 2,
        unit_cost: 1250.00,
        supplier: 'Leser',
        location_id: createdLocations[2].id,
        is_active: true,
      },
      {
        code: 'BOMBA-CIRCULACAO',
        name: 'Bomba de Circulação Caldeira',
        description: 'Bomba de circulação de água para caldeira, 5HP',
        category: 'Bombas',
        unit: 'un',
        min_quantity: 1,
        max_quantity: 3,
        current_quantity: 1,
        unit_cost: 3200.00,
        supplier: 'Grundfos',
        location_id: createdLocations[1].id,
        is_active: true,
      },
      // Peças para Extrusora
      {
        code: 'PARAFUSO-EXTRUSORA-90',
        name: 'Parafuso Extrusora 90mm',
        description: 'Parafuso de extrusão 90mm, aço tratado, para Battenfeld BA 90',
        category: 'Componentes',
        unit: 'un',
        min_quantity: 1,
        max_quantity: 2,
        current_quantity: 1,
        unit_cost: 8500.00,
        supplier: 'Battenfeld',
        location_id: createdLocations[1].id,
        is_active: true,
      },
      {
        code: 'MATRIZ-EXTRUSORA',
        name: 'Matriz de Extrusão',
        description: 'Matriz de extrusão para produção de perfis, aço temperado',
        category: 'Ferramentas',
        unit: 'un',
        min_quantity: 2,
        max_quantity: 6,
        current_quantity: 4,
        unit_cost: 4500.00,
        supplier: 'Battenfeld',
        location_id: createdLocations[1].id,
        is_active: true,
      },
      // Peças para Empilhadeira
      {
        code: 'BATERIA-48V-600AH',
        name: 'Bateria 48V 600Ah',
        description: 'Bateria tracionária 48V 600Ah para empilhadeira elétrica',
        category: 'Baterias',
        unit: 'un',
        min_quantity: 1,
        max_quantity: 3,
        current_quantity: 2,
        unit_cost: 4500.00,
        supplier: 'Trojan',
        location_id: createdLocations[0].id,
        is_active: true,
      },
      // Peças para Triturador
      {
        code: 'LAMINA-TRITURADOR',
        name: 'Lâmina Triturador',
        description: 'Lâmina de corte para triturador Weima WL 15, aço especial',
        category: 'Ferramentas',
        unit: 'un',
        min_quantity: 2,
        max_quantity: 8,
        current_quantity: 5,
        unit_cost: 850.00,
        supplier: 'Weima',
        location_id: createdLocations[0].id,
        is_active: true,
      },
      // Peças genéricas
      {
        code: 'CORREIA-V-A25',
        name: 'Correia em V A25',
        description: 'Correia em V perfil A, comprimento 25 polegadas',
        category: 'Transmissão',
        unit: 'un',
        min_quantity: 10,
        max_quantity: 50,
        current_quantity: 25,
        unit_cost: 35.00,
        supplier: 'Gates',
        location_id: createdLocations[0].id,
        is_active: true,
      },
      {
        code: 'GRAPA-CORREIA',
        name: 'Grapa para Correia',
        description: 'Grapa de emenda para correia em V',
        category: 'Transmissão',
        unit: 'un',
        min_quantity: 20,
        max_quantity: 100,
        current_quantity: 45,
        unit_cost: 8.50,
        supplier: 'Gates',
        location_id: createdLocations[0].id,
        is_active: true,
      },
      {
        code: 'JUNTA-FLANGE-DN80',
        name: 'Junta de Flange DN80',
        description: 'Junta de flange 80mm, material grafite',
        category: 'Vedação',
        unit: 'un',
        min_quantity: 10,
        max_quantity: 50,
        current_quantity: 18,
        unit_cost: 25.00,
        supplier: 'Garlock',
        location_id: createdLocations[0].id,
        is_active: true,
      },
      {
        code: 'PARAFUSO-M10-50',
        name: 'Parafuso M10x50',
        description: 'Parafuso hexagonais M10x50mm, classe 8.8',
        category: 'Fixadores',
        unit: 'un',
        min_quantity: 100,
        max_quantity: 500,
        current_quantity: 250,
        unit_cost: 1.20,
        supplier: 'DIN',
        location_id: createdLocations[0].id,
        is_active: true,
      },
    ];

    const createdInventoryItems = [];
    for (const item of demoInventoryItems) {
      const existingItem = await get('SELECT id FROM inventory_items WHERE code = ?', [item.code]);
      if (existingItem) {
        // Atualizar item existente
        await run(
          `UPDATE inventory_items SET
            name = ?, description = ?, category = ?, unit = ?,
            min_quantity = ?, max_quantity = ?, current_quantity = ?,
            unit_cost = ?, supplier = ?, location_id = ?, is_active = ?
           WHERE id = ?`,
          [
            item.name, item.description, item.category, item.unit,
            item.min_quantity, item.max_quantity, item.current_quantity,
            item.unit_cost, item.supplier, item.location_id, item.is_active ? 1 : 0,
            existingItem.id,
          ]
        );
        createdInventoryItems.push({ id: existingItem.id, code: item.code, name: item.name });
      } else {
        const itemResult = await run(
          `INSERT INTO inventory_items 
          (code, name, description, category, unit, min_quantity, max_quantity, 
           current_quantity, unit_cost, supplier, location_id, is_active, created_by)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            item.code, item.name, item.description, item.category, item.unit,
            item.min_quantity, item.max_quantity, item.current_quantity,
            item.unit_cost, item.supplier, item.location_id, item.is_active ? 1 : 0, userId,
          ]
        );
        createdInventoryItems.push({ id: itemResult.lastID, code: item.code, name: item.name });
      }
    }

    // 3. Criar Movimentações de Inventário (Histórico Realista)
    const today = new Date();
    const movements = [];

    // Movimentações de ENTRADA (compras recebidas)
    const entryMovements = [
      {
        item_id: createdInventoryItems.find(i => i.code === 'ROL-6205')?.id,
        movement_type: 'entry',
        quantity: 15,
        unit_cost: 45.50,
        reference_type: 'purchase',
        reference_id: 1001,
        location_id: createdLocations[0].id,
        notes: 'Recebimento de compra - Pedido #1001',
        created_at: new Date(today.getTime() - 45 * 24 * 60 * 60 * 1000),
      },
      {
        item_id: createdInventoryItems.find(i => i.code === 'FILT-AR-001')?.id,
        movement_type: 'entry',
        quantity: 8,
        unit_cost: 125.00,
        reference_type: 'purchase',
        reference_id: 1002,
        location_id: createdLocations[0].id,
        notes: 'Recebimento de compra - Pedido #1002',
        created_at: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000),
      },
      {
        item_id: createdInventoryItems.find(i => i.code === 'OLEO-ISO46')?.id,
        movement_type: 'entry',
        quantity: 100,
        unit_cost: 28.90,
        reference_type: 'purchase',
        reference_id: 1003,
        location_id: createdLocations[0].id,
        notes: 'Recebimento de compra - Pedido #1003',
        created_at: new Date(today.getTime() - 20 * 24 * 60 * 60 * 1000),
      },
      {
        item_id: createdInventoryItems.find(i => i.code === 'SELO-MEC-80')?.id,
        movement_type: 'entry',
        quantity: 4,
        unit_cost: 320.00,
        reference_type: 'purchase',
        reference_id: 1004,
        location_id: createdLocations[1].id,
        notes: 'Recebimento de compra - Pedido #1004',
        created_at: new Date(today.getTime() - 15 * 24 * 60 * 60 * 1000),
      },
    ];

    // Movimentações de SAÍDA (uso em OS e Chamados)
    // Vincular saídas às OS e chamados criados anteriormente
    const completedOrders = await query(
      `SELECT id FROM maintenance_orders WHERE is_demo = 1 AND status = 'completed' LIMIT 3`
    );
    const completedCalls = await query(
      `SELECT id FROM maintenance_calls WHERE is_demo = 1 AND status = 'completed' LIMIT 3`
    );

    const exitMovements = [];
    
    // Saídas vinculadas a OS concluídas
    if (completedOrders.length > 0) {
      exitMovements.push({
        item_id: createdInventoryItems.find(i => i.code === 'FILT-AR-001')?.id,
        movement_type: 'exit',
        quantity: 2,
        unit_cost: 125.00,
        reference_type: 'maintenance_order',
        reference_id: completedOrders[0].id,
        location_id: createdLocations[0].id,
        notes: 'Saída para OS preventiva - Compressor',
        created_at: new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000),
      });
      exitMovements.push({
        item_id: createdInventoryItems.find(i => i.code === 'OLEO-ISO46')?.id,
        movement_type: 'exit',
        quantity: 20,
        unit_cost: 28.90,
        reference_type: 'maintenance_order',
        reference_id: completedOrders[0].id,
        location_id: createdLocations[0].id,
        notes: 'Saída para OS preventiva - Troca de óleo',
        created_at: new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000),
      });
    }

    if (completedOrders.length > 1) {
      exitMovements.push({
        item_id: createdInventoryItems.find(i => i.code === 'PASTILHA-CNC')?.id,
        movement_type: 'exit',
        quantity: 5,
        unit_cost: 18.50,
        reference_type: 'maintenance_order',
        reference_id: completedOrders[1].id,
        location_id: createdLocations[3].id,
        notes: 'Saída para OS preventiva - Torno CNC',
        created_at: new Date(today.getTime() - 8 * 24 * 60 * 60 * 1000),
      });
    }

    // Saídas vinculadas a Chamados concluídos
    if (completedCalls.length > 0) {
      exitMovements.push({
        item_id: createdInventoryItems.find(i => i.code === 'ROL-6205')?.id,
        movement_type: 'exit',
        quantity: 1,
        unit_cost: 45.50,
        reference_type: 'maintenance_call',
        reference_id: completedCalls[0].id,
        location_id: createdLocations[0].id,
        notes: 'Saída para chamado corretivo - Compressor',
        created_at: new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000),
      });
      exitMovements.push({
        item_id: createdInventoryItems.find(i => i.code === 'RESIST-12KW')?.id,
        movement_type: 'exit',
        quantity: 1,
        unit_cost: 450.00,
        reference_type: 'maintenance_call',
        reference_id: completedCalls[1]?.id || completedCalls[0].id,
        location_id: createdLocations[0].id,
        notes: 'Saída para chamado corretivo - Troca de resistência',
        created_at: new Date(today.getTime() - 17 * 24 * 60 * 60 * 1000),
      });
    }

    // Movimentações de AJUSTE (contagens físicas)
    const adjustmentMovements = [
      {
        item_id: createdInventoryItems.find(i => i.code === 'CORREIA-V-A25')?.id,
        movement_type: 'adjustment',
        quantity: 23, // Ajuste de 25 para 23 (2 unidades perdidas/danificadas)
        unit_cost: 35.00,
        reference_type: 'adjustment',
        location_id: createdLocations[0].id,
        notes: 'Ajuste após contagem física - 2 unidades danificadas identificadas',
        created_at: new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000),
      },
      {
        item_id: createdInventoryItems.find(i => i.code === 'PARAFUSO-M10-50')?.id,
        movement_type: 'adjustment',
        quantity: 248, // Ajuste de 250 para 248
        unit_cost: 1.20,
        reference_type: 'adjustment',
        location_id: createdLocations[0].id,
        notes: 'Ajuste após contagem física - Diferença de 2 unidades',
        created_at: new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000),
      },
    ];

    // Inserir todas as movimentações
    const allMovements = [...entryMovements, ...exitMovements, ...adjustmentMovements];
    for (const movement of allMovements) {
      if (!movement.item_id) continue; // Pular se item não foi encontrado
      
      await run(
        `INSERT INTO inventory_movements 
        (item_id, movement_type, quantity, unit_cost, reference_type, reference_id, 
         location_id, notes, created_by, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          movement.item_id,
          movement.movement_type,
          movement.quantity,
          movement.unit_cost,
          movement.reference_type || null,
          movement.reference_id || null,
          movement.location_id || null,
          movement.notes || null,
          userId,
          movement.created_at.toISOString(),
        ]
      );

      // Atualizar quantidade do item baseado no tipo de movimentação
      const item = await get('SELECT current_quantity FROM inventory_items WHERE id = ?', [movement.item_id]);
      if (item) {
        let newQuantity = item.current_quantity;
        if (movement.movement_type === 'entry') {
          newQuantity += movement.quantity;
        } else if (movement.movement_type === 'exit') {
          newQuantity = Math.max(0, newQuantity - movement.quantity);
        } else if (movement.movement_type === 'adjustment') {
          newQuantity = movement.quantity;
        }
        
        await run(
          'UPDATE inventory_items SET current_quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          [newQuantity, movement.item_id]
        );
      }
    }

    console.log(`✅ [DEMO] Inventário criado: ${createdLocations.length} locações, ${createdInventoryItems.length} itens, ${allMovements.length} movimentações`);

    // ========== CRIAR CHECKLISTS ASSOCIADOS AOS EQUIPAMENTOS ==========
    console.log('📋 [DEMO] Criando checklists associados aos equipamentos...');
    
    const createdChecklists = [];
    
    // Criar checklists específicos para alguns equipamentos e um genérico
    const demoChecklists = [
      // Checklist específico para Compressor de Ar
      {
        name: 'Checklist Preventivo - Compressor de Ar',
        description: 'Checklist completo para manutenção preventiva do compressor de ar parafuso',
        entity_type: 'equipment',
        entity_id: createdEquipment[0]?.id, // Compressor
        items: [
          { title: 'Verificar pressão de operação', instructions: 'Verificar se a pressão está entre 7-8 bar', input_type: 'boolean', required: true, requires_photo: false, requires_signature: false },
          { title: 'Verificar temperatura do óleo', instructions: 'Temperatura deve estar entre 70-90°C', input_type: 'number', required: true, requires_photo: false, requires_signature: false },
          { title: 'Inspecionar vazamentos', instructions: 'Verificar vazamentos de ar e óleo em todas as conexões', input_type: 'boolean', required: true, requires_photo: true, requires_signature: false },
          { title: 'Verificar filtros de ar', instructions: 'Inspecionar e limpar filtros de ar de entrada', input_type: 'boolean', required: true, requires_photo: false, requires_signature: false },
          { title: 'Verificar nível de óleo', instructions: 'Nível deve estar entre mínimo e máximo', input_type: 'boolean', required: true, requires_photo: false, requires_signature: false },
        ],
      },
      // Checklist específico para Bomba Centrífuga
      {
        name: 'Checklist Preventivo - Bomba Centrífuga',
        description: 'Checklist para manutenção preventiva de bomba centrífuga multiestágio',
        entity_type: 'equipment',
        entity_id: createdEquipment[1]?.id, // Bomba
        items: [
          { title: 'Verificar pressão de descarga', instructions: 'Pressão deve estar conforme especificação (80 bar)', input_type: 'number', required: true, requires_photo: false, requires_signature: false },
          { title: 'Verificar vibração', instructions: 'Vibração não deve exceder 4.5 mm/s', input_type: 'number', required: true, requires_photo: false, requires_signature: false },
          { title: 'Inspecionar vazamentos', instructions: 'Verificar vazamentos no selo mecânico e conexões', input_type: 'boolean', required: true, requires_photo: true, requires_signature: false },
          { title: 'Verificar temperatura dos rolamentos', instructions: 'Temperatura não deve exceder 70°C', input_type: 'number', required: true, requires_photo: false, requires_signature: false },
          { title: 'Verificar alinhamento', instructions: 'Verificar alinhamento entre motor e bomba', input_type: 'boolean', required: true, requires_photo: false, requires_signature: false },
        ],
      },
      // Checklist específico para Chiller
      {
        name: 'Checklist Preventivo - Chiller de Água Glicolada',
        description: 'Checklist para manutenção preventiva do chiller',
        entity_type: 'equipment',
        entity_id: createdEquipment[5]?.id, // Chiller
        items: [
          { title: 'Verificar temperatura de saída', instructions: 'Temperatura deve estar entre 5-7°C', input_type: 'number', required: true, requires_photo: false, requires_signature: false },
          { title: 'Verificar pressão do refrigerante', instructions: 'Pressão deve estar conforme especificação do fabricante', input_type: 'number', required: true, requires_photo: false, requires_signature: false },
          { title: 'Inspecionar trocador de calor', instructions: 'Verificar limpeza e integridade do trocador', input_type: 'boolean', required: true, requires_photo: true, requires_signature: false },
          { title: 'Verificar nível de glicol', instructions: 'Nível e concentração do glicol devem estar corretos', input_type: 'boolean', required: true, requires_photo: false, requires_signature: false },
          { title: 'Verificar filtros', instructions: 'Inspecionar e limpar filtros do sistema', input_type: 'boolean', required: true, requires_photo: false, requires_signature: false },
        ],
      },
      // Checklist genérico para todos os equipamentos
      {
        name: 'Checklist Preventivo Genérico',
        description: 'Checklist padrão para manutenção preventiva de equipamentos industriais',
        entity_type: 'equipment',
        entity_id: null, // Genérico - aplica a todos
        items: [
          { title: 'Verificar condições gerais', instructions: 'Inspecionar condições físicas e operacionais do equipamento', input_type: 'boolean', required: true, requires_photo: false, requires_signature: false },
          { title: 'Verificar conexões elétricas', instructions: 'Verificar estado das conexões e terminais', input_type: 'boolean', required: true, requires_photo: false, requires_signature: false },
          { title: 'Verificar lubrificação', instructions: 'Verificar nível e qualidade dos lubrificantes', input_type: 'boolean', required: true, requires_photo: false, requires_signature: false },
          { title: 'Limpeza geral', instructions: 'Realizar limpeza externa e interna conforme necessário', input_type: 'boolean', required: true, requires_photo: true, requires_signature: false },
          { title: 'Teste de funcionamento', instructions: 'Realizar teste de funcionamento após manutenção', input_type: 'boolean', required: true, requires_photo: false, requires_signature: true },
        ],
      },
      // Checklist para chamados corretivos
      {
        name: 'Checklist Corretivo - Análise de Falha',
        description: 'Checklist padrão para análise e correção de falhas em equipamentos',
        entity_type: 'maintenance_call',
        entity_id: null, // Genérico para chamados
        items: [
          { title: 'Identificar causa raiz', instructions: 'Documentar a causa raiz da falha identificada', input_type: 'text', required: true, requires_photo: false, requires_signature: false },
          { title: 'Verificar componentes afetados', instructions: 'Listar todos os componentes que foram afetados', input_type: 'text', required: true, requires_photo: true, requires_signature: false },
          { title: 'Ações corretivas realizadas', instructions: 'Descrever todas as ações corretivas realizadas', input_type: 'text', required: true, requires_photo: true, requires_signature: false },
          { title: 'Peças substituídas', instructions: 'Listar todas as peças que foram substituídas', input_type: 'text', required: true, requires_photo: false, requires_signature: false },
          { title: 'Teste pós-reparo', instructions: 'Realizar teste completo após reparo', input_type: 'boolean', required: true, requires_photo: false, requires_signature: true },
        ],
      },
    ];

    for (const checklistData of demoChecklists) {
      // Pular se o equipamento não foi criado
      if (checklistData.entity_id && !createdEquipment.find(eq => eq.id === checklistData.entity_id)) {
        console.log(`⚠️  [DEMO] Pulando checklist ${checklistData.name} - equipamento não encontrado`);
        continue;
      }

      try {
        // Criar template do checklist
        const templateResult = await run(
          `INSERT INTO checklist_templates 
          (name, description, entity_type, entity_id, is_active, created_by)
          VALUES (?, ?, ?, ?, 1, ?)`,
          [
            checklistData.name,
            checklistData.description,
            checklistData.entity_type,
            checklistData.entity_id || null,
            userId,
          ]
        );

        const templateId = templateResult.lastID;

        // Criar itens do checklist
        for (let i = 0; i < checklistData.items.length; i++) {
          const item = checklistData.items[i];
          await run(
            `INSERT INTO checklist_template_items
            (template_id, order_index, title, instructions, input_type, required, requires_photo, requires_signature)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              templateId,
              i,
              item.title,
              item.instructions || null,
              item.input_type || 'boolean',
              item.required ? 1 : 0,
              item.requires_photo ? 1 : 0,
              item.requires_signature ? 1 : 0,
            ]
          );
        }

        createdChecklists.push({
          id: templateId,
          name: checklistData.name,
          entity_type: checklistData.entity_type,
        });

        console.log(`✅ [DEMO] Checklist "${checklistData.name}" criado (ID: ${templateId})`);
      } catch (checklistError) {
        console.error(`❌ [DEMO] Erro ao criar checklist ${checklistData.name}:`, checklistError);
        // Continuar com os próximos checklists
      }
    }

    console.log(`✅ [DEMO] ${createdChecklists.length} checklists criados`);

    res.json({
      success: true,
      message: `Dados demo criados com sucesso: ${createdEquipment.length} equipamentos, ${createdCalls.length} chamados, ${createdPlans.length} planos preventivos, ${totalOrders[0]?.count || 0} ordens de serviço, ${createdLocations.length} locações de inventário, ${createdInventoryItems.length} itens de inventário, ${allMovements.length} movimentações e ${createdChecklists.length} checklists`,
      data: {
        equipment: createdEquipment.length,
        calls: createdCalls.length,
        plans: createdPlans.length,
        orders: totalOrders[0]?.count || 0,
        inventory_locations: createdLocations.length,
        inventory_items: createdInventoryItems.length,
        inventory_movements: allMovements.length,
        checklists: createdChecklists.length,
        equipmentIds: createdEquipment.map(e => e.id),
      },
    });
  } catch (error) {
    console.error('Erro ao criar dados demo:', error);
    next(error);
  }
});

// Limpar todos os dados demo
router.delete('/clear', authenticate, authorize('admin', 'manager'), async (req, res, next) => {
  try {
    console.log('🗑️ [DEBUG] Iniciando limpeza de dados demo...');
    
    // Deletar em ordem correta (respeitando foreign keys)
    // 1. Históricos e atividades relacionadas
    await run('DELETE FROM call_history WHERE call_id IN (SELECT id FROM maintenance_calls WHERE is_demo = 1)');
    await run('DELETE FROM call_activities WHERE call_id IN (SELECT id FROM maintenance_calls WHERE is_demo = 1)');
    
    // 2. Chamados
    await run('DELETE FROM maintenance_calls WHERE is_demo = 1');
    
    // 3. Histórico de manutenções
    await run('DELETE FROM maintenance_history WHERE order_id IN (SELECT id FROM maintenance_orders WHERE is_demo = 1)');
    
    // 4. Ordens de manutenção (remover todas as OS demo, incluindo as relacionadas a planos demo)
    await run('DELETE FROM maintenance_orders WHERE is_demo = 1');
    await run('DELETE FROM maintenance_orders WHERE plan_id IN (SELECT id FROM preventive_plans WHERE is_demo = 1)');
    await run('DELETE FROM maintenance_orders WHERE plan_id IN (SELECT id FROM preventive_plans WHERE equipment_id IN (SELECT id FROM equipment WHERE is_demo = 1))');
    
    // 5. Documentos de equipamentos
    await run('DELETE FROM equipment_documents WHERE equipment_id IN (SELECT id FROM equipment WHERE is_demo = 1)');
    
    // 6. Planos preventivos (por is_demo diretamente E por equipment_id)
    await run('DELETE FROM preventive_plans WHERE is_demo = 1');
    await run('DELETE FROM preventive_plans WHERE equipment_id IN (SELECT id FROM equipment WHERE is_demo = 1)');
    
    // 7. Equipamentos (por último)
    await run('DELETE FROM equipment WHERE is_demo = 1');

    console.log('✅ [DEBUG] Limpeza de dados demo concluída');
    
    res.json({
      success: true,
      message: 'Todos os dados demo foram removidos com sucesso',
      data: { deleted: true },
    });
  } catch (error) {
    console.error('❌ [DEBUG] Erro ao limpar dados demo:', error);
    next(error);
  }
});

// Limpar dados demo ao fazer logout
router.post('/clear-on-logout', authenticate, async (req, res, next) => {
  try {
    console.log('🗑️ [DEBUG] Iniciando limpeza de dados demo no logout...');
    
    // Limpar todos os dados demo (independente de quem criou)
    // 1. Históricos e atividades de chamados
    await run('DELETE FROM call_history WHERE call_id IN (SELECT id FROM maintenance_calls WHERE is_demo = 1)');
    await run('DELETE FROM call_activities WHERE call_id IN (SELECT id FROM maintenance_calls WHERE is_demo = 1)');
    await run('DELETE FROM maintenance_calls WHERE is_demo = 1');
    
    // 2. Histórico de manutenções
    await run('DELETE FROM maintenance_history WHERE order_id IN (SELECT id FROM maintenance_orders WHERE is_demo = 1)');
    
    // 3. Ordens de manutenção (incluindo órfãs - sem plano, mas com equipamento demo)
    // Primeiro deletar OS marcadas como demo
    await run('DELETE FROM maintenance_orders WHERE is_demo = 1');
    // Depois deletar OS órfãs (sem plano) que pertencem a equipamentos demo
    await run('DELETE FROM maintenance_orders WHERE plan_id IS NULL AND equipment_id IN (SELECT id FROM equipment WHERE is_demo = 1)');
    // E OS de planos demo (mesmo que o plano tenha sido deletado antes)
    await run('DELETE FROM maintenance_orders WHERE plan_id IN (SELECT id FROM preventive_plans WHERE is_demo = 1)');
    // E OS de equipamentos demo (garantir que todas sejam removidas)
    await run('DELETE FROM maintenance_orders WHERE equipment_id IN (SELECT id FROM equipment WHERE is_demo = 1)');
    
    // 4. Movimentações de inventário demo
    await run('DELETE FROM inventory_movements WHERE created_by IN (SELECT id FROM users WHERE role IN ("admin", "manager")) AND item_id IN (SELECT id FROM inventory_items WHERE code LIKE "%-%")');
    
    // 5. Itens de inventário demo
    await run(`DELETE FROM inventory_items WHERE code IN (
      'ROL-6205', 'FILT-AR-001', 'OLEO-ISO46', 'SELO-MEC-80', 'IMPULSOR-KSB',
      'FUSO-BOLA-25', 'PASTILHA-CNC', 'RESIST-12KW', 'FILT-OLEO-CUM',
      'BATERIA-12V-200AH', 'REFRIG-R134A', 'VALV-SEGURANCA-10BAR',
      'BOMBA-CIRCULACAO', 'PARAFUSO-EXTRUSORA-90', 'MATRIZ-EXTRUSORA',
      'BATERIA-48V-600AH', 'LAMINA-TRITURADOR', 'CORREIA-V-A25',
      'GRAPA-CORREIA', 'JUNTA-FLANGE-DN80', 'PARAFUSO-M10-50'
    )`);
    
    // 6. Locações de inventário demo
    await run(`DELETE FROM inventory_locations WHERE name IN (
      'Almoxarifado Principal', 'Almoxarifado de Produção',
      'Estoque de Peças Críticas', 'Almoxarifado de Usinagem'
    )`);
    
    // 7. Documentos de equipamentos
    await run('DELETE FROM equipment_documents WHERE equipment_id IN (SELECT id FROM equipment WHERE is_demo = 1)');
    
    // 8. Planos preventivos
    await run('DELETE FROM preventive_plans WHERE is_demo = 1');
    await run('DELETE FROM preventive_plans WHERE equipment_id IN (SELECT id FROM equipment WHERE is_demo = 1)');
    
    // 9. Equipamentos (por último)
    await run('DELETE FROM equipment WHERE is_demo = 1');

    console.log('✅ [DEBUG] Limpeza de dados demo no logout concluída');
    
    res.json({
      success: true,
      message: 'Dados demo removidos',
    });
  } catch (error) {
    console.error('❌ [DEBUG] Erro ao limpar dados demo no logout:', error);
    next(error);
  }
});

module.exports = router;

