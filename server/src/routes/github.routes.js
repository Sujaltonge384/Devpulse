import { Router } from "express";
import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import GitHubTriage from "../models/GitHubTriage.js";
import Project from "../models/Project.js";
import Task from "../models/Task.js";
import { requireAuth } from "../middleware/auth.js";
import { recordActivity } from "../utils/activity.js";

const router = Router();

// Prevent stale cached responses, especially GitHub connection status.
router.use((req, res, next) => {
  res.set({
    "Cache-Control": "no-store, no-cache, must-revalidate, private",
    Pragma: "no-cache",
    Expires: "0",
  });

  next();
});

const DEFAULT_CALLBACK_URL =
  "http://localhost:5000/api/github/callback";

function callbackUrl() {
  return (
    process.env.GITHUB_CALLBACK_URL ||
    DEFAULT_CALLBACK_URL
  );
}

function clientUrl() {
  return (
    process.env.CLIENT_URL ||
    "http://localhost:5173"
  ).replace(/\/+$/, "");
}

// --------------------------------------------------
// GITHUB TOKEN ENCRYPTION
// --------------------------------------------------

function encryptionKey() {
  const raw = String(
    process.env.GITHUB_TOKEN_ENCRYPTION_KEY || ""
  ).trim();

  if (!raw) {
    throw new Error(
      "GITHUB_TOKEN_ENCRYPTION_KEY is not configured."
    );
  }

  if (/^[a-f0-9]{64}$/i.test(raw)) {
    return Buffer.from(raw, "hex");
  }

  const decoded = Buffer.from(raw, "base64");

  if (decoded.length === 32) {
    return decoded;
  }

  return crypto
    .createHash("sha256")
    .update(raw)
    .digest();
}

function encryptToken(token) {
  const iv = crypto.randomBytes(12);

  const cipher = crypto.createCipheriv(
    "aes-256-gcm",
    encryptionKey(),
    iv
  );

  const encrypted = Buffer.concat([
    cipher.update(token, "utf8"),
    cipher.final(),
  ]);

  return [
    iv.toString("hex"),
    cipher.getAuthTag().toString("hex"),
    encrypted.toString("hex"),
  ].join(":");
}

function decryptToken(value) {
  const [iv, tag, encrypted] = String(value || "").split(":");

  if (!iv || !tag || !encrypted) {
    throw new Error(
      "Stored GitHub token is invalid. Disconnect and reconnect GitHub."
    );
  }

  const ivBuffer = Buffer.from(iv, "hex");
  const tagBuffer = Buffer.from(tag, "hex");
  const encryptedBuffer = Buffer.from(encrypted, "hex");

  const rawKey = String(
    process.env.GITHUB_TOKEN_ENCRYPTION_KEY || ""
  ).trim();

  const keys = [
    encryptionKey(),
    crypto.createHash("sha256").update(rawKey).digest(),
  ];

  for (const key of keys) {
    try {
      const decipher = crypto.createDecipheriv(
        "aes-256-gcm",
        key,
        ivBuffer
      );

      decipher.setAuthTag(tagBuffer);

      return Buffer.concat([
        decipher.update(encryptedBuffer),
        decipher.final(),
      ]).toString("utf8");
    } catch {
      // Try the previous key derivation.
    }
  }

  throw new Error(
    "Stored GitHub token cannot be decrypted with the current key. Disconnect and reconnect GitHub."
  );
}

function oauthConfigured() {
  const hasCoreCredentials = Boolean(
    process.env.GITHUB_CLIENT_ID &&
    process.env.GITHUB_CLIENT_SECRET &&
    process.env.GITHUB_TOKEN_ENCRYPTION_KEY
  );

  const hasProductionUrls =
    process.env.NODE_ENV !== "production" ||
    Boolean(
      process.env.GITHUB_CALLBACK_URL &&
      process.env.CLIENT_URL
    );

  return hasCoreCredentials && hasProductionUrls;
}

// --------------------------------------------------
// USER AND ACCESS HELPERS
// --------------------------------------------------

async function getConnectedUser(userId) {
  return User.findById(userId).select(
    "+github.encryptedAccessToken github.login github.id github.avatarUrl github.profileUrl github.connectedAt"
  );
}

async function getAccess(userId) {
  const user = await getConnectedUser(userId);

  const token = user?.github?.encryptedAccessToken
    ? decryptToken(user.github.encryptedAccessToken)
    : null;

  return {
    user,
    token,
  };
}

// --------------------------------------------------
// GITHUB API HELPER
// --------------------------------------------------

async function githubFetch(path, token, options = {}) {
  const response = await fetch(
    `https://api.github.com${path}`,
    {
      ...options,

      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "DevPulse",
        ...(options.headers || {}),
      },
    }
  );

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      response.status === 401
        ? "GitHub rejected the saved access token. Disconnect and reconnect GitHub."
        : response.status === 403
          ? data.message ||
            "GitHub denied this request. Check repository permissions or API rate limits."
          : data.message ||
            `GitHub API request failed (${response.status}).`;

    const error = new Error(message);

    error.statusCode =
      response.status === 401
        ? 401
        : response.status === 403
          ? 403
          : 502;

    throw error;
  }

  return data;
}

// --------------------------------------------------
// CONNECT GITHUB
// GET /api/github/connect
// --------------------------------------------------

router.get("/connect", requireAuth, (req, res, next) => {
  try {
    if (!oauthConfigured()) {
      return res.status(503).json({
        success: false,
        message:
          "GitHub OAuth is not fully configured. Check GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, GITHUB_TOKEN_ENCRYPTION_KEY and callback configuration.",
      });
    }

    const nonce = crypto.randomBytes(24).toString("hex");

    const state = jwt.sign(
      {
        sub: String(req.user._id),
        nonce,
        purpose: "github_oauth",
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "10m",
        issuer: "devpulse",
        audience: "github-oauth",
      }
    );

    const authorizationUrl = new URL(
      "https://github.com/login/oauth/authorize"
    );

    authorizationUrl.searchParams.set(
      "client_id",
      process.env.GITHUB_CLIENT_ID
    );

    authorizationUrl.searchParams.set(
      "redirect_uri",
      callbackUrl()
    );

    authorizationUrl.searchParams.set(
      "scope",
      "read:user user:email repo"
    );

    authorizationUrl.searchParams.set("state", state);

    return res.json({
      success: true,
      data: {
        url: authorizationUrl.toString(),
      },
    });
  } catch (error) {
    return next(error);
  }
});

// --------------------------------------------------
// GITHUB OAUTH CALLBACK
// GET /api/github/callback
// --------------------------------------------------

router.get("/callback", async (req, res) => {
  const redirectWithError = (code) =>
    res.redirect(
      `${clientUrl()}/github?github_error=${encodeURIComponent(code)}`
    );

  try {
    const {
      code,
      state,
      error,
    } = req.query;

    if (error) {
      return redirectWithError(
        "github_authorization_denied"
      );
    }

    if (!code || !state) {
      return redirectWithError(
        "oauth_state_missing"
      );
    }

    const payload = jwt.verify(
      String(state),
      process.env.JWT_SECRET,
      {
        issuer: "devpulse",
        audience: "github-oauth",
      }
    );

    if (
      !payload.sub ||
      !payload.nonce ||
      payload.purpose !== "github_oauth"
    ) {
      return redirectWithError(
        "oauth_state_mismatch"
      );
    }

    if (!oauthConfigured()) {
      return redirectWithError(
        "oauth_not_configured"
      );
    }

    const tokenResponse = await fetch(
      "https://github.com/login/oauth/access_token",
      {
        method: "POST",

        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          client_id: process.env.GITHUB_CLIENT_ID,
          client_secret: process.env.GITHUB_CLIENT_SECRET,
          code: String(code),
          redirect_uri: callbackUrl(),
        }),
      }
    );

    const tokenData = await tokenResponse
      .json()
      .catch(() => ({}));

    if (!tokenResponse.ok || !tokenData.access_token) {
      throw new Error(
        tokenData.error_description ||
        tokenData.error ||
        "GitHub could not complete authorization."
      );
    }

    const githubUser = await githubFetch(
      "/user",
      tokenData.access_token
    );

    const encryptedToken = encryptToken(
      tokenData.access_token
    );

    const savedUser = await User.findByIdAndUpdate(
      payload.sub,
      {
        $set: {
          "github.id": githubUser.id,
          "github.login": githubUser.login,
          "github.avatarUrl": githubUser.avatar_url || "",
          "github.profileUrl": githubUser.html_url || "",
          "github.encryptedAccessToken": encryptedToken,
          "github.connectedAt": new Date(),
        },
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!savedUser) {
      throw new Error(
        "DevPulse user was not found while saving GitHub connection."
      );
    }

    await recordActivity({
      owner: payload.sub,
      action: "Connected GitHub account",
      target: `@${githubUser.login}`,
      type: "github",
      href: "/github",
    });

    return res.redirect(
      `${clientUrl()}/github?connected=1`
    );
  } catch (error) {
    console.error(
      "GitHub OAuth callback failed:",
      error.message
    );

    return redirectWithError(
      "oauth_failed_check_backend_logs"
    );
  }
});
// --------------------------------------------------
// CONNECTION STATUS
// GET /api/github/status
// --------------------------------------------------

router.get(
  "/status",
  requireAuth,
  async (req, res, next) => {
    try {
      // Status uses the same decrypted token as the data endpoints.
      const { user, token } = await getAccess(req.user._id);

      return res.json({
        success: true,
        data: {
          configured: oauthConfigured(),
          connected: Boolean(token),

          account: token
            ? {
                id: user.github.id,
                login: user.github.login,
                avatarUrl: user.github.avatarUrl,
                profileUrl: user.github.profileUrl,
                connectedAt: user.github.connectedAt,
              }
            : null,
        },
      });
    } catch (error) {
      return next(error);
    }
  }
);

// --------------------------------------------------
// DISCONNECT GITHUB
// POST /api/github/disconnect
// --------------------------------------------------

router.post(
  "/disconnect",
  requireAuth,
  async (req, res, next) => {
    try {
      const { token } = await getAccess(req.user._id).catch(
        () => ({ token: null })
      );

      if (
        token &&
        process.env.GITHUB_CLIENT_ID &&
        process.env.GITHUB_CLIENT_SECRET
      ) {
        try {
          await fetch(
            `https://api.github.com/applications/${encodeURIComponent(
              process.env.GITHUB_CLIENT_ID
            )}/grant`,
            {
              method: "DELETE",

              headers: {
                Authorization: `Basic ${Buffer.from(
                  `${process.env.GITHUB_CLIENT_ID}:${process.env.GITHUB_CLIENT_SECRET}`
                ).toString("base64")}`,
                Accept: "application/vnd.github+json",
                "Content-Type": "application/json",
                "X-GitHub-Api-Version": "2022-11-28",
              },

              body: JSON.stringify({
                access_token: token,
              }),
            }
          );
        } catch (error) {
          console.warn(
            "GitHub token revocation could not be confirmed:",
            error.message
          );
        }
      }

      await User.findByIdAndUpdate(req.user._id, {
        $set: {
          "github.id": null,
          "github.login": "",
          "github.avatarUrl": "",
          "github.profileUrl": "",
          "github.encryptedAccessToken": "",
          "github.connectedAt": null,
        },
      });

      await recordActivity({
        owner: req.user._id,
        action: "Disconnected GitHub account",
        type: "github",
        href: "/github",
      });

      return res.json({
        success: true,
        message: "GitHub disconnected.",
      });
    } catch (error) {
      return next(error);
    }
  }
);

// --------------------------------------------------
// GITHUB REPOSITORIES
// GET /api/github/repos
// --------------------------------------------------

router.get(
  "/repos",
  requireAuth,
  async (req, res, next) => {
    try {
      const { user, token } = await getAccess(req.user._id);

      if (!token) {
        return res.status(409).json({
          success: false,
          message: "Connect GitHub first.",
        });
      }

      const page = Math.min(
        Math.max(Number(req.query.page) || 1, 1),
        10
      );

      const repos = await githubFetch(
        `/user/repos?sort=updated&per_page=100&page=${page}&affiliation=owner,collaborator,organization_member`,
        token
      );

      return res.json({
        success: true,

        data: {
          repos: repos.map((repo) => ({
            id: repo.id,
            name: repo.name,
            fullName: repo.full_name,
            description: repo.description,
            htmlUrl: repo.html_url,
            language: repo.language,
            visibility: repo.private ? "private" : "public",
            stars: repo.stargazers_count || 0,
            forks: repo.forks_count || 0,
            openIssues: repo.open_issues_count || 0,
            updatedAt: repo.updated_at,
            defaultBranch: repo.default_branch,
            owner: repo.owner?.login,
          })),

          account: user.github.login,
        },
      });
    } catch (error) {
      return next(error);
    }
  }
);

// --------------------------------------------------
// GITHUB PULL REQUESTS
// GET /api/github/pulls
// --------------------------------------------------

router.get(
  "/pulls",
  requireAuth,
  async (req, res, next) => {
    try {
      const { token } = await getAccess(req.user._id);

      if (!token) {
        return res.status(409).json({
          success: false,
          message: "Connect GitHub first.",
        });
      }

      const state = [
        "open",
        "closed",
        "all",
      ].includes(req.query.state)
        ? req.query.state
        : "open";

      const repos = await githubFetch(
        "/user/repos?sort=updated&per_page=30&page=1&affiliation=owner,collaborator,organization_member",
        token
      );

      const results = await Promise.allSettled(
        repos.map((repo) =>
          githubFetch(
            `/repos/${repo.full_name}/pulls?state=${state}&sort=updated&direction=desc&per_page=100`,
            token
          ).then((items) =>
            items.map((pull) => ({
              ...pull,
              repoFullName: repo.full_name,
            }))
          )
        )
      );

      const rawPulls = results
        .flatMap((result) =>
          result.status === "fulfilled"
            ? result.value
            : []
        )
        .sort(
          (a, b) =>
            new Date(b.updated_at) - new Date(a.updated_at)
        )
        .slice(0, 200);

      const triageItems = await GitHubTriage.find({
        owner: req.user._id,
        kind: "pull_request",
      }).lean();

      const triageByPull = new Map(
        triageItems.map((item) => [
          `${item.repoFullName}#${item.number}`,
          item,
        ])
      );

      const pulls = rawPulls.map((pull) => {
        const triage = triageByPull.get(
          `${pull.repoFullName}#${pull.number}`
        );

        return {
          id: pull.id,
          number: pull.number,
          title: pull.title,
          url: pull.html_url,
          repoFullName: pull.repoFullName,
          state: pull.state,
          createdAt: pull.created_at,
          updatedAt: pull.updated_at,
          comments: pull.comments || 0,

          labels: (pull.labels || []).map(
            (label) => label.name
          ),

          isDraft: Boolean(pull.draft),
          priority: triage?.priority || "medium",
          triageStatus: triage?.triageStatus || "backlog",
          note: triage?.note || "",
        };
      });

      return res.json({
        success: true,

        data: {
          pulls,
          total: pulls.length,
          repositoryCount: repos.length,

          partial: results.some(
            (result) => result.status === "rejected"
          ),
        },
      });
    } catch (error) {
      return next(error);
    }
  }
);

// --------------------------------------------------
// GITHUB COMMITS
// GET /api/github/commits?repo=owner/repository
// --------------------------------------------------

router.get(
  "/commits",
  requireAuth,
  async (req, res, next) => {
    try {
      const repo = String(req.query.repo || "");

      if (!/^[\w.-]+\/[\w.-]+$/.test(repo)) {
        return res.status(400).json({
          success: false,
          message: "Choose a valid repository.",
        });
      }

      const { token } = await getAccess(req.user._id);

      if (!token) {
        return res.status(409).json({
          success: false,
          message: "Connect GitHub first.",
        });
      }

      const commits = await githubFetch(
        `/repos/${repo}/commits?per_page=30`,
        token
      );

      return res.json({
        success: true,

        data: {
          commits: commits.map((commit) => ({
            sha: commit.sha,
            shortSha: commit.sha.slice(0, 7),

            message:
              commit.commit?.message?.split("\n")[0] ||
              "Commit",

            author:
              commit.commit?.author?.name ||
              commit.author?.login ||
              "Unknown",

            date:
              commit.commit?.author?.date ||
              commit.commit?.committer?.date,

            url: commit.html_url,
            avatarUrl: commit.author?.avatar_url || "",
          })),
        },
      });
    } catch (error) {
      return next(error);
    }
  }
);

// --------------------------------------------------
// GITHUB ACTIVITY
// GET /api/github/events
// --------------------------------------------------

router.get(
  "/events",
  requireAuth,
  async (req, res, next) => {
    try {
      const { user, token } = await getAccess(req.user._id);

      if (!token) {
        return res.status(409).json({
          success: false,
          message: "Connect GitHub first.",
        });
      }

      const events = await githubFetch(
        `/users/${encodeURIComponent(
          user.github.login
        )}/events?per_page=30`,
        token
      );

      return res.json({
        success: true,

        data: {
          events: events.map((event) => ({
            id: event.id,
            type: event.type,
            repo: event.repo?.name || "",
            createdAt: event.created_at,

            action:
              event.payload?.action ||
              event.type.replace(/Event$/, ""),

            ref: event.payload?.ref || "",

            url:
              event.payload?.pull_request?.html_url ||
              event.payload?.issue?.html_url ||
              `https://github.com/${
                event.repo?.name || user.github.login
              }`,
          })),
        },
      });
    } catch (error) {
      return next(error);
    }
  }
);
// --------------------------------------------------
// CREATE / UPDATE GITHUB TRIAGE
// POST /api/github/triage
// --------------------------------------------------

router.post(
  "/triage",
  requireAuth,
  async (req, res, next) => {
    try {
      const repoFullName = String(
        req.body?.repoFullName || ""
      );

      const number = Number(req.body?.number);

      const kind =
        req.body?.kind === "issue"
          ? "issue"
          : "pull_request";

      const title = String(
        req.body?.title || ""
      )
        .trim()
        .slice(0, 300);

      const url = String(req.body?.url || "");

      if (
        !/^[\w.-]+\/[\w.-]+$/.test(repoFullName) ||
        !Number.isInteger(number) ||
        number < 1 ||
        !title ||
        !/^https:\/\/github\.com\//.test(url)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Repository, number, title, and a valid GitHub URL are required.",
        });
      }

      const priority = [
        "low",
        "medium",
        "high",
        "urgent",
      ].includes(req.body?.priority)
        ? req.body.priority
        : "medium";

      const triageStatus = [
        "backlog",
        "planned",
        "in-progress",
        "done",
        "ignored",
      ].includes(req.body?.triageStatus)
        ? req.body.triageStatus
        : "backlog";

      const item = await GitHubTriage.findOneAndUpdate(
        {
          owner: req.user._id,
          repoFullName,
          number,
          kind,
        },
        {
          owner: req.user._id,
          repoFullName,
          number,
          kind,
          title,
          url,
          priority,
          triageStatus,
          note: String(req.body?.note || "").slice(0, 1000),
        },
        {
          new: true,
          upsert: true,
          runValidators: true,
          setDefaultsOnInsert: true,
        }
      );

      await recordActivity({
        owner: req.user._id,
        actorName: req.user.name,
        action: "Updated GitHub triage",
        target: `${repoFullName} #${number}: ${title}`,
        type: "github",
        href: "/github",
        metadata: {
          priority,
          triageStatus,
        },
      });

      return res.json({
        success: true,
        data: { item },
      });
    } catch (error) {
      return next(error);
    }
  }
);

// --------------------------------------------------
// CREATE DEV PULSE TASK FROM GITHUB PR
// POST /api/github/create-task
// --------------------------------------------------

router.post(
  "/create-task",
  requireAuth,
  async (req, res, next) => {
    try {
      const repoFullName = String(
        req.body?.repoFullName || ""
      );

      const number = Number(req.body?.number);

      const title = String(
        req.body?.title || ""
      )
        .trim()
        .slice(0, 160);

      const url = String(req.body?.url || "");

      const projectId = String(
        req.body?.projectId || ""
      );

      if (
        !/^[\w.-]+\/[\w.-]+$/.test(repoFullName) ||
        !Number.isInteger(number) ||
        number < 1 ||
        !title ||
        !/^https:\/\/github\.com\//.test(url)
      ) {
        return res.status(400).json({
          success: false,
          message: "A valid GitHub pull request is required.",
        });
      }

      if (!/^[a-f\d]{24}$/i.test(projectId)) {
        return res.status(400).json({
          success: false,
          message: "Choose a valid project.",
        });
      }

      const project = await Project.findOne({
        _id: projectId,
        $or: [
          { owner: req.user._id },
          { members: req.user._id },
        ],
      });

      if (!project) {
        return res.status(404).json({
          success: false,
          message:
            "Project not found or you do not have access.",
        });
      }

      const description =
        `GitHub pull request: ${url}\n` +
        `Repository: ${repoFullName}\n` +
        `PR: #${number}`;

      const existing = await Task.findOne({
        project: project._id,
        description,
      });

      if (existing) {
        return res.status(409).json({
          success: false,
          message:
            "A task for this pull request already exists in the selected project.",
        });
      }

      const priority = [
        "urgent",
        "high",
      ].includes(req.body?.priority)
        ? "high"
        : req.body?.priority === "low"
          ? "low"
          : "medium";

      const task = await Task.create({
        title: `Review PR #${number}: ${title}`.slice(
          0,
          180
        ),
        description,
        status: "todo",
        priority,
        project: project._id,
        owner: req.user._id,
      });

      await task.populate("project", "name color");
      await task.populate("owner", "name email");

      await recordActivity({
        owner: req.user._id,
        actorName: req.user.name,
        action: "Created task from GitHub PR",
        target: `${repoFullName} #${number}`,
        type: "github",
        href: "/tasks",
        metadata: {
          taskId: String(task._id),
          url,
        },
      });

      return res.status(201).json({
        success: true,
        data: { task },
      });
    } catch (error) {
      return next(error);
    }
  }
);

// --------------------------------------------------
// GET SAVED TRIAGE ITEMS
// GET /api/github/triage
// --------------------------------------------------

router.get(
  "/triage",
  requireAuth,
  async (req, res, next) => {
    try {
      const items = await GitHubTriage.find({
        owner: req.user._id,
      })
        .sort({ updatedAt: -1 })
        .limit(200)
        .lean();

      return res.json({
        success: true,
        data: { items },
      });
    } catch (error) {
      return next(error);
    }
  }
);

// --------------------------------------------------
// DELETE TRIAGE ITEM
// DELETE /api/github/triage/:id
// --------------------------------------------------

router.delete(
  "/triage/:id",
  requireAuth,
  async (req, res, next) => {
    try {
      if (!/^[a-f\d]{24}$/i.test(req.params.id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid triage item ID.",
        });
      }

      const item = await GitHubTriage.findOneAndDelete({
        _id: req.params.id,
        owner: req.user._id,
      });

      if (!item) {
        return res.status(404).json({
          success: false,
          message: "Triage item not found.",
        });
      }

      return res.json({
        success: true,
        message: "Triage item removed.",
      });
    } catch (error) {
      return next(error);
    }
  }
);

export default router;