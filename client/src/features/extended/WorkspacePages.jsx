import React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertCircle,
  ArrowUpRight,
  Bell,
  BookOpen,
  CalendarDays,
  Check,
  CheckCheck,
  CircleDot,
  Clock3,
  ExternalLink,
  Filter,
  GitBranch,
  GitCommitHorizontal,
  GitPullRequest,
  Github,
  LoaderCircle,
  RefreshCw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Star,
  Users,
  X
} from "lucide-react";
import {
  useGetTasksQuery,
  useGetProjectsQuery,
  baseApi
} from "../../api/baseApi";
import { useDispatch } from "react-redux";
import "../../index.css";

const API = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/+$/, "");

async function api(path, options = {}) {
  const token = localStorage.getItem("devpulse_token");
  const headers = new Headers(options.headers || {});

  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(`${API}${path}`, {
    ...options,
    credentials: "include",
    cache: "no-store",
    headers
  });

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = body.message ||
      (response.status === 304
        ? "The server returned a cached response. Disable caching and retry."
        : `Request failed (${response.status}).`);
    throw new Error(message);
  }

  return body.data ?? body;
}

function PageHeader({ eyebrow, title, subtitle, actions }) {
  return (
    <div className="ext-page-header">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>

      {actions && (
        <div className="ext-header-actions">
          {actions}
        </div>
      )}
    </div>
  );
}

function Notice({ children, type = "info" }) {
  return (
    <div className={`ext-notice ext-notice-${type}`}>
      <AlertCircle size={17} />
      <span>{children}</span>
    </div>
  );
}

function Loading({ label = "Loading data…" }) {
  return (
    <div className="ext-loading">
      <LoaderCircle className="ext-spin" size={19} />
      {label}
    </div>
  );
}

function Empty({ icon: Icon = Activity, title, description, action }) {
  return (
    <div className="ext-empty">
      <span>
        <Icon size={23} />
      </span>

      <strong>{title}</strong>
      <p>{description}</p>

      {action}
    </div>
  );
}

function prettyDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

export function GitHubPage() {
  const dispatch = useDispatch();

  const [status, setStatus] = useState(null);
  const [repos, setRepos] = useState([]);
  const [pulls, setPulls] = useState([]);
  const [events, setEvents] = useState([]);
  const [commits, setCommits] = useState([]);
  const [selectedRepo, setSelectedRepo] = useState("");
  const [targetProject, setTargetProject] = useState("");
  const [triage, setTriage] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("pulls");
  const [filter, setFilter] = useState("all");

  const { data: workspaceProjects = [] } = useGetProjectsQuery();

  const loadAllRepositories = useCallback(async () => {
    const allRepositories = [];

    // The backend exposes 100 repositories per page and caps pages at 10.
    for (let page = 1; page <= 10; page += 1) {
      const result = await api(`/github/repos?page=${page}`);

      const pageRepositories = Array.isArray(result.repos)
        ? result.repos
        : [];

      allRepositories.push(...pageRepositories);

      if (pageRepositories.length < 100) {
        break;
      }
    }

    return allRepositories;
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const currentStatus = await api("/github/status");

      // Only an explicit connected:false result should show the Connect screen.
      // A 401/500/decryption error must remain an error, not look disconnected.
      if (typeof currentStatus?.connected !== "boolean") {
        throw new Error(
          "The GitHub status endpoint returned an unexpected response. Check GET /api/github/status in Network."
        );
      }

      setStatus(currentStatus);

      if (!currentStatus.connected) {
        setRepos([]);
        setPulls([]);
        setEvents([]);
        setCommits([]);
        setTriage([]);
        setSelectedRepo("");

        return currentStatus;
      }

      const results = await Promise.allSettled([
        loadAllRepositories(),
        api("/github/pulls?state=open"),
        api("/github/events"),
        api("/github/triage")
      ]);

      const [
        repoResult,
        pullResult,
        eventResult,
        triageResult
      ] = results;

      if (repoResult.status === "fulfilled") {
        const nextRepos = repoResult.value;

        setRepos(nextRepos);

        setSelectedRepo((current) =>
          nextRepos.some((repo) => repo.fullName === current)
            ? current
            : nextRepos[0]?.fullName || ""
        );
      } else {
        setRepos([]);
      }

      if (pullResult.status === "fulfilled") {
        setPulls(pullResult.value.pulls || []);
      } else {
        setPulls([]);
      }

      if (eventResult.status === "fulfilled") {
        setEvents(eventResult.value.events || []);
      } else {
        setEvents([]);
      }

      if (triageResult.status === "fulfilled") {
        setTriage(triageResult.value.items || []);
      } else {
        setTriage([]);
      }

      const failed = results
        .map((result, index) => ({
          result,
          label: [
            "repositories",
            "pull requests",
            "activity",
            "triage"
          ][index]
        }))
        .filter(({ result }) => result.status === "rejected")
        .map(({ result, label }) =>
          `${label}: ${result.reason?.message || "request failed"}`
        );

      if (failed.length) {
        setError(
          `GitHub is connected, but some data could not be loaded — ${failed.join("; ")}`
        );
      }

      return currentStatus;
    } catch (refreshError) {
      setStatus(null);
      setRepos([]);
      setPulls([]);
      setEvents([]);
      setCommits([]);
      setTriage([]);
      setError(
        refreshError.message ||
        "Could not verify the GitHub connection."
      );

      return null;
    } finally {
      setLoading(false);
    }
  }, [loadAllRepositories]);

  useEffect(() => {
    const callbackUrl = new URL(window.location.href);

    const callbackSucceeded =
      callbackUrl.searchParams.get("connected") === "1";

    const callbackError =
      callbackUrl.searchParams.get("github_error");

    if (callbackSucceeded || callbackError) {
      callbackUrl.searchParams.delete("connected");
      callbackUrl.searchParams.delete("github_error");

      window.history.replaceState(
        {},
        "",
        `${callbackUrl.pathname}${callbackUrl.search}${callbackUrl.hash}`
      );
    }

    let active = true;

    (async () => {
      const currentStatus = await refresh();

      if (!active) return;

      if (callbackError) {
        setError(
          `GitHub authorization failed: ${callbackError.replaceAll("+", " ")}`
        );
      } else if (callbackSucceeded && !currentStatus?.connected) {
        setError(
          "GitHub returned to DevPulse successfully, but the saved connection was not found. Check the backend callback logs and MongoDB user record."
        );
      }
    })();

    return () => {
      active = false;
    };
  }, [refresh]);

  useEffect(() => {
    if (!selectedRepo || !status?.connected) {
      setCommits([]);
      return undefined;
    }

    let active = true;

    setCommits([]);

    api(`/github/commits?repo=${encodeURIComponent(selectedRepo)}`)
      .then((result) => {
        if (active) {
          setCommits(result.commits || []);
        }
      })
      .catch((commitError) => {
        if (active) {
          setError(commitError.message);
        }
      });

    return () => {
      active = false;
    };
  }, [selectedRepo, status?.connected]);

  async function connect() {
    if (busy) return;

    setBusy(true);
    setError("");

    try {
      const result = await api("/github/connect");

      const authorizationUrl =
        result?.url || result?.data?.url;

      if (!authorizationUrl) {
        throw new Error(
          "The backend did not return a GitHub authorization URL."
        );
      }

      const destination = new URL(authorizationUrl);

      if (
        destination.protocol !== "https:" ||
        destination.hostname !== "github.com" ||
        destination.pathname !== "/login/oauth/authorize"
      ) {
        throw new Error(
          "The backend returned an invalid GitHub authorization URL."
        );
      }

      window.location.assign(destination.href);
    } catch (connectError) {
      console.error("GitHub connection failed:", connectError);

      setError(
        connectError.message ||
        "Could not start GitHub authorization."
      );

      setBusy(false);
    }
  }

  async function disconnect() {
    if (!window.confirm("Disconnect your GitHub account from DevPulse?")) {
      return;
    }

    setBusy(true);
    setError("");

    try {
      await api("/github/disconnect", {
        method: "POST"
      });

      setStatus((current) =>
        current
          ? {
              ...current,
              connected: false,
              account: null
            }
          : current
      );

      setRepos([]);
      setPulls([]);
      setEvents([]);
      setCommits([]);
      setTriage([]);
      setSelectedRepo("");
    } catch (disconnectError) {
      setError(disconnectError.message);
    } finally {
      setBusy(false);
    }
  }

  async function createTaskFromPull(pull) {
    if (!targetProject) {
      setError(
        "Create a project first, then choose it for this GitHub pull request."
      );
      return;
    }

    try {
      await api("/github/create-task", {
        method: "POST",
        body: JSON.stringify({
          repoFullName: pull.repoFullName,
          number: pull.number,
          title: pull.title,
          url: pull.url,
          projectId: targetProject,
          priority: pull.priority
        })
      });

      setError("");

      dispatch(
        baseApi.util.invalidateTags([
          "Task",
          "Project",
          "Dashboard"
        ])
      );

      window.alert("Task created from GitHub pull request.");
    } catch (taskError) {
      setError(taskError.message);
    }
  }

  async function saveTriage(pull, changes) {
    const body = {
      repoFullName: pull.repoFullName,
      number: pull.number,
      kind: "pull_request",
      title: pull.title,
      url: pull.url,
      priority: pull.priority || "medium",
      triageStatus: pull.triageStatus || "backlog",
      note: pull.note || "",
            ...changes
    };

    try {
      const result = await api("/github/triage", {
        method: "POST",
        body: JSON.stringify(body)
      });

      setPulls((current) =>
        current.map((item) =>
          item.number === pull.number &&
          item.repoFullName === pull.repoFullName
            ? { ...item, ...result.item }
            : item
        )
      );

      setTriage((current) => [
        result.item,
        ...current.filter((item) => !(
          item.number === result.item.number &&
          item.repoFullName === result.item.repoFullName &&
          item.kind === result.item.kind
        ))
      ]);
    } catch (triageError) {
      setError(triageError.message);
    }
  }

  useEffect(() => {
    if (!targetProject && workspaceProjects.length) {
      setTargetProject(workspaceProjects[0]._id);
    }
  }, [targetProject, workspaceProjects]);

  const openPulls = pulls.filter(
    (pull) => pull.state === "open"
  );

  const highPriority = pulls.filter(
    (pull) => ["high", "urgent"].includes(pull.priority)
  ).length;

  if (loading) {
    return (
      <>
        <PageHeader
          eyebrow="DEVELOPER INTEGRATION"
          title="GitHub workspace"
          subtitle="Connect your account to bring repository activity into DevPulse."
        />

        <Loading label="Checking GitHub connection…" />
      </>
    );
  }

  // Do not show the Connect button when the status request itself failed.
  if (!status) {
    return (
      <div className="ext-page">
        <PageHeader
          eyebrow="DEVELOPER INTEGRATION"
          title="GitHub workspace"
          subtitle="DevPulse could not verify your GitHub connection."
        />

        <Notice type="error">
          {error || "The GitHub status request failed. Check your backend and sign-in session."}
        </Notice>

        <button
          className="secondary-btn"
          onClick={refresh}
          disabled={loading}
        >
          <RefreshCw size={15} />
          Retry connection check
        </button>
      </div>
    );
  }

  return (
    <div className="ext-page">
      <PageHeader
        eyebrow="DEVELOPER INTEGRATION"
        title="GitHub workspace"
        subtitle="Repositories, commits, pull requests, and a triage queue — in one place."
        actions={
          status.connected && (
            <>
              <button
                className="secondary-btn"
                onClick={refresh}
                disabled={loading}
              >
                <RefreshCw size={15} />
                Refresh
              </button>

              <button
                className="secondary-btn"
                disabled={busy}
                onClick={disconnect}
              >
                Disconnect
              </button>
            </>
          )
        }
      />

      {error && (
        <Notice type="error">
          {error}
        </Notice>
      )}

      {!status.connected ? (
        <section className="surface-card github-connect-card">
          <div className="github-connect-mark">
            <Github size={35} />
          </div>

          <div className="eyebrow">
            ONE DEVELOPER WORKSPACE
          </div>

          <h2>
            Bring your GitHub workflow into DevPulse.
          </h2>

          <p>
            Connect your account to view repositories, recent commits,
            contribution events, and pull requests you are involved in.
            You can prioritize pull requests and track their triage status
            without changing anything on GitHub.
          </p>

          <div className="github-permissions">
            <span>
              <ShieldCheck size={16} />
              OAuth authorization
            </span>

            <span>
              <BookOpen size={16} />
              Repository metadata
            </span>

            <span>
              <GitPullRequest size={16} />
              PR activity
            </span>
          </div>

          <button
            className="primary-btn"
            disabled={busy || !status.configured}
            onClick={connect}
          >
            <Github size={17} />
            {busy ? "Connecting…" : "Connect GitHub"}
            <ArrowUpRight size={16} />
          </button>

          {!status.configured && (
            <p className="ext-help">
              GitHub OAuth needs the Client ID, Client Secret, callback URL,
              and token encryption key in `server/.env`.
            </p>
          )}
        </section>
      ) : (
        <>
          <section className="github-profile-card">
            <div className="github-profile-main">
              {status.account?.avatarUrl ? (
                <img
                  src={status.account.avatarUrl}
                  alt="GitHub avatar"
                />
              ) : (
                <span className="github-avatar-fallback">
                  <Github />
                </span>
              )}

              <div>
                <div className="eyebrow">
                  CONNECTED ACCOUNT
                </div>

                <h2>
                  @{status.account?.login}
                </h2>

                <a
                  href={status.account?.profileUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  View GitHub profile
                  <ExternalLink size={13} />
                </a>
              </div>
            </div>

            <div className="github-connected-state">
              <span className="live-dot" />
              Connected

              <small>
                since {prettyDate(status.account?.connectedAt)}
              </small>
            </div>
          </section>

          <div className="ext-metric-grid">
            <div className="ext-metric">
              <span>
                <BookOpen size={17} />
              </span>

              <small>Repositories</small>
              <strong>{repos.length}</strong>
              <em>Accessible repositories</em>
            </div>

            <div className="ext-metric">
              <span>
                <GitPullRequest size={17} />
              </span>

              <small>Open pull requests</small>
              <strong>{openPulls.length}</strong>
              <em>Across fetched repositories</em>
            </div>

            <div className="ext-metric">
              <span>
                <GitCommitHorizontal size={17} />
              </span>

              <small>Recent commits</small>
              <strong>{commits.length}</strong>
              <em>{selectedRepo || "Select a repository"}</em>
            </div>

            <div className="ext-metric">
              <span>
                <Star size={17} />
              </span>

              <small>Priority PRs</small>
              <strong>{highPriority}</strong>
              <em>High or urgent triage</em>
            </div>
          </div>

          <div className="ext-tabs">
            <button
              className={tab === "pulls" ? "active" : ""}
              onClick={() => setTab("pulls")}
            >
              <GitPullRequest size={15} />
              Pull request triage
              <span>{pulls.length}</span>
            </button>

            <button
              className={tab === "repos" ? "active" : ""}
              onClick={() => setTab("repos")}
            >
              <BookOpen size={15} />
              Repositories
              <span>{repos.length}</span>
            </button>

            <button
              className={tab === "events" ? "active" : ""}
              onClick={() => setTab("events")}
            >
              <Activity size={15} />
              Activity
              <span>{events.length}</span>
            </button>
          </div>

          {tab === "pulls" && (
            <section className="surface-card ext-list-card">
              <div className="ext-card-head">
                <div>
                  <h3>Pull request triage</h3>

                  <p>
                    Prioritize work for your own planning. Changes are stored
                    in DevPulse, not pushed back to GitHub.
                  </p>

                  <div className="github-create-task-choice">
                    <label>
                      Create task in

                      <select
                        value={targetProject}
                        onChange={(event) => setTargetProject(event.target.value)}
                      >
                        <option value="">
                          Choose project
                        </option>

                        {workspaceProjects.map((project) => (
                          <option
                            key={project._id}
                            value={project._id}
                          >
                            {project.name}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                </div>

                <select
                  value={filter}
                  onChange={(event) => setFilter(event.target.value)}
                  aria-label="Filter pull requests"
                >
                  <option value="all">All priorities</option>
                  <option value="urgent">Urgent</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>

              {pulls.filter(
                (pull) => filter === "all" || pull.priority === filter
              ).length === 0 ? (
                <Empty
                  icon={GitPullRequest}
                  title="No matching pull requests"
                  description="Pull requests from the accessible repositories will appear here when available."
                />
              ) : (
                <div className="github-pull-list">
                  {pulls
                    .filter(
                      (pull) => filter === "all" || pull.priority === filter
                    )
                    .map((pull) => (
                      <article
                        className="github-pull-row"
                        key={`${pull.repoFullName}-${pull.number}`}
                      >
                        <div className="github-pull-icon">
                          <GitPullRequest size={17} />
                        </div>

                        <div className="github-pull-content">
                          <div className="github-pull-repo">
                            {pull.repoFullName}
                            <span>#{pull.number}</span>
                            {pull.isDraft && <i>Draft</i>}
                          </div>

                          <a
                            className="github-pull-title"
                            href={pull.url}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {pull.title}
                            <ExternalLink size={12} />
                          </a>

                          <div className="github-pull-meta">
                            <span>
                              <Clock3 size={12} />
                              {prettyDate(pull.updatedAt)}
                            </span>

                            <span>
                              {pull.comments} comments
                            </span>

                            {pull.labels?.slice(0, 3).map((label) => (
                              <i key={label}>
                                {label}
                              </i>
                            ))}
                          </div>
                        </div>

                        <div className="github-triage-controls">
                          <label>
                            Priority

                            <select
                              value={pull.priority || "medium"}
                              onChange={(event) =>
                                saveTriage(pull, {
                                  priority: event.target.value,
                                })
                              }
                            >
                              <option value="urgent">Urgent</option>
                              <option value="high">High</option>
                              <option value="medium">Medium</option>
                              <option value="low">Low</option>
                            </select>
                          </label>

                          <label>
                            DevPulse status

                            <select
                              value={pull.triageStatus || "backlog"}
                              onChange={(event) =>
                                saveTriage(pull, {
                                  triageStatus: event.target.value,
                                })
                              }
                            >
                              <option value="backlog">Backlog</option>
                              <option value="planned">Planned</option>
                              <option value="in-progress">In progress</option>
                              <option value="done">Done</option>
                              <option value="ignored">Ignored</option>
                            </select>
                          </label>

                          <button
                            className="secondary-btn github-create-task-btn"
                            disabled={!targetProject}
                            onClick={() => createTaskFromPull(pull)}
                          >
                            <Check size={13} />
                            Create task
                          </button>
                        </div>
                      </article>
                    ))}
                </div>
              )}
            </section>
          )}

          {tab === "repos" && (
            <div className="github-repo-layout">
              <section className="surface-card ext-list-card">
                <div className="ext-card-head">
                  <div>
                    <h3>Your repositories</h3>
                    <p>
                      Repositories your GitHub account can access.
                    </p>
                  </div>
                </div>

                {repos.length === 0 ? (
                  <Empty
                    icon={BookOpen}
                    title="No repositories found"
                    description="GitHub returned no accessible repositories for this account."
                  />
                ) : (
                  <div className="github-repo-list">
                    {repos.map((repo) => (
                      <button
                        className={`github-repo-row ${
                          selectedRepo === repo.fullName ? "selected" : ""
                        }`}
                        key={repo.id}
                        onClick={() => setSelectedRepo(repo.fullName)}
                      >
                        <span className="repo-language-dot" />

                        <span className="repo-row-main">
                          <strong>{repo.name}</strong>
                          <small>{repo.description || "No description"}</small>

                          <em>
                            {repo.language || "Other"} · {repo.visibility} ·
                            Updated {prettyDate(repo.updatedAt)}
                          </em>
                        </span>

                        <span className="repo-stars">
                          <Star size={13} />
                          {repo.stars}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </section>

              <section className="surface-card ext-list-card">
                <div className="ext-card-head">
                  <div>
                    <h3>Recent commits</h3>
                    <p>{selectedRepo || "Select a repository"}</p>
                  </div>
                </div>

                {!selectedRepo ? (
                  <Empty
                    icon={GitCommitHorizontal}
                    title="Select a repository"
                    description="Choose a repository to load its recent commits."
                  />
                ) : commits.length === 0 ? (
                  <Empty
                    icon={GitCommitHorizontal}
                    title="No commits returned"
                    description="This repository may be empty, or GitHub returned no recent commits."
                  />
                ) : (
                  <div className="github-commit-list">
                    {commits.map((commit) => (
                      <a
                        className="github-commit-row"
                        href={commit.url}
                        target="_blank"
                        rel="noreferrer"
                        key={commit.sha}
                      >
                        <span>
                          <GitCommitHorizontal size={15} />
                        </span>

                        <div>
                          <strong>{commit.message}</strong>
                          <small>
                            {commit.author} · {prettyDate(commit.date)}
                          </small>
                        </div>

                        <code>{commit.shortSha}</code>
                      </a>
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}

          {tab === "events" && (
            <section className="surface-card ext-list-card">
              <div className="ext-card-head">
                <div>
                  <h3>GitHub activity</h3>
                  <p>
                    Recent public events from the connected account.
                  </p>
                </div>
              </div>

              {events.length === 0 ? (
                <Empty
                  icon={Activity}
                  title="No recent public events"
                  description="GitHub may have no public events in its recent activity window."
                />
              ) : (
                <div className="github-event-list">
                  {events.map((event) => (
                    <a
                      key={event.id}
                      className="github-event-row"
                      href={event.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <span className="activity-event-icon">
                        <Activity size={15} />
                      </span>

                      <div>
                        <strong>
                          {event.action} · {event.repo || "GitHub"}
                        </strong>

                        <small>
                          {event.ref} {prettyDate(event.createdAt)}
                        </small>
                      </div>

                      <ExternalLink size={14} />
                    </a>
                  ))}
                </div>
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
}

export function ActivityPage() {
  const [items, setItems] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);

    try {
      const activityPath = `/activity?limit=100${
        filter !== "all" ? `&type=${filter}` : ""
      }`;

      const [activityData, notificationData] = await Promise.all([
        api(activityPath),
        api("/notifications?limit=100")
      ]);

      setItems(activityData.activities || []);
      setNotifications(notificationData.notifications || []);
      setUnread(notificationData.unreadCount || 0);
      setError("");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  async function markRead(id) {
    try {
      await api(`/notifications/${id}/read`, {
        method: "PATCH",
      });

      setNotifications((current) =>
        current.map((notification) =>
          notification._id === id
            ? {
                ...notification,
                readAt: new Date().toISOString(),
              }
            : notification
        )
      );

      setUnread((count) => Math.max(0, count - 1));
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function readAll() {
    try {
      await api("/notifications/read-all", {
        method: "POST",
      });

      const readAt = new Date().toISOString();

      setNotifications((current) =>
        current.map((notification) => ({
          ...notification,
          readAt,
        }))
      );

      setUnread(0);
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  return (
    <div className="ext-page">
      <PageHeader
        eyebrow="WORKSPACE HISTORY"
        title="Notifications & activity"
        subtitle="Keep track of task updates, project changes, and GitHub actions."
                actions={
          <button
            className="secondary-btn"
            onClick={load}
          >
            <RefreshCw size={15} />
            Refresh
          </button>
        }
      />

      {error && <Notice type="error">{error}</Notice>}

      <div className="activity-page-grid">
        <section className="surface-card ext-list-card">
          <div className="ext-card-head">
            <div>
              <h3>
                Notifications{" "}
                <span className="ext-count">{unread} unread</span>
              </h3>
              <p>Actionable updates for your workspace.</p>
            </div>

            {unread > 0 && (
              <button
                className="secondary-btn"
                onClick={readAll}
              >
                <CheckCheck size={15} />
                Mark all read
              </button>
            )}
          </div>

          {loading ? (
            <Loading />
          ) : notifications.length === 0 ? (
            <Empty
              icon={Bell}
              title="You're all caught up"
              description="New task, project, and GitHub updates will appear here."
            />
          ) : (
            <div className="notification-list">
              {notifications.map((notification) => (
                <article
                  className={`notification-row ${
                    !notification.readAt ? "unread" : ""
                  }`}
                  key={notification._id}
                >
                  <span
                    className={`notification-type-dot type-${notification.type}`}
                  />

                  <div className="notification-row-content">
                    <strong>{notification.title}</strong>
                    <p>{notification.message}</p>
                    <small>{prettyDate(notification.createdAt)}</small>
                  </div>

                  {!notification.readAt && (
                    <button
                      className="icon-btn"
                      title="Mark as read"
                      onClick={() => markRead(notification._id)}
                    >
                      <Check size={15} />
                    </button>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="surface-card ext-list-card">
          <div className="ext-card-head">
            <div>
              <h3>Activity feed</h3>
              <p>A chronological audit trail of your recent work.</p>
            </div>

            <select
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
            >
              <option value="all">All activity</option>
              <option value="task">Tasks</option>
              <option value="project">Projects</option>
              <option value="github">GitHub</option>
              <option value="team">Team</option>
            </select>
          </div>

          {loading ? (
            <Loading />
          ) : items.length === 0 ? (
            <Empty
              icon={Activity}
              title="No activity yet"
              description="Create a task or project to start your activity history."
            />
          ) : (
            <div className="activity-timeline">
              {items.map((activity) => (
                <div
                  className="activity-timeline-row"
                  key={activity._id}
                >
                  <span
                    className={`activity-node type-${activity.type}`}
                  />

                  <div>
                    <strong>{activity.action}</strong>

                    {activity.target && (
                      <p>{activity.target}</p>
                    )}

                    <small>
                      {activity.actorName} · {prettyDate(activity.createdAt)}
                    </small>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export function SearchPage() {
  const [query, setQuery] = useState("");
  const [data, setData] = useState({
    tasks: [],
    projects: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const value = query.trim();

    if (value.length < 2) {
      setData({
        tasks: [],
        projects: [],
      });
      setError("");
      setLoading(false);

      return undefined;
    }

    let isActive = true;

    setLoading(true);

    const timeoutId = window.setTimeout(() => {
      api(`/search?q=${encodeURIComponent(value)}`)
        .then((result) => {
          if (!isActive) return;

          setData(result);
          setError("");
        })
        .catch((requestError) => {
          if (isActive) {
            setError(requestError.message);
          }
        })
        .finally(() => {
          if (isActive) {
            setLoading(false);
          }
        });
    }, 250);

    return () => {
      isActive = false;
      window.clearTimeout(timeoutId);
    };
  }, [query]);

  return (
    <div className="ext-page">
      <PageHeader
        eyebrow="FIND ANYTHING"
        title="Search workspace"
        subtitle="Search projects and tasks by title or description."
      />

      <div className="surface-card ext-search-panel">
        <label className="ext-search-input">
          <Search size={19} />

          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search tasks and projects…"
          />

          <kbd>Type to search</kbd>
        </label>

        {error && (
          <Notice type="error">
            {error}
          </Notice>
        )}

        {query.trim().length < 2 ? (
          <Empty
            icon={Search}
            title="Search your workspace"
            description="Enter at least two characters to search projects and tasks."
          />
        ) : loading ? (
          <Loading label="Searching your workspace…" />
        ) : (
          <div className="ext-search-results">
            <section>
              <div className="ext-card-head">
                <h3>
                  Projects{" "}
                  <span className="ext-count">
                    {data.projects.length}
                  </span>
                </h3>
              </div>

              {data.projects.length > 0 ? (
                data.projects.map((project) => (
                  <a
                    className="search-result-row"
                    href="/projects"
                    key={project._id}
                  >
                    <span className="search-result-icon">
                      <BookOpen size={16} />
                    </span>

                    <div>
                      <strong>{project.name}</strong>
                      <small>
                        {project.description || "Project"}
                      </small>
                    </div>

                    <ArrowUpRight size={15} />
                  </a>
                ))
              ) : (
                <p className="ext-muted">
                  No matching projects.
                </p>
              )}
            </section>

            <section>
              <div className="ext-card-head">
                <h3>
                  Tasks{" "}
                  <span className="ext-count">
                    {data.tasks.length}
                  </span>
                </h3>
              </div>

              {data.tasks.length > 0 ? (
                data.tasks.map((task) => (
                  <a
                    className="search-result-row"
                    href="/tasks"
                    key={task._id}
                  >
                    <span className="search-result-icon">
                      <Check size={16} />
                    </span>

                    <div>
                      <strong>{task.title}</strong>
                      <small>
                        {task.project?.name || "No project"} · {task.status} ·{" "}
                        {task.priority} priority
                      </small>
                    </div>

                    <ArrowUpRight size={15} />
                  </a>
                ))
              ) : (
                <p className="ext-muted">
                  No matching tasks.
                </p>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}

export function CalendarPage() {
  const {
    data: tasks = [],
    isLoading,
    isError,
  } = useGetTasksQuery();

  const [month, setMonth] = useState(() => new Date());
  const [selected, setSelected] = useState("");

  const firstDayOfMonth = new Date(
    month.getFullYear(),
    month.getMonth(),
    1
  );

  const startOffset = (firstDayOfMonth.getDay() + 6) % 7;

  const daysInMonth = new Date(
    month.getFullYear(),
    month.getMonth() + 1,
    0
  ).getDate();

  function keyFor(date) {
    const year = date.getFullYear();

    const monthNumber = String(
      date.getMonth() + 1
    ).padStart(2, "0");

    const dayNumber = String(
      date.getDate()
    ).padStart(2, "0");

    return `${year}-${monthNumber}-${dayNumber}`;
  }

  const taskMap = useMemo(() => {
    const groupedTasks = {};

    tasks
      .filter((task) => task.dueDate)
      .forEach((task) => {
        const key = keyFor(new Date(task.dueDate));

        if (!groupedTasks[key]) {
          groupedTasks[key] = [];
        }

        groupedTasks[key].push(task);
      });

    return groupedTasks;
  }, [tasks, month]);

  const cells = [
    ...Array(startOffset).fill(null),
    ...Array.from(
      { length: daysInMonth },
      (_, index) => index + 1
    ),
  ];

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  const selectedTasks = selected
    ? taskMap[selected] || []
    : [];

  const todayKey = keyFor(new Date());

  const upcomingTasks = tasks
    .filter((task) => {
      if (!task.dueDate) return false;

      const dueDate = new Date(task.dueDate);
      const today = new Date();

      today.setHours(0, 0, 0, 0);

      return dueDate >= today;
    })
    .sort(
      (first, second) =>
        new Date(first.dueDate) - new Date(second.dueDate)
    )
    .slice(0, 8);

  return (
    <div className="ext-page">
      <PageHeader
        eyebrow="TIME & DEADLINES"
        title="Calendar"
        subtitle="Plan around task due dates and spot deadline conflicts."
        actions={
          <div className="calendar-month-controls">
            <button
              className="secondary-btn"
              onClick={() => {
                setMonth(
                  new Date(
                    month.getFullYear(),
                    month.getMonth() - 1,
                    1
                  )
                );

                setSelected("");
              }}
              aria-label="Previous month"
            >
              ‹
            </button>

            <strong>
              {month.toLocaleDateString(undefined, {
                month: "long",
                year: "numeric",
              })}
            </strong>

            <button
              className="secondary-btn"
              onClick={() => {
                setMonth(
                  new Date(
                    month.getFullYear(),
                    month.getMonth() + 1,
                    1
                  )
                );

                setSelected("");
              }}
              aria-label="Next month"
            >
              ›
            </button>

            <button
              className="secondary-btn"
              onClick={() => {
                const today = new Date();

                setMonth(today);
                setSelected(keyFor(today));
              }}
            >
              Today
            </button>
          </div>
        }
      />

      {isLoading ? (
        <Loading />
      ) : isError ? (
        <Notice type="error">
          Could not load tasks. Check the backend connection.
        </Notice>
      ) : (
        <div className="calendar-layout">
          <section className="surface-card calendar-card">
            <div className="calendar-weekdays">
              {[
                "Mon",
                "Tue",
                "Wed",
                "Thu",
                "Fri",
                "Sat",
                "Sun",
              ].map((day) => (
                <span key={day}>{day}</span>
              ))}
            </div>

            <div className="calendar-grid">
              {cells.map((day, index) => {
                const key = day
                  ? keyFor(
                      new Date(
                        month.getFullYear(),
                        month.getMonth(),
                        day
                      )
                    )
                  : null;

                const dayTasks = key
                  ? taskMap[key] || []
                  : [];

                const isToday = day && key === todayKey;
                const isSelected = selected === key;

                return (
                  <button
                    key={`${key || "blank"}-${index}`}
                    disabled={!day}
                    className={`calendar-day ${
                      isToday ? "today" : ""
                    } ${isSelected ? "selected" : ""}`}
                    onClick={() => setSelected(key || "")}
                  >
                    <span>{day || ""}</span>

                    {dayTasks.slice(0, 3).map((task) => (
                      <i
                        className={`calendar-task-chip priority-${task.priority}`}
                        key={task._id}
                        title={task.title}
                      >
                        {task.title}
                      </i>
                    ))}
                                        {dayTasks.length > 3 && (
                      <small>
                        +{dayTasks.length - 3} more
                      </small>
                    )}
                  </button>
                );
              })}
            </div>
          </section>

          <aside className="surface-card calendar-agenda">
            <div className="ext-card-head">
              <div>
                <h3>
                  {selected
                    ? new Date(`${selected}T12:00:00`).toLocaleDateString(
                        undefined,
                        {
                          month: "short",
                          day: "numeric",
                        }
                      )
                    : "Upcoming deadlines"}
                </h3>

                <p>
                  {selected
                    ? "Tasks due on this day"
                    : "Select a date to inspect tasks"}
                </p>
              </div>
            </div>

            {(selected ? selectedTasks : upcomingTasks).map((task) => (
              <div
                className="calendar-agenda-item"
                key={task._id}
              >
                <span
                  className={`agenda-priority priority-${task.priority}`}
                />

                <div>
                  <strong>{task.title}</strong>

                  <small>
                    {task.project?.name || "Project"} · {task.status}
                  </small>

                  <em>{prettyDate(task.dueDate)}</em>
                </div>
              </div>
            ))}

            {(
              (selected && selectedTasks.length === 0) ||
              (!selected && upcomingTasks.length === 0)
            ) && (
              <p className="ext-muted">
                No tasks scheduled for this date.
              </p>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}

export function TeamPage() {
  const { isLoading: projectsLoading } = useGetProjectsQuery();

  const [team, setTeam] = useState([]);
  const [email, setEmail] = useState({});
  const [loading, setLoading] = useState(false);
  const [teamLoading, setTeamLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = useCallback(async () => {
    setTeamLoading(true);

    try {
      const result = await api("/team");

      setTeam(result.projects || []);
      setError("");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setTeamLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function addMember(project) {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await api(`/team/projects/${project._id}/members`, {
        method: "POST",
        body: JSON.stringify({
          email: email[project._id] || "",
        }),
      });

      setSuccess(`Member added to ${project.name}.`);

      setEmail((current) => ({
        ...current,
        [project._id]: "",
      }));

      await load();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  async function removeMember(project, member) {
    const confirmed = window.confirm(
      `Remove ${member.name} from ${project.name}?`
    );

    if (!confirmed) return;

    try {
      await api(
        `/team/projects/${project._id}/members/${member._id}`,
        {
          method: "DELETE",
        }
      );

      setSuccess(
        `${member.name} was removed from ${project.name}.`
      );

      await load();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function leaveProject(project) {
    const confirmed = window.confirm(
      `Leave ${project.name}? You will lose access to its shared tasks.`
    );

    if (!confirmed) return;

    try {
      await api(`/team/projects/${project._id}/leave`, {
        method: "POST",
      });

      setSuccess(`You left ${project.name}.`);

      await load();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  return (
    <div className="ext-page">
      <PageHeader
        eyebrow="COLLABORATION"
        title="Team workspace"
        subtitle="Share projects with existing DevPulse accounts and collaborate on task visibility."
      />

      <Notice>
        Invite people who already have a DevPulse account. Members can create
        and update shared tasks; only the task creator or project owner can
        delete a task. Project owners can manage members.
      </Notice>

      {error && (
        <Notice type="error">
          {error}
        </Notice>
      )}

      {success && (
        <Notice type="success">
          {success}
        </Notice>
      )}

      {teamLoading || projectsLoading ? (
        <Loading />
      ) : team.length === 0 ? (
        <Empty
          icon={Users}
          title="Create a project to start collaborating"
          description="Projects you own or have been invited to will appear here."
        />
      ) : (
        <div className="team-project-list">
          {team.map((project) => (
            <section
              className="surface-card team-project-card"
              key={project._id}
            >
              <div className="team-project-heading">
                <span className="team-project-icon">
                  <Users size={18} />
                </span>

                <div>
                  <h3>{project.name}</h3>

                  <p>
                    {project.isOwner
                      ? "You own this project"
                      : `Owner: ${project.owner?.name || "Workspace member"}`}
                    {" · "}
                    {(project.members || []).length} collaborators
                  </p>
                </div>

                <span
                  className={`team-role ${
                    project.isOwner ? "owner" : "member"
                  }`}
                >
                  {project.isOwner ? "Owner" : "Member"}
                </span>
              </div>

              <div className="team-member-list">
                <div className="team-member-row">
                  <span className="team-member-avatar">
                    {(project.owner?.name || "O")
                      .slice(0, 1)
                      .toUpperCase()}
                  </span>

                  <div>
                    <strong>
                      {project.owner?.name || "Project owner"}
                    </strong>

                    <small>
                      {project.owner?.email || "Owner"}
                    </small>
                  </div>

                  <span className="team-member-role">
                    Owner
                  </span>
                </div>

                {(project.members || []).map((member) => (
                  <div
                    className="team-member-row"
                    key={member._id}
                  >
                    <span className="team-member-avatar">
                      {(member.name || "M")
                        .slice(0, 1)
                        .toUpperCase()}
                    </span>

                    <div>
                      <strong>{member.name}</strong>
                      <small>{member.email}</small>
                    </div>

                    <span className="team-member-role">
                      Member
                    </span>

                    {project.isOwner && (
                      <button
                        className="icon-btn"
                        onClick={() => removeMember(project, member)}
                        title="Remove member"
                        aria-label={`Remove ${member.name}`}
                      >
                        <X size={15} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {project.isOwner ? (
                <form
                  className="team-invite-form"
                  onSubmit={(event) => {
                    event.preventDefault();
                    addMember(project);
                  }}
                >
                  <input
                    type="email"
                    required
                    placeholder="Invite by DevPulse account email"
                    value={email[project._id] || ""}
                    onChange={(event) =>
                      setEmail((current) => ({
                        ...current,
                        [project._id]: event.target.value,
                      }))
                    }
                  />

                  <button
                    className="primary-btn"
                    disabled={loading}
                  >
                    <Users size={15} />
                    {loading ? "Adding…" : "Add member"}
                  </button>
                </form>
              ) : (
                <div className="team-invite-form">
                  <button
                    className="secondary-btn"
                    onClick={() => leaveProject(project)}
                  >
                    Leave project
                  </button>
                </div>
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const result = await api("/notifications?limit=8");

      setItems(result.notifications || []);
      setUnread(result.unreadCount || 0);
      setError("");
    } catch (requestError) {
      setError(requestError.message);
    }
  }, []);

  useEffect(() => {
    load();

    const intervalId = window.setInterval(load, 60_000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [load]);

  async function markRead(id) {
    try {
      await api(`/notifications/${id}/read`, {
        method: "PATCH",
      });

      setItems((current) =>
        current.map((notification) =>
          notification._id === id
            ? {
                ...notification,
                readAt: new Date().toISOString(),
              }
            : notification
        )
      );

      setUnread((count) => Math.max(0, count - 1));
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function markAllRead() {
    try {
      await api("/notifications/read-all", {
        method: "POST",
      });

      const readAt = new Date().toISOString();

      setItems((current) =>
        current.map((notification) => ({
          ...notification,
          readAt,
        }))
      );

      setUnread(0);
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  return (
    <div className="notification-menu-wrap">
      <button
        className="icon-btn notification-btn"
        onClick={() => {
          setOpen((current) => !current);
          load();
        }}
        aria-label="Notifications"
      >
        <Bell size={18} />

        {unread > 0 && <i />}
      </button>

      {open && (
        <>
          <button
            className="notification-dismiss-layer"
            onClick={() => setOpen(false)}
            aria-label="Close notifications"
          />

          <div className="notification-popover">
            <div className="notification-popover-head">
              <div>
                <strong>Notifications</strong>

                <small>
                  {unread
                    ? `${unread} unread`
                    : "You're all caught up"}
                </small>
              </div>

              <div>
                {unread > 0 && (
                  <button onClick={markAllRead}>
                    Read all
                  </button>
                )}

                <button
                  className="icon-btn"
                  onClick={() => setOpen(false)}
                  aria-label="Close"
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            {error && (
              <p className="notification-popover-error">
                {error}
              </p>
            )}

            {items.length === 0 ? (
              <div className="notification-popover-empty">
                <Bell size={20} />
                <span>No notifications yet</span>
              </div>
            ) : (
              items.map((notification) => (
                <button
                  className={`notification-popover-row ${
                    !notification.readAt ? "unread" : ""
                  }`}
                  key={notification._id}
                  onClick={() => {
                    if (!notification.readAt) {
                      markRead(notification._id);
                    }

                    if (notification.href) {
                      window.location.href = notification.href;
                    }

                    setOpen(false);
                  }}
                >
                  <span
                    className={`notification-type-dot type-${notification.type}`}
                  />

                  <span>
                    <strong>{notification.title}</strong>

                    <small>
                      {notification.message ||
                        prettyDate(notification.createdAt)}
                    </small>

                    <em>
                      {prettyDate(notification.createdAt)}
                    </em>
                  </span>

                  {!notification.readAt && <i />}
                </button>
              ))
            )}

            <a
              className="notification-popover-footer"
              href="/activity"
            >
              View all activity
              <ArrowUpRight size={13} />
            </a>
          </div>
        </>
      )}
    </div>
  );
}