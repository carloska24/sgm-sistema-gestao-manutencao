# 🧪 Guia de Teste - Chamados de Manutenção

## 📋 Checklist de Testes Funcionais

### ✅ Teste 1: Criar um Chamado
1. Acesse `/calls`
2. Clique em **"+ Novo Chamado"**
3. Preencha:
   - Equipamento: Selecione um equipamento
   - Descrição: "Teste de chamado de manutenção"
   - Prioridade: Média
4. Clique em **"Criar Chamado"**
5. **Resultado Esperado**: Chamado criado com status "Aberto"
6. **Verificar no Console (F12)**:
   - `🔍 [DEBUG] Carregando chamados:` deve aparecer
   - `📊 [DEBUG] Resposta da API:` deve mostrar o chamado criado

---

### ✅ Teste 2: Visualizar Chamado Criado
1. Após criar, verifique se o chamado aparece na lista
2. **Verificar no Console**:
   - `✅ [DEBUG] Chamados carregados:` deve mostrar 1 ou mais chamados
   - Deve aparecer: `- Chamado #X: open | Nome do Equipamento`
3. Clique no ícone de **👁️ (olho)** para ver detalhes
4. **Resultado Esperado**: Página de detalhes do chamado abre

---

### ✅ Teste 3: Concluir um Chamado
1. Abra um chamado existente (clique no ícone de olho)
2. Se o status for "Em Execução", clique em **"Concluir Chamado"**
3. Se não estiver em execução:
   - Primeiro clique em **"Iniciar Execução"**
   - Depois clique em **"Concluir Chamado"**
4. **Verificar no Console (Backend)**:
   - `🔄 [DEBUG] Concluindo chamado #X`
   - `📋 [DEBUG] Estado atual do chamado:`
   - `✅ [DEBUG] Chamado atualizado: 1 linha(s) afetada(s)`
   - `✅ [DEBUG] Estado após atualização: status=completed`
5. **Resultado Esperado**: 
   - Mensagem de sucesso aparece
   - Redireciona automaticamente para `/calls` após 1 segundo

---

### ✅ Teste 4: Verificar Chamado Concluído na Lista
1. Após concluir, você será redirecionado para `/calls`
2. **Verificar no Console**:
   - `🔍 [DEBUG] Carregando chamados:` deve aparecer novamente
   - `📊 [DEBUG] Resposta da API:` deve incluir o chamado concluído
   - `✅ [DEBUG] Chamados carregados:` deve mostrar o chamado com status `completed`
3. **Verificar na Interface**:
   - O chamado deve aparecer na lista
   - Deve ter badge verde "Concluído"
   - Deve mostrar "Concluído em: [data/hora]" em verde
   - Deve mostrar "Tempo de execução: X min" em azul

---

### ✅ Teste 5: Filtrar por Status "Concluído"
1. Na página de chamados, no filtro **Status**, selecione **"Concluído"**
2. **Verificar no Console**:
   - `🔍 [DEBUG] Carregando chamados:` deve mostrar `status: "completed"`
   - `📊 [DEBUG] Resposta da API:` deve mostrar apenas chamados concluídos
3. **Resultado Esperado**: 
   - Apenas chamados com status "Concluído" aparecem
   - Barra de estatísticas mostra o filtro ativo

---

### ✅ Teste 6: Verificar Paginação
1. Se houver mais de 20 chamados, teste a paginação
2. Clique em **"Próxima"** ou **"Anterior"**
3. **Verificar no Console**:
   - `🔍 [DEBUG] Carregando chamados:` deve mostrar `page: 2` (ou outra página)
   - `📈 [DEBUG] Total de páginas:` deve mostrar o número correto
4. **Resultado Esperado**: 
   - Chamados da próxima página aparecem
   - Barra de estatísticas atualiza mostrando página atual

---

### ✅ Teste 7: Buscar Chamado Concluído
1. Digite parte da descrição do chamado concluído no campo de busca
2. Aguarde 500ms (debounce)
3. **Verificar no Console**:
   - `🔍 [DEBUG] Carregando chamados:` deve mostrar o termo de busca
   - `📊 [DEBUG] Resposta da API:` deve mostrar apenas chamados que correspondem
4. **Resultado Esperado**: 
   - Chamado concluído aparece se a descrição corresponder

---

## 🔍 Como Ver os Logs de Debug

### Frontend (Navegador):
1. Abra o **DevTools** (F12)
2. Vá para a aba **Console**
3. Procure por logs começando com:
   - `🔍 [DEBUG]` - Carregamento de dados
   - `📊 [DEBUG]` - Respostas da API
   - `✅ [DEBUG]` - Sucesso
   - `❌ [DEBUG]` - Erros

### Backend (Terminal):
1. Verifique o terminal onde o backend está rodando
2. Procure por logs começando com:
   - `🔄 [DEBUG]` - Ações (concluir chamado)
   - `📋 [DEBUG]` - Estado atual
   - `✅ [DEBUG]` - Sucesso
   - `❌ [DEBUG]` - Erros

---

## 🐛 Problemas Comuns e Soluções

### Problema: Chamado concluído não aparece na lista
**Verificar:**
1. Console do navegador: O chamado está sendo retornado pela API?
2. Filtro de Status: Está definido como "Todos"?
3. Console do backend: O status foi atualizado corretamente?
4. Paginação: O chamado pode estar em outra página?

**Solução:**
- Se o chamado não aparece, tente selecionar "Concluído" no filtro de Status
- Verifique se há múltiplas páginas e navegue entre elas
- Veja os logs no console para identificar o problema

---

### Problema: Erro ao concluir chamado
**Verificar:**
1. Console do backend: Há algum erro na query SQL?
2. Console do navegador: A requisição foi enviada corretamente?
3. Permissões: O usuário tem permissão para concluir chamados?

**Solução:**
- Verifique os logs de erro no console
- Confirme que o chamado existe e não foi deletado
- Verifique as permissões do usuário (deve ser admin, manager ou technician)

---

## 📝 Notas de Debug

### O que os logs mostram:
- **URL da requisição**: Qual endpoint está sendo chamado
- **Parâmetros**: Quais filtros estão sendo aplicados
- **Resposta da API**: Quantos chamados foram retornados e seus status
- **Estado do chamado**: Status antes e depois da conclusão
- **Paginação**: Total de chamados, página atual, total de páginas

### Informações úteis nos logs:
- `callsStatuses`: Array mostrando ID e status de cada chamado
- `total`: Total de chamados que correspondem aos filtros
- `page`: Página atual
- `totalPages`: Total de páginas disponíveis

---

## ✅ Resultado Esperado Final

Após concluir um chamado:
1. ✅ Status muda para "completed" no banco de dados
2. ✅ `completed_at` é preenchido com a data/hora atual
3. ✅ `execution_time` é calculado (se houver `started_at`)
4. ✅ Equipamento tem `last_corrective_date` atualizado
5. ✅ Histórico é registrado
6. ✅ Chamado aparece na lista com badge "Concluído"
7. ✅ Data de conclusão é exibida
8. ✅ Tempo de execução é exibido (se disponível)

---

**Última Atualização**: Janeiro 2025

