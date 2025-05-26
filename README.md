# Todo List App 📝



A full-stack local Todo List application with filtering, sorting, and timestamp tracking.  
Originally built with SQLite, now upgraded to PostgreSQL and enhanced with a local desktop GUI using Electron.

- **Frontend**: React (Vite) + Tailwind CSS
- **Backend**: Node.js + Express.js
- **Database**: PostgreSQL
- **Desktop App**: Electron (optional)
- **CLI (Legacy/Optional)**: Python + Rich + Typer
- **Standalone Version**: Electron + React Desktop App

---

## Features

- Add, edit, and delete tasks
- Mark tasks as completed
- Sort and filter tasks
- Track created_at and updated_at
- Responsive dark UI (Tailwind)
- Desktop version via Electron (optional)

---

## Getting Started

## 📁 Project Structure

```bash
todo-app/
├── api/                # Node.js backend (Express + PostgreSQL)
├── frontend/           # React frontend (Vite + TailwindCSS)
├── electron/           # Electron wrapper for local desktop app
└── python-cli/         # Legacy CLI interface (optional)
    └── todo-app.bat    # Quick launcher for local dev (optional)
```

### Prerequisites

- Node.js and npm installed
- PostgreSQL installed and running

---

### Installation

```bash
## Clone the repository
git clone https://github.com/makoik/todo-app.git

## Navigate to the project root
cd todo-app

## Set up the backend
cd api
npm install

## Create api/dbConfig.js with your PostgreSQL credentials:

// dbConfig.js
module.exports = {
  user: 'your_username',
  host: 'localhost',
  database: 'todo_app',
  password: 'your_password',
  port: 5432,
};

## Be sure the database todo_app exists. You can create it with:

psql -U postgres
CREATE DATABASE todo_app;


## Start backend (in /api)
cd api
node index.js

## Open a new terminal and start frontend (in /frontend)
cd ../frontend
npm install
npm run dev


# Running as Desktop App (Electron) — Optional
## Database still must be running separately

## Build the frontend
cd frontend
npm run build

## Run Electron
cd ../electron
npm install
npm start


# Optional: Python CLI
## If you're curious about running this from the terminal:
cd python-cli
pip install -r requirements.txt
python todo_cli.py