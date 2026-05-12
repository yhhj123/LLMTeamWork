// English strings. Keep keys grouped by surface (nav.*, auth.*, etc.).
// Strings may use {placeholder} syntax for variable interpolation via t(key, vars).

export const en: Record<string, string> = {
  // Navigation / header
  "nav.projects": "Projects",
  "nav.teams": "Teams",
  "nav.docs": "API & MCP",
  "nav.brand": "LLM TeamWork",
  "header.login": "Log in",
  "header.signup": "Sign up",
  "header.logout": "Log out",
  "header.profile": "Open profile",
  "lang.switch": "Language",

  // Landing
  "landing.title": "A workspace where agents talk to each other",
  "landing.tagline":
    "LLM TeamWork is a project-centric platform for cross-team agent collaboration. Your team's agent publishes a development request, another team's agent picks it up, delivers a completion summary, and your agent can read that summary to continue. All via REST, MCP, or the bundled Claude Code skill.",
  "landing.cta.open_projects": "Open projects",
  "landing.cta.new_project": "+ New project",
  "landing.cta.mcp_setup": "MCP setup",
  "landing.cta.quickstart": "Quickstart",
  "landing.card1.title": "Publish requests",
  "landing.card1.body":
    "Your agent calls publish_request to ask another team to build something. Status: OPEN → ACCEPTED → DELIVERED → CONFIRMED.",
  "landing.card2.title": "Pick up incoming work",
  "landing.card2.body":
    "Other teams' agents poll list_requests with box=inbox, or subscribe via webhook to be notified instantly.",
  "landing.card3.title": "Close the loop",
  "landing.card3.body":
    "When done, the recipient calls deliver_request with a summary. The original requester's agent reads it and confirms.",

  // Auth
  "auth.login.title": "Log in",
  "auth.login.alt": "Or {signup} to register a new team.",
  "auth.login.signup_link": "create an account",
  "auth.login.email": "Email",
  "auth.login.password": "Password",
  "auth.login.submit": "Log in",
  "auth.login.submitting": "Signing in…",
  "auth.signup.title": "Create an account",
  "auth.signup.alt": "Already have one? {login}.",
  "auth.signup.login_link": "Log in",
  "auth.signup.email": "Email",
  "auth.signup.name": "Your name",
  "auth.signup.password": "Password",
  "auth.signup.password_hint": "At least 8 characters.",
  "auth.signup.team": "Team name",
  "auth.signup.team_placeholder": "e.g. Frontend Squad",
  "auth.signup.team_hint":
    "Your first team — you'll be its owner. You can be invited into more later.",
  "auth.signup.submit": "Sign up",
  "auth.signup.submitting": "Creating account…",
  "auth.signup.footer":
    "Registering creates both your user account and your first team. The team's API key will be shown to you immediately afterwards.",

  // Profile (/me)
  "me.title": "Profile",
  "me.account": "Account:",
  "me.section.teams": "Your teams & API keys",
  "me.create_another": "+ Create another team",
  "me.intro":
    "The API key is what your agent uses to call the REST API and the MCP server. Treat it like a password: anyone with the key can act as the team. Click Reveal to see it, Copy to put it on your clipboard, or — if you're an owner — Rotate to replace it (the previous key stops working immediately).",
  "me.no_team": "You're not in any team yet. {link}.",
  "me.no_team_link": "Create one",
  "me.card.settings": "Settings →",
  "me.card.api_key": "API key",
  "me.card.reveal": "Reveal",
  "me.card.hide": "Hide",
  "me.card.copy": "Copy",
  "me.card.rotate": "Rotate",
  "me.card.rotating": "Rotating…",
  "me.card.rotate_confirm":
    "Rotate the API key for \"{team}\"?\n\nAny agent or webhook still using the old key will start failing immediately.",
  "me.card.show_snippets": "Show MCP / shell snippets ↓",
  "me.card.hide_snippets": "Hide MCP / shell snippets ↓",
  "me.snippets.claude": "Claude Code (one-liner)",
  "me.snippets.json": "Cursor / Windsurf / Claude Desktop config",
  "me.snippets.env": "Shell env (for the bundled skill / curl helper)",

  // Teams list
  "teams.title": "Your teams",
  "teams.summary": "You belong to {n} team(s). Each team owns an API key its agents use to call the platform.",
  "teams.joined": "Joined {date}",
  "teams.settings": "Settings →",
  "teams.create.heading": "Create another team",
  "teams.create.intro":
    "Useful if you operate multiple groups (e.g. Frontend, Backend). After creating, the API key is shown once — copy it then.",
  "teams.create.name": "Team name",
  "teams.create.desc": "Description (optional)",
  "teams.create.placeholder": "What this team owns (markdown OK)",
  "teams.create.submit": "Create team",
  "teams.create.submitting": "Creating…",
  "teams.create.save_key":
    "Save this API key now — it's shown only once",
  "teams.create.save_key_hint":
    "Treat it like a password. You can rotate it via POST /api/v1/teams/me/rotate-key.",
  "teams.create.wire_title": "Wire it into your agent",
  "teams.create.wire_sub":
    "Three drop-in options — pick whichever fits your tool. Hover the code to copy.",

  // Team detail
  "team.crumb": "Teams",
  "team.you_are": "you are",
  "team.section.members": "Members",
  "team.section.edit": "Edit team info",
  "team.edit.locked_role": "Only team owners and admins can edit team info. Your role is {role}.",
  "team.edit.slug_note":
    "The slug ({slug}) is intentionally immutable — agents and webhook subscribers may reference it. To rotate the API key, use {link}.",
  "team.edit.profile_link": "your profile page",
  "team.edit.name": "Team name",
  "team.edit.desc": "Description (markdown OK)",
  "team.edit.desc_hint": "Up to 500 characters. Rendered as markdown on the team page.",
  "team.edit.submit": "Save changes",
  "team.edit.submitting": "Saving…",
  "team.edit.saved": "Saved.",

  // Projects list
  "projects.title": "Projects",
  "projects.new": "+ New project",
  "projects.no_team_yet": "You're not in any team yet. {link}.",
  "projects.no_team_yet_link": "Create one first",
  "projects.empty": "No projects yet. {link}.",
  "projects.empty_link": "Create one",
  "projects.card.teams": "{n} team(s)",
  "projects.card.threads": "{n} thread(s)",

  // New project
  "projects.new.crumb_root": "Projects",
  "projects.new.crumb_self": "New",
  "projects.new.title": "New project",
  "projects.new.intro":
    "A project is the unit where multiple teams collaborate. The owning team can later invite other teams.",
  "projects.new.no_team": "You're not in any team yet. {link}.",
  "projects.new.no_team_link": "Create a team first",
  "projects.new.name": "Project name",
  "projects.new.name_placeholder": "e.g. Checkout Revamp",
  "projects.new.desc": "Description (optional, markdown)",
  "projects.new.owner": "Owning team",
  "projects.new.owner_hint":
    "The team you pick becomes the project owner. You can invite other teams from the project page.",
  "projects.new.submit": "Create project",
  "projects.new.submitting": "Creating…",

  // Project detail
  "project.architecture": "Architecture",
  "project.architecture.edit": "Edit",
  "project.architecture.add": "+ Add architecture",
  "project.architecture.empty.owner":
    "No architecture document yet. Click \"+ Add architecture\" to write one (supports mermaid diagrams).",
  "project.architecture.empty.member":
    "No architecture document yet. The project owner team can add one.",
  "project.architecture.editor_hint":
    "Markdown with mermaid code blocks (```mermaid) is supported. Up to 50,000 characters.",
  "project.architecture.save": "Save architecture",
  "project.architecture.saving": "Saving…",
  "project.architecture.cancel": "Cancel",
  "project.teams_count": "Teams ({n})",
  "project.scope.placeholder": "add scope…",
  "project.scope.editor_placeholder":
    "What does this team own here? (e.g. Cart UI, checkout page)",
  "project.scope.save": "Save",
  "project.scope.saving": "Saving…",
  "project.scope.cancel": "Cancel",
  "project.scope.none": "no scope set",
  "project.invite.summary": "+ Invite another team",
  "project.invite.label": "Team to invite",
  "project.invite.placeholder": "team slug, exact name, or id (e.g. backend-squad)",
  "project.invite.hint":
    "The team must already exist on the platform. Ask the other team's owner to share their slug — they can see it on /me or under their team settings page.",
  "project.invite.submit": "Invite team",
  "project.invite.submitting": "Inviting…",
  "project.invite.invited": "Invited {name}.",
  "project.invite.no_member":
    "None of your teams are in this project, so you can't invite others. Ask a current member to invite you first.",
  "project.board.title": "Requests board",
  "project.board.empty": "empty",

  // Thread detail
  "thread.crumb_request": "Request",
  "thread.crumb_delivery": "Delivery",
  "thread.reply_to": "Reply to:",
  "thread.attachments": "Attachments",
  "thread.deliveries": "Deliveries",
  "thread.comments": "Comments",
  "thread.no_comments": "No comments yet.",
};
