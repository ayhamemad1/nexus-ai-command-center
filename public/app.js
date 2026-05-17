const STORAGE_KEY = "nexus-ai-command-center-v1";

const state = {
  workspace: null,
  serverReady: false,
  hasServerKey: false,
  settings: {
    apiKey: "",
    model: "gpt-4.1-mini"
  }
};

const els = {
  navItems: document.querySelectorAll(".nav-item"),
  views: document.querySelectorAll(".view"),
  viewTitle: document.getElementById("view-title"),
  serverDot: document.getElementById("server-dot"),
  serverStatus: document.getElementById("server-status"),
  activeAgents: document.getElementById("active-agents"),
  riskCount: document.getElementById("risk-count"),
  portfolioValue: document.getElementById("portfolio-value"),
  automationCoverage: document.getElementById("automation-coverage"),
  executionHealth: document.getElementById("execution-health"),
  criticalExposure: document.getElementById("critical-exposure"),
  opsChart: document.getElementById("ops-chart"),
  riskChart: document.getElementById("risk-chart"),
  timelineList: document.getElementById("timeline-list"),
  agentGrid: document.getElementById("agent-grid"),
  projectBoard: document.getElementById("project-board"),
  riskList: document.getElementById("risk-list"),
  knowledgeList: document.getElementById("knowledge-list"),
  decisionList: document.getElementById("decision-list"),
  briefOutput: document.getElementById("brief-output"),
  briefSource: document.getElementById("brief-source"),
  generateBrief: document.getElementById("generate-brief"),
  exportReport: document.getElementById("export-report"),
  apiKey: document.getElementById("api-key"),
  modelSelect: document.getElementById("model-select"),
  knowledgeTitle: document.getElementById("knowledge-title"),
  knowledgeContent: document.getElementById("knowledge-content"),
  addKnowledge: document.getElementById("add-knowledge")
};

const currency = (value) => new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0
}).format(value || 0);

const escapeHtml = (value) => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");

function computeKpis() {
  const workspace = state.workspace;
  const projectValue = workspace.projects.reduce((sum, project) => sum + project.value, 0);
  const agentImpact = workspace.agents.reduce((sum, agent) => sum + agent.impact, 0);
  const portfolioValue = projectValue + agentImpact;
  const latestAutomation = workspace.metrics.at(-1)?.automation || 0;
  const avgProgress = workspace.projects.reduce((sum, project) => sum + project.progress, 0) / workspace.projects.length;
  const exposure = workspace.risks.reduce((sum, risk) => sum + Math.round((risk.probability * risk.impact) / 100), 0);
  const executionHealth = Math.max(0, Math.round(avgProgress - exposure / 12));

  return {
    portfolioValue,
    latestAutomation,
    executionHealth,
    exposure,
    activeAgents: workspace.agents.filter((agent) => agent.status === "active").length,
    openRisks: workspace.risks.length
  };
}

function saveState() {
  if (!state.workspace) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    workspace: state.workspace,
    settings: { ...state.settings, apiKey: "" }
  }));
}

async function loadWorkspace() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      state.workspace = parsed.workspace;
      state.settings = { ...state.settings, ...(parsed.settings || {}) };
      return;
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  const response = await fetch("./data/workspace.json");
  state.workspace = await response.json();
}

function switchView(view) {
  els.navItems.forEach((item) => item.classList.toggle("active", item.dataset.view === view));
  els.views.forEach((item) => item.classList.toggle("active", item.id === `${view}-view`));
  els.viewTitle.textContent = view[0].toUpperCase() + view.slice(1);
}

function statusBadge(value) {
  const cls = value === "critical" ? "critical" : value === "watch" || value === "at-risk" || value === "high" ? "watch" : "";
  return `<span class="badge ${cls}">${escapeHtml(value)}</span>`;
}

function renderKpis() {
  const kpis = computeKpis();
  els.activeAgents.textContent = kpis.activeAgents;
  els.riskCount.textContent = kpis.openRisks;
  els.portfolioValue.textContent = currency(kpis.portfolioValue);
  els.automationCoverage.textContent = `${kpis.latestAutomation}%`;
  els.executionHealth.textContent = kpis.executionHealth;
  els.criticalExposure.textContent = kpis.exposure;
}

function renderAgents() {
  els.agentGrid.innerHTML = state.workspace.agents.map((agent) => `
    <article class="agent-card">
      <div class="card-top">
        <h3>${escapeHtml(agent.name)}</h3>
        ${statusBadge(agent.status)}
      </div>
      <p class="muted">${escapeHtml(agent.role)}</p>
      <div class="progress"><span style="width:${agent.confidence}%"></span></div>
      <p class="muted">Confidence ${agent.confidence}% - Load ${agent.load}% - Impact ${currency(agent.impact)}</p>
      <p class="muted"><strong>Next:</strong> ${escapeHtml(agent.nextAction)}</p>
      <p>${agent.tools.map((tool) => `<span class="badge">${escapeHtml(tool)}</span>`).join(" ")}</p>
    </article>
  `).join("");
}

function renderProjects() {
  els.projectBoard.innerHTML = state.workspace.projects.map((project) => `
    <article class="project-card">
      <div class="card-top">
        <h3>${escapeHtml(project.name)}</h3>
        ${statusBadge(project.health)}
      </div>
      <p class="muted">Owner: ${escapeHtml(project.owner)}</p>
      <div class="progress"><span style="width:${project.progress}%"></span></div>
      <p class="muted">${project.progress}% complete - Due ${project.due}</p>
      <p class="muted">Value ${currency(project.value)} - Budget ${currency(project.budget)}</p>
      <div class="stack">
        ${project.tasks.map((task) => `<div class="stack-item"><p class="muted">${escapeHtml(task)}</p></div>`).join("")}
      </div>
    </article>
  `).join("");
}

function renderRisks() {
  const sorted = [...state.workspace.risks].sort((a, b) => (b.probability * b.impact) - (a.probability * a.impact));
  els.riskList.innerHTML = sorted.map((risk) => `
    <article class="stack-item">
      <div class="stack-title">
        <h3>${escapeHtml(risk.title)}</h3>
        ${statusBadge(risk.severity)}
      </div>
      <p class="muted">Owner: ${escapeHtml(risk.owner)} - Probability ${risk.probability}% - Impact ${risk.impact}%</p>
      <p class="muted"><strong>Mitigation:</strong> ${escapeHtml(risk.mitigation)}</p>
    </article>
  `).join("");
}

function renderKnowledge() {
  els.knowledgeList.innerHTML = state.workspace.knowledge.map((item) => `
    <article class="stack-item">
      <div class="stack-title"><h3>${escapeHtml(item.title)}</h3><span class="badge">memory</span></div>
      <p class="muted">${escapeHtml(item.content)}</p>
    </article>
  `).join("");
}

function renderTimeline() {
  els.timelineList.innerHTML = state.workspace.timeline.map((item) => `
    <article class="timeline-item">
      <div class="stack-title">
        <strong>${escapeHtml(item.time)}</strong>
        <span class="badge">${escapeHtml(item.type)}</span>
      </div>
      <p class="muted">${escapeHtml(item.event)}</p>
    </article>
  `).join("");
}

function renderDecisionQueue() {
  const risks = [...state.workspace.risks].sort((a, b) => (b.probability * b.impact) - (a.probability * a.impact)).slice(0, 3);
  const blocked = state.workspace.projects.filter((project) => ["critical", "at-risk", "watch"].includes(project.health));
  const decisions = [
    ...risks.map((risk) => ({
      title: `Approve mitigation for ${risk.owner}`,
      detail: risk.mitigation
    })),
    ...blocked.map((project) => ({
      title: `Review ${project.name}`,
      detail: `Progress is ${project.progress}% with ${currency(project.value)} value at stake.`
    }))
  ].slice(0, 6);

  els.decisionList.innerHTML = decisions.map((decision) => `
    <article class="stack-item">
      <h3>${escapeHtml(decision.title)}</h3>
      <p class="muted">${escapeHtml(decision.detail)}</p>
    </article>
  `).join("");
}

function renderOpsChart() {
  const canvas = els.opsChart;
  const ctx = canvas.getContext("2d");
  const metrics = state.workspace.metrics;
  const max = Math.max(...metrics.flatMap((m) => [m.revenue, m.cost]), 1);
  const baseY = canvas.height - 42;
  const width = (canvas.width - 90) / metrics.length;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#101620";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  metrics.forEach((point, index) => {
    const x = 50 + index * width;
    const revenueH = (point.revenue / max) * 220;
    const costH = (point.cost / max) * 220;
    const autoH = (point.automation / 100) * 220;

    ctx.fillStyle = "#38bdf8";
    ctx.fillRect(x, baseY - revenueH, 26, revenueH);
    ctx.fillStyle = "#fb7185";
    ctx.fillRect(x + 32, baseY - costH, 26, costH);
    ctx.fillStyle = "#34d399";
    ctx.fillRect(x + 64, baseY - autoH, 14, autoH);
    ctx.fillStyle = "#9aa8ba";
    ctx.fillText(point.month, x + 10, baseY + 24);
  });
}

function renderRiskChart() {
  const canvas = els.riskChart;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#101620";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = "#303a4d";

  for (let i = 1; i < 4; i += 1) {
    ctx.beginPath();
    ctx.moveTo((canvas.width / 4) * i, 0);
    ctx.lineTo((canvas.width / 4) * i, canvas.height);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, (canvas.height / 4) * i);
    ctx.lineTo(canvas.width, (canvas.height / 4) * i);
    ctx.stroke();
  }

  state.workspace.risks.forEach((risk) => {
    const x = (risk.probability / 100) * (canvas.width - 50) + 20;
    const y = canvas.height - ((risk.impact / 100) * (canvas.height - 50) + 20);
    ctx.beginPath();
    ctx.fillStyle = risk.severity === "critical" ? "#fb7185" : risk.severity === "high" ? "#f59e0b" : "#38bdf8";
    ctx.arc(x, y, 12, 0, Math.PI * 2);
    ctx.fill();
  });
}

function localBrief() {
  const kpis = computeKpis();
  const topRisk = [...state.workspace.risks].sort((a, b) => (b.probability * b.impact) - (a.probability * a.impact))[0];
  const weakProject = [...state.workspace.projects].sort((a, b) => a.progress - b.progress)[0];
  const topAgent = [...state.workspace.agents].sort((a, b) => b.impact - a.impact)[0];

  return `## Executive Summary
Portfolio value under active AI coordination is ${currency(kpis.portfolioValue)}. Automation coverage is ${kpis.latestAutomation}%, with execution health at ${kpis.executionHealth}/100.

## Highest Priority
${topRisk.title}. Owner: ${topRisk.owner}. Recommended mitigation: ${topRisk.mitigation}

## Execution Watch
${weakProject.name} is the lowest-progress project at ${weakProject.progress}% and has ${currency(weakProject.value)} value attached.

## Agent Leverage
${topAgent.name} has the highest tracked impact at ${currency(topAgent.impact)}. Next action: ${topAgent.nextAction}

## Decisions Needed
- Approve mitigation work for the top operational risk.
- Confirm owner for at-risk projects due within the next two weeks.
- Review agent actions that affect customers, contracts, or spend before execution.`;
}

async function generateBrief() {
  els.briefOutput.textContent = "Generating executive brief...";
  switchView("briefing");

  try {
    const response = await fetch("/api/brief", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        apiKey: state.settings.apiKey,
        model: state.settings.model,
        workspace: state.workspace
      })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "OpenAI request failed");
    els.briefOutput.textContent = data.text;
    els.briefSource.textContent = `Generated with ${data.model}`;
  } catch (error) {
    els.briefOutput.textContent = `${localBrief()}\n\nLocal fallback used: ${error.message}`;
    els.briefSource.textContent = "Local strategy engine";
  }
}

function exportReport() {
  const report = {
    generatedAt: new Date().toISOString(),
    workspace: state.workspace,
    kpis: computeKpis(),
    brief: els.briefOutput.textContent
  };
  const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "nexus-command-center-report.json";
  link.click();
  URL.revokeObjectURL(url);
}

async function checkServer() {
  try {
    const response = await fetch("/api/health");
    const data = await response.json();
    state.serverReady = Boolean(data.ok);
    state.hasServerKey = Boolean(data.hasServerKey);
    els.serverDot.className = "dot ready";
    els.serverStatus.textContent = state.hasServerKey ? "OpenAI proxy ready" : "Server ready, add key";
  } catch {
    state.serverReady = false;
    els.serverDot.className = "dot error";
    els.serverStatus.textContent = "Static local mode";
  }
}

function renderAll() {
  renderKpis();
  renderAgents();
  renderProjects();
  renderRisks();
  renderKnowledge();
  renderTimeline();
  renderDecisionQueue();
  renderOpsChart();
  renderRiskChart();
  saveState();
}

function wireEvents() {
  els.navItems.forEach((item) => item.addEventListener("click", () => switchView(item.dataset.view)));
  els.generateBrief.addEventListener("click", generateBrief);
  els.exportReport.addEventListener("click", exportReport);
  els.apiKey.addEventListener("input", () => {
    state.settings.apiKey = els.apiKey.value.trim();
    saveState();
  });
  els.modelSelect.addEventListener("change", () => {
    state.settings.model = els.modelSelect.value;
    saveState();
  });
  els.addKnowledge.addEventListener("click", () => {
    const title = els.knowledgeTitle.value.trim();
    const content = els.knowledgeContent.value.trim();
    if (!title || !content) return;
    state.workspace.knowledge.push({ title, content });
    els.knowledgeTitle.value = "";
    els.knowledgeContent.value = "";
    renderAll();
  });
}

await loadWorkspace();
wireEvents();
await checkServer();
els.apiKey.value = state.settings.apiKey;
els.modelSelect.value = state.settings.model;
renderAll();
