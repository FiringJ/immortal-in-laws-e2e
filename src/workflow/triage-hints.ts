import type { WorkflowItem } from './types';

type TriageHints = {
  moduleLabel?: string;
  routeHints: string[];
  serviceHints: string[];
  docHints: string[];
};

type HintRule = {
  matchers: string[];
  moduleLabel: string;
  routeHints: string[];
  serviceHints: string[];
  docHints: string[];
};

const RULES: HintRule[] = [
  {
    matchers: ['精准查找', '搜索结果', '筛选结果', '年份筛选', '身高筛选', '地区选择'],
    moduleLabel: '精准查找 / 搜索结果',
    routeHints: ['pages/filter/index', 'pages/filter-result/index'],
    serviceHints: ['services/guest.ts', 'services/region.ts'],
    docHints: ['agent-memory/page-topology.md', 'design/4.项目结构分析/项目结构分析.md'],
  },
  {
    matchers: ['实名认证', '实名相亲'],
    moduleLabel: '实名认证',
    routeHints: ['pages/realname-auth/index', 'pages/profile/index'],
    serviceHints: ['services/user.ts', 'services/order.ts'],
    docHints: ['design/1.需求文档/神仙亲家--小程序产品需求文档.md', 'design/DESIGN_DIRECTORY_STRUCTURE.md'],
  },
  {
    matchers: ['会员中心', '黄金会员', '至尊会员', '开通会员'],
    moduleLabel: '会员中心',
    routeHints: ['pages/member-center/index', 'pages/profile/index'],
    serviceHints: ['services/member.ts', 'services/order.ts', 'services/api-mapper.ts'],
    docHints: ['agent-memory/project-knowledge.md', 'design/4.项目结构分析/项目结构分析.md'],
  },
  {
    matchers: ['设置页', '通知权限', '个性化推荐', '打招呼语', '订单记录', '屏蔽的人'],
    moduleLabel: '设置',
    routeHints: ['pages/settings/index', 'pages/settings-orders/index', 'pages/settings-blocked/index'],
    serviceHints: ['services/settings.ts', 'services/order.ts'],
    docHints: ['agent-memory/page-topology.md', 'design/4.项目结构分析/项目结构分析.md'],
  },
  {
    matchers: ['浏览/收藏/解锁记录', '看过我', '我看过', '收藏我', '我收藏', '解锁我', '我解锁'],
    moduleLabel: '记录页',
    routeHints: ['pages/message-record/index'],
    serviceHints: ['services/record.ts', 'services/member.ts'],
    docHints: ['design/1.需求文档/神仙亲家--小程序产品需求文档.md', 'design/4.项目结构分析/项目结构分析.md'],
  },
  {
    matchers: ['私信', '会话', '交换微信', '发送照片', '拨打电话', '语音'],
    moduleLabel: '私信会话',
    routeHints: ['pages/message/index', 'pages/chat/index'],
    serviceHints: ['services/message.ts', 'services/message-socket.ts', 'services/member.ts'],
    docHints: ['agent-memory/project-knowledge.md', 'design/1.需求文档/神仙亲家--小程序产品需求文档.md'],
  },
  {
    matchers: ['邀请有奖', '邀请好友', '分享领现金', '收益明细', '我的邀请', '现金提现'],
    moduleLabel: '邀请',
    routeHints: ['pages/invite/index'],
    serviceHints: ['services/family.ts'],
    docHints: ['agent-memory/workflows/items/wf-2026-03-13T18-18-12-199Z-qp5ang/plan.md', 'design/1.需求文档/神仙亲家--小程序产品需求文档.md'],
  },
  {
    matchers: ['我的首页', '其他功能', '相亲红豆', '账号切换', '个人主页'],
    moduleLabel: '我的首页',
    routeHints: ['pages/profile/index', 'pages/profile-preview/index', 'pages/profile-edit/index'],
    serviceHints: ['services/user.ts', 'services/member.ts'],
    docHints: ['agent-memory/page-topology.md', 'agent-memory/project-knowledge.md'],
  },
  {
    matchers: ['超级曝光', '曝光'],
    moduleLabel: '超级曝光',
    routeHints: ['pages/exposure/index', 'pages/index/index'],
    serviceHints: ['services/exposure.ts', 'services/order.ts'],
    docHints: ['agent-memory/project-knowledge.md', 'design/1.需求文档/神仙亲家--小程序产品需求文档.md'],
  },
];

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

export function deriveTriageHints(item: WorkflowItem): TriageHints {
  const haystack = [
    item.title,
    item.rawInput,
    item.sourceMeta?.parentRecord || '',
    item.sourceMeta?.notes || '',
  ].join('\n');

  const matched = RULES.filter((rule) => rule.matchers.some((matcher) => haystack.includes(matcher)));
  return {
    moduleLabel: matched[0]?.moduleLabel,
    routeHints: unique(matched.flatMap((rule) => rule.routeHints)),
    serviceHints: unique(matched.flatMap((rule) => rule.serviceHints)),
    docHints: unique([
      'agent-memory/page-topology.md',
      'agent-memory/project-knowledge.md',
      ...matched.flatMap((rule) => rule.docHints),
    ]),
  };
}
