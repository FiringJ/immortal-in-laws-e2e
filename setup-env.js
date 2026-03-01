/**
 * E2E 测试环境：优先加载 .env.local（视觉模型配置）
 */
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

const root = __dirname;
const localEnv = path.join(root, '.env.local');
if (fs.existsSync(localEnv)) {
  dotenv.config({ path: localEnv });
}
