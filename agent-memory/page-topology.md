# Page Topology

## Search / Filter

- `pages/index/index`
  - quick action `精准查找`
    - if saved search conditions exist: `pages/filter-result/index`
    - else: `pages/filter/index`
- `pages/filter/index`
  - CTA `立即搜索` -> `pages/filter-result/index`
- `pages/filter-result/index`
  - header back:
    - if entered from home with `from=index`, may return to `pages/index/index`
    - otherwise returns to previous page
  - `条件设置` -> `pages/filter/index`
  - `pages/filter/index` `立即搜索` -> `pages/filter-result/index`

## History

- `pages/index/index`
  - top-left / quick entry `历史推荐` -> `pages/history/index`

## Exposure

- `pages/index/index`
  - top quick-action `超级曝光` -> `pages/exposure/index?showGuide=true`
  - exposure preview section `查看全部` -> `pages/exposure/index?showGuide=false`

## Message / Chat

- `pages/message/index`
  - tapping a conversation item should enter `pages/chat/index`
- `pages/chat/index`
  - tapping the top header card -> guest detail
  - tapping the white summary card also follows the guest-detail route in the current implementation

## Guest Detail

- guest cards on home, records, and filter result can navigate to `pages/guest-detail/index`
- messaging/chat related routes can also deep link into guest detail

## Profile / Profile Preview / Profile Edit

- `pages/profile/index`
  - card CTA `预览资料` -> `pages/profile-preview/index`
  - card CTA `编辑资料` -> `pages/profile-edit/index`
  - `其他功能` 区域中的 `设置` -> `pages/settings/index`
  - tapping the profile card outside the edit CTA should also follow the preview flow by product intent
- `pages/profile-preview/index`
  - top `编辑资料` pill -> `pages/profile-edit/index`
  - bottom fixed red CTA `编辑资料` -> `pages/profile-edit/index`
- `pages/profile-edit/index`
  - belongs to the same profile-maintenance flow as `pages/profile/index` and `pages/profile-preview/index`

## Settings

- `pages/settings/index`
  - `红豆` -> `pages/beans/index`
  - `开启实名相亲` 在未实名时会弹确认框，并可去 `pages/realname-auth/index`
  - `屏蔽的人` -> `pages/settings-blocked/index`
  - `订单记录` -> `pages/settings-orders/index`
  - `用户协议 / 隐私政策 / 隐私政策摘要 / 个人信息收集清单 / 第三方共享个人信息清单 / 信息真实性承诺 / 申请注销账号` -> `pages/settings-doc/index?...`
  - `打招呼语` 是页内底部弹层，不跳路由
