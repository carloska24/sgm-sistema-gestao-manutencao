/**
 * Helper para processar baixa automática de estoque
 * @param {Object} db - Database connection
 * @param {string} referenceType - Tipo de referência ('maintenance_order' ou 'maintenance_call')
 * @param {number} referenceId - ID da ordem ou chamado
 * @param {string|Object} partsUsed - JSON string ou objeto com os materiais utilizados
 * @param {number} userId - ID do usuário que está fazendo a baixa
 * @returns {Promise<{success: boolean, processed: number, errors: Array}>}
 */
async function processInventoryDeduction(db, referenceType, referenceId, partsUsed, userId) {
  const { query, get, run } = db;
  const results = {
    success: true,
    processed: 0,
    errors: [],
  };

  try {
    // Se não houver parts_used, retornar sucesso sem processar
    if (!partsUsed) {
      return results;
    }

    // Parse do JSON se for string
    let materials;
    if (typeof partsUsed === 'string') {
      try {
        materials = JSON.parse(partsUsed);
      } catch (e) {
        console.error('Erro ao fazer parse de parts_used:', e);
        results.errors.push('Formato inválido de parts_used');
        results.success = false;
        return results;
      }
    } else {
      materials = partsUsed;
    }

    // Garantir que é um array
    if (!Array.isArray(materials)) {
      materials = [materials];
    }

    // Validar todos os materiais antes de processar
    const materialsToProcess = [];
    for (const material of materials) {
      try {
        // Validar estrutura mínima
        if (!material.name && !material.code) {
          results.errors.push('Material sem nome ou código');
          continue;
        }

        const quantity = parseFloat(material.quantity) || 0;
        if (quantity <= 0) {
          results.errors.push(`Quantidade inválida para ${material.name || material.code}`);
          continue;
        }

        // Buscar item no inventário por código ou nome
        let item;
        if (material.code) {
          item = await get('SELECT * FROM inventory_items WHERE code = ? AND is_active = 1', [material.code]);
        }
        
        if (!item && material.name) {
          item = await get('SELECT * FROM inventory_items WHERE name LIKE ? AND is_active = 1 LIMIT 1', [`%${material.name}%`]);
        }

        if (!item) {
          results.errors.push(`Item não encontrado no inventário: ${material.name || material.code}`);
          continue;
        }

        // Validar disponibilidade de estoque
        if (item.current_quantity < quantity) {
          results.errors.push(
            `Estoque insuficiente para ${item.name}: disponível ${item.current_quantity} ${item.unit}, necessário ${quantity} ${item.unit}`
          );
          results.success = false;
          continue;
        }

        materialsToProcess.push({ material, item, quantity });
      } catch (error) {
        console.error('Erro ao validar material:', error);
        results.errors.push(`Erro ao validar ${material.name || material.code}: ${error.message}`);
        results.success = false;
      }
    }

    // Se houver erros de validação, não processar
    if (!results.success) {
      return results;
    }

    // Processar todas as baixas em uma única transação
    await run('BEGIN TRANSACTION');
    try {
      for (const { material, item, quantity } of materialsToProcess) {
        // Registrar movimentação
        await run(
          `INSERT INTO inventory_movements 
           (item_id, movement_type, quantity, unit_cost, reference_type, reference_id, notes, created_by)
           VALUES (?, 'exit', ?, ?, ?, ?, ?, ?)`,
          [
            item.id,
            quantity,
            material.unit_cost || item.unit_cost || null,
            referenceType,
            referenceId,
            `Baixa automática de ${referenceType} #${referenceId}`,
            userId,
          ]
        );

        // Atualizar quantidade do item
        await run(
          'UPDATE inventory_items SET current_quantity = current_quantity - ? WHERE id = ?',
          [quantity, item.id]
        );

        results.processed++;
      }

      await run('COMMIT');
    } catch (error) {
      await run('ROLLBACK');
      console.error('Erro ao processar baixa de estoque:', error);
      results.success = false;
      results.errors.push(`Erro ao processar baixa: ${error.message}`);
    }

    return results;
  } catch (error) {
    console.error('Erro geral ao processar baixa de estoque:', error);
    results.success = false;
    results.errors.push(`Erro geral: ${error.message}`);
    return results;
  }
}

module.exports = { processInventoryDeduction };

