"use client";

import { useState, useMemo } from "react";
import {
  IoSearch,
  IoAdd,
  IoPencil,
  IoTrash,
  IoOpen,
  IoBriefcase,
  IoLocationOutline,
  IoCalendarOutline,
} from "react-icons/io5";
import {
  JobApplication,
  ApplicationStatus,
  STATUS_LABELS,
  WORK_MODE_LABELS,
} from "@/types/application";
import StatusBadge from "./StatusBadge";
import styles from "@/styles/applications.module.scss";

interface ApplicationListProps {
  applications: JobApplication[];
  onAdd: () => void;
  onEdit: (app: JobApplication) => void;
  onDelete: (app: JobApplication) => void;
}

export default function ApplicationList({
  applications,
  onAdd,
  onEdit,
  onDelete,
}: ApplicationListProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<string>("dateApplied");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const filtered = useMemo(() => {
    let result = [...applications];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (a) =>
          a.company.toLowerCase().includes(q) ||
          a.position.toLowerCase().includes(q) ||
          a.location.toLowerCase().includes(q)
      );
    }

    if (statusFilter !== "all") {
      result = result.filter((a) => a.status === statusFilter);
    }

    result.sort((a, b) => {
      let aVal: string;
      let bVal: string;

      switch (sortField) {
        case "company":
          aVal = a.company.toLowerCase();
          bVal = b.company.toLowerCase();
          break;
        case "status":
          aVal = a.status;
          bVal = b.status;
          break;
        case "dateApplied":
        default:
          aVal = a.dateApplied;
          bVal = b.dateApplied;
      }

      if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [applications, search, statusFilter, sortField, sortDir]);

  const toggleSort = (field: string) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  const sortIndicator = (field: string) => {
    if (sortField !== field) return "";
    return sortDir === "asc" ? " ↑" : " ↓";
  };

  return (
    <div>
      <div className={styles.header}>
        <h2>Applications</h2>
        <button className={styles.addButton} onClick={onAdd}>
          <IoAdd /> Add Application
        </button>
      </div>

      <div className={styles.controls}>
        <div className={styles.searchWrapper}>
          <IoSearch />
          <input
            className={styles.searchInput}
            type="text"
            placeholder="Search by company, position, or location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className={styles.filterSelect}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Status</option>
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className={styles.tableWrapper}>
          <div className={styles.emptyTable}>
            <IoBriefcase />
            <p>
              {applications.length === 0
                ? "No applications yet. Click \"Add Application\" to get started."
                : "No applications match your filters."}
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className={styles.desktopTable}>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th onClick={() => toggleSort("company")}>
                      Company{sortIndicator("company")}
                    </th>
                    <th>Location</th>
                    <th onClick={() => toggleSort("status")}>
                      Status{sortIndicator("status")}
                    </th>
                    <th onClick={() => toggleSort("dateApplied")}>
                      Date Applied{sortIndicator("dateApplied")}
                    </th>
                    <th>Salary</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((app) => (
                    <tr key={app.id}>
                      <td>
                        <div className={styles.companyCell}>
                          <div className={styles.company}>{app.company}</div>
                          <div className={styles.position}>{app.position}</div>
                        </div>
                      </td>
                      <td>
                        <div className={styles.locationCell}>
                          <div className={styles.location}>{app.location}</div>
                          <span className={styles.workMode}>
                            {WORK_MODE_LABELS[app.workMode]}
                          </span>
                        </div>
                      </td>
                      <td>
                        <StatusBadge status={app.status} />
                      </td>
                      <td>
                        {new Date(app.dateApplied).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                      <td>{app.salary || "—"}</td>
                      <td>
                        <div className={styles.actions}>
                          {app.jobUrl && (
                            <a
                              href={app.jobUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={styles.actionBtn}
                              title="Open job posting"
                            >
                              <IoOpen />
                            </a>
                          )}
                          <button
                            className={styles.actionBtn}
                            onClick={() => onEdit(app)}
                            title="Edit"
                          >
                            <IoPencil />
                          </button>
                          <button
                            className={`${styles.actionBtn} ${styles.deleteBtn}`}
                            onClick={() => onDelete(app)}
                            title="Delete"
                          >
                            <IoTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className={styles.mobileCards}>
            {filtered.map((app) => (
              <div key={app.id} className={styles.card}>
                <div className={styles.cardHeader}>
                  <div>
                    <div className={styles.cardCompany}>{app.company}</div>
                    <div className={styles.cardPosition}>{app.position}</div>
                  </div>
                  <StatusBadge status={app.status} />
                </div>
                <div className={styles.cardDetails}>
                  <span className={styles.cardDetail}>
                    <IoLocationOutline /> {app.location}
                  </span>
                  <span className={styles.cardDetail}>
                    <IoCalendarOutline />{" "}
                    {new Date(app.dateApplied).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                  {app.salary && (
                    <span className={styles.cardDetail}>{app.salary}</span>
                  )}
                </div>
                <div className={styles.cardActions}>
                  {app.jobUrl && (
                    <a
                      href={app.jobUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.actionBtn}
                    >
                      <IoOpen />
                    </a>
                  )}
                  <button
                    className={styles.actionBtn}
                    onClick={() => onEdit(app)}
                  >
                    <IoPencil />
                  </button>
                  <button
                    className={`${styles.actionBtn} ${styles.deleteBtn}`}
                    onClick={() => onDelete(app)}
                  >
                    <IoTrash />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
