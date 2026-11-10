# DevPulse

**A full-stack developer workspace for projects, tasks, team collaboration, and GitHub activity.**

- Live frontend: https://devpulse-flax-two.vercel.app
- Backend API: https://devpulse-kr3o.onrender.com
- Source repository: https://github.com/Sujaltonge384/Devpulse

## Features

- Authentication with JWT bearer tokens and secure HTTP-only cookies.
- Project creation, task management, priorities, due dates, and dashboard analytics.
- Shared projects: add existing DevPulse accounts by email, view collaborators, leave a project, and collaborate on shared tasks.
- GitHub OAuth connection, repository browsing (including private repositories when the `repo` scope is approved), commits, pull requests, activity, triage, and PR-to-task creation.
- Notifications, activity history, workspace search, calendar, and Help Center.
- Responsive React interface.

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, React Router |
| API state | Redux Toolkit Query |
| Backend | Node.js, Express |
| Database | MongoDB, Mongoose |
| Authentication | JWT, bcrypt, HTTP-only cookies |
| GitHub integration | GitHub OAuth and REST API |
| Hosting | Vercel (frontend), Render (backend) |

## Run locally

### Requirements

- Node.js 20 LTS or newer
- npm
- MongoDB Atlas or a local MongoDB instance
- Git

### 1. Install dependencies

From the repository root:

```bash
npm install
npm install --prefix client
npm install --prefix server