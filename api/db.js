const { Pool } = require('pg');
const dbConfig = require('./dbConfig');
const pool = new Pool(dbConfig);

async function setupDatabase() {
    try {
        await pool.query(`
                CREATE TABLE IF NOT EXISTS todos (
                    id SERIAL PRIMARY KEY,
                    task TEXT NOT NULL,
                    completed BOOLEAN DEFAULT false,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                `);
            
            const result = await pool.query(`
                SELECT column_name
                FROM information_schema.columns
                WHERE table_name = 'todos' AND column_name = 'updated_at'
                `);

            if (result.rows.length === 0) {
                await pool.query('ALTER TABLE todos ADD COLUMN updated_at TIMESTAMP');
            }
        } catch (err) {
            console.error('Error setting up the database:', err.message);
        }
    }
setupDatabase();

// Get all to-do's
async function getTodos(filter = {}) {
    const conditions = [];
    const params = [];

    if (filter.completed !== undefined) {
        conditions.push(`completed = $${params.lenght + 1}`);
        params.push(filter.completed);
    }

    if (filter.date) {
        conditions.push(`DATE(created_at) = DATE($${params.length + 1})`);
        params.push(filter.date);
    }

    if (filter.task) {
        conditions.push(`task ILIKE $${params.length + 1}`); // ILIKE handles case-insensitive search
        params.push(`%${filter.task}%`);
    }

    if (filter.updated_at) {
        conditions.push(`DATE(updated_at) = DATE($${params.length + 1})`);
        params.push(filter.updated_at);
    }

    const allowedSortFields = ['task', 'completed', 'created_at', 'updated_at'];
    const allowedOrder = ['ASC', 'DESC'];

    const sortField = allowedSortFields.includes(filter.sort_by) ? filter.sort_by : 'created_at';
    const sortOrder = allowedOrder.includes(filter.order?.toUpperCase()) ? filter.order.toUpperCase() : 'ASC';

    let sql = 'SELECT * FROM todos';
    if (conditions.length > 0) {
        sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ` ORDER BY ${sortField} ${sortOrder}`;

    try {
        const result = await pool.query(sql, params);
        return result.rows;
    } catch (err) {
        console.error('Error fetching todos:', err.message);
        throw err;
    }
}

async function createTodo(task, completed) {
    const timestamp = new Date().toISOString();

    console.log(`Inserting todo:`, { task, completed });
    const sql = `
        INSERT INTO todos (task, completed, created_at, updated_at)
        VALUES ($1, $2, $3, $4)
        RETURNING id, task, completed, created_at, updated_at
        `;

    const params = [task, completed, timestamp, timestamp];

    try {
        const result = await pool.query(sql, params);
        return result.rows[0];
    } catch (err) {
        console.error('Error inserting todo:', err.message);
        throw err;
    }
}

async function updateTodo(id, updatedFields) {
    const { task, completed } = updatedFields;
    const timestamp = new Date().toISOString();

    const updates = [];
    const values = [];
    let index = 1;

    if (task !== undefined) {
        updates.push(`task = $${index++}`);
        values.push(task);
    }

    if (completed !== undefined) {
        updates.push(`completed = $${index++}`);
        values.push(completed);
    }

    if (updates.length === 0) {
        throw new Error('No fields provided to update');
    }

    updates.push(`updated_at = $${index++}`);
    values.push(timestamp);
    values.push(id); // for WHERE clause

    const sql = `
        UPDATE todos 
        SET ${updates.join(', ')} 
        WHERE id = $${index}
        RETURNING id, task, completed, created_at, updated_at
        `;

    try {
        const result = await pool.query(sql, values);
        return result.rows[0];
    } catch (err) {
        console.error('Error updating todo:', err.message);
        throw err;
    }
}

async function deleteTodo(id) {
    try {
        const result = await pool.query(
            'DELETE FROM todos WHERE id = $1 RETURNING id',
            [id]
        );

        return { deleted: result.rowCount > 0 };
    } catch (err) {
        console.error('Error deleting todo:', err.message);
        throw err;
    }
}

module.exports = {
    pool,
    getTodos,
    createTodo,
    updateTodo,
    deleteTodo
};