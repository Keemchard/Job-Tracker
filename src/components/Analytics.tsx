"use client";

import {
  JobApplication,
  ApplicationStatus,
  STATUS_LABELS,
  STATUS_COLORS,
  WORK_MODE_LABELS,
  WorkMode,
} from "@/types/application";
import styles from "@/styles/analytics.module.scss";

interface AnalyticsProps {
  applications: JobApplication[];
}

function getWeekLabel(date: Date): string {
  const start = new Date(date);
  start.setDate(start.getDate() - start.getDay());
  return start.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function Analytics({ applications }: AnalyticsProps) {
  const total = applications.length;

  // Response rate: apps that moved past "applied"
  const responded = applications.filter((a) => a.status !== "applied").length;
  const responseRate = total > 0 ? Math.round((responded / total) * 100) : 0;

  // Interview rate: apps that reached interview or beyond
  const interviewed = applications.filter((a) =>
    ["interview", "technical", "offer", "accepted"].includes(a.status)
  ).length;
  const interviewRate = total > 0 ? Math.round((interviewed / total) * 100) : 0;

  // Offer rate
  const offers = applications.filter(
    (a) => a.status === "offer" || a.status === "accepted"
  ).length;
  const offerRate = total > 0 ? Math.round((offers / total) * 100) : 0;

  // Average time to response (apps that moved past applied)
  // We can't calculate exact response time without a status change timestamp,
  // so we show days since application for active ones
  const active = applications.filter(
    (a) => !["rejected", "withdrawn", "accepted"].includes(a.status)
  );
  const avgDaysActive =
    active.length > 0
      ? Math.round(
          active.reduce((sum, a) => {
            const days = Math.floor(
              (Date.now() - new Date(a.dateApplied).getTime()) /
                (1000 * 60 * 60 * 24)
            );
            return sum + days;
          }, 0) / active.length
        )
      : 0;

  // Weekly activity (last 8 weeks)
  const weeklyData: { label: string; count: number }[] = [];
  for (let i = 7; i >= 0; i--) {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - i * 7 - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const count = applications.filter((a) => {
      const d = new Date(a.dateApplied);
      return d >= weekStart && d < weekEnd;
    }).length;

    weeklyData.push({ label: getWeekLabel(weekStart), count });
  }
  const maxWeekly = Math.max(...weeklyData.map((w) => w.count), 1);

  // Status funnel
  const funnelStages: ApplicationStatus[] = [
    "applied",
    "screening",
    "interview",
    "technical",
    "offer",
    "accepted",
  ];
  const funnelData = funnelStages.map((status) => ({
    status,
    count: applications.filter((a) => {
      const idx = funnelStages.indexOf(a.status);
      const stageIdx = funnelStages.indexOf(status);
      return idx >= stageIdx || a.status === status;
    }).length,
    exact: applications.filter((a) => a.status === status).length,
  }));

  // Work mode distribution
  const workModes = (Object.keys(WORK_MODE_LABELS) as WorkMode[]).map((mode) => ({
    mode,
    label: WORK_MODE_LABELS[mode],
    count: applications.filter((a) => a.workMode === mode).length,
  }));

  // Top companies by applications
  const companyCounts: Record<string, number> = {};
  applications.forEach((a) => {
    companyCounts[a.company] = (companyCounts[a.company] || 0) + 1;
  });
  const topCompanies = Object.entries(companyCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Monthly trend (last 6 months)
  const monthlyData: { label: string; count: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const month = d.toLocaleDateString("en-US", { month: "short" });
    const year = d.getFullYear();
    const m = d.getMonth();
    const count = applications.filter((a) => {
      const ad = new Date(a.dateApplied);
      return ad.getMonth() === m && ad.getFullYear() === year;
    }).length;
    monthlyData.push({ label: month, count });
  }
  const maxMonthly = Math.max(...monthlyData.map((m) => m.count), 1);

  if (total === 0) {
    return (
      <div>
        <div className={styles.header}>
          <h2>Analytics</h2>
          <p>Insights and trends from your job search</p>
        </div>
        <div className={styles.empty}>
          <p>Add some applications to see your analytics.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className={styles.header}>
        <h2>Analytics</h2>
        <p>Insights and trends from your job search</p>
      </div>

      <div className={styles.rateCards}>
        <div className={styles.rateCard}>
          <div className={styles.rateValue} style={{ color: "#3b82f6" }}>
            {responseRate}%
          </div>
          <div className={styles.rateLabel}>Response Rate</div>
          <div className={styles.rateSub}>
            {responded} of {total} got responses
          </div>
        </div>
        <div className={styles.rateCard}>
          <div className={styles.rateValue} style={{ color: "#8b5cf6" }}>
            {interviewRate}%
          </div>
          <div className={styles.rateLabel}>Interview Rate</div>
          <div className={styles.rateSub}>
            {interviewed} reached interview stage
          </div>
        </div>
        <div className={styles.rateCard}>
          <div className={styles.rateValue} style={{ color: "#10b981" }}>
            {offerRate}%
          </div>
          <div className={styles.rateLabel}>Offer Rate</div>
          <div className={styles.rateSub}>{offers} offers received</div>
        </div>
        <div className={styles.rateCard}>
          <div className={styles.rateValue} style={{ color: "#f59e0b" }}>
            {avgDaysActive}
          </div>
          <div className={styles.rateLabel}>Avg Days Active</div>
          <div className={styles.rateSub}>For in-progress applications</div>
        </div>
      </div>

      <div className={styles.chartsGrid}>
        <div className={styles.chartCard}>
          <h3>Weekly Activity</h3>
          <div className={styles.barChart}>
            {weeklyData.map((w, i) => (
              <div key={i} className={styles.barGroup}>
                <div className={styles.barWrapper}>
                  <div
                    className={styles.bar}
                    style={{
                      height: `${(w.count / maxWeekly) * 100}%`,
                      background: w.count > 0 ? "#6366f1" : "transparent",
                    }}
                  />
                </div>
                <span className={styles.barLabel}>{w.label}</span>
                {w.count > 0 && (
                  <span className={styles.barValue}>{w.count}</span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className={styles.chartCard}>
          <h3>Monthly Trend</h3>
          <div className={styles.barChart}>
            {monthlyData.map((m, i) => (
              <div key={i} className={styles.barGroup}>
                <div className={styles.barWrapper}>
                  <div
                    className={styles.bar}
                    style={{
                      height: `${(m.count / maxMonthly) * 100}%`,
                      background: m.count > 0 ? "#8b5cf6" : "transparent",
                    }}
                  />
                </div>
                <span className={styles.barLabel}>{m.label}</span>
                {m.count > 0 && (
                  <span className={styles.barValue}>{m.count}</span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className={styles.chartCard}>
          <h3>Application Funnel</h3>
          <div className={styles.funnel}>
            {funnelStages.map((status) => {
              const exact = applications.filter(
                (a) => a.status === status
              ).length;
              const pct = total > 0 ? Math.round((exact / total) * 100) : 0;
              return (
                <div key={status} className={styles.funnelRow}>
                  <div className={styles.funnelLabel}>
                    <div
                      className={styles.funnelDot}
                      style={{ background: STATUS_COLORS[status] }}
                    />
                    {STATUS_LABELS[status]}
                  </div>
                  <div className={styles.funnelBarWrap}>
                    <div
                      className={styles.funnelBar}
                      style={{
                        width: `${Math.max(pct, 2)}%`,
                        background: STATUS_COLORS[status],
                      }}
                    />
                  </div>
                  <span className={styles.funnelCount}>{exact}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className={styles.chartCard}>
          <h3>Work Mode</h3>
          <div className={styles.donutList}>
            {workModes.map((wm) => {
              const pct =
                total > 0 ? Math.round((wm.count / total) * 100) : 0;
              return (
                <div key={wm.mode} className={styles.donutItem}>
                  <div className={styles.donutInfo}>
                    <span className={styles.donutLabel}>{wm.label}</span>
                    <span className={styles.donutPct}>{pct}%</span>
                  </div>
                  <div className={styles.donutBarWrap}>
                    <div
                      className={styles.donutBar}
                      style={{
                        width: `${Math.max(pct, 2)}%`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {topCompanies.length > 0 && (
          <div className={styles.chartCard}>
            <h3>Top Companies</h3>
            <div className={styles.companyList}>
              {topCompanies.map(([company, count], i) => (
                <div key={company} className={styles.companyItem}>
                  <span className={styles.companyRank}>{i + 1}</span>
                  <span className={styles.companyName}>{company}</span>
                  <span className={styles.companyCount}>
                    {count} app{count > 1 ? "s" : ""}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className={styles.chartCard}>
          <h3>Status Overview</h3>
          <div className={styles.statusGrid}>
            {(Object.keys(STATUS_LABELS) as ApplicationStatus[]).map(
              (status) => {
                const count = applications.filter(
                  (a) => a.status === status
                ).length;
                const pct =
                  total > 0 ? Math.round((count / total) * 100) : 0;
                return (
                  <div key={status} className={styles.statusTile}>
                    <div
                      className={styles.statusTileDot}
                      style={{ background: STATUS_COLORS[status] }}
                    />
                    <div className={styles.statusTileInfo}>
                      <span className={styles.statusTileName}>
                        {STATUS_LABELS[status]}
                      </span>
                      <span className={styles.statusTileCount}>
                        {count} ({pct}%)
                      </span>
                    </div>
                  </div>
                );
              }
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
