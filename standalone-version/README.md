# TodoApp (Standalone Version)

A lightweight desktop todo app built with **Electron**, **React**, and **Vite**.
Saves your data locally in a JSON file.
Comes with both an installer and a portable `.exe` version — no internet or external services required.

---

## 🔹 What it does

- Add / check off / delete tasks
- Saves tasks in a local `.json` file
- Works completely offline
- Lightweight and simple

---

## 🛠 How to run it (dev mode)

First, clone the full repo and go into the Electron app folder:

```bash
git clone https://github.com/makoik/todo-app.git
cd todo-app/standalone-version
npm install
```

Then run it like this:

```bash
npm run dev      # starts Vite dev server
npm run start    # opens the app in Electron
```
## 🏗 How to build it

To create the installer and portable version:
```bash
npm run dist
```
After it's done, you'll find:

    TodoApp Setup.exe (the installer)

    TodoApp 1.0.0 Portable.exe (portable version)

Both are inside the dist/ folder.


## 💾 Where it saves your data

Your tasks are stored in a tabledata.json file:

    Portable version: saves next to the .exe, inside a data/ folder

    Installed version: saves inside the app’s resources/data/ folder

## ⚠️ Just FYI

    This is a practice project — not production-ready

    There’s no sync, backup, or encryption

    If you delete the data/tabledata.json file, your tasks are gone