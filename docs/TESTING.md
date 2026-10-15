# DevPulse manual verification checklist

Run `npm run dev` after configuring MongoDB and the environment variables.

## Core workspace
- Register an account, log out, and log back in.
- Create a project and tasks with different statuses, priorities, and due dates.
- Change a task status and verify the dashboard analytics refresh.
- Check Calendar and select a date containing a due task.
- Search for at least two characters from a task/project title and description.

## Notifications and activity
- Create, update, complete, and delete a task; verify an activity record and notification are created.
- Create or update a project and verify the activity feed.
- Open the header bell, mark one notification read, then mark all read.
- Verify one user's notifications are not visible from another account.

## GitHub OAuth and repository views
- Configure a GitHub OAuth App with callback `http://localhost:5000/api/github/callback`.
- Sign in to DevPulse, open GitHub, and connect the account.
- Verify the GitHub username and avatar are displayed.
- Open Repositories, select one, and verify recent commits load.
- Open Pull request triage; change a PR priority and DevPulse status, refresh, and verify they persist.
- Select a DevPulse project and create a task from a PR; verify it appears in Tasks.
- Disconnect GitHub and verify the page returns to the connect state.

## Team
- Create a second DevPulse account.
- As the first account, add the second account's email to a project.
- Sign in as the second account and verify the shared project and tasks are visible.
- Verify only project owners can add/remove members and that users cannot see unrelated projects.

## Build and security
- Run `npm run build`.
- Check the browser console and both terminal windows for errors.
- Verify `.env` files, OAuth secrets, MongoDB URLs, JWT secrets, and tokens are not committed.
- Test that protected endpoints return 401 when signed out.
