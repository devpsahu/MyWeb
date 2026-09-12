// Usage: node setup-admin.js <username> <password>
// Rewrites the ADMIN_USERNAME and ADMIN_PASSWORD_HASH lines in .env.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const [, , username, password] = process.argv;

if (!username || !password) {
  console.log('Usage: node setup-admin.js <username> <password>');
  process.exit(1);
}

const salt = crypto.randomBytes(16).toString('hex');
const hash = crypto.scryptSync(password, salt, 64).toString('hex');
const hashLine = `${salt}:${hash}`;

const envPath = path.join(__dirname, '.env');
let env = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';

if (env.match(/^ADMIN_USERNAME=.*$/m)) {
  env = env.replace(/^ADMIN_USERNAME=.*$/m, `ADMIN_USERNAME=${username}`);
} else {
  env += `\nADMIN_USERNAME=${username}`;
}

if (env.match(/^ADMIN_PASSWORD_HASH=.*$/m)) {
  env = env.replace(/^ADMIN_PASSWORD_HASH=.*$/m, `ADMIN_PASSWORD_HASH=${hashLine}`);
} else {
  env += `\nADMIN_PASSWORD_HASH=${hashLine}`;
}

fs.writeFileSync(envPath, env);
console.log('Admin credentials updated in .env. Restart the server for it to take effect.');
