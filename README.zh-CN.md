# NewAPI Bar

EN | [中文](./README.zh-CN.md)

在 VS Code 状态栏显示 [New-API](https://github.com/Calcium-Ion/new-api) 余额与用量。

![status bar preview](https://img.shields.io/badge/vscode-%5E1.60.0-blue)

## 功能

- **状态栏轮播** — 可自定义轮播内容（余额、用量、请求数等）
- **悬停提示** — 悬停查看完整数据
- **自动刷新** — 可配置刷新间隔（默认 60 分钟）
- 点击状态栏手动刷新

## 安装

从 [VS Code Marketplace](https://marketplace.visualstudio.com/) 安装 _(即将上线)_，或本地安装 `.vsix`：

```
扩展 → ··· → 从 VSIX 安装
```

## 配置

> **获取凭据：** 在你的 New-API 实例中，进入 **个人设置 → 安全设置 → 系统访问令牌**，令牌和用户 ID 均在该页面。

| 设置项 | 默认值 | 说明 |
|---|---|---|
| `newapiStatus.baseUrl` | — | New-API 实例地址 |
| `newapiStatus.token` | — | 系统访问令牌 |
| `newapiStatus.userId` | — | 用户 ID |
| `newapiStatus.refreshInterval` | `60` | 数据刷新间隔（分钟） |
| `newapiStatus.slideInterval` | `4` | 轮播切换间隔（秒） |
| `newapiStatus.slides` | 见下方 | 状态栏显示模板 |

### 轮播模板

每条为字符串，支持 [VS Code 图标](https://code.visualstudio.com/api/references/icons-in-labels) 和以下占位符：

| 占位符 | 说明 |
|---|---|
| `${balance}` | 剩余余额（如 `$2.85`） |
| `${balance_tokens}` | 剩余余额（tokens） |
| `${today}` | 今日消耗 |
| `${today_tokens}` | 今日消耗（tokens） |
| `${today_requests}` | 今日请求次数 |
| `${monthly}` | 本月消耗 |
| `${used}` | 累计消耗 |
| `${total}` | 总额（余额 + 已用） |
| `${percent}` | 余额百分比 |
| `${bar}` | 进度条 `████░░` |
| `${total_requests}` | 累计请求次数 |
| `${rpm}` | 每分钟请求数 |
| `${tpm}` | 每分钟 tokens |
| `${update_time}` | 上次刷新时间 |

默认轮播：

```json
"newapiStatus.slides": [
  "$(credit-card) ${today} / ${balance}",
  "$(graph) ${percent} ${bar}",
  "$(history) ${total_requests} reqs  $(zap)${rpm}rpm"
]
```

## License

MIT
