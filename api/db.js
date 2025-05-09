const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./todo.db');

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS todos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        task TEXT NOT null,
        completed INTEGER DEFAULT 0,
        created_at TEXT
    )`);

    db.run(`ALTER TABLE todos ADD COLUMN updated_at TEXT`, err => {
        if (err && !err.message.includes('duplicate column name')) {
            console.error('Error adding updated_at column: ', err.message);
        }
    });
});

// Get all to-do's
function getTodos(filter = {}, callback) {
    let sql = 'SELECT * FROM todos';
    const params = [];
    const conditions = [];

    if (filter.completed !== undefined) {
        conditions.push('completed = ?');
        params.push(filter.completed ? 1 : 0);
    }

    if (filter.date) {
        conditions.push('DATE(created_at) = DATE(?)');
        params.push(filter.date);
    }

    if (conditions.length > 0) {
        sql += ' WHERE ' + conditions.join(' AND ');
    }

    const allowedSortFields = ['task', 'completed', 'created_at', 'updated_at'];
    const allowedOrder = ['ASC', 'DESC'];
    
    // default sort values
    let sortField = allowedSortFields.includes(filter.sort_by) ? filter.sort_by : 'created_at';
    let sortOrder = allowedOrder.includes(filter.order?.toUpperCase()) ? filter.order.toUpperCase() : 'ASC';
  
    sql += ` ORDER BY ${sortField} ${sortOrder}`;

    db.all(sql, params, callback);
}

// Add a new to-do
function createTodo(task, completed, callback) {
    const timestamp = new Date().toISOString();
    const completedInt = completed ? 1 : 0;
    console.log(`Inserting todo:`, { task, completedInt });
    db.run('INSERT INTO todos (task, completed, created_at, updated_at) VALUES (?, ?, ?, ?)', [task, completedInt, timestamp, timestamp], function(err) {
        if (err) {
            console.error('Error inserting todo:', err.message);
            return callback(err);
        }
        callback(null, { id: this.lastID, task, completed: completedInt, created_at: timestamp, updated_at: timestamp });
    });
}

function updateTodo(id, updatedFields, callback) {
    const { task, completed } = updatedFields;
    const timestamp = new Date().toISOString();

    // Dynamic query parts
    const updates = [];
    const values = [];

    if (task !== undefined) {
        updates.push('task = ?');
        values.push(task);
    }

    if (completed !== undefined) {
        updates.push('completed = ?');
        values.push(completed ? 1 : 0); // Forces a boolean to integer (SQLite handles booleans only as integers)
    }

    if (updates.length === 0) {
        return callback(new Error('No fields provided to update'));
    }

    updates.push('updated_at = ?');
    values.push(timestamp);
    values.push(id); // for WHERE clause

    const sql = `UPDATE todos SET ${updates.join(', ')} WHERE id = ?`;

    db.run(sql, values, function(err) {
        if (err) return callback(err);
        callback(null, { id, ...updatedFields, updated_at: timestamp });
    });
}

function deleteTodo(id, callback) {
    db.run('DELETE FROM todos WHERE id = ?', [id], function(err) {
        if (err) return callback(err);
        callback(null, { deleted: this.changes > 0 });
    });
}


module.exports = {
    db,
    getTodos,
    createTodo,
    updateTodo,
    deleteTodo
};