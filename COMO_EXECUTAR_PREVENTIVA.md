# 🛠️ Como Executar uma Manutenção Preventiva - Guia do Técnico

## 📋 Resumo Rápido

1. **Acesse o Calendário** ou **Planos Preventivos**
2. **Encontre a OS Pendente** (Ordem de Serviço)
3. **Clique para ver os detalhes** da OS
4. **Leia as instruções** de manutenção
5. **Inicie a execução** (botão "Iniciar Execução")
6. **Execute a manutenção** no equipamento
7. **Marque como concluída** (botão "Concluir OS")
8. **Pronto!** A próxima OS será gerada automaticamente

---

## 🎯 Passo a Passo Detalhado

### 📍 **PASSO 1: Encontrar a OS Pendente**

Você tem 3 formas de encontrar uma OS pendente:

#### **Opção A: Pelo Calendário** (Recomendado)
1. No menu lateral, clique em **"Calendário"**
2. Você verá um calendário mensal
3. Os dias com OS pendentes aparecem com **badges coloridos**:
   - 🟡 **Amarelo** = Pendente
   - 🔵 **Azul** = Em Execução
   - 🟢 **Verde** = Concluída
4. **Clique no badge** do dia que você quer executar

#### **Opção B: Pelo Plano Preventivo**
1. No menu lateral, clique em **"Preventivas"**
2. Clique no botão **"Ver"** do plano que você quer executar
3. Vá para a aba **"Ordens de Serviço"**
4. Você verá todas as OS do plano
5. **Clique no ícone de olho** 👁️ para ver detalhes da OS pendente

#### **Opção C: Pela Página de Detalhes do Plano**
1. Acesse o plano preventivo
2. Na aba **"Ordens de Serviço"**, encontre a OS com status **"Pendente"**
3. Você já verá as instruções na lista
4. Clique no botão **"Iniciar Execução"** ▶️ (botão azul) ou **"Ver Detalhes"** 👁️

---

### 📄 **PASSO 2: Ver os Detalhes da OS**

Quando você clica na OS, uma página de detalhes abre mostrando:

- **Número da OS** (ex: OS #123)
- **Equipamento** (ex: BOMBA-001 - Bomba Centrífuga)
- **Data Agendada** (ex: 15/01/2024)
- **Status** (Pendente, Em Execução, Concluída)
- **Instruções de Manutenção** (o que você precisa fazer)

**📌 Exemplo de Instruções:**
```
1. Verificar nível de óleo
2. Completar óleo se necessário
3. Trocar filtro de óleo
4. Verificar vazamentos
5. Testar funcionamento
```

---

### ▶️ **PASSO 3: Iniciar a Execução**

Quando você está na página de detalhes da OS:

1. Se a OS está **"Pendente"**, você verá um **banner azul** no topo:
   ```
   "Pronto para executar?"
   [Botão: Iniciar Execução ▶️]
   ```

2. **Clique no botão "Iniciar Execução"**
   - A OS muda para status **"Em Execução"**
   - O sistema registra o horário de início
   - O banner muda para verde: **"Manutenção em andamento"**

**💡 Dica:** Você pode iniciar a execução mesmo antes de ir ao equipamento, para reservar a OS para você.

---

### 🔧 **PASSO 4: Executar a Manutenção no Equipamento**

Agora você vai até o equipamento físico:

1. **Leia todas as instruções** na tela novamente
2. **Vá até o equipamento** (ex: Bomba 001)
3. **Siga as instruções passo a passo**:
   - ✅ Verificar nível de óleo
   - ✅ Completar óleo se necessário
   - ✅ Trocar filtro de óleo
   - ✅ Verificar vazamentos
   - ✅ Testar funcionamento
4. **Anote qualquer observação** importante (opcional)

**⚠️ IMPORTANTE:**
- Não marque como concluída até completar TODAS as tarefas
- Se encontrar problemas, anote e informe ao supervisor
- Se faltar peças, pause a execução e informe

---

### ✅ **PASSO 5: Marcar como Concluída**

Após executar todas as tarefas:

1. **Volte para a página de detalhes da OS** (se ainda estiver aberta)
2. Você verá um **banner verde** no topo:
   ```
   "Manutenção em andamento"
   [Botão: Concluir OS ✅]
   ```

3. **Clique no botão "Concluir OS"**
4. Uma confirmação aparecerá: **"Tem certeza que deseja marcar esta OS como concluída?"**
5. **Clique em "OK"** ou "Confirmar"

**O que acontece automaticamente:**
- ✅ Status muda para **"Concluída"**
- ✅ Data e hora de conclusão são registradas
- ✅ Tempo de execução é calculado automaticamente
- ✅ Equipamento tem sua **última preventiva** atualizada
- ✅ Sistema **calcula a próxima data** (ex: hoje + 30 dias)
- ✅ Sistema **gera automaticamente** a próxima OS
- ✅ Você será redirecionado para a lista de planos

---

### 🎉 **PASSO 6: Verificar a Próxima OS Gerada**

Após concluir:

1. **Volte para o plano preventivo** (ou aguarde o redirecionamento)
2. Vá para a aba **"Ordens de Serviço"**
3. Você verá:
   ```
   OS #123 - Concluída em 15/01/2024 14:30 ✅
   OS #124 - Agendada para 14/02/2024 (Pendente) 🟡
   ```

4. **A próxima OS já está criada e agendada!** 🎊

---

## 🎨 Interface Visual

### **Página de Detalhes da OS**

```
┌─────────────────────────────────────────────────┐
│  ← Voltar    Ordem de Serviço #123              │
│                                                  │
│  [Banner: Pronto para executar?]                │
│  [Botão: Iniciar Execução ▶️]                    │
│                                                  │
│  ╔════════════════════════════════════════════╗ │
│  ║  Informações da Ordem de Serviço           ║ │
│  ╠════════════════════════════════════════════╣ │
│  ║  Plano Preventivo: Lubrificação Mensal     ║ │
│  ║  Equipamento: BOMBA-001 - Bomba Centrífuga ║ │
│  ║  Data Agendada: 15/01/2024                 ║ │
│  ║  Técnico: João Silva                       ║ │
│  ╠════════════════════════════════════════════╣ │
│  ║  Instruções de Manutenção                  ║ │
│  ║  ┌──────────────────────────────────────┐  ║ │
│  ║  │ 1. Verificar nível de óleo           │  ║ │
│  ║  │ 2. Completar óleo se necessário      │  ║ │
│  ║  │ 3. Trocar filtro de óleo             │  ║ │
│  ║  │ 4. Verificar vazamentos              │  ║ │
│  ║  │ 5. Testar funcionamento              │  ║ │
│  ║  └──────────────────────────────────────┘  ║ │
│  ╚════════════════════════════════════════════╝ │
│                                                  │
│  [Botão: Voltar]                                 │
└─────────────────────────────────────────────────┘
```

---

## 🔍 Onde Está cada Botão?

### **Na Lista de OS (Página do Plano)**

```
┌─────────────────────────────────────────────┐
│ OS #123 - [Pendente]                        │
│ Equipamento: BOMBA-001                      │
│ Agendada para: 15/01/2024                   │
│                                              │
│ [▶️ Iniciar] [✅ Concluir] [👁️ Ver Detalhes] │
└─────────────────────────────────────────────┘
```

### **Na Página de Detalhes**

- **Banner no topo** com botão grande e visível
- **Botão "Iniciar Execução"** quando status = Pendente
- **Botão "Concluir OS"** quando status = Em Execução

---

## ❓ Perguntas Frequentes

### Q: Posso concluir uma OS sem iniciar a execução?
**R:** Sim! Você pode marcar como concluída diretamente se quiser. Mas é recomendado iniciar primeiro para registrar o tempo de execução.

### Q: E se eu não conseguir executar no dia agendado?
**R:** Não tem problema! A OS continua como "Pendente" até você executar. Quando marcar como concluída, o sistema calcula a próxima data baseada na data de conclusão (não na data agendada).

### Q: O que acontece se eu iniciar mas não concluir hoje?
**R:** A OS fica como "Em Execução". Você pode continuar amanhã e concluir depois. O sistema calcula o tempo de execução desde o início até a conclusão.

### Q: Como vejo minhas OS pendentes?
**R:** 
- Pelo **Calendário**: Veja os dias com badges amarelos
- Pelo **Plano**: Abra o plano e veja a aba "Ordens de Serviço"
- Pelo **Dashboard**: Veja o card "Preventivas Pendentes"

### Q: Posso ver as instruções sem abrir a OS?
**R:** Sim! Na lista de OS do plano, as instruções aparecem em um box destacado abaixo do número da OS.

### Q: A próxima OS é gerada imediatamente?
**R:** Sim! Assim que você marca como concluída, a próxima OS é gerada automaticamente na mesma hora.

---

## 🎯 Checklist de Execução

Antes de marcar como concluída, verifique:

- [ ] ✅ Todas as instruções foram seguidas
- [ ] ✅ Manutenção foi executada corretamente
- [ ] ✅ Equipamento está funcionando normalmente
- [ ] ✅ Não há problemas pendentes
- [ ] ✅ Ferramentas e materiais foram guardados
- [ ] ✅ Área está limpa

---

## 💡 Dicas Importantes

1. **Sempre leia as instruções** antes de começar
2. **Inicie a execução** quando começar a trabalhar (não quando terminar)
3. **Siga a ordem** das instruções quando possível
4. **Anote problemas** encontrados (há um campo para observações)
5. **Não conclua** até terminar tudo
6. **Verifique o equipamento** após a manutenção

---

## 🚨 Problemas Comuns

### **Problema:** Não consigo ver o botão "Concluir OS"
**Solução:** 
- Verifique se você iniciou a execução primeiro
- Verifique se você tem permissão (técnico, gerente ou admin)
- Recarregue a página

### **Problema:** A próxima OS não foi gerada
**Solução:**
- Verifique se o plano está ativo
- Verifique se já existe uma OS para a próxima data
- Entre em contato com o administrador

### **Problema:** Não consigo iniciar a execução
**Solução:**
- Verifique se a OS está com status "Pendente"
- Verifique se você tem permissão (técnico, gerente ou admin)
- Tente recarregar a página

---

## 📞 Precisa de Ajuda?

Se você encontrar algum problema:
1. Verifique os logs no console do navegador (F12)
2. Entre em contato com o administrador do sistema
3. Consulte o `MANUAL_DO_USUARIO.md` para mais informações

---

**🎉 Agora você sabe como executar uma manutenção preventiva!**

Lembre-se: **Inicie → Execute → Conclua → Próxima OS gerada automaticamente!** 🔄

