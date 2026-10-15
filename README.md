# DevPulse — Developer Productivity Workspace

DevPulse is a full-stack developer workspace built with React, Vite, Redux Toolkit + RTK Query, Express, MongoDB, and Mongoose. It combines project/task planning with a GitHub activity workspace.

## Features

### Workspace
- Register/login with bcrypt-hashed passwords and JWT in HTTP-only cookies
- Dashboard statistics and workload analytics
- Create, edit, filter, search, and delete projects and tasks
- Kanban board and task list views
- Task status, priority, and due dates
- Calendar view of task deadlines
- Workspace search across task/project titles and descriptions
- Light/dark theme and responsive navigation

### Notifications and activity
- MongoDB-backed notifications with unread counts
- Mark one or all notifications as read
- Notification dropdown in the app header
- Activity feed for task, project, GitHub, and team events

### GitHub integration
- GitHub OAuth connection and disconnection
- Encrypted GitHub access token stored server-side (AES-256-GCM; key derived from `GITHUB_TOKEN_ENCRYPTION_KEY` or `JWT_SECRET`)
- Repository list with language, visibility, stars, forks, and update time
- Recent commits for a selected repository
- Pull requests across the latest 30 accessible repositories, capped at 200 displayed items
- Recent public GitHub events
- DevPulse-only PR prioritization and triage status (Urgent/High/Medium/Low and Backlog/Planned/In progress/Done/Ignored)

### Team collaboration
- Add existing DevPulse users to projects by email
- Shared projects and their tasks are visible to project members
- Only project owners can manage collaborators or edit/delete shared tasks in this MVP

## Requirements
- Node.js 20+ recommended (Node 20+ provides built-in `fetch`)
- npm
- MongoDB Atlas or local MongoDB
- A GitHub OAuth App for the GitHub integration

## 1. Install dependencies
From the project root:

```bash
npm run install:all
```

## 2. Configure the backend
Copy `server/.env.example` to `server/.env` and fill in your values. PowerShell:

```powershell
Copy-Item server/.env.example server/.env
```

Set at minimum:

```env
PORT=5000
CLIENT_URL=http://localhost:5173
MONGODB_URI=mongodb+srv://YOUR_USER:YOUR_PASSWORD@YOUR_CLUSTER/devpulse?retryWrites=true&w=majority
JWT_SECRET=use-a-long-random-secret-at-least-32-characters
NODE_ENV=development
```

### Configure GitHub OAuth
1. Open [GitHub Developer Settings](https://github.com/settings/developers) → **OAuth Apps** → **New OAuth App**.
2. Set **Homepage URL** to `http://localhost:5173`.
3. Set **Authorization callback URL** to `http://localhost:5000/api/github/callback`.
4. Copy the client ID and generate a client secret.
5. Add these to `server/.env`:

```env
GITHUB_CLIENT_ID=your_oauth_app_client_id
GITHUB_CLIENT_SECRET=your_oauth_app_client_secret
GITHUB_CALLBACK_URL=http://localhost:5000/api/github/callback
GITHUB_TOKEN_ENCRYPTION_KEY=use-a-different-long-random-secret
```

Restart the backend after changing `.env`. Never commit `.env` or expose the client secret/access token in frontend code.

**GitHub permissions and scope:** this starter requests `read:user user:email public_repo`. It is intended for public repository activity. GitHub's classic OAuth `public_repo` scope does not provide full private-repository access. For a production product that needs private repositories with least-privilege read-only permissions, prefer a GitHub App with explicit read-only repository contents, metadata, and pull-request permissions. Do not casually replace `public_repo` with the broad `repo` scope, because that grants much wider repository access.

## 3. Configure the frontend
`client/.env.example` contains:

```env
VITE_API_URL=http://localhost:5000/api
```

Copy it to `client/.env` if you need to override the default API URL.

## 4. Run DevPulse
From the root folder:

```bash
npm run dev
```

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`
- Health endpoint: `http://localhost:5000/api/health`

Or run the apps separately:

```bash
npm run dev:server
npm run dev:client
```

Register an account first. Task/project operations require a working MongoDB connection. GitHub integration additionally requires the OAuth environment variables above and a signed-in DevPulse account.

## 5. Build check

```bash
npm run build
```

## Important integration notes
- OAuth credentials are not included. You must create your own GitHub OAuth App and add credentials locally.
- Repository list and pull-request queries are limited to the latest 30 accessible repositories to stay within GitHub API limits; pull-request results are capped at 200.
- GitHub events are the public events endpoint; GitHub does not expose every private event in that feed.
- Commits load for the selected repository (up to 30).
- PR priority and triage status are DevPulse metadata; they do not change labels or priority in GitHub itself.
- Weekly productivity is estimated from task update timestamps; precise completion analytics would need a dedicated `completedAt` field.
- Team members can view shared projects and tasks, but task mutation/assignment permissions are intentionally owner-only in this MVP.
- This is a portfolio-ready starting point, not a deployed production service. Before production, add OAuth token revocation on disconnect, GitHub App support if private repo access is needed, automated tests, audit/security review, and deployment-specific cookie/CORS settings.

## Suggested next improvements
- GitHub App installation flow with least-privilege permissions and private repository support
- Create a DevPulse task from a GitHub issue or pull request
- Pull-request review-request tracking and CI/check status
- GitHub webhooks for near-real-time updates instead of polling
- Team invitations with accept/decline and task assignees
- Automated backend/API tests and frontend component tests
