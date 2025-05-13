const express = require('express');
const cors = require('cors');
const { db, createTodo, updateTodo, deleteTodo } = require('./db');
const app = express();
const Joi = require('joi');
const PORT = 3000;

app.use(cors());
app.use(express.json());

// GET
app.get('/todos', async (req, res) => {
  const { completed, date, task, updated_at, sort_by, order } = req.query;

  const allowedSortFields = ['task', 'completed', 'created_at', 'updated_at'];
  const allowedOrder = ['ASC', 'DESC'];
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

  let conditions = [];
  let params = [];

  if (completed !== undefined) {
    if (completed !== 'true' && completed !== 'false') {
      return res.status(400).json({ error: 'completed must be true or false' });
    }
    conditions.push('completed = ?');
    params.push(completed === 'true' ? 1 : 0);
  }

  if (date) {
    if (!dateRegex.test(date)) {
      return res.status(400).json({ error: 'date must be in YYYY-MM-DD format' });
    }
    conditions.push('DATE(created_at) = DATE(?)');
    params.push(date);
  }

  if (updated_at) {
    if (!dateRegex.test(updated_at)) {
      return res.status(400).json({ error: 'updated_at needs to be in YYYY-MM-DD format' });
    }
    conditions.push('DATE(updated_at) = DATE(?)');
    params.push(updated_at);
  }

  if (task) {
    if (typeof task !== 'string') {
      return res.status(400).json({ error: 'task must a string' });
    }
    conditions.push('task LIKE ?');
    params.push(`%${task}%`);
  }

  let sql = 'SELECT * FROM todos';
  if (conditions.length > 0) {
    sql += ' WHERE ' + conditions.join(' AND ');
  }

  const sortField = allowedSortFields.includes(sort_by) ? sort_by : 'created_at';
  const sortOrder = allowedOrder.includes(order?.toUpperCase()) ? order.toUpperCase() : 'ASC';

  sql += ` ORDER BY ${sortField} ${sortOrder}`;

  try {
    const todos = await new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    const todosWithLocalTime = todos.map(todo => ({
      ...todo,
      created_at: new Date(todo.created_at).toLocaleString(),
      updated_at: new Date(todo.updated_at).toLocaleString()
    }));

    res.json(todosWithLocalTime);
  } catch (err) {
    console.error('Database query error: ', err);
    res.status(500).json({ error: 'Database error' });
  }
});


// POST
app.post('/todos', (req, res) => {
  console.log('Received POST /todos: ', req.body);

  const todoSchema = Joi.object({
    task: Joi.string().min(1).required(),
    completed: Joi.boolean().optional()
  });

  const { error, value } = todoSchema.validate(req.body);

  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  const completed = value.completed !== undefined ? value.completed : false;

  createTodo(value.task, completed, (err, newTodo) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json(newTodo);
  });
});

app.put('/todos/:id', (req, res) => {
  const updateSchema = Joi.object({
    task: Joi.string().optional(),
    completed: Joi.boolean().optional()
  }).min(1);

  const { error, value } = updateSchema.validate(req.body);

  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  const id = parseInt(req.params.id);

  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid ID' });
  }

  if (value.completed !== undefined) {
    value.completed = value.completed ? 1 : 0;
  }

  updateTodo(id, value, (err, updated) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(updated);
  });
});

app.delete('/todos/:id', (req, res) => {
  const id = parseInt(req.params.id);

  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid ID' });
  }

  deleteTodo(id, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });

    if (!result.deleted) {
      return res.status(404).json({ error: 'Todo not found' });
    }

    res.json({ message: 'Todo deleted successfully' });
  });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});


