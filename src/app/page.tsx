"use client";

import { useState, useEffect, useCallback } from "react";
import {
  IoGrid,
  IoBriefcase,
  IoMenu,
  IoClose,
  IoLogOut,
  IoPersonCircle,
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
import styles from "@/styles/layout.module.scss";
import authStyles from "@/styles/auth.module.scss";

type View = "dashboard" | "applications";

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
              background: "#1a1d27",
              color: "#e8eaf0",
              border: "1px solid #2e3348",
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
            <h1>
              Job<span>Tracker</span>
            </h1>
            <p>Application Records</p>
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
