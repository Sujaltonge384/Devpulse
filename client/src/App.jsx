import React from "react";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { NavLink, Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import {
  Activity, ArrowDownRight, ArrowUpRight, Bell, Check, CheckCircle2, ChevronDown, CalendarDays, GitPullRequest,
  CircleHelp, CirclePlus, ClipboardList, Code2, Command, FolderKanban, LayoutDashboard,
  LogOut, Menu, Moon, MoreHorizontal, Plus, Search, Settings, ShieldCheck, Sun,
  Target, Trash2, Users, X, Zap, Clock3, AlertTriangle, Github, Sparkles
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import {
  baseApi, useGetMeQuery, useLoginMutation, useRegisterMutation, useLogoutMutation,
  useGetProjectsQuery, useCreateProjectMutation, useUpdateProjectMutation,
  useDeleteProjectMutation, useGetTasksQuery, useCreateTaskMutation,
  useUpdateTaskMutation, useDeleteTaskMutation, useGetDashboardQuery, useGetHealthQuery
} from "./api/baseApi";
import { toggleTheme, setToast, clearToast } from "./features/ui/uiSlice";
import { GitHubPage, ActivityPage, SearchPage, CalendarPage, TeamPage, NotificationBell } from "./features/extended/WorkspacePages";

const colors = ["violet", "blue", "green", "orange", "pink"];
const statusLabel = { todo: "To do", "in-progress": "In progress", done: "Done" };

function App() {
  const dispatch = useDispatch();
  const theme = useSelector((s) => s.ui.theme);
  const toast = useSelector((s) => s.ui.toast);
  const { data: meData, isLoading: meLoading } = useGetMeQuery();
  const user = meData?.data?.user ?? meData?.user ?? null;
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => dispatch(clearToast()), 3200);
    return () => clearTimeout(id);
  }, [toast, dispatch]);

  if (meLoading) return <div className="loading-screen"><div className="brand-mark"><Activity /></div><span>Preparing your workspace…</span></div>;

  if (!user) {
    return <AuthPage onSuccess={() => navigate("/")} />;
  }

  const pathTitle = location.pathname.startsWith("/projects") ? "Projects"
    : location.pathname.startsWith("/tasks") ? "Tasks"
    : location.pathname.startsWith("/settings") ? "Settings"
    : location.pathname.startsWith("/github") ? "GitHub workspace"
    : location.pathname.startsWith("/activity") ? "Activity & notifications"
    : location.pathname.startsWith("/search") ? "Search workspace"
    : location.pathname.startsWith("/calendar") ? "Calendar"
    : location.pathname.startsWith("/team") ? "Team workspace"
    : "Overview";

  async function handleLogout() {
    try {
      await fetchLogout();
    } catch (error) {
      console.error("Sign out request failed:", error);
    } finally {
      localStorage.removeItem("devpulse_token");
      dispatch(baseApi.util.resetApiState());
      dispatch(baseApi.util.resetApiState());
      navigate("/login", { replace: true });
    }
  }
  async function fetchLogout() {
    const token = localStorage.getItem("devpulse_token");
    await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/auth/logout`, {
      method: "POST",
      credentials: "include",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileOpen ? "sidebar-open" : ""}`}>
        <div className="sidebar-brand-row">
          <NavLink to="/" className="brand" onClick={() => setMobileOpen(false)}>
            <span className="brand-mark"><Activity size={21} /></span>
            <span>devpulse<span className="brand-period">.</span></span>
          </NavLink>
          <button className="icon-btn mobile-close" onClick={() => setMobileOpen(false)} aria-label="Close menu"><X size={18} /></button>
        </div>

        <div className="workspace-switcher">
          <div className="workspace-avatar">D</div>
          <div className="workspace-copy"><strong>Personal workspace</strong></div>
          <ChevronDown size={15} />
        </div>

        <div className="nav-label">WORKSPACE</div>
        <nav className="nav-list">
          <NavLink end to="/" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`} onClick={() => setMobileOpen(false)}><LayoutDashboard size={18} /><span>Overview</span><kbd>⌘1</kbd></NavLink>
          <NavLink to="/projects" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`} onClick={() => setMobileOpen(false)}><FolderKanban size={18} /><span>Projects</span></NavLink>
          <NavLink to="/tasks" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`} onClick={() => setMobileOpen(false)}><ClipboardList size={18} /><span>Tasks</span></NavLink>
          <NavLink to="/team" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`} onClick={() => setMobileOpen(false)}><Users size={18} /><span>Team</span></NavLink>
          <NavLink to="/calendar" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`} onClick={() => setMobileOpen(false)}><CalendarDays size={18} /><span>Calendar</span></NavLink>
        </nav>

        <div className="nav-label nav-label-spaced">DEVELOPER TOOLS</div>
        <nav className="nav-list">
          <NavLink to="/github" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`} onClick={() => setMobileOpen(false)}><Github size={18} /><span>GitHub</span></NavLink>
          <NavLink to="/activity" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`} onClick={() => setMobileOpen(false)}><Activity size={18} /><span>Activity</span></NavLink>
          <NavLink to="/search" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`} onClick={() => setMobileOpen(false)}><Search size={18} /><span>Search</span></NavLink>
        </nav>

        <div className="nav-label nav-label-spaced">PERSONAL</div>
        <nav className="nav-list">
          <NavLink to="/settings" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`} onClick={() => setMobileOpen(false)}><Settings size={18} /><span>Settings</span></NavLink>
          <button className="nav-link" onClick={() => dispatch(setToast({ type: "info", message: "Help center documentation is coming soon." }))}><CircleHelp size={18} /><span>Help center</span></button>
        </nav>

        <div className="sidebar-spacer" />
        <div className="sidebar-upgrade">
          <div className="upgrade-icon"><Sparkles size={17} /></div>
          <strong>Make work flow.</strong>
          <p>One focused place for all your development work.</p>
          <div className="upgrade-foot"><span>DEV PULSE</span><span>v1.0</span></div>
        </div>
        <div className="sidebar-profile">
          <div className="avatar">{(user.name || "D").slice(0,1).toUpperCase()}</div>
          <div className="profile-meta"><strong>{user.name}</strong><span>{user.email}</span></div>
          <button className="icon-btn" onClick={handleLogout} title="Sign out"><LogOut size={16} /></button>
        </div>
      </aside>

      {mobileOpen && <button className="mobile-scrim" onClick={() => setMobileOpen(false)} aria-label="Close navigation" />}

      <main className="main-area">
        <header className="topbar">
          <div className="topbar-left">
            <button className="icon-btn mobile-menu" onClick={() => setMobileOpen(true)} aria-label="Open menu"><Menu size={20} /></button>
            <div className="breadcrumbs"><span>Workspace</span><span className="crumb-slash">/</span><strong>{pathTitle}</strong></div>
          </div>
          <div className="topbar-right">
            <div className="api-pill"><span className="api-dot" /> Connected workspace</div>
            <button className="icon-btn" onClick={() => navigate("/search")} title="Search workspace" aria-label="Search workspace"><Search size={18} /></button>
            <button className="icon-btn theme-toggle" onClick={() => dispatch(toggleTheme())} title={`Switch to ${theme === "light" ? "dark" : "light"} theme`} aria-label="Toggle theme">{theme === "light" ? <Moon size={18} /> : <Sun size={18} />}</button>
            <NotificationBell />
            <div className="topbar-avatar">{(user.name || "D").slice(0,1).toUpperCase()}</div>
          </div>
        </header>
        <div className="route-content">
          <Routes>
            <Route path="/" element={<Dashboard user={user} />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/settings" element={<SettingsPage user={user} />} />
            <Route path="/github" element={<GitHubPage />} />
            <Route path="/activity" element={<ActivityPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/team" element={<TeamPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </main>
      {toast && <div className={`toast toast-${toast.type || "success"}`}><span>{toast.type === "error" ? <AlertTriangle size={17} /> : <CheckCircle2 size={17} />}</span>{toast.message}<button onClick={() => dispatch(clearToast())} aria-label="Dismiss"><X size={15} /></button></div>}
    </div>
  );
}

function AuthPage({ onSuccess }) {
  const dispatch = useDispatch();
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [login, loginState] = useLoginMutation();
  const [register, registerState] = useRegisterMutation();
  const busy = loginState.isLoading || registerState.isLoading;
  const error = loginState.error?.data?.message || registerState.error?.data?.message;

  async function submit(e) {
    e.preventDefault();
    try {
      const result = mode === "login"
        ? await login({ email, password }).unwrap()
        : await register({ name, email, password }).unwrap();
      const token = result?.data?.token ?? result?.token;
      if (token) localStorage.setItem("devpulse_token", token);
      dispatch(baseApi.util.resetApiState());
      onSuccess();
    } catch (error) {
      console.error("Authentication failed:", error);
    }
  }

  return (
    <div className="auth-layout">
      <div className="auth-art">
        <NavLink to="/" className="brand auth-brand"><span className="brand-mark"><Activity size={21} /></span><span>devpulse<span className="brand-period">.</span></span></NavLink>
        <div className="auth-art-copy">
          <div className="auth-eyebrow"><span /> YOUR WORK, IN SYNC</div>
          <h1>Good work<br />has a <em>pulse.</em></h1>
          <p>A calmer command center for your projects, tasks, and developer workflow.</p>
          <div className="art-dashboard">
            <div className="art-top"><span>Weekly progress</span><span className="art-live"><i /> LIVE PREVIEW</span></div>
            <div className="art-bars">{[32,52,42,76,58,88,68,100,72,84,60,92].map((h,i)=><span key={i} style={{height:`${h}%`}} />)}</div>
            <div className="art-bottom"><div><small>COMPLETED THIS WEEK</small><strong>24 <span>+18%</span></strong></div><div className="art-ring"><span>82%</span></div></div>
          </div>
        </div>
        <div className="auth-art-footer"><span>FOCUSED BY DESIGN</span><span>DEV PULSE © 2026</span></div>
      </div>
      <div className="auth-form-side">
        <div className="auth-form-top"><span>Already using DevPulse?</span><button className="text-button" onClick={() => setMode(mode === "login" ? "register" : "login")}>{mode === "login" ? "Create account" : "Sign in"}</button></div>
        <form className="auth-form" onSubmit={submit}>
          <div className="auth-icon"><ShieldCheck size={22} /></div>
          <div className="eyebrow">YOUR WORKSPACE AWAITS</div>
          <h2>{mode === "login" ? "Welcome back" : "Create your account"}</h2>
          <p className="auth-subtitle">{mode === "login" ? "Enter your details to access your workspace." : "Start organizing your development work today."}</p>
          {mode === "register" && <label className="field-label">Full name<input value={name} onChange={e=>setName(e.target.value)} placeholder="Your name" autoComplete="name" required minLength={2} /></label>}
          <label className="field-label">Email address<input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" required /></label>
          <label className="field-label">Password<div className="password-wrap"><input type={showPassword?"text":"password"} value={password} onChange={e=>setPassword(e.target.value)} placeholder="At least 8 characters" autoComplete={mode==="login"?"current-password":"new-password"} minLength={8} required /><button type="button" onClick={()=>setShowPassword(!showPassword)}>{showPassword?"Hide":"Show"}</button></div></label>
          {error && <div className="form-error">{error}</div>}
          <button className="button button-primary auth-submit" disabled={busy}>{busy ? "Please wait…" : mode === "login" ? "Sign in to workspace" : "Create account"}<ArrowUpRight size={17} /></button>
          <div className="auth-switch">{mode === "login" ? "New to DevPulse?" : "Already have an account?"} <button type="button" onClick={()=>setMode(mode==="login"?"register":"login")}>{mode==="login"?"Create an account":"Sign in"}</button></div>
          <div className="secure-note"><ShieldCheck size={14} /> Secure authentication · Your data stays yours</div>
        </form>
        <div className="auth-footer">By continuing, you agree to use DevPulse responsibly.</div>
      </div>
    </div>
  );
}

function Dashboard({ user }) {
  const navigate = useNavigate();
  const { data, isLoading, isError, refetch } = useGetDashboardQuery();
  const { data: projects = [] } = useGetProjectsQuery();
  const { data: allTasks = [] } = useGetTasksQuery();
  const { data: health } = useGetHealthQuery();
  const dispatch = useDispatch();
  const stats = data?.stats || {};
  const recent = data?.recentTasks || [];
  const completion = stats.totalTasks ? Math.round((stats.done / stats.totalTasks) * 100) : 0;
  const today = new Intl.DateTimeFormat("en", { weekday: "long", month: "long", day: "numeric" }).format(new Date());

  // Dashboard analytics are calculated from the user's task list.
  const taskCounts = {
    todo: allTasks.filter((task) => task.status === "todo").length,
    inProgress: allTasks.filter((task) => task.status === "in-progress").length,
    done: allTasks.filter((task) => task.status === "done").length,
  };
  const priorityCounts = {
    high: allTasks.filter((task) => task.priority === "high" && task.status !== "done").length,
    medium: allTasks.filter((task) => task.priority === "medium" && task.status !== "done").length,
    low: allTasks.filter((task) => task.priority === "low" && task.status !== "done").length,
  };
  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const overdueCount = allTasks.filter((task) => {
    if (!task.dueDate || task.status === "done") return false;
    const due = new Date(task.dueDate);
    due.setHours(0, 0, 0, 0);
    return due < startOfToday;
  }).length;
  const weekDays = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(startOfToday);
    date.setDate(startOfToday.getDate() - (6 - index));
    return date;
  });
  const weeklyActivity = weekDays.map((date) => {
    const nextDate = new Date(date);
    nextDate.setDate(date.getDate() + 1);
    const count = allTasks.filter((task) => {
      if (task.status !== "done" || !task.updatedAt) return false;
      const updated = new Date(task.updatedAt);
      return updated >= date && updated < nextDate;
    }).length;
    return {
      label: date.toLocaleDateString("en-IN", { weekday: "short" }),
      count,
    };
  });
  const maxWeeklyCount = Math.max(1, ...weeklyActivity.map((day) => day.count));

  return (
    <div className="page-wrap">
      <style>{`
        .analytics-grid { margin-top: 20px; }
        .analytics-card { min-width: 0; }
        .analytics-empty { padding: 22px 0 8px; color: var(--muted, #858595); font-size: 13px; }
        .analytics-priority-list { display: grid; gap: 0; margin-top: 5px; }
        .analytics-priority-row, .analytics-overdue-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 13px 0; border-bottom: 1px solid var(--border, rgba(130,130,150,.16)); font-size: 13px; }
        .analytics-priority-row > span, .analytics-overdue-row > span { display: flex; align-items: center; gap: 9px; }
        .analytics-priority-row strong, .analytics-overdue-row strong { font-size: 14px; }
        .analytics-priority-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }
        .analytics-priority-dot.priority-high { background: #e66b69; }
        .analytics-priority-dot.priority-medium { background: #e5a342; }
        .analytics-priority-dot.priority-low { background: #4cae8a; }
        .analytics-overdue-row { color: #d85d5d; border-bottom: 0; }
        .analytics-hint { margin: 12px 0 0; color: var(--muted, #858595); font-size: 12px; line-height: 1.6; }
        .analytics-hint code { font-size: 11px; }
        .weekly-card { margin-top: 20px; }
        .weekly-chart { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 12px; align-items: end; height: 170px; padding: 12px 4px 0; }
        .weekly-chart-day { display: flex; flex-direction: column; align-items: center; justify-content: flex-end; gap: 8px; height: 100%; min-width: 0; }
        .weekly-chart-day > strong { font-size: 12px; color: var(--text, inherit); }
        .weekly-chart-track { display: flex; align-items: flex-end; justify-content: center; width: min(100%, 34px); flex: 1; border-radius: 7px 7px 3px 3px; background: var(--track, rgba(130,130,150,.10)); overflow: hidden; }
        .weekly-chart-track > span { display: block; width: 100%; min-height: 3px; border-radius: 7px 7px 3px 3px; background: linear-gradient(180deg, #9b83f5, #6d59d8); }
        .weekly-chart-label { font-size: 11px; color: var(--muted, #858595); }
        @media (max-width: 640px) { .weekly-chart { gap: 6px; height: 145px; } .weekly-chart-label { font-size: 10px; } }
      `}</style>
      <div className="welcome-header">
        <div><div className="eyebrow"><span className="eyebrow-line" /> DEVELOPER COMMAND CENTER</div><h1>Good to see you, {user.name.split(" ")[0]}<span className="heading-period">.</span></h1><p className="page-subtitle">Here's what's happening with your work today.</p></div>
        <div className="welcome-actions"><span className="date-chip"><Clock3 size={15}/>{today}</span><button
  type="button"
  className="button button-primary"
  onClick={() => navigate("/projects?create=1")}
>
  <Plus size={17} />
  New project
</button></div>
      </div>
      {isError && <div className="inline-alert"><AlertTriangle size={17}/><div><strong>Couldn't load dashboard data</strong><span>Check that the API is running and MongoDB is connected.</span></div><button onClick={refetch}>Retry</button></div>}
      <div className="metric-grid">
        <MetricCard label="Active projects" value={stats.projects ?? "—"} icon={FolderKanban} tone="violet" delta={`${projects.length} total in workspace`} />
        <MetricCard label="Tasks in progress" value={stats.inProgress ?? "—"} icon={Activity} tone="blue" delta={`${stats.todo ?? 0} waiting to start`} />
        <MetricCard label="Tasks completed" value={stats.done ?? "—"} icon={CheckCircle2} tone="green" delta={`${completion}% overall completion`} />
        <MetricCard label="High priority" value={stats.highPriority ?? "—"} icon={Zap} tone="orange" delta="Open items needing attention" />
      </div>
      <div className="dashboard-grid">
        <section className="surface-card projects-overview">
          <div className="section-top"><div><h2>Projects overview</h2><p>Your active work, all in one place.</p></div><NavLink to="/projects" className="link-button">View all <ArrowUpRight size={15}/></NavLink></div>
          {projects.length === 0 ? <EmptyState icon={FolderKanban} title="Your workspace starts here" text="Create a project to organize tasks, track progress, and keep your work moving." action="Create your first project" onClick={() => navigate("/projects?create=1")}/> : <div className="project-list">{projects.slice(0,4).map(project=><ProjectRow key={project._id} project={project}/>)}</div>}
        </section>
        <section className="surface-card progress-card">
          <div className="section-top"><div><h2>Task progress</h2><p>A snapshot of your workload.</p></div><div className="mini-icon"><Target size={17}/></div></div>
          <div className="progress-main"><div className="progress-ring" style={{"--progress":`${completion}%`}}><div><strong>{completion}%</strong><span>complete</span></div></div><div className="progress-copy"><strong>{stats.done || 0} of {stats.totalTasks || 0}</strong><span>tasks completed</span><small>{completion===100 && stats.totalTasks ? "Everything is wrapped up!" : "Keep the momentum going."}</small></div></div>
          <div className="progress-legend"><span><i className="legend-dot dot-green"/>Done <b>{stats.done || 0}</b></span><span><i className="legend-dot dot-blue"/>In progress <b>{stats.inProgress || 0}</b></span><span><i className="legend-dot dot-gray"/>To do <b>{stats.todo || 0}</b></span></div>
        </section>
      </div>
      <div className="dashboard-grid analytics-grid">
        <section className="surface-card analytics-card">
          <div className="section-top"><div><h2>Workload breakdown</h2><p>How your tasks are distributed right now.</p></div><div className="mini-icon"><Activity size={17}/></div></div>
          {allTasks.length === 0 ? (
            <div className="analytics-empty">Create a few tasks to see your workload analytics.</div>
          ) : (
            <div style={{ display: "grid", gap: 18, paddingTop: 8 }}>
              {[
                { label: "To do", count: taskCounts.todo, color: "var(--analytics-todo, #9ca3af)" },
                { label: "In progress", count: taskCounts.inProgress, color: "var(--analytics-progress, #6687f5)" },
                { label: "Done", count: taskCounts.done, color: "var(--analytics-done, #36a879)" },
              ].map((item) => (
                <div key={item.label}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 8, fontSize: 13 }}>
                    <span>{item.label}</span><strong>{item.count} <span style={{ opacity: 0.6, fontWeight: 500 }}>({Math.round((item.count / allTasks.length) * 100)}%)</span></strong>
                  </div>
                  <div style={{ height: 8, background: "var(--track, rgba(130,130,150,.14))", borderRadius: 999, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${(item.count / allTasks.length) * 100}%`, background: item.color, borderRadius: 999, transition: "width .25s ease" }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
        <section className="surface-card analytics-card">
          <div className="section-top"><div><h2>Priority & deadlines</h2><p>Open work that may need your attention.</p></div><div className="mini-icon"><AlertTriangle size={17}/></div></div>
          <div className="analytics-priority-list">
            {[
              { label: "High priority", count: priorityCounts.high, className: "priority-high" },
              { label: "Medium priority", count: priorityCounts.medium, className: "priority-medium" },
              { label: "Low priority", count: priorityCounts.low, className: "priority-low" },
            ].map((item) => (
              <div className="analytics-priority-row" key={item.label}>
                <span><i className={`analytics-priority-dot ${item.className}`} />{item.label}</span><strong>{item.count}</strong>
              </div>
            ))}
            <div className="analytics-overdue-row">
              <span><AlertTriangle size={15}/> Overdue tasks</span>
              <strong>{overdueCount}</strong>
            </div>
          </div>
          <p className="analytics-hint">{overdueCount ? "Review overdue items and adjust their deadlines or status." : "You're clear of overdue tasks. Keep it that way!"}</p>
        </section>
      </div>
      <section className="surface-card analytics-card weekly-card">
        <div className="section-top"><div><h2>Weekly productivity</h2><p>Tasks marked done by day over the last seven days.</p></div><div className="mini-icon"><Target size={17}/></div></div>
        <div className="weekly-chart" role="img" aria-label="Completed tasks by day for the last seven days">
          {weeklyActivity.map((day, index) => (
            <div className="weekly-chart-day" key={`${day.label}-${index}`}>
              <strong>{day.count}</strong>
              <div className="weekly-chart-track"><span style={{ height: `${day.count ? Math.max(8, (day.count / maxWeeklyCount) * 100) : 3}%` }} /></div>
              <span className="weekly-chart-label">{day.label}</span>
            </div>
          ))}
        </div>
        <p className="analytics-hint">This chart uses a task's <code>updatedAt</code> timestamp as an estimate of when it was completed.</p>
      </section>
      <section className="surface-card recent-card">
        <div className="section-top"><div><h2>Recent tasks</h2><p>The latest updates across your projects.</p></div><NavLink to="/tasks" className="link-button">All tasks <ArrowUpRight size={15}/></NavLink></div>
        {recent.length === 0 ? <EmptyState icon={ClipboardList} title="No tasks yet" text="Add tasks to your projects and they'll show up here." action="Go to tasks" onClick={()=>navigate("/tasks")}/> : <div className="table-wrap"><table><thead><tr><th>Task</th><th>Project</th><th>Priority</th><th>Status</th></tr></thead><tbody>{recent.map(task=><tr key={task._id}><td><span className={`task-check ${task.status==="done"?"checked":""}`}>{task.status==="done"&&<Check size={12}/>}</span><span className={task.status==="done"?"task-title-done":"task-title"}>{task.title}</span></td><td><span className="project-cell"><i className={`project-dot ${task.project?.color||"violet"}`}/>{task.project?.name||"Project"}</span></td><td><PriorityPill priority={task.priority}/></td><td><StatusPill status={task.status}/></td></tr>)}</tbody></table></div>}
      </section>
      <div className="dashboard-footnote"><span><span className={`health-light ${health?.data?.database==="connected"?"healthy":""}`}/>{health?.data?.database==="connected"?"API and database connected":"Workspace data is loaded from your account"}</span><span>Built to help you stay in flow <Sparkles size={13}/></span></div>
    </div>
  );
}

function MetricCard({ label, value, icon: Icon, tone, delta }) {
  return <article className="metric-card"><div className="metric-head"><span>{label}</span><span className={`metric-icon ${tone}`}><Icon size={19}/></span></div><div className="metric-value">{value}</div><div className="metric-foot"><span className={`metric-trend ${tone}`}><ArrowUpRight size={13}/></span><span>{delta}</span></div></article>;
}

function ProjectRow({ project }) {
  const progress = project.taskCount ? Math.round((project.completedTasks / project.taskCount) * 100) : 0;
  return <div className="project-row"><div className={`project-symbol ${project.color||"violet"}`}><Code2 size={18}/></div><div className="project-row-main"><div className="project-row-title"><strong>{project.name}</strong><span>{project.taskCount} tasks</span></div><div className="project-progress-track"><span className={project.color||"violet"} style={{width:`${progress}%`}}/></div></div><strong className="project-percent">{progress}%</strong></div>;
}

function EmptyState({ icon: Icon, title, text, action, onClick }) {
  return <div className="empty-state"><div className="empty-icon"><Icon size={22}/></div><strong>{title}</strong><p>{text}</p>{action&&<button className="button button-secondary button-small" onClick={onClick}>{action}<ArrowUpRight size={14}/></button>}</div>;
}

function ProjectsPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { data: projects = [], isLoading, isError } = useGetProjectsQuery();
  const [createProject, createState] = useCreateProjectMutation();
  const [updateProject] = useUpdateProjectMutation();
  const [deleteProject] = useDeleteProjectMutation();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [form, setForm] = useState({ name: "", description: "", color: "violet" });

  const [searchParams, setSearchParams] = useSearchParams();

useEffect(() => {
  if (searchParams.get("create") !== "1") return;

  setEditing(null);
  setForm({
    name: "",
    description: "",
    color: "violet",
  });
  setModal(true);

  setSearchParams(
    (current) => {
      const next = new URLSearchParams(current);
      next.delete("create");
      return next;
    },
    { replace: true }
  );
}, [searchParams, setSearchParams]);

  const visible = projects.filter(p => p.name.toLowerCase().includes(query.toLowerCase()) && (filter === "all" || p.status === filter));
  function openEdit(p) { setEditing(p); setForm({ name:p.name, description:p.description||"", color:p.color||"violet" }); setModal(true); }
  async function submit(e) {
    e.preventDefault();
    try {
      if (editing) await updateProject({ id: editing._id, ...form }).unwrap();
      else await createProject(form).unwrap();
      setModal(false); dispatch(setToast({ type:"success", message:editing?"Project updated successfully.":"Project created successfully." }));
    } catch (e) { dispatch(setToast({ type:"error", message:e?.data?.message||"Couldn't save project." })); }
  }
  async function remove() {
    try { await deleteProject(confirmDelete._id).unwrap(); dispatch(setToast({type:"success",message:"Project and its tasks deleted."})); setConfirmDelete(null); }
    catch(e) { dispatch(setToast({type:"error",message:e?.data?.message||"Couldn't delete project."})); }
  }

  return <div className="page-wrap">
    <div className="page-heading-row"><div><div className="eyebrow"><span className="eyebrow-line"/> ORGANIZE YOUR WORK</div><h1>Projects<span className="heading-period">.</span></h1><p className="page-subtitle">A home for every idea, initiative, and release.</p></div><button className="button button-primary" onClick={()=>{setEditing(null);setForm({name:"",description:"",color:"violet"});setModal(true)}}><Plus size={17}/> New project</button></div>
    <div className="toolbar"><div className="search-box"><Search size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search projects…"/>{query&&<button onClick={()=>setQuery("")}><X size={14}/></button>}</div><div className="filter-tabs">{[["all","All projects"],["active","Active"],["completed","Completed"],["archived","Archived"]].map(([v,l])=><button key={v} className={filter===v?"selected":""} onClick={()=>setFilter(v)}>{l}</button>)}</div></div>
    {isLoading ? <div className="loading-card">Loading projects…</div> : isError ? <div className="inline-alert"><AlertTriangle size={17}/><div><strong>Couldn't load projects</strong><span>Check your API and database connection.</span></div></div> : visible.length ? <div className="project-card-grid">{visible.map(p=><article className="project-card" key={p._id}><div className="project-card-top"><div className={`project-symbol large ${p.color}`}><Code2 size={21}/></div><button className="icon-btn" onClick={()=>openEdit(p)} title="Edit project"><MoreHorizontal size={18}/></button></div><div className="project-card-name">{p.name}</div><p className="project-card-desc">{p.description||"A new space for your team's work and ideas."}</p><div className="project-card-meta"><span className={`status-label status-${p.status}`}>{p.status}</span><span>{p.taskCount} tasks</span></div><div className="project-progress-track"><span className={p.color} style={{width:`${p.taskCount?Math.round(p.completedTasks/p.taskCount*100):0}%`}}/></div><div className="project-card-bottom"><span>{p.completedTasks||0} completed</span><div className="card-actions"><button onClick={()=>navigate(`/tasks?project=${p._id}`)}>View tasks <ArrowUpRight size={13}/></button><button className="danger-icon" onClick={()=>setConfirmDelete(p)} title="Delete project"><Trash2 size={14}/></button></div></div></article>)}</div> : <div className="surface-card"><EmptyState icon={FolderKanban} title={query?"No matching projects":"No projects yet"} text={query?"Try a different search term or filter.":"Create your first project to start organizing your work."} action={query?"Clear search":"Create a project"} onClick={()=>query?setQuery(""):setModal(true)}/></div>}
    {modal&&<Modal title={editing?"Edit project":"Create a project"} subtitle="Give your work a clear home." onClose={()=>setModal(false)}><form onSubmit={submit} className="modal-form"><label className="field-label">Project name<input autoFocus value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="e.g. Website redesign" maxLength={120} required/></label><label className="field-label">Description <span className="optional">Optional</span><textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="What are you building?" rows={3}/></label><div className="field-label">Project color<div className="color-options">{colors.map(c=><button type="button" key={c} aria-label={c} className={`color-choice ${c} ${form.color===c?"chosen":""}`} onClick={()=>setForm({...form,color:c})}>{form.color===c&&<Check size={14}/>}</button>)}</div></div><div className="modal-actions"><button type="button" className="button button-secondary" onClick={()=>setModal(false)}>Cancel</button><button className="button button-primary" disabled={createState.isLoading}>{editing?"Save changes":"Create project"}<ArrowUpRight size={15}/></button></div></form></Modal>}
    {confirmDelete&&<ConfirmModal title="Delete this project?" text={`“${confirmDelete.name}” and all of its tasks will be permanently deleted.`} onCancel={()=>setConfirmDelete(null)} onConfirm={remove}/>}
  </div>;
}


function TasksPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { data: projects = [] } = useGetProjectsQuery();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [projectFilter, setProjectFilter] = useState(
    new URLSearchParams(window.location.search).get("project") || "all"
  );
  const [viewMode, setViewMode] = useState("board");
  const [draggedTask, setDraggedTask] = useState(null);
  const [dragOverStatus, setDragOverStatus] = useState(null);

  const params = useMemo(
    () => ({
      ...(statusFilter !== "all" ? { status: statusFilter } : {}),
      ...(priorityFilter !== "all" ? { priority: priorityFilter } : {}),
      ...(projectFilter !== "all" ? { projectId: projectFilter } : {}),
      ...(query.trim() ? { search: query.trim() } : {}),
    }),
    [statusFilter, priorityFilter, projectFilter, query]
  );

  const {
    data: tasks = [],
    isLoading,
    isError,
    refetch,
  } = useGetTasksQuery(params);

  const [createTask, createState] = useCreateTaskMutation();
  const [updateTask] = useUpdateTaskMutation();
  const [deleteTask] = useDeleteTaskMutation();

  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    project: "",
    priority: "medium",
    status: "todo",
    dueDate: "",
  });

  const columns = [
    { id: "todo", title: "To Do", description: "Ready when you are" },
    {
      id: "in-progress",
      title: "In Progress",
      description: "Work in motion",
    },
    { id: "done", title: "Done", description: "Successfully completed" },
  ];

  function openNew() {
    setEditing(null);
    setForm({
      title: "",
      description: "",
      project: projects[0]?._id || "",
      priority: "medium",
      status: "todo",
      dueDate: "",
    });
    setModal(true);
  }

  function openEdit(task) {
    setEditing(task);
    setForm({
      title: task.title,
      description: task.description || "",
      project: task.project?._id || task.project || "",
      priority: task.priority,
      status: task.status,
      dueDate: task.dueDate ? task.dueDate.slice(0, 10) : "",
    });
    setModal(true);
  }

  async function submit(event) {
    event.preventDefault();

    try {
      const payload = {
        ...form,
        dueDate: form.dueDate || null,
      };

      if (editing) {
        const { project, ...updates } = payload;
        await updateTask({ id: editing._id, ...updates }).unwrap();
      } else {
        await createTask(payload).unwrap();
      }

      setModal(false);
      dispatch(
        setToast({
          type: "success",
          message: editing ? "Task updated." : "Task created.",
        })
      );
    } catch (error) {
      dispatch(
        setToast({
          type: "error",
          message: error?.data?.message || "Couldn't save task.",
        })
      );
    }
  }

  async function changeStatus(task, status) {
    if (task.status === status) return;

    try {
      await updateTask({ id: task._id, status }).unwrap();
      dispatch(
        setToast({
          type: "success",
          message: `Task moved to ${statusLabel[status]}.`,
        })
      );
    } catch (error) {
      dispatch(
        setToast({
          type: "error",
          message: error?.data?.message || "Couldn't update task.",
        })
      );
    }
  }

  async function remove() {
    if (!confirmDelete) return;

    try {
      await deleteTask(confirmDelete._id).unwrap();
      setConfirmDelete(null);
      dispatch(setToast({ type: "success", message: "Task deleted." }));
    } catch (error) {
      dispatch(
        setToast({
          type: "error",
          message: error?.data?.message || "Couldn't delete task.",
        })
      );
    }
  }

  function handleDrop(event, status) {
    event.preventDefault();
    setDragOverStatus(null);

    if (!draggedTask) return;

    const task = draggedTask;
    setDraggedTask(null);

    if (task.status !== status) {
      changeStatus(task, status);
    }
  }

  function formatDueDate(value) {
    if (!value) return "No deadline";

    const date = new Date(value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const due = new Date(date);
    due.setHours(0, 0, 0, 0);

    if (due.getTime() === today.getTime()) return "Due today";

    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  function isOverdue(task) {
    if (!task.dueDate || task.status === "done") return false;

    const due = new Date(task.dueDate);
    const today = new Date();
    due.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    return due < today;
  }

  return (
    <div className="page-wrap">
      <div className="page-heading-row">
        <div>
          <div className="eyebrow">
            <span className="eyebrow-line" /> KEEP YOUR MOMENTUM
          </div>
          <h1>
            Tasks<span className="heading-period">.</span>
          </h1>
          <p className="page-subtitle">
            Plan your work, track progress, and ship what matters.
          </p>
        </div>

        <button
          className="button button-primary"
          onClick={openNew}
          disabled={!projects.length}
        >
          <Plus size={17} /> New task
        </button>
      </div>

      {!projects.length && (
        <div className="inline-alert">
          <FolderKanban size={17} />
          <div>
            <strong>Create a project first</strong>
            <span>Tasks belong to a project. Create one before adding tasks.</span>
          </div>
          <button onClick={() => navigate("/projects")}>
            Go to projects
          </button>
        </div>
      )}

      <div className="task-workspace-toolbar">
        <div className="search-box task-board-search">
          <Search size={17} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search tasks..."
          />
          {query && (
            <button onClick={() => setQuery("")} aria-label="Clear search">
              <X size={14} />
            </button>
          )}
        </div>

        <div className="select-filters task-board-filters">
          <select
            value={projectFilter}
            onChange={(event) => setProjectFilter(event.target.value)}
            aria-label="Filter by project"
          >
            <option value="all">All projects</option>
            {projects.map((project) => (
              <option key={project._id} value={project._id}>
                {project.name}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            aria-label="Filter by status"
          >
            <option value="all">All statuses</option>
            {columns.map((column) => (
              <option key={column.id} value={column.id}>
                {column.title}
              </option>
            ))}
          </select>

          <select
            value={priorityFilter}
            onChange={(event) => setPriorityFilter(event.target.value)}
            aria-label="Filter by priority"
          >
            <option value="all">All priorities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        <div className="task-view-switch" aria-label="Task display mode">
          <button
            className={viewMode === "board" ? "selected" : ""}
            onClick={() => setViewMode("board")}
            aria-pressed={viewMode === "board"}
          >
            <span aria-hidden="true">▦</span> Board
          </button>
          <button
            className={viewMode === "list" ? "selected" : ""}
            onClick={() => setViewMode("list")}
            aria-pressed={viewMode === "list"}
          >
            <span aria-hidden="true">☷</span> List
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="loading-card">Loading tasks...</div>
      ) : isError ? (
        <div className="inline-alert">
          <AlertTriangle size={17} />
          <div>
            <strong>Couldn't load tasks</strong>
            <span>Check your API and database connection.</span>
          </div>
          <button onClick={refetch}>Retry</button>
        </div>
      ) : tasks.length === 0 ? (
        <section className="surface-card task-table-card">
          <EmptyState
            icon={ClipboardList}
            title={query ? "No matching tasks" : "Your board is ready"}
            text={
              query
                ? "Try a different search or clear the filters."
                : "Create your first task and start tracking your progress."
            }
            action={projects.length ? (query ? "Clear search" : "Create a task") : undefined}
            onClick={query ? () => setQuery("") : openNew}
          />
        </section>
      ) : viewMode === "board" ? (
        <div className="kanban-board">
          {columns.map((column) => {
            const columnTasks = tasks.filter(
              (task) => task.status === column.id
            );

            return (
              <section
                key={column.id}
                className={`kanban-column kanban-${column.id} ${
                  dragOverStatus === column.id ? "kanban-column-over" : ""
                }`}
                onDragOver={(event) => {
                  event.preventDefault();
                  setDragOverStatus(column.id);
                }}
                onDragLeave={(event) => {
                  if (!event.currentTarget.contains(event.relatedTarget)) {
                    setDragOverStatus(null);
                  }
                }}
                onDrop={(event) => handleDrop(event, column.id)}
              >
                <div className="kanban-column-header">
                  <div className="kanban-column-heading">
                    <span className={`kanban-status-dot dot-${column.id}`} />
                    <h2>{column.title}</h2>
                    <span className="kanban-count">{columnTasks.length}</span>
                  </div>
                  <p>{column.description}</p>
                </div>

                <div className="kanban-column-content">
                  {columnTasks.length ? (
                    columnTasks.map((task) => (
                      <article
                        key={task._id}
                        className={`kanban-task-card ${
                          draggedTask?._id === task._id ? "is-dragging" : ""
                        }`}
                        draggable
                        onDragStart={(event) => {
                          setDraggedTask(task);
                          event.dataTransfer.effectAllowed = "move";
                          event.dataTransfer.setData("text/plain", task._id);
                        }}
                        onDragEnd={() => {
                          setDraggedTask(null);
                          setDragOverStatus(null);
                        }}
                      >
                        <div className="kanban-card-top">
                          <PriorityPill priority={task.priority} />
                          <button
                            className="icon-btn"
                            onClick={() => openEdit(task)}
                            title="Edit task"
                            aria-label={`Edit ${task.title}`}
                          >
                            <Settings size={15} />
                          </button>
                        </div>

                        <h3
                          className={
                            task.status === "done" ? "task-title-done" : ""
                          }
                        >
                          {task.title}
                        </h3>

                        {task.description && (
                          <p className="kanban-task-description">
                            {task.description}
                          </p>
                        )}

                        <div className="kanban-project">
                          <i
                            className={`project-dot ${
                              task.project?.color || "violet"
                            }`}
                          />
                          <span>{task.project?.name || "Project"}</span>
                        </div>

                        <div
                          className={`kanban-due-date ${
                            isOverdue(task) ? "is-overdue" : ""
                          }`}
                        >
                          <Clock3 size={14} />
                          <span>
                            {isOverdue(task)
                              ? `Overdue · ${formatDueDate(task.dueDate)}`
                              : formatDueDate(task.dueDate)}
                          </span>
                        </div>

                        <div className="kanban-card-footer">
                          <label className="kanban-move-label">
                            Move to
                            <select
                              value={task.status}
                              onChange={(event) =>
                                changeStatus(task, event.target.value)
                              }
                              aria-label={`Move ${task.title} to another status`}
                              onClick={(event) => event.stopPropagation()}
                            >
                              {columns.map((option) => (
                                <option key={option.id} value={option.id}>
                                  {option.title}
                                </option>
                              ))}
                            </select>
                          </label>

                          <button
                            className="icon-btn danger-icon"
                            onClick={() => setConfirmDelete(task)}
                            title="Delete task"
                            aria-label={`Delete ${task.title}`}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </article>
                    ))
                  ) : (
                    <div className="kanban-empty">
                      <span>{column.id === "done" ? "✓" : "+"}</span>
                      <p>No tasks here yet</p>
                      <small>Drag a task here to update its status.</small>
                    </div>
                  )}
                </div>

                <button
                  className="kanban-add-task"
                  onClick={() => {
                    setEditing(null);
                    setForm({
                      title: "",
                      description: "",
                      project:
                        projectFilter !== "all"
                          ? projectFilter
                          : projects[0]?._id || "",
                      priority: "medium",
                      status: column.id,
                      dueDate: "",
                    });
                    setModal(true);
                  }}
                  disabled={!projects.length}
                >
                  <Plus size={15} /> Add task
                </button>
              </section>
            );
          })}
        </div>
      ) : (
        <section className="surface-card task-table-card">
          <div className="table-wrap">
            <table className="tasks-table">
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Project</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Due date</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => (
                  <tr key={task._id}>
                    <td>
                      <button
                        className={`task-check ${
                          task.status === "done" ? "checked" : ""
                        }`}
                        onClick={() =>
                          changeStatus(
                            task,
                            task.status === "done" ? "todo" : "done"
                          )
                        }
                        aria-label="Toggle task completion"
                      >
                        {task.status === "done" && <Check size={12} />}
                      </button>
                      <div className="task-title-wrap">
                        <strong
                          className={
                            task.status === "done" ? "task-title-done" : ""
                          }
                        >
                          {task.title}
                        </strong>
                        {task.description && <small>{task.description}</small>}
                      </div>
                    </td>
                    <td>
                      <span className="project-cell">
                        <i
                          className={`project-dot ${
                            task.project?.color || "violet"
                          }`}
                        />
                        {task.project?.name || "—"}
                      </span>
                    </td>
                    <td>
                      <PriorityPill priority={task.priority} />
                    </td>
                    <td>
                      <select
                        className={`status-select status-${task.status}`}
                        value={task.status}
                        onChange={(event) =>
                          changeStatus(task, event.target.value)
                        }
                        aria-label="Task status"
                      >
                        {columns.map((column) => (
                          <option key={column.id} value={column.id}>
                            {column.title}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td
                      className={`due-cell ${
                        isOverdue(task) ? "is-overdue" : ""
                      }`}
                    >
                      {formatDueDate(task.dueDate)}
                    </td>
                    <td>
                      <div className="row-actions">
                        <button
                          className="icon-btn"
                          onClick={() => openEdit(task)}
                          title="Edit task"
                        >
                          <Settings size={15} />
                        </button>
                        <button
                          className="icon-btn danger-icon"
                          onClick={() => setConfirmDelete(task)}
                          title="Delete task"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {modal && (
        <Modal
          title={editing ? "Edit task" : "Create a task"}
          subtitle="Small steps make meaningful progress."
          onClose={() => setModal(false)}
        >
          <form onSubmit={submit} className="modal-form">
            <label className="field-label">
              Task title
              <input
                autoFocus
                value={form.title}
                onChange={(event) =>
                  setForm({ ...form, title: event.target.value })
                }
                placeholder="What needs to get done?"
                maxLength={180}
                required
              />
            </label>

            <label className="field-label">
              Description <span className="optional">Optional</span>
              <textarea
                rows={3}
                value={form.description}
                onChange={(event) =>
                  setForm({ ...form, description: event.target.value })
                }
                placeholder="Add a little context..."
              />
            </label>

            <label className="field-label">
              Project
              <select
                value={form.project}
                onChange={(event) =>
                  setForm({ ...form, project: event.target.value })
                }
                required
                disabled={!!editing}
              >
                <option value="">Select a project</option>
                {projects.map((project) => (
                  <option value={project._id} key={project._id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </label>

            <div className="form-two-col">
              <label className="field-label">
                Priority
                <select
                  value={form.priority}
                  onChange={(event) =>
                    setForm({ ...form, priority: event.target.value })
                  }
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </label>

              <label className="field-label">
                Status
                <select
                  value={form.status}
                  onChange={(event) =>
                    setForm({ ...form, status: event.target.value })
                  }
                >
                  {columns.map((column) => (
                    <option key={column.id} value={column.id}>
                      {column.title}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="field-label">
              Due date <span className="optional">Optional</span>
              <input
                type="date"
                value={form.dueDate}
                onChange={(event) =>
                  setForm({ ...form, dueDate: event.target.value })
                }
              />
            </label>

            <div className="modal-actions">
              <button
                type="button"
                className="button button-secondary"
                onClick={() => setModal(false)}
              >
                Cancel
              </button>
              <button
                className="button button-primary"
                disabled={createState.isLoading}
              >
                {editing ? "Save changes" : "Create task"}
                <ArrowUpRight size={15} />
              </button>
            </div>
          </form>
        </Modal>
      )}

      {confirmDelete && (
        <ConfirmModal
          title="Delete this task?"
          text={`"${confirmDelete.title}" will be permanently deleted.`}
          onCancel={() => setConfirmDelete(null)}
          onConfirm={remove}
        />
      )}
    </div>
  );
}


function SettingsPage({ user }) {
  const dispatch=useDispatch();
  const theme=useSelector(s=>s.ui.theme);
  const [logout] = useLogoutMutation();
  return <div className="page-wrap settings-page">
    <div className="page-heading-row"><div><div className="eyebrow"><span className="eyebrow-line"/> MAKE IT YOURS</div><h1>Settings<span className="heading-period">.</span></h1><p className="page-subtitle">Your workspace, your preferences.</p></div></div>
    <section className="surface-card settings-card"><div className="settings-section-title"><div className="settings-section-icon"><Users size={19}/></div><div><h2>Profile</h2><p>Your account details.</p></div></div><div className="settings-profile"><div className="settings-avatar">{user.name.slice(0,1).toUpperCase()}</div><div><strong>{user.name}</strong><span>{user.email}</span></div><span className="verified-tag"><ShieldCheck size={13}/> Account</span></div></section>
    <section className="surface-card settings-card"><div className="settings-section-title"><div className="settings-section-icon"><Sun size={19}/></div><div><h2>Appearance</h2><p>Choose the look that works for you.</p></div></div><div className="settings-option"><div><strong>Color theme</strong><span>Switch between light and dark appearance.</span></div><div className="theme-choice"><button className={theme==="light"?"chosen":""} onClick={()=>{if(theme!=="light")dispatch(toggleTheme())}}><Sun size={15}/> Light</button><button className={theme==="dark"?"chosen":""} onClick={()=>{if(theme!=="dark")dispatch(toggleTheme())}}><Moon size={15}/> Dark</button></div></div></section>
    <section className="surface-card settings-card"><div className="settings-section-title"><div className="settings-section-icon"><ShieldCheck size={19}/></div><div><h2>Security</h2><p>Manage your active session.</p></div></div><div className="settings-option"><div><strong>Sign out</strong><span>End your current DevPulse session on this browser.</span></div><button className="button button-danger" onClick={async()=>{try{await logout().unwrap()}catch(error){console.error("Sign out failed:",error)}finally{localStorage.removeItem("devpulse_token");dispatch(baseApi.util.resetApiState());window.location.assign("/login")}}}><LogOut size={15}/> Sign out</button></div></section>
    <section className="surface-card settings-card integration-card"><div className="settings-section-title"><div className="settings-section-icon"><Github size={19}/></div><div><h2>Integrations</h2><p>Connect the tools you already use.</p></div></div><div className="integration-row"><div className="integration-icon"><Github size={20}/></div><div className="integration-copy"><strong>GitHub</strong><span>Repository sync and pull request activity</span></div><span className="coming-badge">PLANNED</span></div><div className="integration-row"><div className="integration-icon ai"><Sparkles size={20}/></div><div className="integration-copy"><strong>AI project assistant</strong><span>Project summaries and release notes</span></div><span className="coming-badge">PLANNED</span></div></section>
    <div className="settings-note"><ShieldCheck size={16}/><span>Your account data is scoped to your user ID on the backend. Never share your environment variables or API secrets.</span></div>
  </div>;
}

function Modal({ title, subtitle, onClose, children }) {
  useEffect(()=>{const fn=e=>{if(e.key==="Escape")onClose()};window.addEventListener("keydown",fn);return()=>window.removeEventListener("keydown",fn)},[onClose]);
  return <div className="modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)onClose()}}><section className="modal-card"><div className="modal-header"><div><h2>{title}</h2><p>{subtitle}</p></div><button className="icon-btn" onClick={onClose} aria-label="Close"><X size={18}/></button></div>{children}</section></div>;
}

function ConfirmModal({ title, text, onCancel, onConfirm }) {
  return <Modal title={title} subtitle="This action cannot be undone." onClose={onCancel}><div className="confirm-body"><div className="confirm-icon"><Trash2 size={21}/></div><p>{text}</p></div><div className="modal-actions"><button className="button button-secondary" onClick={onCancel}>Cancel</button><button className="button button-danger" onClick={onConfirm}><Trash2 size={15}/> Delete permanently</button></div></Modal>;
}

function PriorityPill({ priority="medium" }) {
  return <span className={`priority-pill priority-${priority}`}><i/>{priority}</span>;
}

function StatusPill({ status="todo" }) {
  return <span className={`status-pill status-${status}`}><i/>{statusLabel[status]||status}</span>;
}

export default App;
