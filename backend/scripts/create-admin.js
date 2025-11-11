require('dotenv').config();
const bcrypt = require('bcrypt');
const { run, get } = require('../database');

async function createAdmin() {
  try {
    const username = process.argv[2] || 'admin';
    const email = process.argv[3] || 'admin@sgm.com';
    const password = process.argv[4] || 'admin123';
    const fullName = process.argv[5] || 'Administrador';

    console.log('🔐 Criando usuário administrador...');
    console.log(`Username: ${username}`);
    console.log(`Email: ${email}`);
    console.log(`Nome: ${fullName}`);

    // Verificar se usuário já existe
    const existingUser = await get(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [username, email]
    );

    if (existingUser) {
      console.log('❌ Usuário já existe!');
      process.exit(1);
    }

    // Hash da senha
    const passwordHash = await bcrypt.hash(password, 10);

    // Criar usuário admin
    const result = await run(
      `INSERT INTO users (username, email, password_hash, role, full_name)
       VALUES (?, ?, ?, ?, ?)`,
      [username, email, passwordHash, 'admin', fullName]
    );

    console.log('✅ Usuário administrador criado com sucesso!');
    console.log(`ID: ${result.lastID}`);
    console.log('\n📝 Credenciais de acesso:');
    console.log(`   Username: ${username}`);
    console.log(`   Senha: ${password}`);
    console.log('\n⚠️  IMPORTANTE: Altere a senha após o primeiro login!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao criar usuário:', error);
    process.exit(1);
  }
}

createAdmin();

