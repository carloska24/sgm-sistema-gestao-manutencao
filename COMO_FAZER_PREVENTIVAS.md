# 📘 Como Fazer Manutenções Preventivas - Guia Completo

## 🎯 Entendendo o Conceito

O sistema de **manutenções preventivas** funciona assim:

```
1. Você CRIA um PLANO (dizendo: "lubrificar a bomba a cada 30 dias")
   ↓
2. O SISTEMA gera automaticamente ORDENS DE SERVIÇO (OS) baseadas no plano
   ↓
3. TÉCNICO executa a manutenção (faz a lubrificação)
   ↓
4. TÉCNICO marca a OS como CONCLUÍDA
   ↓
5. O SISTEMA gera automaticamente a PRÓXIMA OS (para daqui a 30 dias)
   ↓
6. O ciclo se REPETE automaticamente! 🔄
```

**Resumo**: Você cria um plano uma vez, e o sistema cuida de gerar todas as manutenções futuras automaticamente!

---

## 📋 Exemplo Prático Completo

### Cenário: Lubrificação Mensal da Bomba 001

---

## 🚀 PASSO A PASSO COMPLETO

### 📝 PASSO 1: Criar um Plano Preventivo

**O que é um Plano?**

- Um plano é um "modelo" que define:
  - Qual equipamento
  - Qual manutenção fazer
  - Com que frequência fazer
  - Instruções de como fazer

**Como criar:**

1. **Acesse a seção "Preventivas"** no menu lateral
2. Clique no botão **"+ Novo Plano"**
3. Preencha os campos:

   ```
   Nome do Plano: "Lubrificação Mensal Bomba 001"

   Equipamento: [Selecione] Bomba 001

   Frequência:
     Tipo: Dias
     Valor: 30
     (Significa: A cada 30 dias)

   Data de Início: 01/01/2024

   Instruções:
     - Verificar nível de óleo
     - Completar óleo se necessário
     - Trocar filtro de óleo
     - Verificar vazamentos

   Duração Estimada: 60 minutos

   Técnico Responsável: [Opcional] João Silva
   ```

4. Clique em **"Criar Plano"**

**O que acontece automaticamente:**

- ✅ O sistema cria a **primeira Ordem de Serviço (OS)** para a data de início (01/01/2024)
- ✅ O plano fica **ativo** e começa a gerar OS automaticamente

---

### 📅 PASSO 2: Verificar as OS Geradas

**O que é uma OS (Ordem de Serviço)?**

- Uma OS é uma manutenção específica que precisa ser executada
- É gerada automaticamente pelo plano
- Cada OS tem uma data agendada

**Como ver as OS:**

**Opção A - Pelo Plano:**

1. Vá em **"Preventivas"** (Planos Preventivos)
2. Clique no botão **"Ver"** no plano que você criou
3. Vá para a aba **"Ordens de Serviço"**
4. Você verá:
   ```
   OS #1 - Agendada para: 01/01/2024
   Status: Pendente
   ```

**Opção B - Pelo Calendário:**

1. Vá em **"Calendário"** no menu lateral
2. Veja no calendário a OS marcada para o dia 01/01/2024
3. Clique na OS para ver detalhes

---

### 🔧 PASSO 3: Executar a Manutenção

**Quando chegar o dia (01/01/2024):**

1. **Técnico vai até o equipamento** (Bomba 001)
2. **Abre a OS** (pelo calendário ou pelo plano)
3. **Lê as instruções** definidas no plano:
   - Verificar nível de óleo
   - Completar óleo se necessário
   - Trocar filtro de óleo
   - Verificar vazamentos
4. **Executa todas as tarefas** listadas nas instruções
5. **Anota qualquer observação** importante (opcional)

---

### ✅ PASSO 4: Marcar a OS como Concluída

**⚠️ IMPORTANTE**: Esta funcionalidade está sendo implementada na interface. Por enquanto:

**Forma atual:**

1. Abra o plano preventivo
2. Vá para a aba **"Ordens de Serviço"**
3. Identifique a OS que foi executada
4. **Nota**: A funcionalidade de botão "Concluir OS" será adicionada em breve

**O que acontece quando você marca como concluída:**

- ✅ Status muda para **"Concluída"**
- ✅ Data de conclusão é registrada
- ✅ Equipamento tem sua **última preventiva** atualizada
- ✅ Sistema **calcula automaticamente** a próxima data (01/01/2024 + 30 dias = 31/01/2024)
- ✅ Sistema **gera automaticamente** a próxima OS (OS #2 para 31/01/2024)

---

### 🔄 PASSO 5: Verificar Próxima OS Gerada

**Após marcar como concluída:**

1. Volte para a aba **"Ordens de Serviço"** do plano
2. Você verá:

   ```
   OS #1 - Concluída em: 01/01/2024 ✅

   OS #2 - Agendada para: 31/01/2024
   Status: Pendente
   ```

3. **O ciclo continua automaticamente!**
   - Em 31/01/2024, a OS #2 será executada
   - Após concluir, a OS #3 será gerada para 01/03/2024
   - E assim por diante...

---

## 🎯 Exemplo Visual Completo

### Janeiro 2024 - Primeira Execução

```
📅 01/01/2024
   └─ OS #1: Lubrificação Mensal Bomba 001
      Status: Pendente
      └─ Técnico executa
      └─ Marca como concluída ✅
```

### Resultado Automático

```
✅ OS #1: Concluída (01/01/2024)
   ↓
📅 31/01/2024 (30 dias depois)
   └─ OS #2: Lubrificação Mensal Bomba 001
      Status: Pendente (gerada automaticamente!)
```

### Fevereiro 2024 - Segunda Execução

```
📅 31/01/2024
   └─ OS #2: Lubrificação Mensal Bomba 001
      Status: Pendente
      └─ Técnico executa
      └─ Marca como concluída ✅
```

### Resultado Automático

```
✅ OS #2: Concluída (31/01/2024)
   ↓
📅 01/03/2024 (30 dias depois)
   └─ OS #3: Lubrificação Mensal Bomba 001
      Status: Pendente (gerada automaticamente!)
```

**E assim continua infinitamente! 🔄**

---

## 🎓 Conceitos Importantes

### 1. **Plano vs OS (Ordem de Serviço)**

| Plano                                | OS (Ordem de Serviço)                     |
| ------------------------------------ | ----------------------------------------- |
| Define a **regra**                   | É a **execução** específica               |
| Criado **uma vez**                   | Gerada **automaticamente** várias vezes   |
| Exemplo: "Lubrificar a cada 30 dias" | Exemplo: "Lubrificação do dia 01/01/2024" |

**Analogia:**

- **Plano** = Receita de bolo (define como fazer)
- **OS** = Bolo específico assado (execução real)

### 2. **Frequências Disponíveis**

Você pode definir frequências como:

- **Dias**: A cada X dias (ex: 30 dias)
- **Semanas**: A cada X semanas (ex: 2 semanas)
- **Meses**: A cada X meses (ex: 3 meses)
- **Horas**: A cada X horas de operação
- **Ciclos**: A cada X ciclos de produção

### 3. **Status das OS**

- **Pendente**: Aguardando execução
- **Em Execução**: Técnico iniciou a manutenção
- **Concluída**: Manutenção finalizada
- **Cancelada**: OS cancelada (não será executada)

---

## 📊 Fluxo Completo Visual

```
┌─────────────────────────────────────────────────────────┐
│ 1. CRIAR PLANO PREVENTIVO                               │
│    - Nome: "Lubrificação Mensal"                        │
│    - Equipamento: Bomba 001                             │
│    - Frequência: A cada 30 dias                         │
│    - Data Início: 01/01/2024                            │
│    - Instruções: "Verificar óleo, trocar filtro..."     │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│ 2. SISTEMA GERA AUTOMATICAMENTE                         │
│    ✅ OS #1 para 01/01/2024 (Status: Pendente)          │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│ 3. DIA 01/01/2024 - TÉCNICO EXECUTA                     │
│    - Vai até a Bomba 001                                │
│    - Segue as instruções                                │
│    - Executa a manutenção                               │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│ 4. TÉCNICO MARCA COMO CONCLUÍDA                         │
│    ✅ OS #1 → Status: Concluída                         │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│ 5. SISTEMA CALCULA PRÓXIMA DATA                         │
│    01/01/2024 + 30 dias = 31/01/2024                    │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│ 6. SISTEMA GERA AUTOMATICAMENTE                         │
│    ✅ OS #2 para 31/01/2024 (Status: Pendente)          │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
            [CICLO SE REPETE]
```

---

## 🎯 Exemplos Práticos de Planos

### Exemplo 1: Lubrificação Mensal

```
Nome: "Lubrificação Mensal Bomba Centrífuga"
Equipamento: Bomba 001
Frequência: A cada 30 dias
Instruções:
  - Verificar nível de óleo
  - Completar se necessário
  - Verificar vazamentos
```

### Exemplo 2: Troca de Filtros Trimestral

```
Nome: "Troca de Filtros Trimestral"
Equipamento: Compressor 002
Frequência: A cada 3 meses
Instruções:
  - Trocar filtro de ar
  - Trocar filtro de óleo
  - Verificar pressão
```

### Exemplo 3: Inspeção Semanal

```
Nome: "Inspeção Semanal Gerador"
Equipamento: Gerador 003
Frequência: A cada 7 dias
Instruções:
  - Verificar nível de combustível
  - Testar partida
  - Verificar bateria
```

---

## ❓ Perguntas Frequentes

### Q: Preciso criar uma OS manualmente toda vez?

**R:** Não! Você cria o plano uma vez, e o sistema gera todas as OS automaticamente.

### Q: E se eu não executar no dia exato?

**R:** Não tem problema! A OS continua como "Pendente" até você executar. Quando marcar como concluída, o sistema calcula a próxima data baseada na data de conclusão (não na data agendada).

### Q: Posso ter mais de um plano para o mesmo equipamento?

**R:** Sim! Por exemplo:

- Plano 1: Lubrificação mensal
- Plano 2: Troca de filtros trimestral
- Plano 3: Inspeção semanal

Todos podem rodar simultaneamente no mesmo equipamento.

### Q: Como vejo quais preventivas estão atrasadas?

**R:**

- No **Dashboard**: Veja o card "Preventivas Atrasadas"
- No **Calendário**: OS com data passada e status "Pendente" estão atrasadas
- No **Plano**: Veja a aba "Ordens de Serviço" e identifique OS pendentes com data passada

### Q: O que acontece se eu desativar um plano?

**R:**

- O plano para de gerar novas OS
- OS já geradas continuam existindo
- Você pode reativar depois e o plano volta a funcionar

### Q: Posso editar um plano depois de criado?

**R:** Sim! Mas atenção:

- Mudanças na frequência só afetam OS futuras
- OS já geradas não são modificadas
- Instruções podem ser atualizadas a qualquer momento

---

## 🎯 Resumo Rápido

1. **Crie um Plano** → Define a regra (frequência, instruções)
2. **Sistema gera OS** → Automaticamente para cada data
3. **Técnico executa** → No dia agendado, faz a manutenção
4. **Marca como concluída** → OS finalizada
5. **Sistema gera próxima** → Automaticamente calcula e cria a próxima OS
6. **Ciclo se repete** → Infinitamente, sem intervenção manual! 🔄

---

## 💡 Dica Final

**O segredo é:**

- Você configura **UMA VEZ** (criar o plano)
- O sistema faz o resto **AUTOMATICAMENTE** (gerar OS, calcular datas, etc.)
- Você só precisa **EXECUTAR** e **MARCAR COMO CONCLUÍDA**

É como programar um despertador: você configura uma vez, e ele toca todos os dias na hora certa! ⏰

---

**Precisa de ajuda?** Consulte o `MANUAL_DO_USUARIO.md` para mais detalhes sobre cada funcionalidade.
