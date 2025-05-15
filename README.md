# Todo List App 📝

A full-stack Todo List application with filtering, sorting, and timestamp tracking.

- **Frontend**: React + Tailwind CSS
- **Backend**: Node.js + Express.js
- **Database**: ~~SQLite~~ → PostgreSQL

---

## Features

- Add, edit, and delete tasks
- Mark tasks as completed
- Sort and filter by task, completion, created/updated date
- Tracks `created_at` and `updated_at` timestamps
- Simple confirmation before deleting a task
- Fully responsive dark-themed UI

---

## Getting Started

### Prerequisites

- Node.js and npm installed
- PostgreSQL installed and running

---

### Installation

```bash
# Clone the repository
git clone https://github.com/makoik/todo-app.git

# Navigate to the project root
cd todo-app

# Install backend dependencies
cd api
npm install

# Create dbConfig.js in api/:

// dbConfig.js
module.exports = {
  user: 'your_username',
  host: 'localhost',
  database: 'todo_app',
  password: 'your_password',
  port: 5432,
};

# Be sure the database todo_app exists. You can create it with:

psql -U postgres
CREATE DATABASE todo_app;


# Start backend (in /api)
node index.js

# Open a new terminal and start frontend (in /frontend)
cd ../frontend
npm install
npm run dev
