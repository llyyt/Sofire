// 在Node环境中验证
const bcrypt = require('bcrypt');

async function checkPassword() {
  const isValid = await bcrypt.compare(
    'passwd123',
    '$2b$10$WtrS8ZC4QavzZ77GP420h.YK2Ttn2GZWj0owqhWdQE/TrP/m3yDMu'
  );
  console.log('密码验证结果:', isValid); // 应该输出 true
}

checkPassword();
