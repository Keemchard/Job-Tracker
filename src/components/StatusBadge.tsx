"use client";

import {
  ApplicationStatus,
  STATUS_LABELS,
  STATUS_COLORS,
} from "@/types/application";
import styles from "@/styles/applications.module.scss";

interface StatusBadgeProps {
  status: ApplicationStatus;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const color = STATUS_COLORS[status];

  return (
    <span
      className={styles.statusBadge}
      style={{
        color,
        background: `${color}18`,
      }}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
