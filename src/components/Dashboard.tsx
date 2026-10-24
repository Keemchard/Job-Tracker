"use client";

import {
  IoDocumentText,
  IoPeople,
  IoCheckmarkCircle,
  IoCloseCircle,
  IoBriefcase,
} from "react-icons/io5";
import {
  JobApplication,
  ApplicationStatus,
  STATUS_LABELS,
  STATUS_COLORS,
} from "@/types/application";
import StatusBadge from "./StatusBadge";
import styles from "@/styles/dashboard.module.scss";

interface DashboardProps {
  applications: JobApplication[];
  onNavigate: (view: string) => void;
}

export default function Dashboard({
  applications,
  onNavigate,
}: DashboardProps) {
  const total = applications.length;
  const active = applications.filter(
    (a) =>
      !["rejected", "withdrawn", "accepted"].includes(a.status)
  ).length;
  const offers = applications.filter((a) => a.status === "offer" || a.status === "accepted").length;
  const rejected = applications.filter(
    (a) => a.status === "rejected"
  ).length;

  const statusCounts = applications.reduce(
    (acc, app) => {
      acc[app.status] = (acc[app.status] || 0) + 1;
      return acc;
    },
    {} as Record<ApplicationStatus, number>
  );

  const recent = [...applications]
    .sort(
      (a, b) =>
        new Date(b.dateApplied).getTime() - new Date(a.dateApplied).getTime()
    )
    .slice(0, 5);

  const thisWeek = applications.filter((a) => {
    const applied = new Date(a.dateApplied);
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return applied >= weekAgo;
  }).length;

  return (
    <div>
      <div className={styles.header}>
        <h2>Dashboard</h2>
        <p>Overview of your job application progress</p>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Total Applications</div>
          <div className={styles.statValue} style={{ color: "#6366f1" }}>
            {total}
          </div>
          <div className={styles.statFooter}>{thisWeek} this week</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Active</div>
          <div className={styles.statValue} style={{ color: "#3b82f6" }}>
            {active}
          </div>
          <div className={styles.statFooter}>In progress</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Offers</div>
          <div className={styles.statValue} style={{ color: "#10b981" }}>
            {offers}
          </div>
          <div className={styles.statFooter}>Received</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Rejected</div>
          <div className={styles.statValue} style={{ color: "#ef4444" }}>
            {rejected}
          </div>
          <div className={styles.statFooter}>
            {total > 0
              ? `${Math.round((rejected / total) * 100)}% rejection rate`
              : "No data"}
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h3>Status Breakdown</h3>
        </div>
        <div className={styles.statusBreakdown}>
          {(Object.keys(STATUS_LABELS) as ApplicationStatus[]).map(
            (status) => (
              <div key={status} className={styles.statusItem}>
                <div
                  className={styles.statusDot}
                  style={{ background: STATUS_COLORS[status] }}
                />
                <div className={styles.statusInfo}>
                  <div className={styles.statusName}>
                    {STATUS_LABELS[status]}
                  </div>
                  <div className={styles.statusCount}>
                    {statusCounts[status] || 0}
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h3>Recent Applications</h3>
          {applications.length > 5 && (
            <button
              className={styles.viewAll}
              onClick={() => onNavigate("applications")}
              style={{
                background: "none",
                border: "none",
                color: "#6366f1",
                cursor: "pointer",
                fontSize: "0.875rem",
              }}
            >
              View all
            </button>
          )}
        </div>
        {recent.length === 0 ? (
          <div className={styles.emptyState}>
            <IoBriefcase />
            <h3>No applications yet</h3>
            <p>
              Start tracking your job applications to see your progress here.
            </p>
          </div>
        ) : (
          <div className={styles.recentList}>
            {recent.map((app) => (
              <div key={app.id} className={styles.recentItem}>
                <div className={styles.recentInfo}>
                  <span className={styles.company}>{app.company}</span>
                  <span className={styles.position}>{app.position}</span>
                </div>
                <div className={styles.recentMeta}>
                  <StatusBadge status={app.status} />
                  <span className={styles.date}>
                    {new Date(app.dateApplied).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
