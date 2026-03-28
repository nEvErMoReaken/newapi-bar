const vscode = require('vscode');
const https = require('https');

const QUOTA_PER_UNIT = 500000;

function getConfig() {
  const cfg = vscode.workspace.getConfiguration('newapiStatus');
  const token = cfg.get('token');
  const userId = cfg.get('userId');
  const baseUrl = cfg.get('baseUrl');
  if (!token || !userId || !baseUrl) return null;
  return { token, userId, baseUrl };
}

function request(baseUrl, path, token, userId) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      headers: { 'Authorization': `Bearer ${token}`, 'New-Api-User': String(userId), 'User-Agent': 'Mozilla/5.0' },
    };
    https.get(options, res => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => {
        try { resolve(JSON.parse(data).data || {}); } catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

function toUsd(q) { return (q / QUOTA_PER_UNIT).toFixed(2); }
function toTokens(q) { return Math.round(q / QUOTA_PER_UNIT * 1000); }
function fmtUsd(q) { const v = q / QUOTA_PER_UNIT; return v >= 1000 ? `$${(v/1000).toFixed(1)}k` : `$${v.toFixed(2)}`; }
function fmtNum(n) { return Number(n).toLocaleString(); }
function bar(pct, len = 10) { const f = Math.round(pct / 100 * len); return '█'.repeat(f) + '░'.repeat(len - f); }
function apply(tpl, vars) { return tpl.replace(/\$\{(\w+)\}/g, (_, k) => vars[k] !== undefined ? vars[k] : `{${k}}`); }

let cachedVars = null;
let slideIndex = 0;
let slideTimer = null;

async function fetchData(cfg) {
  const now = Math.floor(Date.now() / 1000);
  const todayD = new Date(); todayD.setHours(0, 0, 0, 0);
  const todayStart = Math.floor(todayD.getTime() / 1000);
  const monthD = new Date(); monthD.setDate(1); monthD.setHours(0, 0, 0, 0);
  const monthStart = Math.floor(monthD.getTime() / 1000);

  const [info, todayStat, monthStat, todayLog] = await Promise.all([
    request(cfg.baseUrl, '/api/user/self', cfg.token, cfg.userId),
    request(cfg.baseUrl, `/api/log/self/stat?type=0&start_timestamp=${todayStart}&end_timestamp=${now}&group=`, cfg.token, cfg.userId),
    request(cfg.baseUrl, `/api/log/self/stat?type=0&start_timestamp=${monthStart}&end_timestamp=${now}&group=`, cfg.token, cfg.userId),
    request(cfg.baseUrl, `/api/log/self?p=1&page_size=1&start_timestamp=${todayStart}&end_timestamp=${now}`, cfg.token, cfg.userId),
  ]);

  const remaining = info.quota || 0;
  const totalUsed = info.used_quota || 0;
  const total = remaining + totalUsed;
  const pct = total > 0 ? (remaining / total * 100) : 0;

  return {
    balance:        fmtUsd(remaining),
    balance_tokens: fmtNum(toTokens(remaining)),
    today:          fmtUsd(todayStat.quota || 0),
    today_tokens:   fmtNum(toTokens(todayStat.quota || 0)),
    today_requests: String(todayLog.total || 0),
    monthly:        fmtUsd(monthStat.quota || 0),
    monthly_tokens: fmtNum(toTokens(monthStat.quota || 0)),
    used:           fmtUsd(totalUsed),
    used_tokens:    fmtNum(toTokens(totalUsed)),
    total:          fmtUsd(total),
    total_tokens:   fmtNum(toTokens(total)),
    percent:        `${pct.toFixed(1)}%`,
    bar:            bar(pct),
    total_requests: String(info.request_count || 0),
    rpm:            String(todayStat.rpm || 0),
    tpm:            String(todayStat.tpm || 0),
    update_time:    new Date().toLocaleTimeString(),
    _remaining:     remaining,
    _totalUsed:     totalUsed,
    _total:         total,
    _pct:           pct,
    _todayStat:     todayStat,
    _monthStat:     monthStat,
    _todayLog:      todayLog,
    _info:          info,
  };
}

function buildTooltip(v, baseUrl) {
  const siteName = baseUrl ? new URL(baseUrl).hostname : 'NewAPI';
  const md = new vscode.MarkdownString([
    `**$(graph) ${siteName}**`,
    ``,
    `$(credit-card) 余额: ${v.balance} (${v.balance_tokens} tokens)`,
    `$(calendar) 今日: ${v.today} (${v.today_tokens} tokens)`,
    `$(history) 本月: ${v.monthly} (${v.monthly_tokens} tokens)`,
    `$(arrow-up) 已用: ${v.used} (${v.used_tokens} tokens)`,
    `$(database) 总额: ${v.total}`,
    `$(pulse) 剩余: ${v.percent} ${v.bar}`,
    `$(list-ordered) 今日请求: ${v.today_requests} 次 | 累计: ${v.total_requests} 次`,
    `$(zap) RPM: ${v.rpm} | TPM: ${v.tpm}`,
    ``,
    `$(clock) 更新: ${v.update_time}`,
    ``,
    `*点击刷新*`,
  ].join('\n\n'));
  md.isTrusted = true;
  md.supportThemeIcons = true;
  return md;
}

function updateSlide(item, vars) {
  const vscfg = vscode.workspace.getConfiguration('newapiStatus');
  const slides = vscfg.get('slides') || ['$(credit-card) ${today} / ${balance}'];
  if (slides.length === 0) return;
  slideIndex = slideIndex % slides.length;
  item.text = apply(slides[slideIndex], vars);
}

async function refresh(item) {
  item.text = '$(sync~spin) ...';
  const cfg = getConfig();
  if (!cfg || !cfg.token) {
    item.text = '$(warning) no token';
    item.tooltip = 'Set newapiStatus.token in settings';
    return;
  }
  try {
    cachedVars = await fetchData(cfg);
    item.tooltip = buildTooltip(cachedVars, cfg.baseUrl);
    slideIndex = 0;
    updateSlide(item, cachedVars);
  } catch (e) {
    item.text = '$(cloud-offline) newapi';
    item.tooltip = e.message;
  }
}

function activate(context) {
  const item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 50);
  item.command = 'newapiStatus.refresh';
  item.show();

  const cmd = vscode.commands.registerCommand('newapiStatus.refresh', () => refresh(item));
  context.subscriptions.push(item, cmd);

  refresh(item);

  // Data refresh timer
  const vscfg = vscode.workspace.getConfiguration('newapiStatus');
  const dataInterval = (vscfg.get('refreshInterval') || 60) * 60 * 1000;
  const dataTimer = setInterval(() => refresh(item), dataInterval);

  // Carousel timer
  const slideSec = (vscfg.get('slideInterval') || 4) * 1000;
  slideTimer = setInterval(() => {
    if (!cachedVars) return;
    const slides = vscode.workspace.getConfiguration('newapiStatus').get('slides') || [];
    if (slides.length <= 1) return;
    slideIndex = (slideIndex + 1) % slides.length;
    updateSlide(item, cachedVars);
  }, slideSec);

  context.subscriptions.push(
    { dispose: () => clearInterval(dataTimer) },
    { dispose: () => clearInterval(slideTimer) }
  );
}

function deactivate() {}

module.exports = { activate, deactivate };
