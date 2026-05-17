# Nexus AI Command Center

A massive enterprise-style AI operations command center for coordinating AI agents, projects, risks, executive decisions, knowledge memory, and automated briefings.

This is designed as a portfolio-grade showcase project: it looks like a serious internal tool a company could use to supervise AI agents across revenue, finance, support, product, compliance, and operations.

## What It Does

Nexus AI Command Center gives executives and operators one place to monitor:

- AI agent performance and workload
- Project progress and business value
- Operational risk and mitigation plans
- Live event timeline
- Knowledge base memory
- Decision queue
- Executive brief generation
- Portfolio KPIs and operating trends
- Optional OpenAI-powered board memo generation

## Major Features

- Multi-agent command dashboard
- Agent cards with status, confidence, workload, impact, tools, and next action
- Project board with progress, value, budget, due dates, and task lists
- Risk register with impact/probability scoring
- Risk matrix canvas visualization
- Operating trend chart for revenue, cost, tickets, and automation
- Live timeline feed
- Local knowledge base with custom memory entries
- Decision queue generated from risks and weak projects
- Local executive brief engine
- Optional OpenAI Responses API backend proxy
- JSON report export
- Sample enterprise workspace data
- No frontend build step
- No required npm dependencies

## Screens

- Overview: KPIs, operating chart, live timeline
- Agents: multi-agent cards and operational next actions
- Projects: project portfolio board
- Risk: risk register and risk matrix
- Knowledge: operating memory and policy context
- Briefing: executive memo and decision queue

## Quick Start

Requires Node.js 18 or newer.

```bash
npm start
```

Open:

```text
http://localhost:5190
```

The app works without an API key using the local strategy engine.

## Optional OpenAI Briefs

Set your API key before starting:

```powershell
$env:OPENAI_API_KEY="your_api_key_here"
npm start
```

Then click `Generate brief`.

The backend uses:

- [OpenAI Responses API](https://platform.openai.com/docs/api-reference/responses)
- [OpenAI models documentation](https://platform.openai.com/docs/models)

## Project Structure

```text
nexus-ai-command-center/
  public/
    data/
      workspace.json
    index.html
    styles.css
    app.js
  server.js
  package.json
  README.md
  LICENSE
```

## Why This Project Is Big

Most AI demos are a chat box. This project is an operations platform:

- It models a full business workspace.
- It has multiple agent personas and responsibilities.
- It tracks risk, value, execution, automation, and decisions.
- It includes visual analytics.
- It supports local operation and optional AI enhancement.
- It is easy to extend into a real SaaS dashboard.

## Possible Extensions

- Real authentication
- User roles and permissions
- SQLite or Postgres persistence
- Agent run history
- Tool execution audit logs
- Streaming OpenAI responses
- File upload for policies and reports
- Calendar and task integration
- GitHub/Slack/Linear connectors
- Docker deployment
- Multi-tenant workspaces
- Real-time WebSocket event feed

## Security Notes

- Keep `OPENAI_API_KEY` on the server for real deployments.
- The temporary key field is only for local demos.
- Agents in this demo recommend actions but do not execute external side effects.
- Human approval should be required for spend, contracts, customer communication, or compliance decisions.

## License

MIT
