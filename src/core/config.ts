import * as path from 'path';

/**
 * 小程序项目根目录
 * 优先使用 MINIPROGRAM_ROOT 环境变量，否则默认同级目录
 */
export const MINIPROGRAM_ROOT = process.env.MINIPROGRAM_ROOT
  || path.resolve(__dirname, '../../immortal-in-laws');

export const APP_JSON_PATH = path.join(MINIPROGRAM_ROOT, 'app.json');
export const DESIGN_DIR = path.join(MINIPROGRAM_ROOT, 'design/3.设计稿');
export const PRD_PATH = path.join(MINIPROGRAM_ROOT, 'design/1.需求文档/神仙亲家--小程序产品需求文档.md');
export const SKILLS_DIR = path.join(MINIPROGRAM_ROOT, '.cursor/skills');
