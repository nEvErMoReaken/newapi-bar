# NewAPI Bar

[中文](./README.zh-CN.md) | EN

Display your [New-API](https://github.com/Calcium-Ion/new-api) balance and usage in the VS Code status bar.

![status bar preview](https://img.shields.io/badge/vscode-%5E1.60.0-blue)

## Features

- **Status bar carousel** — cycles through customizable slides (balance, usage, requests, etc.)
- **Hover tooltip** — full breakdown on hover
- **Auto refresh** — configurable interval (default 60 min)
- Click the status bar item to refresh manually

## Installation

Install from the [VS Code Marketplace](https://marketplace.visualstudio.com/) _(coming soon)_, or install the `.vsix` locally:

```
Extensions → ··· → Install from VSIX
```

## Configuration

| Setting | Default | Description |
|---|---|---|
| `newapiStatus.baseUrl` | `https://iina.ai` | Your New-API instance URL |
| `newapiStatus.token` | — | System access token |
| `newapiStatus.userId` | — | Your user ID |
| `newapiStatus.refreshInterval` | `60` | Data refresh interval (minutes) |
| `newapiStatus.slideInterval` | `4` | Carousel slide interval (seconds) |
| `newapiStatus.slides` | see below | Status bar display templates |

### Slide templates

Each slide is a string with optional [VS Code icons](https://code.visualstudio.com/api/references/icons-in-labels) and placeholders:

| Placeholder | Description |
|---|---|
| `${balance}` | Remaining balance (e.g. `$2.85`) |
| `${balance_tokens}` | Remaining balance in tokens |
| `${today}` | Today's spend |
| `${today_tokens}` | Today's spend in tokens |
| `${today_requests}` | Today's request count |
| `${monthly}` | This month's spend |
| `${used}` | Total spent |
| `${total}` | Total quota (balance + used) |
| `${percent}` | Balance percentage |
| `${bar}` | Progress bar `████░░` |
| `${total_requests}` | All-time request count |
| `${rpm}` | Requests per minute |
| `${tpm}` | Tokens per minute |
| `${update_time}` | Last refresh time |

Default slides:

```json
"newapiStatus.slides": [
  "$(credit-card) ${today} / ${balance}",
  "$(graph) ${percent} ${bar}",
  "$(history) ${total_requests} reqs  $(zap)${rpm}rpm"
]
```

## License

MIT
