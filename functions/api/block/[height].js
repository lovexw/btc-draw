// GET /api/block/:height → { status, height, hash, time, number }
const BASES = ['https://mempool.space/api', 'https://blockstream.info/api'];

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'access-control-allow-origin': '*',
      'cache-control': status === 200 ? 'public, max-age=60' : 'no-store',
    },
  });
}

export async function onRequestGet({ params }) {
  const h = String(params.height || '');
  if (!/^\d{1,8}$/.test(h)) return json({ error: '无效的区块高度' }, 400);

  for (const base of BASES) {
    try {
      const rh = await fetch(`${base}/block-height/${h}`, { signal: AbortSignal.timeout(8000) });
      if (rh.status === 404) return json({ status: 'pending', height: Number(h) });
      if (!rh.ok) continue;
      const hash = (await rh.text()).trim();
      const rb = await fetch(`${base}/block/${hash}`, { signal: AbortSignal.timeout(8000) });
      if (!rb.ok) continue;
      const b = await rb.json();
      // 号码规则与 scripts/draw.mjs、前端 app.js 一致：哈希后 6 位倒序
      const number = b.id.slice(-6).split('').reverse().join('');
      return json({ status: 'mined', height: b.height, hash: b.id, time: b.timestamp, number });
    } catch { /* 尝试下一个数据源 */ }
  }
  return json({ error: '上游数据源请求失败' }, 502);
}
