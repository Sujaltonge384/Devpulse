# DevPulse API

Base URL: `http://localhost:5000/api`

Most endpoints require the `devpulse_token` HTTP-only cookie.

## Authentication
- `POST /auth/register` — create an account
- `POST /auth/login` — sign in
- `GET /auth/me` — current user
- `POST /auth/logout` — clear the session cookie

## Projects and tasks
- `GET|POST /projects`
- `PATCH|DELETE /projects/:id`
- `GET|POST /tasks` (supports `projectId`, `status`, `priority`, `search` query filters)
- `PATCH|DELETE /tasks/:id`
- `GET /dashboard`

## Notifications and activity
- `GET /notifications?limit=30` — notification list and unread count
- `PATCH /notifications/:id/read` — mark one notification read
- `POST /notifications/read-all` — mark all notifications read
- `DELETE /notifications/:id`
- `GET /activity?limit=50&type=task|project|github|team|system`

## Search and calendar
- `GET /search?q=term` — project/task search results
- Calendar uses `GET /tasks`; the UI groups tasks with due dates by day.

## GitHub
- `GET /github/status` — OAuth configuration and connection status
- `GET /github/connect` — returns a GitHub authorization URL
- `GET /github/callback` — OAuth callback (browser redirect)
- `POST /github/disconnect`
- `GET /github/repos?page=1`
- `GET /github/pulls?state=open|closed|all`
- `GET /github/commits?repo=owner/name`
- `GET /github/events`
- `POST /github/create-task` — create a DevPulse task from a GitHub pull request and selected project
- `GET /github/triage`
- `POST /github/triage` — save DevPulse-only priority/status/note for a GitHub issue or PR
- `DELETE /github/triage/:id`

## Team
- `GET /team` — projects and collaborators visible to the signed-in user
- `POST /team/projects/:id/members` with `{ "email": "existing-user@example.com" }`
- `DELETE /team/projects/:id/members/:memberId`

## Health
- `GET /health`
