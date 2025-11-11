# 🔄 Como Mudar a Associação de um Checklist Existente

## 📋 Passo a Passo Visual

### **PASSO 1: Selecionar o Checklist**

1. Acesse **"Checklists Inteligentes"** no menu lateral
2. No painel esquerdo **"Templates Disponíveis"**, encontre o checklist que deseja modificar
3. **Clique no card do checklist** - ele ficará destacado em verde

```
┌─────────────────────────────────────────┐
│ 📋 Templates Disponíveis                │
├─────────────────────────────────────────┤
│                                         │
│  ┌───────────────────────────────────┐ │ ← Clique aqui!
│  │ 📦 Checklist Preventivo -         │ │
│  │    Compressor de Ar                │ │
│  │                                    │ │
│  │    Tipo: equipment                │ │
│  │    Itens: 5                        │ │
│  └───────────────────────────────────┘ │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │ 📅 Checklist Preventivo -          │ │
│  │    Bomba Centrífuga                │ │
│  └───────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### **PASSO 2: O Formulário Aparece Automaticamente**

Ao clicar no checklist, o formulário de edição aparece no painel direito:

```
┌─────────────────────────────────────────┐
│ ✏️ Editar Template                      │
├─────────────────────────────────────────┤
│                                         │
│  Nome do Checklist:                    │
│  [Checklist Preventivo - Compressor...] │
│                                         │
│  Tipo de Associação:                   │
│  [Equipamento ▼]                       │ ← Pode mudar aqui!
│                                         │
│  Entidade Específica:                   │
│  [Compressor de Ar (COMP-001) ▼]       │ ← Pode mudar aqui!
│                                         │
│  [Salvar Checklist]                    │
└─────────────────────────────────────────┘
```

### **PASSO 3: Alterar a Associação**

#### **Opção A: Mudar o Tipo de Associação**

1. No campo **"Tipo de Associação"**, selecione um novo tipo:
   - **Equipamento** → Aplica a equipamentos
   - **Plano Preventivo** → Aplica a planos preventivos
   - **Ordem de Manutenção** → Aplica a OS específicas
   - **Chamado** → Aplica a chamados (genérico)

#### **Opção B: Mudar a Entidade Específica**

1. No campo **"Entidade Específica"**, clique no botão para abrir o seletor
2. Escolha uma das opções:
   - **"Todas as entidades deste tipo"** → Remove a associação específica (aplica a todos)
   - **Uma entidade específica** → Seleciona um equipamento/plano/OS específico

**Exemplo prático:**

```
ANTES:
Tipo: Equipamento
Entidade: Compressor de Ar (COMP-001)
→ Checklist aparece APENAS no Compressor de Ar

DEPOIS (Opção 1 - Tornar Genérico):
Tipo: Equipamento
Entidade: (vazio - Todas as entidades)
→ Checklist aparece em TODOS os equipamentos

DEPOIS (Opção 2 - Mudar Equipamento):
Tipo: Equipamento
Entidade: Bomba Centrífuga (BOMB-002)
→ Checklist aparece APENAS na Bomba Centrífuga

DEPOIS (Opção 3 - Mudar Tipo):
Tipo: Plano Preventivo
Entidade: Preventiva Mensal
→ Checklist aparece em TODAS as OS deste plano
```

### **PASSO 4: Salvar as Alterações**

1. Após fazer as alterações, clique em **"Salvar Checklist"**
2. O sistema atualizará a associação
3. O checklist será aplicado automaticamente conforme a nova associação

---

## 🎯 Exemplos Práticos

### **Exemplo 1: Tornar um Checklist Genérico**

**Situação**: Você tem um checklist específico para o "Compressor de Ar" e quer aplicar a todos os equipamentos.

**Passos:**
1. Clique no checklist "Checklist Preventivo - Compressor de Ar"
2. No campo "Entidade Específica", clique no botão
3. Selecione **"Todas as entidades deste tipo"**
4. Clique em **"Salvar Checklist"**

**Resultado**: O checklist agora aparece em TODOS os equipamentos!

---

### **Exemplo 2: Mudar de um Equipamento para Outro**

**Situação**: Você quer mover o checklist do "Compressor de Ar" para a "Bomba Centrífuga".

**Passos:**
1. Clique no checklist
2. No campo "Entidade Específica", clique no botão
3. Busque e selecione **"Bomba Centrífuga (BOMB-002)"**
4. Clique em **"Salvar Checklist"**

**Resultado**: O checklist agora aparece apenas na Bomba Centrífuga!

---

### **Exemplo 3: Mudar de Equipamento para Plano Preventivo**

**Situação**: Você quer que o checklist seja aplicado a um plano preventivo ao invés de um equipamento.

**Passos:**
1. Clique no checklist
2. No campo "Tipo de Associação", mude de **"Equipamento"** para **"Plano Preventivo"**
3. No campo "Entidade Específica", selecione o plano desejado (ex: "Preventiva Mensal")
4. Clique em **"Salvar Checklist"**

**Resultado**: O checklist agora aparece em todas as OS geradas por aquele plano preventivo!

---

## 🔍 Verificando a Mudança

Após salvar, você pode verificar se a mudança funcionou:

1. **Na lista de templates**: O badge mostra o novo tipo de associação
2. **Abrindo uma OS/Chamado**: O checklist deve aparecer (ou não aparecer) conforme a nova associação

---

## ⚠️ Importante

- **Checklists já executados**: Se um checklist já foi usado em uma OS/Chamado, as respostas antigas permanecem. Apenas novas OS/Chamados usarão a nova associação.
- **Múltiplos checklists**: Se houver múltiplos checklists compatíveis, o sistema usa o mais específico primeiro.
- **Checklists inativos**: Se você desativar um checklist (`is_active = false`), ele não aparecerá mesmo que a associação esteja correta.

---

## 💡 Dica Rápida

Para **duplicar** um checklist e criar uma nova associação:
1. Clique no checklist
2. Clique no botão de **duplicar** (ícone de cópia)
3. Altere a associação no novo checklist
4. Salve

Assim você mantém o original e cria uma versão com nova associação!

