x<div align="center">

# DevPulse

### A full-stack workspace for managing projects, tasks, and developer activity.

**Plan smarter. Build better. Stay in sync.**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Visit%20DevPulse-6C5CE7?style=for-the-badge&logo=vercel&logoColor=white)](https://devpulse-flax-two.vercel.app)
[![React](https://img.shields.io/badge/Frontend-React-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![Express](https://img.shields.io/badge/Backend-Express-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/Database-MongoDB-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://www.mongodb.com/)

</div>

---

## 📌 Overview

**DevPulse** is a full-stack project and task management web application built to bring everyday development work into one workspace. It provides a dashboard and dedicated areas for projects, tasks, team workflows, notifications, activity, search, and GitHub-related features.

The project demonstrates full-stack application development, API integration, authentication flows, database-backed features, and deployment of a React frontend and Express backend.

- **Live application:** [devpulse-flax-two.vercel.app](https://devpulse-flax-two.vercel.app)
- **Backend API:** [devpulse-kr3o.onrender.com](https://devpulse-kr3o.onrender.com)
- **Repository:** [Sujaltonge384/Devpulse](https://github.com/Sujaltonge384/Devpulse)

## 🖼️ Screenshots

> Add screenshots captured from your running application to `docs/screenshots/` using the filenames below. These image paths are placeholders until you add the real screenshots.

### Dashboard
<img width="1900" height="976" alt="image" src="https://github.com/user-attachments/assets/a45bf8af-7309-4733-8b8d-af06260f30cc" />

### Projects
<img width="1911" height="990" alt="image" src="https://github.com/user-attachments/assets/3155985d-9d46-43ea-818b-f02399b7a737" />

### Task Management
<img width="1917" height="986" alt="image" src="https://github.com/user-attachments/assets/31c37349-023d-4d51-a440-430457154772" />

### GitHub workspace
<img width="1917" height="986" alt="image" src="https://github.com/user-attachments/assets/5052e0a2-fd83-4f57-839a-c845e8c381c7" />

### Notifications & activity
<img width="1916" height="987" alt="image" src="https://github.com/user-attachments/assets/c53bf6bd-b1ef-4002-b764-cd10ffc19e0f" />

### Help Center
<img width="1892" height="991" alt="image" src="https://github.com/user-attachments/assets/92e4162e-98b5-4fa3-9b90-8f376ca5169f" />

### How to add screenshots

1. Open your local or deployed DevPulse website.
2. Capture the Dashboard, Projects, Tasks, and Help Center pages.
3. Create `docs/screenshots/` in the repository.
4. Save the images as `dashboard.png`, `projects.png`, `tasks.png`, and `help-center.png`.
5. Commit and push the images. GitHub will then render them in this README.

**Tip:** Use consistent screenshot dimensions and hide personal information, credentials, tokens, and other private data.

## ✨ Features

- **Dashboard:** Central overview of projects, tasks, and recent activity.
- **Project management:** Create, view, and organize projects.
- **Task management:** Manage tasks and access project-specific task views.
- **Authentication:** Login and account-session flows.
- **Team area:** Access team-related workflows available in the application.
- **GitHub area:** Dedicated area for GitHub-related development workflows.
- **Notifications and activity:** Review application notifications and recorded activity.
- **Search:** Find relevant information through the application's search interface.
- **Help Center:** Search help articles, browse categories, and expand frequently asked questions.
- **Responsive interface:** Designed for desktop and smaller screens.
- **Deployed architecture:** React frontend on Vercel, Express API on Render, and MongoDB database.

*Feature availability depends on the current implementation and configuration of the deployed application.*

## 🧰 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React |
| Client-side routing | React Router |
| API and server-state integration | Redux Toolkit / RTK Query |
| Backend | Node.js, Express.js |
| Database | MongoDB |
| Frontend hosting | Vercel |
| Backend hosting | Render |
| Version control | Git and GitHub |

## 🏗️ Architecture

```text
User's Browser
      |
      v
React Frontend (Vercel)
      |
      | HTTP requests / API calls
      v
Express REST API (Render)
      |
      v
MongoDB Database
```

The frontend communicates with the backend through API requests. The backend handles server-side routes and database operations.

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (an active LTS version is recommended)
- npm
- A MongoDB database, such as a local instance or MongoDB Atlas
- Git

### 1. Clone the repository

```bash
git clone https://github.com/Sujaltonge384/Devpulse.git
cd Devpulse
```

### 2. Configure the backend

```bash
cd server
npm install
```

Create a `.env` file inside `server/`. A typical configuration may look like this:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=replace_with_a_long_random_secret
CLIENT_URL=http://localhost:5173
```

These are example settings. Confirm the exact environment variable names in your server code before running the app. Never commit real database credentials, JWT secrets, or API keys.

Start the backend with a script defined in `server/package.json`. For example, if a `dev` script exists:

```bash
npm run dev
```

### 3. Configure the frontend

Open a second terminal from the repository root:

```bash
cd client
npm install
```

Create or update `client/.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

The variable must match the API base URL expected by the application. Vite exposes `VITE_` variables to client-side code, so never put secrets in frontend environment variables.

Start the frontend with the script defined in `client/package.json`. For a typical Vite setup:

```bash
npm run dev
```

Open the local URL printed in the terminal, commonly `http://localhost:5173`.

### 4. Verify the application

- Confirm the backend starts without errors.
- Confirm the frontend loads.
- Test login and logout.
- Test project and task workflows.
- Check the browser console and Network panel if an API request fails.

## 🌐 Deployment

- **Frontend:** [https://devpulse-flax-two.vercel.app](https://devpulse-flax-two.vercel.app)
- **Backend:** [https://devpulse-kr3o.onrender.com](https://devpulse-kr3o.onrender.com)

For production, configure the frontend API URL in Vercel to point to the deployed backend:

```env
VITE_API_URL=https://devpulse-kr3o.onrender.com/api
```

Configure backend environment variables in Render, including the database connection string and authentication secret. Ensure the backend CORS allowlist includes the production frontend domain. Redeploy after changing environment variables.

## 🔐 Security Notes

- Keep `.env` files out of Git.
- Use strong, unique authentication secrets.
- Never expose MongoDB credentials, JWT secrets, or private tokens in frontend code.
- Restrict database access and configure CORS for trusted origins.
- Do not include real user credentials or private account data in screenshots.

## 🗺️ Potential Improvements

- Automated tests for important frontend and API flows.
- More detailed project and task filtering.
- Clear loading, empty, and error states.
- A dedicated support/contact workflow.
- CI checks for linting and tests.
- Improved accessibility and keyboard navigation.

## 🤝 Contributing

Contributions and suggestions are welcome.

1. Fork the repository.
2. Create a branch for your change.
3. Make and test your changes.
4. Open a pull request describing the improvement.

For bugs, include the affected page, steps to reproduce, and the error message. Never include secrets or private credentials.

## 📄 License

No license has been specified in this README. Add a `LICENSE` file and update this section if you intend to distribute the project under a particular open-source license.

---

<div align="center">

**Built as a full-stack development project.**

[Live Demo](https://devpulse-flax-two.vercel.app) · [GitHub Repository](https://github.com/Sujaltonge384/Devpulse)

</div>
