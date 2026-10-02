> ⚠️ **本项目已于 2026-10-02 合并至 [lovexw/btchao-mono](https://github.com/lovexw/btchao-mono) 的 `sites/draw` 目录**（线上 https://lottery.btchao.com ）。本仓库已归档，每日开奖由 btchao-mono 的 `update-draw.yml` 继续，此处的代码与数据仅为历史存档。

# BTC 开奖 🎱₿

用比特币区块哈希当摇奖机的开奖平台。号码由全网算力决定，无人可操控。

**线上地址**：<https://lottery.btchao.com>（备用：<https://btc-draw.pages.dev>）

## 开奖规则

1. **号码来源**：从区块哈希（64 位十六进制）的**末尾往前**逐位扫描，只要数字 0-9，遇到字母 a-f 跳过，凑满 **6 个数字**为止，扫描顺序即为开奖号码（哈希最后一位数字 = 号码第一位）。
   例：哈希末尾为 `…1e70fbbc135a` → 从末尾往前收集到的数字依次是 5、3、1、0、7、1 → 开奖号码 `531071`。
2. **开奖时刻**：每天 **北京时间 12:00 整**（UTC+8），取该时刻之前挖出的最新区块作为开奖区块。
3. **数据保留**：滚动保存最近 **15 天**的开奖号码，旧的自动覆盖。
4. **未来估算**：支持按区块高度估算开奖时间、按开奖时间估算区块高度（按 10 分钟/块，可调），并可生成 `.ics` 开奖日历通知（不做存储）。

## 架构

```
GitHub Actions（cron 0 4 * * * UTC = 北京时间 12:00）
   │  scripts/draw.mjs 调 mempool.space / blockstream.info
   │  找到 12:00 前最新区块 → 计算号码 → 更新 public/data/draws.json
   │  commit 到本仓库（数据存档）→ 可选触发 Cloudflare 部署钩子
   ▼
Cloudflare Pages（本仓库 public/ + functions/）
   ├─ 静态站：今日开奖 / 15 天记录 / 查询与估算工具
   └─ Pages Functions：
       /api/tip            → 最新区块高度
       /api/block/:height  → 任意高度的开奖号码（实时计算）
```

## 目录

```
public/            静态站（index.html / styles.css / app.js / data/draws.json）
functions/api/     Cloudflare Pages Functions（链上数据同源代理）
scripts/draw.mjs   开奖核心脚本（含号码规则与 15 天滚动保存）
.github/workflows/ 每日开奖定时任务
```

## 本地开发

```bash
npx wrangler pages dev public   # 含 Functions，默认 http://localhost:8788
```

手动开奖 / 回填：

```bash
node scripts/draw.mjs               # 开今天的奖（已开过则跳过）
node scripts/draw.mjs --backfill 15 # 回填最近 15 天
node scripts/draw.mjs --date 2026-10-01 --force  # 重开指定日期
```

## 部署

### 1. GitHub（数据存档 + 定时开奖）

代码推送到 GitHub 即可，Actions 无需任何密钥。手动触发：仓库 → Actions → 每日开奖 → Run workflow（`mode` 填 `backfill 15` 可补数据）。

### 2. Cloudflare Pages（Git 集成，已配置）

本项目已通过 **Git 集成** 连接 `lovexw/btc-draw` 仓库（Cloudflare GitHub App 授权一次即可）：

- 构建命令：无；构建输出目录：`public`；Functions 从仓库根 `functions/` 自动打包
- 自定义域名：`lottery.btchao.com`（zone 同账号，DNS 自动创建）
- **每次 push 到 `main` 自动构建部署**——包括每天 Actions 提交的开奖数据，无需任何部署钩子或密钥

每日数据流：北京时间 12:00 Actions 开奖 → commit 数据 → push → Cloudflare 自动重新部署 → 网站展示最新开奖，全程无人工干预。

> 备用方式（直传）：`npx wrangler pages deploy`，或用部署钩子（Pages 项目 → 设置 → 部署钩子 → 把 URL 配为 GitHub secret `CLOUDFLARE_DEPLOY_HOOK`）。前端本身也会从 GitHub raw / jsDelivr 拉取最新数据兜底。

## 数据文件格式（public/data/draws.json）

```json
{
  "rule": "开奖号码 = 从开奖区块哈希末尾往前收集 6 个数字（0-9，字母跳过）；……",
  "updatedAt": "2026-10-02T04:05:11.000Z",
  "draws": [
    {
      "date": "2026-10-02",
      "height": 916632,
      "hash": "00000000000000000002a7c4…",
      "time": "2026-10-02T03:52:41Z",
      "number": "531071"
    }
  ]
}
```

## 说明

- 数据源为 mempool.space 公共节点，失败时自动降级 blockstream.info。
- 区块时间戳由矿工写入，可能与真实时间有 ±2 小时内的偏差，属 Bitcoin 协议正常现象；开奖区块的判定以链上时间戳为准。
- 本项目仅供娱乐，不构成任何投资建议。

---

© 2026 [btchao.com](https://www.btchao.com) · 仅供娱乐
