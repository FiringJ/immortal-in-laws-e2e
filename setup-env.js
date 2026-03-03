/**
 * E2E/Daemon 环境变量加载：
 * 1) 先加载 .env.local（本机覆盖）
 * 2) 再加载 .env（补齐缺失项，不覆盖 .env.local）
 */
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

const root = __dirname;
const localEnv = path.join(root, '.env.local');
if (fs.existsSync(localEnv)) {
  dotenv.config({ path: localEnv });
}

const baseEnv = path.join(root, '.env');
if (fs.existsSync(baseEnv)) {
  dotenv.config({ path: baseEnv });
}
