const express = require('express');
const mysql = require('mysql2/promise');
const Anthropic = require('@anthropic-ai/sdk');

const app = express();
app.use(express.json());

// 서버리스 환경에서 pool 재사용
let pool;
const getPool = () => {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
      waitForConnections: true,
      connectionLimit: 5,
      dateStrings: true,
    });
  }
  return pool;
};

const interval = (req) => (parseInt(req.query.days) || 7) - 1;

// ─── 유입 ────────────────────────────────────────────────────────────
app.get('/api/traffic', async (req, res) => {
  const d = interval(req);
  try {
    const db = getPool();
    const [daily] = await db.query(`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM traffic_sync
      WHERE url LIKE '%interview_pay%'
        AND created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      GROUP BY DATE(created_at) ORDER BY date
    `, [d]);
    const [todayRow] = await db.query(`
      SELECT COUNT(*) as count FROM traffic_sync
      WHERE url LIKE '%interview_pay%' AND DATE(created_at) = CURDATE()
    `);
    const total = daily.reduce((s, r) => s + Number(r.count), 0);
    const avg = daily.length ? (total / daily.length).toFixed(1) : 0;
    res.json({ daily, today: Number(todayRow[0].count), total, avg });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── 회원가입 ─────────────────────────────────────────────────────────
app.get('/api/users', async (req, res) => {
  const d = interval(req);
  try {
    const db = getPool();
    const [daily] = await db.query(`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM users_sync
      WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      GROUP BY DATE(created_at) ORDER BY date
    `, [d]);
    const [todayRow] = await db.query(`SELECT COUNT(*) as count FROM users_sync WHERE DATE(created_at) = CURDATE()`);
    const [totalRow] = await db.query(`SELECT COUNT(*) as count FROM users_sync`);
    const total = daily.reduce((s, r) => s + Number(r.count), 0);
    res.json({ daily, today: Number(todayRow[0].count), total: Number(totalRow[0].count), periodTotal: total });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── 로그인 ───────────────────────────────────────────────────────────
app.get('/api/login', async (req, res) => {
  const d = interval(req);
  try {
    const db = getPool();
    const [daily] = await db.query(`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM login_sync
      WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      GROUP BY DATE(created_at) ORDER BY date
    `, [d]);
    const [todayRow] = await db.query(`SELECT COUNT(*) as count FROM login_sync WHERE DATE(created_at) = CURDATE()`);
    const total = daily.reduce((s, r) => s + Number(r.count), 0);
    const avg = daily.length ? (total / daily.length).toFixed(1) : 0;
    res.json({ daily, today: Number(todayRow[0].count), total, avg });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── 결제 ────────────────────────────────────────────────────────────
app.get('/api/payments', async (req, res) => {
  const d = interval(req);
  try {
    const db = getPool();
    const [daily] = await db.query(`
      SELECT DATE(created_at) as date, COUNT(*) as count, SUM(amount) as amount
      FROM payments_sync
      WHERE (status='DONE' OR status='결제 완료')
        AND created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      GROUP BY DATE(created_at) ORDER BY date
    `, [d]);
    const [byProduct] = await db.query(`
      SELECT product_name as name, COUNT(*) as count, SUM(amount) as amount
      FROM payments_sync
      WHERE (status='DONE' OR status='결제 완료')
        AND created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      GROUP BY product_name ORDER BY count DESC LIMIT 10
    `, [d]);
    const [recent] = await db.query(`
      SELECT name, product_name as product, amount,
             payment_method as method, status,
             refund_requested, DATE(created_at) as date
      FROM payments_sync ORDER BY created_at DESC LIMIT 30
    `);
    const [todayRow] = await db.query(`
      SELECT COUNT(*) as count, COALESCE(SUM(amount),0) as amount
      FROM payments_sync
      WHERE (status='DONE' OR status='결제 완료') AND DATE(created_at) = CURDATE()
    `);
    const [refundRow] = await db.query(`SELECT COUNT(*) as count FROM payments_sync WHERE refund_requested=1 AND created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)`, [d]);
    const [couponRow] = await db.query(`SELECT COUNT(*) as count FROM payments_sync WHERE status='결제 완료' AND created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)`, [d]);
    const COLORS = ['#6366f1','#8b5cf6','#a78bfa','#c4b5fd','#ddd6fe','#818cf8','#4f46e5','#7c3aed','#6d28d9','#5b21b6'];
    res.json({
      daily: daily.map(r => ({ ...r, count: Number(r.count), amount: Number(r.amount || 0) })),
      byProduct: byProduct.map((r, i) => ({ ...r, count: Number(r.count), amount: Number(r.amount || 0), color: COLORS[i] || '#6366f1' })),
      recent,
      today: { count: Number(todayRow[0].count), amount: Number(todayRow[0].amount) },
      periodTotal: daily.reduce((s, r) => s + Number(r.count), 0),
      periodAmount: daily.reduce((s, r) => s + Number(r.amount || 0), 0),
      refunds: Number(refundRow[0].count),
      coupons: Number(couponRow[0].count),
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── 면접 세션 ────────────────────────────────────────────────────────
app.get('/api/interviews', async (req, res) => {
  const d = interval(req);
  try {
    const db = getPool();
    const [funnelRows] = await db.query(`
      SELECT COUNT(*) as total,
        SUM(CASE WHEN email IS NOT NULL THEN 1 ELSE 0 END) as step1,
        SUM(CASE WHEN agree_yn='1' THEN 1 ELSE 0 END) as step2,
        SUM(CASE WHEN company_size IS NOT NULL THEN 1 ELSE 0 END) as step3,
        SUM(CASE WHEN (pdf_prep IS NOT NULL OR jaseo1 IS NOT NULL) THEN 1 ELSE 0 END) as step4,
        SUM(CASE WHEN interview_feedback IS NOT NULL THEN 1 ELSE 0 END) as step5
      FROM interview_seesion_sync
      WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
    `, [d]);
    const f = funnelRows[0];
    const total = Number(f.total) || 1;
    const funnel = [
      { stage: '1단계: 이메일 입력', count: Number(f.step1), percent: parseFloat((Number(f.step1)/total*100).toFixed(1)) },
      { stage: '2단계: 동의',        count: Number(f.step2), percent: parseFloat((Number(f.step2)/total*100).toFixed(1)) },
      { stage: '3단계: 회사 정보',   count: Number(f.step3), percent: parseFloat((Number(f.step3)/total*100).toFixed(1)) },
      { stage: '4단계: PDF/자소서',  count: Number(f.step4), percent: parseFloat((Number(f.step4)/total*100).toFixed(1)) },
      { stage: '5단계: 완주',        count: Number(f.step5), percent: parseFloat((Number(f.step5)/total*100).toFixed(1)) },
    ];
    const [byProduct] = await db.query(`SELECT product, COUNT(*) as count FROM interview_seesion_sync WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY) AND product IS NOT NULL GROUP BY product`, [d]);
    const [byType] = await db.query(`SELECT product as type, COUNT(*) as count FROM interview_raw_sync WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY) AND product IS NOT NULL GROUP BY product`, [d]);
    const [todayRow] = await db.query(`SELECT COUNT(*) as count FROM interview_seesion_sync WHERE DATE(created_at) = CURDATE()`);
    const [daily] = await db.query(`SELECT DATE(created_at) as date, COUNT(*) as count FROM interview_seesion_sync WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY) GROUP BY DATE(created_at) ORDER BY date`, [d]);
    const COLORS = ['#6366f1','#8b5cf6','#a78bfa','#c4b5fd'];
    res.json({
      funnel,
      total: Number(f.total),
      completionRate: parseFloat((Number(f.step5)/Math.max(Number(f.total),1)*100).toFixed(1)),
      byProduct: byProduct.map((r, i) => ({ ...r, count: Number(r.count), color: COLORS[i] || '#6366f1' })),
      byType: byType.map((r, i) => ({ ...r, count: Number(r.count), color: COLORS[i] || '#6366f1' })),
      today: Number(todayRow[0].count),
      daily,
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── 버그/문의 ────────────────────────────────────────────────────────
app.get('/api/bugs', async (req, res) => {
  const d = interval(req);
  try {
    const db = getPool();
    const [summaryRows] = await db.query(`
      SELECT COUNT(*) as total,
        SUM(CASE WHEN type LIKE '%버그%' THEN 1 ELSE 0 END) as bugs,
        SUM(CASE WHEN type LIKE '%문의%' THEN 1 ELSE 0 END) as issues,
        SUM(CASE WHEN type='기타' THEN 1 ELSE 0 END) as others
      FROM bug_report_sync
      WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
    `, [d]);
    const [byProductType] = await db.query(`
      SELECT product_name, type, COUNT(*) as count
      FROM bug_report_sync
      WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      GROUP BY product_name, type ORDER BY count DESC
    `, [d]);
    const products = [...new Set(byProductType.map(r => r.product_name))];
    const types = [...new Set(byProductType.map(r => r.type))];
    const chartData = products.map(p => {
      const row = { product: p };
      types.forEach(t => {
        const found = byProductType.find(r => r.product_name === p && r.type === t);
        row[t] = found ? Number(found.count) : 0;
      });
      return row;
    });
    const [recent] = await db.query(`SELECT product_name as product, type, content, email, DATE(created_at) as date FROM bug_report_sync ORDER BY created_at DESC LIMIT 20`);
    const [todayRow] = await db.query(`SELECT COUNT(*) as count FROM bug_report_sync WHERE DATE(created_at) = CURDATE()`);
    const s = summaryRows[0];
    res.json({
      summary: { total: Number(s.total), bugs: Number(s.bugs), issues: Number(s.issues), others: Number(s.others) },
      chartData, types, recent,
      today: Number(todayRow[0].count),
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── AI 분석 ─────────────────────────────────────────────────────────
app.post('/api/ai-analyze', async (req, res) => {
  const { data } = req.body;
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(400).json({ error: 'ANTHROPIC_API_KEY 환경변수를 설정해주세요.' });
  }
  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const message = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 800,
      messages: [{
        role: 'user',
        content: `다음은 면접 메이트 서비스의 오늘 운영 데이터입니다. 핵심 인사이트와 개선 제안을 한국어로 3-4개 bullet point로 간결하게 분석해주세요.

데이터:
- 오늘 접속자(유입): ${data.todayTraffic}건
- 오늘 신규 회원가입: ${data.todaySignup}건
- 오늘 로그인: ${data.todayLogin}건
- 오늘 결제 건수: ${data.todayPayments}건
- 오늘 결제 금액: ${Number(data.todayAmount).toLocaleString()}원
- 면접 세션 수 (기간): ${data.totalSessions}건
- 퍼널 완주율: ${data.completionRate}%
- 1→2단계 이탈율: ${data.dropRate12}%
- 버그/문의 건수: ${data.bugCount}건

분석 형식: 각 항목 앞에 이모지를 붙이고, 2줄 이내로 작성`,
      }],
    });
    res.json({ result: message.content[0].text });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = app;
