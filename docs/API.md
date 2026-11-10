# DevPulse API

Local base URL: `http://localhost:5000/api`  
Production base URL: `https://devpulse-kr3o.onrender.com/api`

Protected endpoints accept the `Authorization: Bearer <token>` header. The API also sets and accepts the `devpulse_token` HTTP-only cookie for browser sessions. Browser requests must include credentials.

## Health

- `GET /health` — API and MongoDB connection status.

## Authentication

- `POST /auth/register` — `{ "name": "Ada", "email": "ada@example.com", "password": "at-least-8-characters" }`
- `POST /auth/login` — `{ "email": "ada@example.com", "password": "..." }`
- `GET /auth/me` — current account.
- `POST /auth/logout` — invalidates the current JWT version and clears the session cookie.

## Projects and tasks

- `GET /projects` — projects owned by or shared with the signed-in user.
- `POST /projects` — create a project.
- `PATCH /projects/:id` — update a project (owner only).
- `DELETE /projects/:id` — delete a project and its tasks (owner only).
- `GET /tasks?status=todo&priority=high&projectId=<id>&search=design` — tasks in accessible projects.
- `POST /tasks` — create a task in an owned/shared project.
- `PATCH /tasks/:id` — update a task in an accessible project.
- `DELETE /tasks/:id` — delete a task (creator or project owner only).
- `GET /dashboard` — summary metrics and recent tasks across accessible projects.

## Team

- `GET /team` — projects and collaborators visible to the signed-in user.
- `POST /team/projects/:id/members` — add an existing DevPulse account using `{ "email": "existing-user@example.com" }` (owner only).
- `DELETE /team/projects/:id/members/:memberId` — remove a member (owner only).
- `POST /team/projects/:id/leave` — leave a shared project (member only).

## GitHub

- `GET /github/status` — OAuth configuration and connection status.
- `GET /github/connect` — return the GitHub authorization URL.
- `GET /github/callback` — OAuth callback (browser redirect).
- `POST /github/disconnect` — revoke/clear the stored connection.
- `GET /github/repos?page=1` — accessible repositories.
- `GET /github/pulls?state=open|closed|all` — pull requests from recently updated accessible repositories.
- `GET /github/commits?repo=owner/name` — recent commits for a repository.
- `GET /github/events` — recent public GitHub account events.
- `GET /github/triage` — saved DevPulse triage records.
- `POST /github/triage` — save DevPulse-only priority, status, and note for an issue/PR.
- `DELETE /github/triage/:id` — remove a saved triage record.
- `POST /github/create-task` — create a task from a pull request in an owned/shared project.

## Notifications, activity, and search

- `GET /notifications?limit=30` — notifications and unread count.
- `PATCH /notifications/:id/read` — mark one notification read.
- `POST /notifications/read-all` — mark all notifications read.
- `DELETE /notifications/:id` — delete a notification.
- `GET /activity?limit=50&type=task|project|github|team|system` — activity history.
- `GET /search?q=term` — search accessible projects and tasks.