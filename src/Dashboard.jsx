import { useState, useEffect, useCallback } from "react";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, Legend,
} from "recharts";

// ─── 공통 컴포넌트 ───────────────────────────────────────────────────

const StatCard = ({ title, value, sub, color, icon, change }) => (
  <div style={{
    background: "#fff", borderRadius: 16, padding: "20px 24px",
    borderTop: `4px solid ${color}`,
    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
    display: "flex", flexDirection: "column", gap: 8, minWidth: 0,
  }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span style={{ fontSize: 13, color: "#6b7280", fontWeight: 500 }}>{title}</span>
      <span style={{ fontSize: 20 }}>{icon}</span>
    </div>
    <div style={{ fontSize: 28, fontWeight: 800, color: "#111827", letterSpacing: "-1px" }}>{value}</div>
    {sub && <div style={{ fontSize: 12, color: "#9ca3af" }}>{sub}</div>}
    {change !== undefined && (
      <div style={{ fontSize: 12, color: change >= 0 ? "#10b981" : "#ef4444", fontWeight: 600 }}>
        {change >= 0 ? "▲" : "▼"} {Math.abs(change).toFixed(1)}% 전일 대비
      </div>
    )}
  </div>
);

const SectionTitle = ({ children, color = "#6366f1" }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
    <div style={{ width: 4, height: 20, borderRadius: 2, background: color }} />
    <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#111827" }}>{children}</h3>
  </div>
);

const Card = ({ children, style = {} }) => (
  <div style={{
    background: "#fff", borderRadius: 16, padding: "24px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.08)", ...style,
  }}>
    {children}
  </div>
);

const Spinner = () => (
  <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: 120, color: "#9ca3af", fontSize: 13 }}>
    데이터 로딩 중...
  </div>
);

const COLORS = ["#6366f1", "#8b5cf6", "#a78bfa", "#c4b5fd", "#ddd6fe", "#818cf8", "#4f46e5", "#7c3aed"];

// ─── AI 분석 ────────────────────────────────────────────────────────

const AIAnalysis = ({ data }) => {
  const [analysis, setAnalysis] = useState("");
  const [loading, setLoading] = useState(false);

  const analyze = async () => {
    setLoading(true);
    setAnalysis("");
    try {
      const response = await fetch("/api/ai-analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data }),
      });
      const result = await response.json();
      if (result.result) {
        setAnalysis(result.result);
      } else {
        setAnalysis(result.error || "분석에 실패했습니다.");
      }
    } catch (e) {
      setAnalysis("서버 연결 오류가 발생했습니다.");
    }
    setLoading(false);
  };

  return (
    <Card style={{ background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)", color: "#fff" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 13, color: "#a5b4fc", marginBottom: 4 }}>AI 인사이트</div>
          <div style={{ fontSize: 16, fontWeight: 700 }}>오늘의 운영 분석</div>
        </div>
        <button onClick={analyze} disabled={loading} style={{
          padding: "8px 16px", borderRadius: 8,
          border: "1px solid rgba(165,180,252,0.4)",
          background: loading ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.15)",
          color: "#e0e7ff", fontSize: 13, fontWeight: 600,
          cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit",
        }}>
          {loading ? "분석 중..." : "✨ AI 분석"}
        </button>
      </div>
      {analysis ? (
        <div style={{ fontSize: 13, lineHeight: 1.8, color: "#e0e7ff", whiteSpace: "pre-wrap" }}>{analysis}</div>
      ) : (
        <div style={{ fontSize: 13, color: "#a5b4fc", padding: "8px 0" }}>
          버튼을 클릭하면 AI가 오늘의 데이터를 분석해드립니다.
        </div>
      )}
    </Card>
  );
};

// ─── 메인 대시보드 ───────────────────────────────────────────────────

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [days, setDays] = useState(7);
  const today = new Date().toISOString().slice(0, 10);

  const [traffic, setTraffic] = useState(null);
  const [users, setUsers] = useState(null);
  const [login, setLogin] = useState(null);
  const [payments, setPayments] = useState(null);
  const [interviews, setInterviews] = useState(null);
  const [bugs, setBugs] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [t, u, l, p, iv, b] = await Promise.all([
        fetch(`/api/traffic?days=${days}`).then(r => r.json()),
        fetch(`/api/users?days=${days}`).then(r => r.json()),
        fetch(`/api/login?days=${days}`).then(r => r.json()),
        fetch(`/api/payments?days=${days}`).then(r => r.json()),
        fetch(`/api/interviews?days=${days}`).then(r => r.json()),
        fetch(`/api/bugs?days=${days}`).then(r => r.json()),
      ]);
      setTraffic(t); setUsers(u); setLogin(l);
      setPayments(p); setInterviews(iv); setBugs(b);
    } catch (e) {
      console.error('데이터 로딩 실패:', e);
    }
    setLoading(false);
  }, [days]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const tabs = [
    { id: "overview",  label: "📊 개요",          color: "#6366f1" },
    { id: "traffic",   label: "🌐 유입·가입",     color: "#0ea5e9" },
    { id: "login",     label: "🔐 로그인",         color: "#10b981" },
    { id: "payment",   label: "💳 결제",           color: "#f59e0b" },
    { id: "interview", label: "🎙️ 면접 세션",     color: "#ec4899" },
    { id: "bugs",      label: "🐛 문의/버그",      color: "#ef4444" },
  ];

  // 일별 traffic + signup 병합
  const trafficSignupData = (() => {
    if (!traffic || !users) return [];
    const map = {};
    (traffic.daily || []).forEach(r => { map[r.date] = { date: r.date, traffic: Number(r.count) }; });
    (users.daily || []).forEach(r => {
      if (!map[r.date]) map[r.date] = { date: r.date, traffic: 0 };
      map[r.date].signup = Number(r.count);
    });
    return Object.values(map).sort((a, b) => a.date > b.date ? 1 : -1);
  })();

  const aiData = {
    todayTraffic: traffic?.today || 0,
    todaySignup: users?.today || 0,
    todayLogin: login?.today || 0,
    todayPayments: payments?.today?.count || 0,
    todayAmount: payments?.today?.amount || 0,
    totalSessions: interviews?.total || 0,
    completionRate: interviews?.completionRate || 0,
    dropRate12: (() => {
      const f = interviews?.funnel;
      if (!f || !f[0]?.count) return 0;
      return parseFloat(((f[0].count - (f[1]?.count || 0)) / f[0].count * 100).toFixed(1));
    })(),
    bugCount: bugs?.today || 0,
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f3f4f6", fontFamily: "'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif", color: "#111827" }}>

      {/* Header */}
      <div style={{
        background: "#fff", borderBottom: "1px solid #e5e7eb", padding: "0 32px",
        position: "sticky", top: 0, zIndex: 100, boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 60 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: "#fff",
            }}>🎙️</div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 16, color: "#111827" }}>면접 메이트</div>
              <div style={{ fontSize: 11, color: "#9ca3af" }}>Activity Dashboard · Live</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {[7, 30, 90].map(d => (
              <button key={d} onClick={() => setDays(d)} style={{
                padding: "5px 12px", borderRadius: 6, border: "1px solid #e5e7eb",
                background: days === d ? "#6366f1" : "#fff",
                color: days === d ? "#fff" : "#6b7280",
                fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
              }}>
                최근 {d}일
              </button>
            ))}
            <button onClick={fetchAll} style={{
              padding: "5px 12px", borderRadius: 6, border: "1px solid #e5e7eb",
              background: "#fff", color: "#6b7280", fontSize: 12, cursor: "pointer", fontFamily: "inherit",
            }}>🔄 새로고침</button>
            <div style={{ fontSize: 12, color: "#9ca3af", marginLeft: 8 }}>{today} 기준</div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 4, overflowX: "auto" }}>
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              padding: "10px 16px", border: "none", background: "transparent",
              color: activeTab === tab.id ? tab.color : "#9ca3af",
              fontWeight: activeTab === tab.id ? 700 : 500, fontSize: 13, cursor: "pointer",
              borderBottom: activeTab === tab.id ? `2px solid ${tab.color}` : "2px solid transparent",
              fontFamily: "inherit", whiteSpace: "nowrap", transition: "all 0.2s",
            }}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: "28px 32px", maxWidth: 1400, margin: "0 auto" }}>

        {/* ── 개요 탭 ──────────────────────────────────────────────── */}
        {activeTab === "overview" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

            {/* 오늘 KPI */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#9ca3af", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>오늘 현황</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 16 }}>
                <StatCard title="오늘 유입" value={loading ? "–" : (traffic?.today ?? 0).toLocaleString()} sub="interview_pay URL" color="#0ea5e9" icon="🌐" />
                <StatCard title="오늘 신규 가입" value={loading ? "–" : (users?.today ?? 0).toLocaleString()} sub="users_sync" color="#10b981" icon="👤" />
                <StatCard title="오늘 로그인" value={loading ? "–" : (login?.today ?? 0).toLocaleString()} sub="login_sync" color="#6366f1" icon="🔐" />
                <StatCard title="오늘 결제 금액" value={loading ? "–" : `${(payments?.today?.amount ?? 0).toLocaleString()}원`} sub={`${payments?.today?.count ?? 0}건 결제`} color="#f59e0b" icon="💳" />
                <StatCard title="오늘 면접 세션" value={loading ? "–" : (interviews?.today ?? 0).toLocaleString()} sub="interview_session" color="#ec4899" icon="🎙️" />
              </div>
            </div>

            {/* 기간 KPI */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#9ca3af", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>최근 {days}일 누적</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
                <StatCard title={`${days}일 총 유입`} value={loading ? "–" : (traffic?.total ?? 0).toLocaleString()} sub="interview_pay URL 기준" color="#0ea5e9" icon="📈" />
                <StatCard title={`${days}일 결제 건수`} value={loading ? "–" : `${(payments?.periodTotal ?? 0).toLocaleString()}건`} sub={`총 ${(payments?.periodAmount ?? 0).toLocaleString()}원`} color="#f59e0b" icon="💰" />
                <StatCard title="퍼널 완주율" value={loading ? "–" : `${interviews?.completionRate ?? 0}%`} sub="5단계 완료 기준" color="#ec4899" icon="🏁" />
                <StatCard title="오늘 버그/문의" value={loading ? "–" : (bugs?.today ?? 0).toLocaleString()} sub="bug_report_sync" color="#ef4444" icon="🐛" />
              </div>
            </div>

            {/* 차트 */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <Card>
                <SectionTitle color="#0ea5e9">일별 유입 & 가입 추이</SectionTitle>
                {loading ? <Spinner /> : (
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={trafficSignupData}>
                      <defs>
                        <linearGradient id="tg" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9ca3af" }} />
                      <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} />
                      <Tooltip />
                      <Area type="monotone" dataKey="traffic" name="유입" stroke="#0ea5e9" fill="url(#tg)" strokeWidth={2} />
                      <Area type="monotone" dataKey="signup" name="가입" stroke="#10b981" fill="url(#sg)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </Card>

              <Card>
                <SectionTitle color="#f59e0b">일별 결제 금액 추이</SectionTitle>
                {loading ? <Spinner /> : (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={payments?.daily || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9ca3af" }} />
                      <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} tickFormatter={v => `${Math.round(v/1000)}K`} />
                      <Tooltip formatter={v => [`${Number(v).toLocaleString()}원`]} />
                      <Bar dataKey="amount" name="결제금액" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </Card>
            </div>

            {/* 퍼널 + AI 분석 */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <Card>
                <SectionTitle color="#ec4899">면접 세션 퍼널 (이탈 분석)</SectionTitle>
                {loading ? <Spinner /> : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {(interviews?.funnel || []).map((stage, i, arr) => (
                      <div key={i}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                          <span style={{ fontSize: 12, color: "#374151", fontWeight: 500 }}>{stage.stage}</span>
                          <span style={{ fontSize: 12, color: "#6b7280" }}>{stage.count}명 ({stage.percent}%)</span>
                        </div>
                        <div style={{ height: 8, background: "#f3f4f6", borderRadius: 4, overflow: "hidden" }}>
                          <div style={{
                            height: "100%", width: `${stage.percent}%`,
                            background: `hsl(${280 - i * 20}, 80%, ${60 + i * 5}%)`,
                            borderRadius: 4, transition: "width 0.8s ease",
                          }} />
                        </div>
                        {i < arr.length - 1 && arr[i+1] && (
                          <div style={{ fontSize: 11, color: "#ef4444", textAlign: "right", marginTop: 2 }}>
                            ↓ 이탈 {arr[i].count - arr[i+1].count}명 ({(100 - (arr[i+1].percent / Math.max(arr[i].percent, 1) * 100)).toFixed(1)}%)
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </Card>
              <AIAnalysis data={aiData} />
            </div>
          </div>
        )}

        {/* ── 유입·가입 탭 ──────────────────────────────────────────── */}
        {activeTab === "traffic" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
              <StatCard title={`${days}일 총 유입`} value={loading ? "–" : (traffic?.total ?? 0).toLocaleString()} sub="interview_pay URL" color="#0ea5e9" icon="🌐" />
              <StatCard title="오늘 유입" value={loading ? "–" : (traffic?.today ?? 0).toLocaleString()} sub={today} color="#0ea5e9" icon="📍" />
              <StatCard title="일평균 유입" value={loading ? "–" : traffic?.avg ?? 0} sub={`최근 ${days}일 기준`} color="#0ea5e9" icon="📊" />
            </div>
            <Card>
              <SectionTitle color="#0ea5e9">일별 유입 추이 (interview_pay URL)</SectionTitle>
              {loading ? <Spinner /> : (
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={traffic?.daily || []}>
                    <defs>
                      <linearGradient id="ta2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                    <XAxis dataKey="date" tick={{ fontSize: 12, fill: "#9ca3af" }} />
                    <YAxis tick={{ fontSize: 12, fill: "#9ca3af" }} />
                    <Tooltip />
                    <Area type="monotone" dataKey="count" name="유입 수" stroke="#0ea5e9" fill="url(#ta2)" strokeWidth={2.5} dot={{ r: 4, fill: "#0ea5e9" }} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </Card>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <Card>
                <SectionTitle color="#10b981">일별 신규 회원가입</SectionTitle>
                {loading ? <Spinner /> : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={users?.daily || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9ca3af" }} />
                      <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} />
                      <Tooltip />
                      <Bar dataKey="count" name="가입 수" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </Card>
              <Card>
                <SectionTitle color="#0ea5e9">유입→가입 전환율</SectionTitle>
                {loading ? <Spinner /> : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12, paddingTop: 8 }}>
                    {trafficSignupData.map(d => {
                      const rate = d.traffic > 0 ? ((d.signup || 0) / d.traffic * 100).toFixed(1) : 0;
                      return (
                        <div key={d.date} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <span style={{ fontSize: 12, color: "#6b7280", width: 50 }}>{d.date}</span>
                          <div style={{ flex: 1, height: 8, background: "#f3f4f6", borderRadius: 4 }}>
                            <div style={{ height: "100%", width: `${Math.min(Number(rate), 100)}%`, background: "#0ea5e9", borderRadius: 4 }} />
                          </div>
                          <span style={{ fontSize: 12, fontWeight: 600, color: "#374151", width: 50, textAlign: "right" }}>{rate}%</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            </div>
          </div>
        )}

        {/* ── 로그인 탭 ────────────────────────────────────────────── */}
        {activeTab === "login" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
              <StatCard title={`${days}일 총 로그인`} value={loading ? "–" : (login?.total ?? 0).toLocaleString()} sub="login_sync" color="#6366f1" icon="🔐" />
              <StatCard title="오늘 로그인" value={loading ? "–" : (login?.today ?? 0).toLocaleString()} sub={today} color="#6366f1" icon="📍" />
              <StatCard title="일평균 로그인" value={loading ? "–" : login?.avg ?? 0} sub={`최근 ${days}일 기준`} color="#6366f1" icon="📊" />
            </div>
            <Card>
              <SectionTitle color="#6366f1">일별 로그인 추이</SectionTitle>
              {loading ? <Spinner /> : (
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={login?.daily || []}>
                    <defs>
                      <linearGradient id="la" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                    <XAxis dataKey="date" tick={{ fontSize: 12, fill: "#9ca3af" }} />
                    <YAxis tick={{ fontSize: 12, fill: "#9ca3af" }} />
                    <Tooltip />
                    <Area type="monotone" dataKey="count" name="로그인 수" stroke="#6366f1" fill="url(#la)" strokeWidth={2.5} dot={{ r: 4, fill: "#6366f1" }} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </Card>
            <Card>
              <SectionTitle color="#6366f1">로그인 vs 가입 비교</SectionTitle>
              {loading ? <Spinner /> : (() => {
                const merged = {};
                (login?.daily || []).forEach(r => { merged[r.date] = { date: r.date, login: Number(r.count) }; });
                (users?.daily || []).forEach(r => {
                  if (!merged[r.date]) merged[r.date] = { date: r.date, login: 0 };
                  merged[r.date].signup = Number(r.count);
                });
                const data = Object.values(merged).sort((a,b)=>a.date>b.date?1:-1);
                return (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={data}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9ca3af" }} />
                      <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="login" name="로그인" fill="#6366f1" radius={[3,3,0,0]} />
                      <Bar dataKey="signup" name="가입" fill="#10b981" radius={[3,3,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                );
              })()}
            </Card>
          </div>
        )}

        {/* ── 결제 탭 ──────────────────────────────────────────────── */}
        {activeTab === "payment" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
              <StatCard title={`${days}일 결제 건수`} value={loading ? "–" : `${(payments?.periodTotal ?? 0).toLocaleString()}건`} sub="DONE + 결제 완료" color="#f59e0b" icon="💳" />
              <StatCard title={`${days}일 결제 금액`} value={loading ? "–" : `${(payments?.periodAmount ?? 0).toLocaleString()}원`} sub="쿠폰 제외 실결제" color="#f59e0b" icon="💰" />
              <StatCard title="환불 건수" value={loading ? "–" : `${(payments?.refunds ?? 0)}건`} sub="refund_requested=1" color="#ef4444" icon="↩️" />
              <StatCard title="쿠폰 결제" value={loading ? "–" : `${(payments?.coupons ?? 0)}건`} sub="100% 할인 쿠폰" color="#10b981" icon="🎫" />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <Card>
                <SectionTitle color="#f59e0b">제품별 결제 현황</SectionTitle>
                {loading ? <Spinner /> : (
                  <>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
                      {(payments?.byProduct || []).map((p, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <div style={{ width: 8, height: 8, borderRadius: "50%", background: COLORS[i % COLORS.length], flexShrink: 0 }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 12, fontWeight: 600, color: "#374151", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</div>
                            <div style={{ fontSize: 11, color: "#9ca3af" }}>{p.count}건 · {Number(p.amount).toLocaleString()}원</div>
                          </div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: "#f59e0b" }}>{p.count}건</div>
                        </div>
                      ))}
                    </div>
                    <ResponsiveContainer width="100%" height={160}>
                      <PieChart>
                        <Pie data={payments?.byProduct || []} cx="50%" cy="50%" outerRadius={70} dataKey="count" nameKey="name">
                          {(payments?.byProduct || []).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip formatter={(v, n) => [`${v}건`, n]} />
                      </PieChart>
                    </ResponsiveContainer>
                  </>
                )}
              </Card>

              <Card>
                <SectionTitle color="#f59e0b">일별 결제 건수 & 금액</SectionTitle>
                {loading ? <Spinner /> : (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={payments?.daily || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9ca3af" }} />
                      <YAxis yAxisId="left" tick={{ fontSize: 11, fill: "#9ca3af" }} />
                      <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: "#9ca3af" }} tickFormatter={v => `${Math.round(v/1000)}K`} />
                      <Tooltip formatter={(v, n) => n === '건수' ? [`${v}건`] : [`${Number(v).toLocaleString()}원`]} />
                      <Legend />
                      <Bar yAxisId="left" dataKey="count" name="건수" fill="#f59e0b" radius={[3,3,0,0]} />
                      <Bar yAxisId="right" dataKey="amount" name="금액" fill="#fcd34d" radius={[3,3,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </Card>
            </div>

            <Card>
              <SectionTitle color="#f59e0b">최근 결제 내역</SectionTitle>
              {loading ? <Spinner /> : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                    <thead>
                      <tr style={{ borderBottom: "2px solid #f3f4f6" }}>
                        {["이름", "제품", "결제금액", "결제방법", "상태", "날짜"].map(h => (
                          <th key={h} style={{ padding: "8px 12px", textAlign: "left", color: "#6b7280", fontWeight: 600, fontSize: 12 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(payments?.recent || []).map((p, i) => (
                        <tr key={i} style={{ borderBottom: "1px solid #f9fafb" }}
                          onMouseEnter={e => e.currentTarget.style.background="#fafafa"}
                          onMouseLeave={e => e.currentTarget.style.background="transparent"}>
                          <td style={{ padding: "10px 12px", fontWeight: 600 }}>{p.name}</td>
                          <td style={{ padding: "10px 12px", color: "#374151", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.product}</td>
                          <td style={{ padding: "10px 12px", fontWeight: 700, color: p.amount === 0 ? "#9ca3af" : "#f59e0b" }}>
                            {p.amount === 0 ? "0원 (쿠폰)" : `${Number(p.amount).toLocaleString()}원`}
                          </td>
                          <td style={{ padding: "10px 12px", color: "#6b7280" }}>{p.method}</td>
                          <td style={{ padding: "10px 12px" }}>
                            <span style={{
                              padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600,
                              background: p.refund_requested ? "#fee2e2" : p.status === "DONE" ? "#d1fae5" : "#fef3c7",
                              color: p.refund_requested ? "#991b1b" : p.status === "DONE" ? "#065f46" : "#92400e",
                            }}>{p.refund_requested ? "환불" : p.status}</span>
                          </td>
                          <td style={{ padding: "10px 12px", color: "#9ca3af" }}>{p.date}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>
        )}

        {/* ── 면접 세션 탭 ─────────────────────────────────────────── */}
        {activeTab === "interview" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
              <StatCard title="총 면접 세션" value={loading ? "–" : (interviews?.total ?? 0).toLocaleString()} sub="interview_seesion_sync" color="#ec4899" icon="🎙️" />
              <StatCard title="퍼널 완주" value={loading ? "–" : `${(interviews?.funnel?.[4]?.count ?? 0)}명`} sub={`${interviews?.completionRate ?? 0}% 완주율`} color="#ec4899" icon="🏁" />
              <StatCard title="1단계 이탈" value={loading ? "–" : `${(interviews?.funnel?.[0]?.count ?? 0) - (interviews?.funnel?.[1]?.count ?? 0)}명`} sub="이메일 입력 후 이탈" color="#ef4444" icon="↩️" />
              <StatCard title="오늘 세션" value={loading ? "–" : (interviews?.today ?? 0).toLocaleString()} sub={today} color="#ec4899" icon="📍" />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <Card>
                <SectionTitle color="#ec4899">면접 세션 퍼널 상세</SectionTitle>
                {loading ? <Spinner /> : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {(interviews?.funnel || []).map((stage, i, arr) => (
                      <div key={i}>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>{stage.stage}</span>
                          <div style={{ display: "flex", gap: 8 }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>{stage.count}명</span>
                            <span style={{ fontSize: 12, color: "#9ca3af" }}>({stage.percent}%)</span>
                          </div>
                        </div>
                        <div style={{ height: 10, background: "#f3f4f6", borderRadius: 5, overflow: "hidden", marginTop: 6 }}>
                          <div style={{
                            height: "100%", width: `${stage.percent}%`,
                            background: "linear-gradient(90deg, #ec4899, #f472b6)",
                            borderRadius: 5, transition: "width 1s ease",
                          }} />
                        </div>
                        {i < arr.length - 1 && arr[i+1] && (
                          <div style={{
                            fontSize: 11, color: "#ef4444", padding: "3px 8px",
                            background: "#fef2f2", borderRadius: 4, display: "inline-block",
                            alignSelf: "flex-end", marginTop: 4,
                          }}>
                            ⚠️ {arr[i].count - arr[i+1].count}명 이탈 ({(((arr[i].count - arr[i+1].count) / Math.max(arr[i].count, 1)) * 100).toFixed(1)}%)
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <Card>
                  <SectionTitle color="#8b5cf6">제품별 세션 분포</SectionTitle>
                  {loading ? <Spinner /> : (
                    <>
                      <ResponsiveContainer width="100%" height={140}>
                        <PieChart>
                          <Pie data={interviews?.byProduct || []} cx="50%" cy="50%" outerRadius={60} dataKey="count" nameKey="product">
                            {(interviews?.byProduct || []).map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                      <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginTop: 8 }}>
                        {(interviews?.byProduct || []).map((p, i) => (
                          <div key={i} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12 }}>
                            <div style={{ width: 8, height: 8, borderRadius: "50%", background: COLORS[i] }} />
                            <span style={{ color: "#6b7280" }}>{p.product}</span>
                            <span style={{ fontWeight: 700 }}>{p.count}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </Card>

                <Card>
                  <SectionTitle color="#a78bfa">면접 유형 분포 (interview_raw)</SectionTitle>
                  {loading ? <Spinner /> : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {(interviews?.byType || []).map((t, i) => {
                        const total = (interviews.byType || []).reduce((s, r) => s + r.count, 0);
                        const pct = total ? (t.count / total * 100).toFixed(0) : 0;
                        return (
                          <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <span style={{ fontSize: 12, color: "#6b7280", width: 140, flexShrink: 0 }}>{t.type}</span>
                            <div style={{ flex: 1, height: 10, background: "#f3f4f6", borderRadius: 5 }}>
                              <div style={{ height: "100%", width: `${pct}%`, background: COLORS[i], borderRadius: 5 }} />
                            </div>
                            <span style={{ fontSize: 12, fontWeight: 700, color: "#374151", width: 30 }}>{t.count}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Card>
              </div>
            </div>
          </div>
        )}

        {/* ── 버그/문의 탭 ─────────────────────────────────────────── */}
        {activeTab === "bugs" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
              <StatCard title={`${days}일 총 문의`} value={loading ? "–" : `${(bugs?.summary?.total ?? 0)}건`} sub="bug_report_sync" color="#ef4444" icon="📋" />
              <StatCard title="버그 신고" value={loading ? "–" : `${(bugs?.summary?.bugs ?? 0)}건`} sub="type 버그 포함" color="#ef4444" icon="⚠️" />
              <StatCard title="이용 문의" value={loading ? "–" : `${(bugs?.summary?.issues ?? 0)}건`} sub="type 문의 포함" color="#f59e0b" icon="💬" />
              <StatCard title="기타" value={loading ? "–" : `${(bugs?.summary?.others ?? 0)}건`} sub="type 기타" color="#6b7280" icon="📌" />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <Card>
                <SectionTitle color="#ef4444">제품별 문의 유형 현황</SectionTitle>
                {loading ? <Spinner /> : (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={bugs?.chartData || []} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                      <XAxis type="number" tick={{ fontSize: 11, fill: "#9ca3af" }} />
                      <YAxis dataKey="product" type="category" tick={{ fontSize: 11, fill: "#6b7280" }} width={110} />
                      <Tooltip />
                      <Legend />
                      {(bugs?.types || []).map((type, i) => (
                        <Bar key={type} dataKey={type} stackId="a" fill={COLORS[i % COLORS.length]} radius={i === (bugs.types.length-1) ? [0,2,2,0] : [0,0,0,0]} />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </Card>

              <Card>
                <SectionTitle color="#ef4444">최근 주요 문의</SectionTitle>
                {loading ? <Spinner /> : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 280, overflowY: "auto" }}>
                    {(bugs?.recent || []).map((b, i) => (
                      <div key={i} style={{
                        padding: "10px 12px", background: "#fafafa", borderRadius: 8,
                        borderLeft: `3px solid ${b.type?.includes("버그") ? "#ef4444" : "#f59e0b"}`,
                      }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: "#374151" }}>{b.product}</span>
                          <span style={{ fontSize: 10, color: "#9ca3af" }}>{b.email} · {b.date}</span>
                        </div>
                        <div style={{ fontSize: 11, color: "#6b7280" }}>[{b.type}] {b.content}</div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
