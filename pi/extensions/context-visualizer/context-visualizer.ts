/**
 * Context Visualizer Extension
 *
 * Graphically shows how much of the LLM context window is filled and which
 * parts are cached. Renders as a persistent widget below the editor and an
 * optional status indicator in the footer.
 *
 * Install: copy this file to ~/.pi/agent/extensions/context-visualizer.ts
 *          or .pi/extensions/context-visualizer.ts (project-local)
 */

import type {
  AssistantMessage,
  ExtensionAPI,
  ExtensionContext,
} from "@earendil-works/pi-coding-agent";
import {
  truncateToWidth,
  visibleWidth,
} from "@earendil-works/pi-tui";

// ── Types ──────────────────────────────────────────────────────────────

type CacheInfo = {
  cacheRead: number;
  cacheWrite: number;
  totalInput: number;
  totalOutput: number;
};

type ContextBreakdown = {
  systemTokens: number;
  cachedHistoryTokens: number;
  uncachedHistoryTokens: number;
  outputTokens: number;
  currentInputTokens: number;
  totalTokens: number;
  contextWindow: number;
  freeTokens: number;
};

// ── State ──────────────────────────────────────────────────────────────

let enabled = true;
let lastCacheInfo: CacheInfo | undefined;
let showExpanded = false;

// ── Helpers ────────────────────────────────────────────────────────────

function fmtK(n: number): string {
  if (n < 1000) return `${n}`;
  if (n < 1_000_000) return `${(n / 1000).toFixed(1)}k`;
  return `${(n / 1_000_000).toFixed(2)}M`;
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function segmentWidth(total: number, part: number, barWidth: number): number {
  if (total <= 0) return 0;
  const ratio = part / total;
  return Math.max(0, Math.round(ratio * barWidth));
}

function buildBreakdown(
  ctx: ExtensionContext,
  cacheInfo?: CacheInfo
): ContextBreakdown | null {
  const model = ctx.model;
  if (!model) return null;

  const usage = ctx.getContextUsage();
  const contextWindow = model.contextWindow ?? 0;
  const totalTokens = usage?.tokens ?? 0;
  const freeTokens = Math.max(0, contextWindow - totalTokens);

  // Walk the branch to estimate breakdown
  const branch = ctx.sessionManager.getBranch();
  let systemTokens = 0;
  let cachedHistoryTokens = 0;
  let uncachedHistoryTokens = 0;
  let outputTokens = 0;
  let currentInputTokens = 0;

  // Detect system prompt size via heuristic: first ~512 tokens are usually
  // system prompt + context files. We refine this by checking the actual
  // assistant message usage deltas.
  const firstAssistant = branch.find(
    (e) => e.type === "message" && e.message.role === "assistant"
  );
  if (firstAssistant && firstAssistant.type === "message") {
    const msg = firstAssistant.message as AssistantMessage;
    if (msg.usage) {
      systemTokens = Math.max(0, msg.usage.input - Math.round(msg.usage.output / 2));
    }
  }
  systemTokens = clamp(systemTokens, 0, totalTokens);

  // Accumulate history from assistant messages
  for (const entry of branch) {
    if (entry.type === "message" && entry.message.role === "assistant") {
      const msg = entry.message as AssistantMessage;
      if (!msg.usage) continue;
      outputTokens += msg.usage.output;
      const inputThisTurn = msg.usage.input;
      // Roughly estimate how much of this turn's input is history vs system
      const historyInput = Math.max(0, inputThisTurn - systemTokens);
      // If we have cache info, attribute cache read to cached history
      const cachedThisTurn = msg.usage.cacheRead ?? 0;
      const cachedPart = Math.min(cachedThisTurn, historyInput);
      cachedHistoryTokens += cachedPart;
      uncachedHistoryTokens += historyInput - cachedPart;
      // After first assistant, system is already accounted
      systemTokens = 0;
    }
  }

  // If we got explicit cache info from the latest response, use it
  if (cacheInfo) {
    cachedHistoryTokens = cacheInfo.cacheRead;
    // Adjust uncached to account for explicit cache read
    const totalHistory = cachedHistoryTokens + uncachedHistoryTokens;
    if (totalHistory > 0) {
      const scale = totalHistory > 0 ? (cacheInfo.totalInput - systemTokens - outputTokens) / totalHistory : 1;
      cachedHistoryTokens = Math.round(cachedHistoryTokens * scale);
      uncachedHistoryTokens = Math.max(0, Math.round(uncachedHistoryTokens * scale));
    }
  }

  // Current input = latest user message (if agent just started) or 0
  const lastEntry = branch[branch.length - 1];
  if (lastEntry?.type === "message" && lastEntry.message.role === "user") {
    const content = lastEntry.message.content;
    let text = "";
    if (typeof content === "string") {
      text = content;
    } else if (Array.isArray(content)) {
      text = content.map((c) => (c.type === "text" ? c.text : "")).join(" ");
    }
    currentInputTokens = Math.round(text.length / 4); // very rough heuristic
  }

  // Normalize so sum <= totalTokens
  const accounted = systemTokens + cachedHistoryTokens + uncachedHistoryTokens + outputTokens + currentInputTokens;
  if (accounted > totalTokens && totalTokens > 0) {
    const scale = totalTokens / accounted;
    systemTokens = Math.round(systemTokens * scale);
    cachedHistoryTokens = Math.round(cachedHistoryTokens * scale);
    uncachedHistoryTokens = Math.round(uncachedHistoryTokens * scale);
    outputTokens = Math.round(outputTokens * scale);
    currentInputTokens = Math.round(currentInputTokens * scale);
  }

  return {
    systemTokens,
    cachedHistoryTokens,
    uncachedHistoryTokens,
    outputTokens,
    currentInputTokens,
    totalTokens,
    contextWindow,
    freeTokens,
  };
}

function renderBar(
  breakdown: ContextBreakdown,
  barWidth: number,
  theme: ExtensionContext["ui"]["theme"]
): string {
  const total = breakdown.totalTokens + breakdown.freeTokens;
  if (total <= 0) return "";

  const wSys = segmentWidth(total, breakdown.systemTokens, barWidth);
  const wCache = segmentWidth(total, breakdown.cachedHistoryTokens, barWidth);
  const wUncached = segmentWidth(total, breakdown.uncachedHistoryTokens, barWidth);
  const wOut = segmentWidth(total, breakdown.outputTokens, barWidth);
  const wInput = segmentWidth(total, breakdown.currentInputTokens, barWidth);
  const wFree = Math.max(0, barWidth - (wSys + wCache + wUncached + wOut + wInput));

  const cFree = "░";   // empty / free
  const cCached = "▒"; // cached
  const cUsed = "▓";   // filled / used

  const sys = theme.fg("accent", cUsed.repeat(wSys));
  const cached = theme.fg("success", cCached.repeat(wCache));
  const uncached = theme.fg("warning", cUsed.repeat(wUncached));
  const out = theme.fg("error", cUsed.repeat(wOut));
  const inp = theme.fg("muted", cUsed.repeat(wInput));
  const free = theme.fg("dim", cFree.repeat(wFree));

  return sys + cached + uncached + out + inp + free;
}

function renderWidgetLines(
  breakdown: ContextBreakdown,
  width: number,
  theme: ExtensionContext["ui"]["theme"]
): string[] {
  const pad = "  ";
  const innerWidth = Math.max(1, width - visibleWidth(pad));

  const pctVal = breakdown.contextWindow > 0
    ? (breakdown.totalTokens / breakdown.contextWindow) * 100
    : 0;
  const pct = pctVal.toFixed(1);

  const barWidth = Math.max(8, Math.floor((width - 20) / 10));
  const bar = renderBar(breakdown, barWidth, theme);

  const pctColor = pctVal < 40 ? "success" : pctVal < 60 ? "warning" : "error";
  const info = theme.fg(pctColor, `${pct}% (${fmtK(breakdown.totalTokens)} / ${fmtK(breakdown.contextWindow)})`);

  const line = truncateToWidth(bar + " " + info, innerWidth);
  return [pad + line];
}

function updateDisplay(ctx: ExtensionContext) {
  if (!enabled || !ctx.hasUI) return;

  const theme = ctx.ui.theme;
  const breakdown = buildBreakdown(ctx, lastCacheInfo);
  if (!breakdown) {
    ctx.ui.setWidget("context-viz", undefined);
    ctx.ui.setStatus("context-viz", undefined);
    return;
  }

  const pctVal = breakdown.contextWindow > 0
    ? (breakdown.totalTokens / breakdown.contextWindow) * 100
    : 0;

  if (showExpanded) {
    ctx.ui.setStatus("context-viz", undefined);
    ctx.ui.setWidget("context-viz", (tui, th) => {
      return {
        render(width: number) {
          const barWidth = Math.max(8, Math.floor((width - 20) / 10));
          const bar = renderBar(breakdown, barWidth, th);
          const pct = pctVal.toFixed(1);
          const pctColor = pctVal < 40 ? "success" : pctVal < 60 ? "warning" : "error";
          const info = th.fg(pctColor, `${pct}% (${fmtK(breakdown.totalTokens)} / ${fmtK(breakdown.contextWindow)})`);
          const pad = "  ";
          const innerWidth = Math.max(1, width - visibleWidth(pad));
          const line = truncateToWidth(bar + " " + info, innerWidth);
          return [pad + line];
        },
        invalidate() {},
      };
    }, { placement: "belowEditor" });
  } else {
    ctx.ui.setWidget("context-viz", undefined);
    const pct = pctVal.toFixed(0);
    const statusText = theme.fg(pctVal > 90 ? "error" : "dim", `ctx:${pct}%`);
    ctx.ui.setStatus("context-viz", statusText);
  }
}

// ── Extension Factory ──────────────────────────────────────────────────

export default function (pi: ExtensionAPI) {
  // Toggle command
  pi.registerCommand("context-viz", {
    description: "Toggle context visualizer (compact/expanded/off)",
    handler: async (_args, ctx) => {
      if (!enabled) {
        enabled = true;
        showExpanded = false;
        ctx.ui.notify("Context visualizer: compact", "info");
      } else if (!showExpanded) {
        showExpanded = true;
        ctx.ui.notify("Context visualizer: expanded", "info");
      } else {
        enabled = false;
        showExpanded = false;
        ctx.ui.setWidget("context-viz", undefined);
        ctx.ui.setStatus("context-viz", undefined);
        ctx.ui.notify("Context visualizer: off", "info");
        return;
      }
      updateDisplay(ctx);
    },
  });

  // Listen for events that change context
  pi.on("session_start", async (_event, ctx) => {
    lastCacheInfo = undefined;
    updateDisplay(ctx);
  });

  pi.on("agent_start", async (_event, ctx) => {
    lastCacheInfo = undefined;
    updateDisplay(ctx);
  });

  pi.on("message_end", async (_event, ctx) => {
    updateDisplay(ctx);
  });

  pi.on("turn_end", async (_event, ctx) => {
    updateDisplay(ctx);
  });

  // Capture cache info from provider response headers
  pi.on("after_provider_response", (event, ctx) => {
    const headers = event.headers;
    if (!headers) return;

    // Anthropic cache headers
    const cacheRead = parseInt(headers["anthropic-cache-read-input-tokens"] ?? "0", 10);
    const cacheWrite = parseInt(headers["anthropic-cache-create-input-tokens"] ?? "0", 10);
    const totalInput = parseInt(headers["anthropic-input-tokens"] ?? "0", 10);
    const totalOutput = parseInt(headers["anthropic-output-tokens"] ?? "0", 10);

    if (cacheRead || cacheWrite) {
      lastCacheInfo = {
        cacheRead,
        cacheWrite,
        totalInput,
        totalOutput,
      };
      updateDisplay(ctx);
      return;
    }

    // OpenAI / generic cache indicators
    const cachedTokens = parseInt(headers["x-cached-tokens"] ?? "0", 10);
    if (cachedTokens) {
      lastCacheInfo = {
        cacheRead: cachedTokens,
        cacheWrite: 0,
        totalInput: parseInt(headers["x-request-tokens"] ?? "0", 10),
        totalOutput: parseInt(headers["x-response-tokens"] ?? "0", 10),
      };
      updateDisplay(ctx);
    }
  });

  // Also use assistant message usage for cache info
  pi.on("message_end", async (event, ctx) => {
    if (event.message.role === "assistant") {
      const msg = event.message as AssistantMessage;
      if (msg.usage && (msg.usage.cacheRead || msg.usage.cacheWrite)) {
        lastCacheInfo = {
          cacheRead: msg.usage.cacheRead,
          cacheWrite: msg.usage.cacheWrite,
          totalInput: msg.usage.input,
          totalOutput: msg.usage.output,
        };
      }
    }
    updateDisplay(ctx);
  });

  // Model changes reset
  pi.on("model_select", async (_event, ctx) => {
    lastCacheInfo = undefined;
    updateDisplay(ctx);
  });

  // Cleanup on shutdown
  pi.on("session_shutdown", async () => {
    lastCacheInfo = undefined;
    enabled = true;
    showExpanded = false;
  });
}
