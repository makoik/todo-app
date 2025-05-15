const express = require('express');
const cors = require('cors');
const { pool, getTodos, createTodo, updateTodo, deleteTodo } = require('./db');
const app = express();
const Joi = require('joi');
const PORT = 3000;

app.use(cors());
app.use(express.json());

// GET
app.get('/todos', async (req, res) => {
  const { completed, date, task, updated_at, sort_by, order } = req.query;
  const filter = {};
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

  if (completed !== undefined) {
    if (completed !== 'true' && completed !== 'false') {
      return res.status(400).json({ error: 'completed must be true or false' });
    }
    filter.completed = completed === 'true';
  }

  if (date) {
    if (!dateRegex.test(date)) {
      return res.status(400).json({ error: 'date must be in YYYY-MM-DD format' });
    }
    filter.date = date;
  }

  if (updated_at) {
    if (!dateRegex.test(updated_at)) {
      return res.status(400).json({ error: 'updated_at needs to be in YYYY-MM-DD format' });
    }
    filter.updated_at = updated_at;
  }

  if (task) {
    if (typeof task !== 'string') {
      return res.status(400).json({ error: 'task must be a string' });
    }
    filter.task = task;
  }

  if (sort_by) filter.sort_by = sort_by;
  if (order) filter.order = order;

  try {
    const todos = await getTodos(filter);

    const todosWithLocalTime = todos.map(todo => ({
      ...todo,
      created_at: new Date(todo.created_at).toLocaleString(),
      updated_at: new Date(todo.updated_at).toLocaleString()
    }));

    res.json(todosWithLocalTime);
  } catch (err) {
    console.error('Database query error:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

  
// POST
app.post('/todos', async (req, res) => {
  console.log('Received POST /todos: ', req.body);

  const todoSchema = Joi.object({
    task: Joi.string().min(1).required(),
    completed: Joi.boolean().default(false)
  });

  const { error, value } = todoSchema.validate(req.body);

  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  try {
    const newTodo = await createTodo(value.task, value.completed);
    res.status(201).json(newTodo);
  } catch (err) {
    console.error('Failed to create todo:', err.message);
    res.status(500).json({ error: 'Database insert failed' });
  }
});

// UPDATE
app.put('/todos/:id', async (req, res) => {
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

  try {
    const updatedTodo = await updateTodo(id, value);
    res.json(updatedTodo);
  } catch (err) {
    console.error('Failed to updated todo: ', err.message);
    res.status(500).json({ error: 'Update failed' });
  }
});

// DELETE
app.delete('/todos/:id', async (req, res) => {
  const id = parseInt(req.params.id);

  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid ID' });
  }

  try {
    const result = await deleteTodo(id);

    if (!result.deleted) {
      return res.status(404).json({ error: 'Todo not found' });
    }

    res.json({ message: 'Todo deleted successfully' });
  } catch (err) {
    console.error('Failed to delete todo:', err.message);
    res.status(500).json({ error: 'Delete failed' });   
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});