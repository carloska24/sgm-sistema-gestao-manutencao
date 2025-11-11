# 📋 Guia Completo: Como Aplicar Checklists no Sistema

## 🎯 Visão Geral

Os checklists são aplicados **automaticamente** quando você cria uma Ordem de Manutenção (OS) ou um Chamado. O sistema busca checklists associados ao **equipamento** ou à **entidade específica**.

---

## 📝 Passo a Passo: Criando e Aplicando um Checklist

### **PASSO 1: Criar um Template de Checklist**

1. Acesse **"Checklists Inteligentes"** no menu lateral
2. Clique em **"+ Novo Template"**
3. Preencha as informações básicas:
   - **Nome**: Ex: "Checklist Preventivo - Compressor de Ar"
   - **Descrição**: Contexto e objetivo do checklist

### **PASSO 2: Associar o Checklist a uma Entidade**

No formulário de criação, você verá:

#### **Tipo de Associação** (Campo obrigatório)
Escolha onde o checklist será aplicado:

- **📦 Equipamento**: Checklist aplicado a um equipamento específico ou a todos
- **📅 Plano Preventivo**: Checklist aplicado a um plano preventivo específico
- **🔧 Ordem de Manutenção**: Checklist aplicado a uma OS específica
- **⚠️ Chamado**: Checklist aplicado a chamados (genérico)

#### **Entidade Específica** (Campo opcional)
- **Deixe vazio**: O checklist será aplicado a **TODAS** as entidades do tipo selecionado
- **Selecione uma entidade**: O checklist será aplicado **APENAS** àquela entidade específica

**Exemplo prático:**
```
Tipo: Equipamento
Entidade: Compressor de Ar (COMP-001)

✅ Resultado: Este checklist aparecerá APENAS quando houver uma OS ou Chamado 
   relacionado ao Compressor de Ar (COMP-001)
```

```
Tipo: Equipamento
Entidade: (vazio)

✅ Resultado: Este checklist aparecerá em TODOS os equipamentos quando houver 
   uma OS ou Chamado relacionado
```

### **PASSO 3: Adicionar Itens ao Checklist**

1. Clique em **"Adicionar Item"**
2. Para cada item, configure:
   - **Título**: Ex: "Verificar pressão de operação"
   - **Instruções**: Detalhes do que verificar
   - **Tipo de Resposta**: Sim/Não, Numérico, Texto, ou Seleção múltipla
   - **Obrigatório**: Se o item é obrigatório ou não
   - **Requer Foto**: Se precisa de foto comprovante
   - **Requer Assinatura**: Se precisa de assinatura digital
3. Arraste os itens para reordenar
4. Clique em **"Salvar Checklist"**

---

## 🔄 Como Funciona a Aplicação Automática

### **Para Ordens de Manutenção (OS)**

Quando você abre uma OS, o sistema busca checklists nesta ordem:

1. **Checklist específico da OS** (`entity_type: 'maintenance_order'`, `entity_id: [ID da OS]`)
2. **Checklist do equipamento** (`entity_type: 'equipment'`, `entity_id: [ID do equipamento]`)
3. **Checklist do plano preventivo** (`entity_type: 'preventive_plan'`, `entity_id: [ID do plano]`)

**Exemplo:**
```
OS #123 → Equipamento: Compressor de Ar (COMP-001) → Plano: Preventiva Mensal

Sistema busca:
1. Checklist com entity_type='maintenance_order' e entity_id=123
2. Checklist com entity_type='equipment' e entity_id=[ID do COMP-001]
3. Checklist com entity_type='preventive_plan' e entity_id=[ID do plano]

✅ O primeiro checklist encontrado é exibido automaticamente!
```

### **Para Chamados**

Quando você abre um Chamado, o sistema busca checklists nesta ordem:

1. **Checklist do equipamento** (`entity_type: 'equipment'`, `entity_id: [ID do equipamento]`)
2. **Checklist genérico de chamados** (`entity_type: 'maintenance_call'`, `entity_id: null`)

**Exemplo:**
```
Chamado #456 → Equipamento: Bomba Centrífuga (BOMB-002)

Sistema busca:
1. Checklist com entity_type='equipment' e entity_id=[ID do BOMB-002]
2. Checklist com entity_type='maintenance_call' e entity_id=null

✅ O primeiro checklist encontrado é exibido automaticamente!
```

---

## 🎨 Indicadores Visuais

### **Na Listagem de Chamados/OS**

Os cards mostram um badge **"Checklist"** quando há checklist associado:

```
┌─────────────────────────────────┐
│ #456  [Status] [Tipo] [Checklist]│ ← Badge roxo "Checklist"
│ Bomba Centrífuga                │
│ Descrição do problema...         │
└─────────────────────────────────┘
```

### **Na Página de Detalhes**

O checklist aparece automaticamente em uma seção dedicada:

```
┌─────────────────────────────────────┐
│ 📋 Checklist Inteligente            │
│ ─────────────────────────────────── │
│ ✅ Item 1: Verificar pressão       │
│ ⏳ Item 2: Verificar temperatura    │
│ ⏳ Item 3: Inspecionar vazamentos   │
└─────────────────────────────────────┘
```

---

## 💡 Cenários Práticos

### **Cenário 1: Checklist Específico para um Equipamento**

**Objetivo**: Criar um checklist exclusivo para o Compressor de Ar

1. Criar checklist:
   - Tipo: **Equipamento**
   - Entidade: **Compressor de Ar (COMP-001)**

2. **Resultado**: 
   - ✅ Aparece em TODAS as OS relacionadas ao Compressor de Ar
   - ✅ Aparece em TODOS os Chamados relacionados ao Compressor de Ar
   - ❌ NÃO aparece em outros equipamentos

### **Cenário 2: Checklist Genérico para Todos os Equipamentos**

**Objetivo**: Criar um checklist padrão que funciona para qualquer equipamento

1. Criar checklist:
   - Tipo: **Equipamento**
   - Entidade: **(vazio - deixar genérico)**

2. **Resultado**:
   - ✅ Aparece em TODAS as OS de qualquer equipamento
   - ✅ Aparece em TODOS os Chamados de qualquer equipamento
   - ✅ Funciona como um checklist padrão universal

### **Cenário 3: Checklist para um Plano Preventivo Específico**

**Objetivo**: Criar um checklist exclusivo para o plano "Preventiva Mensal"

1. Criar checklist:
   - Tipo: **Plano Preventivo**
   - Entidade: **Preventiva Mensal**

2. **Resultado**:
   - ✅ Aparece em TODAS as OS geradas por este plano preventivo
   - ❌ NÃO aparece em OS de outros planos

### **Cenário 4: Checklist para Chamados de Emergência**

**Objetivo**: Criar um checklist padrão para todos os chamados emergenciais

1. Criar checklist:
   - Tipo: **Chamado**
   - Entidade: **(vazio - genérico)**

2. **Resultado**:
   - ✅ Aparece em TODOS os chamados (independente do equipamento)
   - ✅ Útil para procedimentos padrão de atendimento emergencial

---

## 🔍 Verificando se um Checklist Está Associado

### **Na Tela de Chamados/OS**

1. Abra a listagem de Chamados ou Ordens de Manutenção
2. Procure pelo badge **"Checklist"** nos cards
3. Cards com checklist têm um badge roxo com ícone de checklist

### **Na Página de Detalhes**

1. Abra uma OS ou Chamado
2. Role até a seção **"Checklist Inteligente"**
3. Se houver checklist associado, ele aparecerá automaticamente
4. Se não houver, você verá uma mensagem informando que não há checklist disponível

---

## ⚙️ Configurações Avançadas

### **Prioridade de Associação**

O sistema segue esta ordem de prioridade:

1. **Mais Específico**: Checklist com `entity_id` específico
2. **Genérico**: Checklist sem `entity_id` (aplica a todos)

**Exemplo:**
```
Equipamento COMP-001 tem:
- Checklist genérico (entity_type='equipment', entity_id=null)
- Checklist específico (entity_type='equipment', entity_id=[COMP-001])

✅ O checklist ESPECÍFICO tem prioridade e será exibido!
```

### **Múltiplos Checklists**

Se houver múltiplos checklists compatíveis, o sistema usa o **primeiro encontrado** na ordem de busca.

---

## 🚀 Dicas e Boas Práticas

1. **Use checklists genéricos** para procedimentos padrão que se aplicam a todos
2. **Use checklists específicos** para equipamentos com procedimentos únicos
3. **Organize por tipo de manutenção**: Crie checklists diferentes para preventiva, corretiva, preditiva e emergencial
4. **Teste a associação**: Após criar um checklist, abra uma OS/Chamado relacionado para verificar se aparece
5. **Use Templates Prontos**: Clique em "Templates Prontos" para criar checklists profissionais pré-configurados

---

## 📞 Suporte

Se o checklist não aparecer onde esperado:

1. Verifique se o tipo de associação está correto
2. Verifique se a entidade específica está correta (se aplicável)
3. Verifique se o checklist está ativo (`is_active = 1`)
4. Verifique se há um checklist mais específico com prioridade maior

---

**Última atualização**: Sistema atualizado com suporte completo a todos os tipos de manutenção e associação automática de checklists! 🎉

