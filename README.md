# BTC 开奖 🎱₿

用比特币区块哈希当摇奖机的开奖平台。号码由全网算力决定，无人可操控。

**线上地址**：https://btc-draw.pages.dev （部署后以实际域名为准）

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

### 2. Cloudflare Pages

方式 A（直传，最简单）：

```bash
npx wrangler login
npx wrangler pages deploy        # 读取 wrangler.toml，部署 public/ 并打包 functions/
```

方式 B（Git 集成）：Cloudflare 控制台 → Workers & Pages → 创建 Pages 项目 → 连接本仓库 → 构建命令留空、输出目录填 `public`。此后每次 Actions 提交开奖数据都会自动重新部署，无需部署钩子。

### 3. 每日数据更新机制

网站前端会**多源并行**加载开奖数据（站点自带版本 / GitHub raw / jsDelivr 镜像），自动选用 `updatedAt` 最新的那份。所以 Actions 每天提交开奖数据后，**即使 Cloudflare 不重新部署，网站也会展示最新开奖**。

可选加强：在 Cloudflare 控制台给 Pages 项目创建一个**部署钩子**（Deploy hook），并配置 GitHub 仓库 secret `CLOUDFLARE_DEPLOY_HOOK`，Actions 提交数据后会顺便触发一次重新部署，让站点自带的数据副本也保持最新（对 SEO 与无 JS 场景更友好）。

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
