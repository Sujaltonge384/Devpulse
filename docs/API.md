# DevPulse API

Base URL: `http://localhost:5000/api`
Authentication uses an HTTP-only cookie named `devpulse_token`.

## Health
- `GET /health` — API and MongoDB connection status.

## Authentication
- `POST /auth/register` — `{ "name": "Ada", "email": "ada@example.com", "password": "at-least-8-characters" }`
- `POST /auth/login` — `{ "email": "ada@example.com", "password": "..." }`
- `GET /auth/me` — current account (authenticated)
- `POST /auth/logout` — clears the cookie

## Projects (authenticated)
- `GET /projects`
- `POST /projects` — `{ "name": "Website", "description": "...", "color": "violet" }`
- `PATCH /projects/:id` — accepts `name`, `description`, `color`, `status`
- `DELETE /projects/:id` — deletes the project and its tasks

## Tasks (authenticated)
- `GET /tasks?status=todo&priority=high&projectId=...&search=design`
- `POST /tasks` — `{ "title": "Design hero", "project": "<project id>", "priority": "medium", "status": "todo" }`
- `PATCH /tasks/:id` — accepts `title`, `description`, `status`, `priority`, `dueDate`
- `DELETE /tasks/:id`

## Dashboard
- `GET /dashboard` — counts and recent tasks for the current user.

All private routes scope reads and mutations to the authenticated owner.
