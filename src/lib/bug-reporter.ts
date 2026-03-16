/**
 * @royea/bug-reporter — inline copy for Vercel deployment
 * Floating bug reporter: FAB button + modal + console capture → Supabase
 */

interface BugReporterConfig {
  supabaseUrl: string;
  supabaseKey: string;
  projectName: string;
  version: string;
  includeConsoleLogs?: boolean;
  maxLogEntries?: number;
  position?: 'bottom-left' | 'bottom-right';
  userId?: string;
  sessionId?: string;
}

interface LogEntry { level: string; message: string; ts: number; }

const capturedLogs: LogEntry[] = [];
let maxLogs = 50;
let consolePatched = false;

function patchConsole(): void {
  if (consolePatched || typeof window === 'undefined') return;
  consolePatched = true;
  for (const level of ['error', 'warn'] as const) {
    const original = console[level];
    console[level] = (...args: unknown[]) => {
      try {
        capturedLogs.push({ level, message: args.map(a => typeof a === 'string' ? a : JSON.stringify(a)).join(' ').slice(0, 500), ts: Date.now() });
        if (capturedLogs.length > maxLogs) capturedLogs.shift();
      } catch { /* silent */ }
      original.apply(console, args);
    };
  }
  window.addEventListener('error', (e) => { capturedLogs.push({ level: 'error', message: `${e.message} at ${e.filename}:${e.lineno}`, ts: Date.now() }); });
  window.addEventListener('unhandledrejection', (e) => { capturedLogs.push({ level: 'error', message: `Unhandled: ${e.reason?.message || String(e.reason)}`, ts: Date.now() }); });
}

let _config: BugReporterConfig | null = null;
let _modalEl: HTMLDivElement | null = null;
let _fabEl: HTMLButtonElement | null = null;
let _sessionId = '';

function getSessionId(): string {
  if (_sessionId) return _sessionId;
  try { const s = sessionStorage.getItem('__br_sid'); if (s) { _sessionId = s; return s; } const id = crypto.randomUUID(); sessionStorage.setItem('__br_sid', id); _sessionId = id; return id; } catch { _sessionId = `f-${Date.now()}`; return _sessionId; }
}

async function insertReport(config: BugReporterConfig, title: string, desc?: string): Promise<void> {
  const row = { project: config.projectName, version: config.version, title, description: desc || null, url: location.href, user_agent: navigator.userAgent, user_id: config.userId || null, session_id: config.sessionId || _sessionId, console_logs: capturedLogs.slice(-maxLogs), metadata: {}, status: 'open' };
  const res = await fetch(`${config.supabaseUrl}/rest/v1/bug_reports`, { method: 'POST', headers: { 'Content-Type': 'application/json', apikey: config.supabaseKey, Authorization: `Bearer ${config.supabaseKey}`, Prefer: 'return=minimal' }, body: JSON.stringify(row) });
  if (!res.ok) throw new Error(`Failed: ${res.status}`);
  // Fire-and-forget: sync bug to Google Drive
  fetch(`${config.supabaseUrl}/functions/v1/sync-bugs-to-drive`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ description: title + (desc ? ' — ' + desc : ''), severity: 'medium', page: location.pathname, timestamp: new Date().toISOString() }) }).catch(() => {});
}

function openReporter(): void {
  if (!_modalEl) return;
  _modalEl.style.display = 'flex';
  const meta = _modalEl.querySelector('#__br-meta') as HTMLDivElement;
  if (meta && _config) meta.textContent = `${_config.projectName} v${_config.version} · ${location.pathname} · ${capturedLogs.filter(l => l.level === 'error').length} errors`;
  setTimeout(() => (_modalEl!.querySelector('#__br-title') as HTMLInputElement)?.focus(), 100);
}

function createUI(config: BugReporterConfig): void {
  // Modal
  const modal = document.createElement('div');
  modal.id = '__bug-reporter-modal';
  modal.style.cssText = 'position:fixed;inset:0;z-index:100000;display:none;align-items:center;justify-content:center;background:rgba(0,0,0,0.6);backdrop-filter:blur(4px);font-family:system-ui,sans-serif;';
  modal.innerHTML = `<div style="background:#1a1a2e;border-radius:16px;padding:24px;width:90%;max-width:420px;color:#fff;box-shadow:0 20px 60px rgba(0,0,0,0.5);"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;"><h3 style="margin:0;font-size:18px;">🐛 Report a Bug</h3><button id="__br-close" style="background:none;border:none;color:#888;font-size:24px;cursor:pointer;padding:0;">&times;</button></div><input id="__br-title" placeholder="What went wrong?" style="width:100%;padding:10px 12px;border-radius:8px;border:1px solid #333;background:#0d0d1a;color:#fff;font-size:14px;margin-bottom:12px;box-sizing:border-box;" /><textarea id="__br-desc" placeholder="Steps to reproduce (optional)" rows="3" style="width:100%;padding:10px 12px;border-radius:8px;border:1px solid #333;background:#0d0d1a;color:#fff;font-size:14px;margin-bottom:12px;resize:vertical;box-sizing:border-box;font-family:inherit;"></textarea><div id="__br-meta" style="font-size:11px;color:#666;margin-bottom:16px;"></div><button id="__br-submit" style="width:100%;padding:12px;border-radius:8px;border:none;background:#e63946;color:#fff;font-size:15px;font-weight:600;cursor:pointer;">📤 Send Report</button><div id="__br-status" style="text-align:center;margin-top:8px;font-size:13px;color:#888;"></div></div>`;
  document.body.appendChild(modal);
  _modalEl = modal;

  modal.querySelector('#__br-close')!.addEventListener('click', () => { modal.style.display = 'none'; });
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.style.display = 'none'; });
  modal.querySelector('#__br-submit')!.addEventListener('click', async () => {
    const title = (modal.querySelector('#__br-title') as HTMLInputElement).value.trim();
    if (!title) { (modal.querySelector('#__br-status') as HTMLDivElement).textContent = 'Please enter a title'; return; }
    const desc = (modal.querySelector('#__br-desc') as HTMLTextAreaElement).value.trim();
    const btn = modal.querySelector('#__br-submit') as HTMLButtonElement;
    const status = modal.querySelector('#__br-status') as HTMLDivElement;
    btn.disabled = true; btn.textContent = '⏳ Sending...';
    try { await insertReport(config, title, desc); status.style.color = '#4ecdc4'; status.textContent = '✅ Sent!'; setTimeout(() => { modal.style.display = 'none'; (modal.querySelector('#__br-title') as HTMLInputElement).value = ''; (modal.querySelector('#__br-desc') as HTMLTextAreaElement).value = ''; status.textContent = ''; }, 1500); }
    catch (err) { status.style.color = '#e63946'; status.textContent = `❌ ${(err as Error).message}`; }
    finally { btn.disabled = false; btn.textContent = '📤 Send Report'; }
  });

  // FAB
  const side = config.position === 'bottom-right' ? 'right:16px' : 'left:16px';
  const fab = document.createElement('button');
  fab.style.cssText = `position:fixed;bottom:80px;${side};z-index:99999;width:48px;height:48px;border-radius:24px;border:none;background:#e63946;color:#fff;font-size:22px;cursor:pointer;box-shadow:0 4px 12px rgba(230,57,70,0.4);display:flex;align-items:center;justify-content:center;`;
  fab.textContent = '🐛';
  fab.title = 'Report a bug (Shift+Alt+B)';
  fab.addEventListener('click', openReporter);
  document.body.appendChild(fab);
  _fabEl = fab;
}

export function initBugReporter(config: BugReporterConfig): void {
  if (typeof window === 'undefined') return;
  _config = config;
  _sessionId = config.sessionId || getSessionId();
  maxLogs = config.maxLogEntries || 50;
  if (config.includeConsoleLogs !== false) patchConsole();
  createUI(config);
  document.addEventListener('keydown', (e) => { if (e.shiftKey && e.altKey && e.key === 'B') { e.preventDefault(); openReporter(); } });
}

export function destroyBugReporter(): void {
  _fabEl?.remove(); _modalEl?.remove(); _fabEl = null; _modalEl = null; _config = null;
}
