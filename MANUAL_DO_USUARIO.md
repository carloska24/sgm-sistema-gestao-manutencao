# 📘 Manual do Usuário - SGM (Sistema de Gestão de Manutenção)

## 📋 Índice

1. [Visão Geral do Sistema](#visão-geral-do-sistema)
2. [Dashboard](#dashboard)
3. [Equipamentos](#equipamentos)
4. [Chamados de Manutenção Corretiva](#chamados-de-manutenção-corretiva)
5. [Planos Preventivos](#planos-preventivos)
6. [Como Fazer Manutenções Preventivas e Marcar como Concluída](#como-fazer-manutenções-preventivas-e-marcar-como-concluída)
7. [Calendário de Manutenções](#calendário-de-manutenções)
8. [Relatórios](#relatórios)
9. [Usuários](#usuários)

---

## 🎯 Visão Geral do Sistema

O **SGM (Sistema de Gestão de Manutenção)** é uma plataforma completa para gerenciar:
- **Equipamentos** da empresa
- **Chamados de manutenção corretiva** (quando algo quebra)
- **Planos de manutenção preventiva** (manutenções programadas)
- **Ordens de serviço** geradas automaticamente
- **Relatórios e análises** gerenciais

### Fluxo Geral do Sistema

```
1. Cadastrar Equipamentos
   ↓
2. Criar Planos Preventivos (para cada equipamento)
   ↓
3. Sistema gera automaticamente Ordens de Serviço (OS)
   ↓
4. Técnico executa a manutenção
   ↓
5. Marca a OS como concluída
   ↓
6. Sistema gera próxima OS automaticamente
```

**Para chamados corretivos:**
```
1. Equipamento apresenta problema
   ↓
2. Abre um Chamado
   ↓
3. Atribui para técnico
   ↓
4. Técnico executa e marca como concluído
```

---

## 📊 Dashboard

### O que é?
O Dashboard é a tela inicial do sistema, mostrando um resumo geral de todas as informações importantes.

### O que você vê:

**Cards de Estatísticas:**
- **Total de Equipamentos**: Quantidade total cadastrada
- **Equipamentos Ativos**: Equipamentos em funcionamento
- **Chamados Abertos**: Chamados de manutenção corretiva não resolvidos
- **Chamados em Execução**: Chamados que estão sendo executados
- **Preventivas Pendentes**: Manutenções preventivas aguardando execução
- **Preventivas Atrasadas**: Manutenções preventivas que passaram da data
- **Taxa de Conformidade**: Porcentagem de manutenções preventivas realizadas no prazo
- **MTTR Médio**: Tempo médio para reparar equipamentos (em minutos)

**Gráficos:**
- **Chamados por Status**: Gráfico de pizza mostrando distribuição de chamados
- **Chamados por Período**: Gráfico de linha com evolução temporal
- **Preventivas por Status**: Gráfico de pizza com status das preventivas
- **Equipamentos por Status**: Gráfico de barras com status dos equipamentos

### Como usar:
- Apenas visualização - não há ações necessárias
- Use para ter uma visão geral rápida do estado da manutenção
- Atualiza automaticamente conforme os dados do sistema

---

## 🔧 Equipamentos

### O que é?
A seção de Equipamentos é onde você cadastra e gerencia todos os equipamentos da empresa.

### Funcionalidades:

#### 1. **Listar Equipamentos**
- Visualize todos os equipamentos cadastrados
- Filtre por status (Ativo, Inativo, Em Manutenção, Desativado)
- Busque por nome, código ou descrição
- Veja informações como:
  - Nome e código
  - Status atual
  - Criticidade (Baixa, Média, Alta)
  - Última manutenção preventiva
  - Próxima manutenção preventiva

#### 2. **Cadastrar Novo Equipamento**
**Passo a passo:**
1. Clique no botão **"Novo Equipamento"**
2. Preencha as informações:
   - **Nome do Equipamento** * (obrigatório)
   - **Código de Identificação** * (obrigatório, ex: BOMB-001)
   - **Descrição**
   - **Fabricante** (ex: KSB, WEG)
   - **Modelo**
   - **Número de Série**
   - **Data de Aquisição**
   - **Custo de Aquisição**
   - **Localização** (ex: Setor A, Linha 1)
   - **Status** * (Ativo, Inativo, Em Manutenção, Desativado)
   - **Criticidade** * (Baixa, Média, Alta)
   - **Características Técnicas** (Potência, Capacidade, Voltagem, etc.)
3. **Fotos do Equipamento** (opcional):
   - Clique na área de upload
   - Selecione uma ou mais fotos (JPG, PNG, GIF - máx. 10MB cada)
   - Visualize as fotos antes de salvar
   - Pode remover fotos antes de salvar
4. **Manual do Equipamento** (opcional):
   - Clique na área de upload
   - Selecione um arquivo PDF (máx. 50MB)
5. Clique em **"Criar Equipamento"**
6. As fotos e o manual serão enviados automaticamente após criar o equipamento

#### 3. **Editar Equipamento**
1. Na lista de equipamentos, clique em **"Editar"** (ícone de lápis)
2. Modifique as informações desejadas
3. **Adicionar novas fotos** (se necessário):
   - Selecione novas fotos
   - Elas serão enviadas quando você salvar
4. **Adicionar ou substituir manual** (se necessário)
5. Clique em **"Salvar Alterações"**

#### 4. **Visualizar Detalhes do Equipamento**
1. Clique em **"Ver"** (ícone de olho) na lista
2. Veja todas as informações completas do equipamento
3. Visualize fotos e documentos anexados

#### 5. **Excluir Equipamento**
- ⚠️ **Atenção**: Esta ação é irreversível!
- Clique no botão **"Deletar"** (ícone de lixeira)
- Confirme a exclusão

---

## 📞 Chamados de Manutenção Corretiva

### O que é?
Chamados são abertos quando um equipamento apresenta um problema que precisa ser corrigido.

### Tipos de Chamados:
- **Corretivos**: Quando algo quebra ou apresenta defeito

### Status dos Chamados:
1. **Aberto**: Chamado criado, aguardando análise
2. **Análise**: Em análise técnica
3. **Atribuído**: Atribuído a um técnico
4. **Execução**: Técnico iniciou a execução
5. **Aguardando Peças**: Aguardando peças ou materiais
6. **Concluído**: Manutenção finalizada
7. **Cancelado**: Chamado cancelado

### Como usar:

#### 1. **Abrir um Novo Chamado**
**Passo a passo:**
1. Vá para **"Chamados"** no menu lateral
2. Clique em **"Novo Chamado"**
3. Preencha as informações:
   - **Equipamento** * (selecione o equipamento com problema)
   - **Tipo de Problema** (opcional, ex: Vazamento, Ruído, Falha elétrica)
   - **Descrição** * (descreva o problema detalhadamente)
   - **Data de Ocorrência** (quando o problema aconteceu)
   - **Prioridade** * (Baixa, Média, Alta, Urgente)
4. Clique em **"Criar Chamado"**

#### 2. **Atribuir Chamado a um Técnico**
**Apenas Admin/Manager podem fazer isso:**
1. Abra o chamado clicando nele
2. Na aba **"Informações"**
3. Selecione um técnico no campo **"Técnico Responsável"**
4. O status muda automaticamente para **"Atribuído"**

#### 3. **Iniciar Execução do Chamado**
**Técnico ou Admin/Manager:**
1. Abra o chamado
2. Clique no botão **"Iniciar Execução"**
3. O status muda para **"Execução"**
4. O sistema registra o horário de início

#### 4. **Registrar Atividades durante a Execução**
**Durante a execução, você pode registrar atividades:**
1. Na aba **"Atividades"**
2. Digite a atividade realizada (ex: "Verificado vazamento na válvula X")
3. Clique em **"Adicionar Atividade"**
4. Todas as atividades ficam registradas com data e hora

#### 5. **Concluir o Chamado**
**Quando a manutenção estiver completa:**
1. Abra o chamado
2. Clique no botão **"Concluir Chamado"**
3. O sistema:
   - Muda o status para **"Concluído"**
   - Registra a data/hora de conclusão
   - Calcula o tempo de execução automaticamente
   - Atualiza a última manutenção corretiva do equipamento

#### 6. **Alterar Status Manualmente**
**Admin/Manager pode alterar status manualmente:**
1. Na página de detalhes do chamado
2. Selecione o novo status no campo **"Status"**
3. O sistema atualiza automaticamente

#### 7. **Visualizar Histórico**
1. Na aba **"Histórico"**
2. Veja todas as mudanças de status, atribuições, etc.
3. Cada registro mostra quem fez e quando

---

## 📅 Planos Preventivos

### O que é?
Planos Preventivos são configurações que definem **quando** e **como** fazer manutenções preventivas em equipamentos.

### Conceitos Importantes:
- **Plano**: Define a frequência e instruções da manutenção
- **Ordem de Serviço (OS)**: É gerada automaticamente pelo plano, representando uma manutenção específica a ser executada
- **Frequência**: Define com que frequência a manutenção deve ser feita (ex: a cada 30 dias, a cada 3 meses)

### Como usar:

#### 1. **Criar um Plano Preventivo**
**Passo a passo:**
1. Vá para **"Preventivas"** no menu lateral
2. Clique em **"Novo Plano"**
3. Preencha as informações:
   - **Nome do Plano** * (ex: "Lubrificação Mensal Bomba 001")
   - **Equipamento** * (selecione o equipamento)
   - **Frequência**:
     - **Tipo**: Dias, Semanas, Meses, Horas ou Ciclos
     - **Valor**: Quantidade (ex: 30 dias, 3 meses)
   - **Data de Início** * (quando começar a aplicar o plano)
   - **Data de Término** (opcional, se o plano tiver fim)
   - **Instruções** (opcional, descreva o que deve ser feito na manutenção)
   - **Duração Estimada** (opcional, em minutos)
   - **Técnico Responsável** (opcional, pode atribuir um técnico padrão)
4. Clique em **"Criar Plano"**
5. **O sistema automaticamente:**
   - Cria a primeira Ordem de Serviço (OS) para a data de início
   - Ativa o plano
   - Começa a gerar OS automaticamente conforme a frequência

#### 2. **Visualizar Planos**
1. Na lista de planos, você verá:
   - Nome do plano
   - Equipamento associado
   - Frequência
   - Status (Ativo/Inativo)
   - Quantidade de OS geradas
   - Quantidade de OS concluídas
2. Clique em **"Ver"** para ver detalhes completos

#### 3. **Ver Detalhes de um Plano**
1. Clique em **"Ver"** no plano desejado
2. Na aba **"Informações"**:
   - Veja todas as informações do plano
   - Veja estatísticas (total de OS, concluídas, taxa de conclusão)
   - Veja as instruções de manutenção
3. Na aba **"Ordens de Serviço"**:
   - Veja todas as OS geradas por este plano
   - Status de cada OS
   - Datas agendadas e concluídas

#### 4. **Ativar/Desativar um Plano**
**Para pausar temporariamente um plano:**
1. Na lista de planos, clique no botão de **"Desativar"** (ícone de power off)
2. O plano fica inativo e não gera novas OS
3. Para reativar, clique em **"Ativar"** (ícone de power)

#### 5. **Gerar OS Manualmente**
**Às vezes você pode querer gerar uma OS antes da data programada:**
1. Abra o plano
2. Na aba **"Ordens de Serviço"**
3. Clique em **"Gerar OS"**
4. Uma nova OS é criada com a data atual

#### 6. **Editar um Plano**
1. Clique em **"Editar"** (ícone de lápis)
2. Modifique as informações necessárias
3. Clique em **"Salvar Alterações"**
4. **Nota**: Mudanças na frequência não afetam OS já geradas

#### 7. **Excluir um Plano**
- ⚠️ **Atenção**: Esta ação é irreversível!
- Clique em **"Deletar"** (ícone de lixeira)
- Confirme a exclusão
- **Nota**: OS já geradas não são deletadas

---

## ✅ Como Fazer Manutenções Preventivas e Marcar como Concluída

### ⚠️ IMPORTANTE: Entendendo o Fluxo

O sistema funciona assim:
1. Você cria um **Plano Preventivo** (define a frequência)
2. O sistema **gera automaticamente** Ordens de Serviço (OS) baseadas no plano
3. A OS aparece no **Calendário** e na lista de preventivas
4. O técnico executa a manutenção
5. **Marca a OS como concluída**
6. O sistema **gera automaticamente** a próxima OS

### 🔍 Passo a Passo Completo:

#### **Passo 1: Verificar OS Pendentes**
**Opção A - Pelo Calendário:**
1. Vá para **"Calendário"** no menu lateral
2. Veja as preventivas agendadas no calendário
3. Clique em uma preventiva para ver detalhes

**Opção B - Pelo Plano:**
1. Vá para **"Preventivas"** (Planos Preventivos)
2. Clique em **"Ver"** no plano desejado
3. Vá para a aba **"Ordens de Serviço"**
4. Veja as OS com status **"Pendente"** ou **"Em Execução"**

#### **Passo 2: Atribuir a OS para um Técnico (Opcional)**
**Se a OS não tiver técnico atribuído:**
1. Abra o plano
2. Na aba **"Ordens de Serviço"**, encontre a OS
3. **Nota**: Atualmente, a atribuição de técnicos é feita no nível do plano
4. Se você quiser atribuir especificamente para uma OS, pode editar o plano

#### **Passo 3: Executar a Manutenção**
1. O técnico vai até o equipamento
2. Segue as **instruções** definidas no plano (se houver)
3. Executa a manutenção conforme o procedimento

#### **Passo 4: Marcar a OS como Concluída**
**⚠️ IMPORTANTE: Atualmente, a interface gráfica para marcar OS como concluída ainda está em desenvolvimento.**

**Forma atual de atualizar status:**
1. Abra o plano preventivo
2. Vá para a aba **"Ordens de Serviço"**
3. Identifique a OS que foi executada
4. **Nota**: A funcionalidade de botão "Concluir OS" na interface será adicionada em breve

**O que acontece quando você marca como concluída (via API/backend):**
- Status muda para **"Concluída"**
- Data de conclusão é registrada automaticamente
- Equipamento tem sua **última preventiva** atualizada
- Sistema **gera automaticamente** a próxima OS baseada na frequência do plano
- Próxima OS aparece com status **"Pendente"** e data calculada automaticamente

**Solução temporária:**
- Entre em contato com o administrador do sistema para marcar a OS como concluída
- Ou aguarde a implementação da funcionalidade na interface

#### **Passo 5: Verificar Próxima OS Gerada**
1. Após marcar como concluída, volte para a aba **"Ordens de Serviço"**
2. Você verá uma nova OS gerada com a próxima data
3. O ciclo continua automaticamente

### 📝 Exemplo Prático:

**Cenário:** Lubrificação mensal da Bomba 001

1. **Criar Plano:**
   - Nome: "Lubrificação Mensal Bomba 001"
   - Equipamento: Bomba 001
   - Frequência: A cada 30 dias
   - Data de Início: 01/01/2024
   - Instruções: "Verificar nível de óleo, completar se necessário, trocar filtro"

2. **Sistema gera primeira OS:**
   - OS #1 agendada para 01/01/2024

3. **Técnico executa:**
   - Dia 01/01/2024, técnico vai até a bomba
   - Segue as instruções
   - Executa a lubrificação

4. **Marcar como concluída:**
   - Marca OS #1 como concluída

5. **Sistema gera próxima:**
   - OS #2 é gerada automaticamente para 31/01/2024 (30 dias depois)

6. **Ciclo continua:**
   - O processo se repete automaticamente

---

## 📆 Calendário de Manutenções

### O que é?
O calendário mostra visualmente todas as manutenções preventivas agendadas.

### Como usar:

#### 1. **Visualizar Calendário**
1. Vá para **"Calendário"** no menu lateral
2. Veja o mês atual com todas as preventivas marcadas
3. Cada dia mostra:
   - Quantidade de preventivas agendadas
   - Código do equipamento
   - Status (cor diferente para cada status)

#### 2. **Navegar entre Meses**
- Use as setas **←** e **→** para mudar de mês
- Ou use o seletor de data

#### 3. **Ver Detalhes de uma Preventiva**
1. Clique em uma preventiva no calendário
2. Um painel aparece mostrando:
   - Número da OS
   - Equipamento
   - Plano associado
   - Data agendada
   - Técnico responsável
   - Status atual

#### 4. **Cores no Calendário:**
- **Amarelo**: Pendente
- **Azul**: Em Execução
- **Verde**: Concluída
- **Vermelho**: Cancelada

---

## 📊 Relatórios

### O que é?
A seção de Relatórios fornece análises e estatísticas gerenciais sobre a manutenção.

### Tipos de Relatórios Disponíveis:

#### 1. **Conformidade de Manutenções**
- Mostra a taxa de conformidade das manutenções preventivas
- Indica quantas foram realizadas no prazo
- Útil para: Avaliar eficácia do programa preventivo

#### 2. **MTBF e MTTR**
- **MTBF** (Mean Time Between Failures): Tempo médio entre falhas
- **MTTR** (Mean Time To Repair): Tempo médio de reparo
- Útil para: Análise de confiabilidade dos equipamentos

#### 3. **Custos de Manutenção**
- Análise de custos por equipamento
- Compara custos corretivos vs preventivos
- Útil para: Gestão de custos e orçamento

#### 4. **Performance de Técnicos**
- Estatísticas de desempenho dos técnicos
- Quantidade de chamados resolvidos
- Tempo médio de execução
- Útil para: Avaliação de desempenho

#### 5. **Chamados por Período**
- Análise temporal de chamados
- Gráficos de evolução
- Útil para: Identificar tendências e padrões

#### 6. **Equipamentos Críticos**
- Equipamentos com mais chamados
- Identifica problemas recorrentes
- Útil para: Priorização de ações

### Como usar:

#### 1. **Gerar um Relatório**
1. Vá para **"Relatórios"** no menu lateral
2. **Aplique filtros** (opcional):
   - Data Início
   - Data Fim
3. Clique no **card do relatório** desejado
4. O relatório será carregado e exibido em uma tabela

#### 2. **Filtrar Relatórios**
1. Use os campos **"Data Início"** e **"Data Fim"**
2. Selecione o período desejado
3. Clique no relatório
4. Os dados serão filtrados para o período selecionado

#### 3. **Limpar Filtros**
1. Clique no botão **"Limpar"**
2. Os filtros são resetados
3. Os dados são limpos

#### 4. **Exportar Relatórios**
- ⚠️ **Nota**: Funcionalidade de exportação está em desenvolvimento
- Por enquanto, use a opção de impressão do navegador

---

## 👥 Usuários

### O que é?
A seção de Usuários permite gerenciar os usuários do sistema.

### Tipos de Usuários (Papéis/Roles):

1. **Admin**: Acesso total ao sistema
2. **Manager**: Pode gerenciar equipamentos, chamados e planos
3. **Technician**: Pode executar chamados e manutenções
4. **Viewer**: Apenas visualização (leitura)

### Como usar (Apenas Admin):

#### 1. **Listar Usuários**
1. Vá para **"Usuários"** no menu lateral
2. Veja lista de todos os usuários cadastrados
3. Filtre por papel ou status

#### 2. **Criar Novo Usuário**
1. Clique em **"Novo Usuário"**
2. Preencha:
   - **Nome de Usuário** * (login)
   - **Nome Completo** *
   - **Email** *
   - **Senha** *
   - **Papel** * (Admin, Manager, Technician, Viewer)
   - **Status** (Ativo/Inativo)
3. Clique em **"Criar Usuário"**

#### 3. **Editar Usuário**
1. Clique em **"Editar"** no usuário
2. Modifique as informações
3. Clique em **"Salvar Alterações"**

#### 4. **Desativar/Ativar Usuário**
1. Clique no botão de ativar/desativar
2. Usuário inativo não consegue fazer login

#### 5. **Excluir Usuário**
- ⚠️ **Atenção**: Esta ação é irreversível!
- Clique em **"Deletar"**
- Confirme a exclusão

---

## 🎯 Dicas e Boas Práticas

### Para Gestores:
1. **Crie planos preventivos** para todos os equipamentos críticos
2. **Monitore o calendário** regularmente para evitar atrasos
3. **Analise os relatórios** mensalmente para identificar tendências
4. **Mantenha os dados atualizados** (equipamentos, usuários, etc.)

### Para Técnicos:
1. **Verifique o calendário** diariamente para ver preventivas do dia
2. **Registre atividades** durante a execução de chamados
3. **Marque preventivas como concluídas** assim que executar
4. **Siga as instruções** definidas nos planos preventivos

### Para Todos:
1. **Use descrições claras** ao criar chamados
2. **Atualize status** conforme o progresso
3. **Registre atividades** para manter histórico completo
4. **Use filtros** para encontrar informações rapidamente

---

## ❓ Perguntas Frequentes (FAQ)

### Q: Como vejo quais preventivas estão pendentes?
**R:** Vá para "Calendário" ou "Preventivas" → Abra o plano → Aba "Ordens de Serviço". Veja as OS com status "Pendente".

### Q: Posso criar uma preventiva sem criar um plano?
**R:** Não. O sistema funciona com planos que geram OS automaticamente. Isso garante controle e rastreabilidade.

### Q: O que acontece se eu não marcar uma preventiva como concluída?
**R:** Ela continua como "Pendente" e o sistema não gera a próxima OS. É importante marcar como concluída para manter o ciclo.

### Q: Posso alterar a frequência de um plano depois de criado?
**R:** Sim, pode editar o plano. Mas as OS já geradas não são afetadas. Apenas novas OS seguirão a nova frequência.

### Q: Como cancelo uma OS?
**R:** Atualmente, a funcionalidade de cancelar OS específica precisa ser implementada na interface. Você pode desativar o plano inteiro temporariamente se necessário.

### Q: Como marco uma OS preventiva como concluída?
**R:** A funcionalidade de botão "Concluir OS" na interface está sendo implementada. Por enquanto, entre em contato com o administrador ou aguarde a atualização do sistema. O backend já suporta essa funcionalidade.

### Q: Posso ter mais de um plano para o mesmo equipamento?
**R:** Sim! Por exemplo, um plano para lubrificação mensal e outro para troca de peças semestral.

### Q: Como vejo o histórico de manutenções de um equipamento?
**R:** Abra o equipamento e veja os campos "Última Manutenção Preventiva" e "Última Manutenção Corretiva". Para detalhes completos, use os relatórios.

### Q: O sistema calcula automaticamente a próxima data?
**R:** Sim! Quando você marca uma OS como concluída, o sistema calcula automaticamente a próxima data baseada na frequência do plano.

---

## 🆘 Suporte

Se você tiver dúvidas ou encontrar problemas:
1. Consulte este manual primeiro
2. Verifique se sua permissão de usuário permite a ação desejada
3. Entre em contato com o administrador do sistema

---

**Versão do Manual:** 1.0  
**Última Atualização:** Janeiro 2024  
**Sistema:** SGM - Sistema de Gestão de Manutenção

