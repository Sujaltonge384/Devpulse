# DevPulse manual verification checklist

Run the frontend and backend after installing dependencies and configuring `server/.env` and `client/.env`.

## Startup and authentication

- Confirm `GET http://localhost:5000/api/health` returns JSON and reports the database as connected.
- Register a new account, sign out, and sign in again with the same email/password.
- Confirm `/api/auth/me` returns the signed-in user after login.
- Confirm a wrong password returns `401` with `Invalid email or password.`
- Change `JWT_SECRET` only when intended; changing it invalidates existing sessions. Sign in again after changing it.

## Projects and tasks

- Create two projects and tasks with different statuses, priorities, and due dates.
- Update a task status and confirm the dashboard refreshes.
- Confirm the calendar shows due dates and search finds project/task titles.
- Confirm users cannot open or change projects they do not own or belong to.

## Team collaboration

1. Register a second DevPulse account with a different email.
2. Sign in as the first account and create a project.
3. Add the second account using its registered email from the Team page.
4. Sign in as the second account and confirm the shared project appears in Team and Projects.
5. Create a task as the second account; confirm both members can see it.
6. Update the shared task as either member; confirm the change is visible to both.
7. Confirm only the task creator or project owner can delete that task.
8. Confirm only the project owner can add/remove members and a member can leave a project.
9. Remove a member and confirm the removed account no longer sees that project's tasks.

## GitHub OAuth and integration

- Set `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, and `GITHUB_TOKEN_ENCRYPTION_KEY` in the backend environment.
- Set `GITHUB_CALLBACK_URL` to exactly the callback URL saved in the GitHub OAuth App.
- Set `CLIENT_URL` to the frontend origin, without `/api` or a trailing slash.
- Sign in to DevPulse, open GitHub, and connect the account.
- Confirm the GitHub username and avatar appear.
- Confirm repositories load. If private repositories should appear, approve the `repo` scope.
- Select a repository and confirm recent commits load.
- Open pull request triage, change a PR priority/status, refresh, and confirm the values persist.
- Select a project and create a task from a PR; confirm the task appears in Tasks.
- Disconnect GitHub and confirm the page returns to the connect state.

## Deployment

- Set Vercel `VITE_API_URL` to the Render API URL ending in `/api`.
- Set Render `CLIENT_URL` to the Vercel frontend origin.
- Set Render `GITHUB_CALLBACK_URL` to `https://<render-service>.onrender.com/api/github/callback` and copy that exact URL into the production GitHub OAuth App.
- Set `NODE_ENV=production` on Render and configure the MongoDB, JWT, GitHub OAuth, and encryption environment variables.
- Refresh `/github` and `/team` directly in the deployed app to verify SPA rewrites.

## Security and regression checks

- Confirm `.env` files and `node_modules` are not included in the project archive or committed to Git.
- Confirm no GitHub token, Client Secret, JWT secret, or MongoDB connection string appears in frontend files.
- Confirm protected routes return `401` when no valid session is supplied.