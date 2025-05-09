const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const app = express();
const port = 3000;

const db = new sqlite3.Database('./todos.db');

app.use(express.json());

// Create Table
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS todos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task TEXT NOT NULL,
      completed INTEGER DEFAULT 0
    )
  `);
});

// CREATE
app.post('/todos', (req, res) => {
    const { task } = req.body;
    db.run(`INSERT INTO todos (task) VALUES (?)`, [task], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ id: this.lastID, task, completed: 0 });
    });
});

// READ
app.get('/todos', (req, res) => {
    db.all(`SELECT * FROM todos`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: message });
        res.json(rows);
    });
});

// UPDATE
app.put('/todos/:id', (req, res) => {
    const { task, completed } = req.body;
    db.run(
        `UPDATE todos SET task = ?, completed = ? WHERE id = ?`,
        [task, completed, req.params.id],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ updated: this.changes });
        }
    );
});

// DELETE
app.delete('/todos/:id', (req, res) => {
    db.run(`DELETE FROM todos WHERE id = ?`, [req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ deleted: this.changes });
    });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});