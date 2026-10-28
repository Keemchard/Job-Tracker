"use client";

import { useState, useRef } from "react";
import {
  JobApplication,
  ApplicationStatus,
  STATUS_LABELS,
  STATUS_COLORS,
} from "@/types/application";
import StatusBadge from "./StatusBadge";
import styles from "@/styles/kanban.module.scss";

interface KanbanBoardProps {
  applications: JobApplication[];
  onStatusChange: (appId: string, newStatus: ApplicationStatus) => void;
  onEdit: (app: JobApplication) => void;
}

const COLUMNS: ApplicationStatus[] = [
  "applied",
  "screening",
  "interview",
  "technical",
  "offer",
  "accepted",
  "rejected",
  "withdrawn",
];

export default function KanbanBoard({
  applications,
  onStatusChange,
  onEdit,
}: KanbanBoardProps) {
  const [draggedApp, setDraggedApp] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<ApplicationStatus | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const grouped = COLUMNS.reduce(
    (acc, status) => {
      acc[status] = applications.filter((a) => a.status === status);
      return acc;
    },
    {} as Record<ApplicationStatus, JobApplication[]>
  );

  const handleDragStart = (appId: string) => {
    setDraggedApp(appId);
  };

  const handleDragOver = (e: React.DragEvent, status: ApplicationStatus) => {
    e.preventDefault();
    setDragOverCol(status);
  };

  const handleDragLeave = () => {
    setDragOverCol(null);
  };

  const handleDrop = (status: ApplicationStatus) => {
    if (draggedApp) {
      const app = applications.find((a) => a.id === draggedApp);
      if (app && app.status !== status) {
        onStatusChange(draggedApp, status);
      }
    }
    setDraggedApp(null);
    setDragOverCol(null);
  };

  const handleDragEnd = () => {
    setDraggedApp(null);
    setDragOverCol(null);
  };

  return (
    <div>
      <div className={styles.header}>
        <h2>Kanban Board</h2>
        <p>Drag and drop applications between stages</p>
      </div>

      <div className={styles.board} ref={scrollRef}>
        {COLUMNS.map((status) => (
          <div
            key={status}
            className={`${styles.column} ${dragOverCol === status ? styles.columnOver : ""}`}
            onDragOver={(e) => handleDragOver(e, status)}
            onDragLeave={handleDragLeave}
            onDrop={() => handleDrop(status)}
          >
            <div className={styles.columnHeader}>
              <div
                className={styles.columnDot}
                style={{ background: STATUS_COLORS[status] }}
              />
              <span className={styles.columnTitle}>{STATUS_LABELS[status]}</span>
              <span className={styles.columnCount}>{grouped[status].length}</span>
            </div>

            <div className={styles.columnBody}>
              {grouped[status].length === 0 ? (
                <div className={styles.emptyCol}>Drop here</div>
              ) : (
                grouped[status].map((app) => (
                  <div
                    key={app.id}
                    className={`${styles.card} ${draggedApp === app.id ? styles.cardDragging : ""}`}
                    draggable
                    onDragStart={() => handleDragStart(app.id)}
                    onDragEnd={handleDragEnd}
                    onClick={() => onEdit(app)}
                  >
                    <div className={styles.cardCompany}>{app.company}</div>
                    <div className={styles.cardPosition}>{app.position}</div>
                    <div className={styles.cardMeta}>
                      <span>{app.location}</span>
                      <span>
                        {new Date(app.dateApplied).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                    {app.salary && (
                      <div className={styles.cardSalary}>{app.salary}</div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
