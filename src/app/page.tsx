"use client";

import { useState, useEffect, useCallback } from "react";
import {
  IoGrid,
  IoBriefcase,
  IoMenu,
  IoClose,
  IoLogOut,
  IoPersonCircle,
  IoApps,
  IoBarChart,
  IoDocumentText,
  IoRibbon,
  IoChatbubbles,
} from "react-icons/io5";
import { Toaster, toast } from "react-hot-toast";
import { useAuth } from "@/components/AuthProvider";
import AuthPage from "@/components/AuthPage";
import { JobApplication } from "@/types/application";
import {
  getApplications,
  addApplication,
  updateApplication,
  deleteApplication,
} from "@/lib/applications";
import Dashboard from "@/components/Dashboard";
import ApplicationList from "@/components/ApplicationList";
import ApplicationModal from "@/components/ApplicationModal";
import DeleteConfirmModal from "@/components/DeleteConfirmModal";
import ThemeToggle from "@/components/ThemeToggle";
import KanbanBoard from "@/components/KanbanBoard";
import Analytics from "@/components/Analytics";
import CoverLetterGenerator from "@/components/CoverLetterGenerator";
import ResumeMatchScore from "@/components/ResumeMatchScore";
import InterviewPrep from "@/components/InterviewPrep";
import styles from "@/styles/layout.module.scss";
import authStyles from "@/styles/auth.module.scss";

type View = "dashboard" | "applications" | "kanban" | "analytics" | "cover-letter" | "resume-match" | "interview-prep";

export default function Home() {
  const { user, loading: authLoading, logout } = useAuth();

  const [view, setView] = useState<View>("dashboard");
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<JobApplication | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<JobApplication | null>(null);

  const fetchApplications = useCallback(async () => {
    if (!user) return;
    try {
      const data = await getApplications(user.uid);
      setApplications(data);
    } catch {
      toast.error("Failed to load applications");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      setLoading(true);
      fetchApplications();
    }
  }, [user, fetchApplications]);

  const handleAdd = async (
    data: Omit<JobApplication, "id" | "userId" | "createdAt" | "updatedAt">
  ) => {
    if (!user) return;
    try {
      await addApplication(user.uid, data);
      await fetchApplications();
      toast.success("Application added!");
    } catch {
      toast.error("Failed to add application");
    }
  };

  const handleUpdate = async (
    data: Omit<JobApplication, "id" | "userId" | "createdAt" | "updatedAt">
  ) => {
    if (!editingApp || !user) return;
    try {
      await updateApplication(editingApp.id, user.uid, data);
      await fetchApplications();
      toast.success("Application updated!");
    } catch {
      toast.error("Failed to update application");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget || !user) return;
    try {
      await deleteApplication(deleteTarget.id, user.uid);
      await fetchApplications();
      toast.success("Application deleted");
      setDeleteTarget(null);
    } catch {
      toast.error("Failed to delete application");
    }
  };

  const handleStatusChange = async (appId: string, newStatus: string) => {
    if (!user) return;
    try {
      await updateApplication(appId, user.uid, {
        status: newStatus as import("@/types/application").ApplicationStatus,
      });
      await fetchApplications();
      toast.success("Status updated!");
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setApplications([]);
    } catch {
      toast.error("Failed to sign out");
    }
  };

  const navigate = (v: string) => {
    setView(v as View);
    setSidebarOpen(false);
  };

  if (authLoading) {
    return <div className={authStyles.loadingPage}>Loading...</div>;
  }

  if (!user) {
    return (
      <>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "var(--color-bg-secondary)",
              color: "var(--color-text-primary)",
              border: "1px solid var(--color-border)",
              borderRadius: "10px",
            },
          }}
        />
        <AuthPage />
      </>
    );
  }

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "#1a1d27",
            color: "#e8eaf0",
            border: "1px solid #2e3348",
            borderRadius: "10px",
          },
        }}
      />

      <div className={styles.layout}>
        {sidebarOpen && (
          <div
            className={styles.overlay}
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <aside
          className={`${styles.sidebar} ${sidebarOpen ? styles.open : ""}`}
        >
          <div className={styles.logo}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="28" height="28" rx="7" fill="#6366f1"/>
                <text x="5" y="19" fontFamily="monospace" fontWeight="800" fontSize="13" fill="white">&gt;_</text>
              </svg>
              <h1 style={{ fontSize: "1.1rem", fontWeight: 700, letterSpacing: "-0.02em", margin: 0, color: "var(--color-text-primary)" }}>
                hired<span style={{ color: "#6366f1" }}>.log</span>
              </h1>
            </div>
            <p style={{ fontSize: "0.7rem", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>
              your hunt, your log.
            </p>
          </div>
          <nav className={styles.nav}>
            <button
              className={`${styles.navItem} ${view === "dashboard" ? styles.active : ""}`}
              onClick={() => navigate("dashboard")}
            >
              <IoGrid />
              Dashboard
            </button>
            <button
              className={`${styles.navItem} ${view === "applications" ? styles.active : ""}`}
              onClick={() => navigate("applications")}
            >
              <IoBriefcase />
              Applications
            </button>
            <button
              className={`${styles.navItem} ${view === "kanban" ? styles.active : ""}`}
              onClick={() => navigate("kanban")}
            >
              <IoApps />
              Kanban Board
            </button>
            <button
              className={`${styles.navItem} ${view === "analytics" ? styles.active : ""}`}
              onClick={() => navigate("analytics")}
            >
              <IoBarChart />
              Analytics
            </button>

            <div className={styles.navLabel}>AI Tools</div>

            <button
              className={`${styles.navItem} ${view === "cover-letter" ? styles.active : ""}`}
              onClick={() => navigate("cover-letter")}
            >
              <IoDocumentText />
              Cover Letters
            </button>
            <button
              className={`${styles.navItem} ${view === "resume-match" ? styles.active : ""}`}
              onClick={() => navigate("resume-match")}
            >
              <IoRibbon />
              Resume Match
            </button>
            <button
              className={`${styles.navItem} ${view === "interview-prep" ? styles.active : ""}`}
              onClick={() => navigate("interview-prep")}
            >
              <IoChatbubbles />
              Interview Prep
            </button>
          </nav>

          <div className={styles.userSection}>
            <div className={styles.userInfo}>
              <IoPersonCircle className={styles.userAvatar} />
              <div className={styles.userDetails}>
                <span className={styles.userName}>
                  {user.displayName || "User"}
                </span>
                <span className={styles.userEmail}>{user.email}</span>
              </div>
            </div>
            <ThemeToggle />
            <button
              className={styles.logoutBtn}
              onClick={handleLogout}
              title="Sign out"
            >
              <IoLogOut />
            </button>
          </div>
        </aside>

        <main className={styles.main}>
          {loading ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "60vh",
                color: "#6b7280",
              }}
            >
              Loading...
            </div>
          ) : view === "dashboard" ? (
            <Dashboard applications={applications} onNavigate={navigate} />
          ) : view === "kanban" ? (
            <KanbanBoard
              applications={applications}
              onStatusChange={handleStatusChange}
              onEdit={(app) => {
                setEditingApp(app);
                setModalOpen(true);
              }}
            />
          ) : view === "analytics" ? (
            <Analytics applications={applications} />
          ) : view === "cover-letter" ? (
            <CoverLetterGenerator applications={applications} />
          ) : view === "resume-match" ? (
            <ResumeMatchScore />
          ) : view === "interview-prep" ? (
            <InterviewPrep applications={applications} />
          ) : (
            <ApplicationList
              applications={applications}
              onAdd={() => {
                setEditingApp(null);
                setModalOpen(true);
              }}
              onEdit={(app) => {
                setEditingApp(app);
                setModalOpen(true);
              }}
              onDelete={(app) => setDeleteTarget(app)}
            />
          )}
          <footer className={styles.footer}>
            made by <span>KC</span> · {new Date().getFullYear()}
          </footer>
        </main>

        <button
          className={styles.mobileToggle}
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? <IoClose /> : <IoMenu />}
        </button>
      </div>

      <ApplicationModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingApp(null);
        }}
        onSubmit={editingApp ? handleUpdate : handleAdd}
        initialData={editingApp}
      />

      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        companyName={deleteTarget?.company || ""}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}
