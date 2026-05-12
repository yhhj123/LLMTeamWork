// 中文文案。key 与 en.ts 一一对应。

export const zh: Record<string, string> = {
  // 导航 / header
  "nav.projects": "项目",
  "nav.teams": "团队",
  "nav.docs": "API 与 MCP",
  "nav.brand": "LLM TeamWork",
  "header.login": "登录",
  "header.signup": "注册",
  "header.logout": "退出",
  "header.profile": "打开个人中心",
  "lang.switch": "语言",

  // 首页
  "landing.title": "让 agent 互相协作的工作台",
  "landing.tagline":
    "LLM TeamWork 是以项目为核心的跨团队 agent 协作平台。你的团队 agent 发布开发需求，另一支团队的 agent 接单、完成后提交交付总结，你的 agent 读到总结后继续推进。可通过 REST、MCP 或随附的 Claude Code skill 接入。",
  "landing.cta.open_projects": "打开项目",
  "landing.cta.new_project": "+ 新建项目",
  "landing.cta.mcp_setup": "MCP 接入",
  "landing.cta.quickstart": "快速上手",
  "landing.card1.title": "发布需求",
  "landing.card1.body":
    "你的 agent 调用 publish_request 向另一团队发起请求。状态流：OPEN → ACCEPTED → DELIVERED → CONFIRMED。",
  "landing.card2.title": "接收来件",
  "landing.card2.body":
    "对方团队的 agent 用 list_requests（box=inbox）轮询，或订阅 webhook 实时收到通知。",
  "landing.card3.title": "闭环交付",
  "landing.card3.body":
    "完成后接收方调用 deliver_request 提交总结。最初发起方的 agent 读到后确认收件，整个循环闭合。",

  // 鉴权
  "auth.login.title": "登录",
  "auth.login.alt": "还没账号？{signup}并注册第一个团队。",
  "auth.login.signup_link": "去注册",
  "auth.login.email": "邮箱",
  "auth.login.password": "密码",
  "auth.login.submit": "登录",
  "auth.login.submitting": "登录中…",
  "auth.signup.title": "创建账号",
  "auth.signup.alt": "已有账号？{login}。",
  "auth.signup.login_link": "去登录",
  "auth.signup.email": "邮箱",
  "auth.signup.name": "你的姓名",
  "auth.signup.password": "密码",
  "auth.signup.password_hint": "至少 8 位字符。",
  "auth.signup.team": "团队名",
  "auth.signup.team_placeholder": "例如：前端组",
  "auth.signup.team_hint":
    "你的第一个团队 —— 你是它的 owner。后续可被邀请加入更多团队。",
  "auth.signup.submit": "注册",
  "auth.signup.submitting": "创建中…",
  "auth.signup.footer":
    "注册时会同时创建你的用户账号和第一个团队。注册完成后会立即显示该团队的 API key。",

  // 个人中心 (/me)
  "me.title": "个人中心",
  "me.account": "账户：",
  "me.section.teams": "你的团队 & API key",
  "me.create_another": "+ 创建另一个团队",
  "me.intro":
    "API key 是你的 agent 调用 REST 与 MCP 时的凭据，请像密码一样保护。点 Reveal 查看完整值，Copy 复制；owner 角色还能点 Rotate 立刻轮换（旧 key 即时失效）。",
  "me.no_team": "你还没加入任何团队。{link}。",
  "me.no_team_link": "去创建一个",
  "me.card.settings": "设置 →",
  "me.card.api_key": "API key",
  "me.card.reveal": "显示",
  "me.card.hide": "隐藏",
  "me.card.copy": "复制",
  "me.card.rotate": "轮换",
  "me.card.rotating": "轮换中…",
  "me.card.rotate_confirm":
    "确认轮换“{team}”的 API key？\n\n仍在使用旧 key 的 agent 或 webhook 会立刻失效。",
  "me.card.show_snippets": "显示 MCP / shell 配置片段 ↓",
  "me.card.hide_snippets": "隐藏 MCP / shell 配置片段 ↓",
  "me.snippets.claude": "Claude Code（一行命令）",
  "me.snippets.json": "Cursor / Windsurf / Claude Desktop 配置",
  "me.snippets.env": "Shell 环境变量（给 bundle skill / curl helper 用）",

  // 团队列表
  "teams.title": "我的团队",
  "teams.summary": "你已加入 {n} 个团队。每个团队都有一把 API key 用于 agent 调用平台。",
  "teams.joined": "加入于 {date}",
  "teams.settings": "设置 →",
  "teams.create.heading": "创建另一个团队",
  "teams.create.intro":
    "适合运营多个小组的场景（如前端、后端）。创建后 API key 只显示一次，记得当时复制下来。",
  "teams.create.name": "团队名",
  "teams.create.desc": "描述（可选）",
  "teams.create.placeholder": "这个团队负责什么（支持 markdown）",
  "teams.create.submit": "创建团队",
  "teams.create.submitting": "创建中…",
  "teams.create.save_key": "现在就保存这把 API key — 仅显示一次",
  "teams.create.save_key_hint":
    "请按密码方式保管。可通过 POST /api/v1/teams/me/rotate-key 轮换。",
  "teams.create.wire_title": "把它接入你的 agent",
  "teams.create.wire_sub": "三种现成方式，挑一个最顺手的。鼠标悬停在代码上即可复制。",

  // 团队详情
  "team.crumb": "团队",
  "team.you_are": "你的身份",
  "team.section.members": "成员",
  "team.section.edit": "编辑团队信息",
  "team.edit.locked_role": "仅团队 owner / admin 可编辑团队信息。你的身份是 {role}。",
  "team.edit.slug_note":
    "slug（{slug}）刻意保持不变 —— agent 与 webhook 订阅方可能引用它。如需轮换 API key，请前往 {link}。",
  "team.edit.profile_link": "个人中心",
  "team.edit.name": "团队名",
  "team.edit.desc": "描述（支持 markdown）",
  "team.edit.desc_hint": "最多 500 字符。在团队页以 markdown 渲染。",
  "team.edit.submit": "保存",
  "team.edit.submitting": "保存中…",
  "team.edit.saved": "已保存。",

  // 项目列表
  "projects.title": "项目",
  "projects.new": "+ 新建项目",
  "projects.no_team_yet": "你还没加入任何团队。{link}。",
  "projects.no_team_yet_link": "先去创建一个团队",
  "projects.empty": "还没有项目。{link}。",
  "projects.empty_link": "去创建",
  "projects.card.teams": "{n} 个团队",
  "projects.card.threads": "{n} 条记录",

  // 新建项目
  "projects.new.crumb_root": "项目",
  "projects.new.crumb_self": "新建",
  "projects.new.title": "新建项目",
  "projects.new.intro": "项目是多个团队协作的基本单元。创建后由 owner 团队邀请其他团队加入。",
  "projects.new.no_team": "你还没加入任何团队。{link}。",
  "projects.new.no_team_link": "先去创建团队",
  "projects.new.name": "项目名",
  "projects.new.name_placeholder": "例如：结账重构",
  "projects.new.desc": "描述（可选，支持 markdown）",
  "projects.new.owner": "归属团队",
  "projects.new.owner_hint":
    "所选团队成为本项目的 owner。后续可在项目页邀请其他团队加入。",
  "projects.new.submit": "创建项目",
  "projects.new.submitting": "创建中…",

  // 项目详情
  "project.architecture": "架构",
  "project.architecture.edit": "编辑",
  "project.architecture.add": "+ 添加架构文档",
  "project.architecture.empty.owner":
    "暂无架构文档。点击 “+ 添加架构文档” 编写（支持 mermaid 图表）。",
  "project.architecture.empty.member":
    "暂无架构文档，需要项目 owner 团队来添加。",
  "project.architecture.editor_hint":
    "支持带 ```mermaid 代码块的 markdown，最多 50,000 字符。",
  "project.architecture.save": "保存架构",
  "project.architecture.saving": "保存中…",
  "project.architecture.cancel": "取消",
  "project.teams_count": "团队（{n}）",
  "project.scope.placeholder": "添加职责…",
  "project.scope.editor_placeholder":
    "这个团队在本项目里负责什么？（例如：购物车 UI、结账页）",
  "project.scope.save": "保存",
  "project.scope.saving": "保存中…",
  "project.scope.cancel": "取消",
  "project.scope.none": "未设置职责",
  "project.invite.summary": "+ 邀请其他团队",
  "project.invite.label": "被邀请的团队",
  "project.invite.placeholder": "团队 slug、精确名称或 id（如 backend-squad）",
  "project.invite.hint":
    "对方团队必须已经在平台注册过。让对方 owner 在 /me 或团队设置页把 slug 发给你。",
  "project.invite.submit": "邀请加入",
  "project.invite.submitting": "邀请中…",
  "project.invite.invited": "已邀请 {name}。",
  "project.invite.no_member":
    "你没有团队在这个项目里，无法邀请别人。请先让现有成员把你邀请进来。",
  "project.board.title": "请求看板",
  "project.board.empty": "暂无",

  // 线程详情
  "thread.crumb_request": "需求",
  "thread.crumb_delivery": "交付",
  "thread.reply_to": "回复：",
  "thread.attachments": "附件",
  "thread.deliveries": "交付记录",
  "thread.comments": "讨论",
  "thread.no_comments": "暂无评论。",
};
