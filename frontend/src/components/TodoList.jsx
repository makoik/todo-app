// src/components/TodoList.jsx
import React, { useEffect, useState } from 'react';

function TodoList() {
  const [todos, setTodos] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editTask, setEditTask] = useState('');

  const fetchTodos = () => { 
    fetch('http://localhost:3000/todos')
      .then(res => res.json())
      .then(data => {
        console.log('Fetched todos: ', data);
        setTodos(data);
      })
      .catch(err => console.error('Error fetching todos:', err));
  };

  useEffect(() => {
    fetchTodos();
   }, []);

  const handleAddTodo = async () => {
    if (!newTask.trim()) return;

    await fetch('http://localhost:3000/todos', {
      method: 'POST',
      headers: { 'Content-type': 'application/json' },
      body: JSON.stringify({ task: newTask })
    })
    .then(res => res.json())
    .then(() => {
      setNewTask('');
      fetchTodos(); // refreshes the list
    })
    .catch(err => console.error('Error adding todo:', err));
  };

  const handleToggleCompleted = (todo) => {
    fetch(`http://localhost:3000/todos/${todo.id}`, {
      method: 'PUT',
      headers: { 'Content-type': 'application/json' },
      body: JSON.stringify({ completed: !todo.completed, task: todo.task })
    })
    .then(res => res.json())
    .then(() => fetchTodos())
    .catch(err => console.error('Error updating todo:', err));
  };

  const startEditing = (todo) => {
    setEditingId(todo.id);
    setEditTask(todo.task);
  };

  const handleSaveEdit = (todo) => {
    fetch(`http://localhost:3000/todos/${todo.id}`, {
      method: 'PUT',
      headers: { 'Content-type': 'application/json' },
      body: JSON.stringify({ task: editTask, completed: todo.completed })
    })
    .then(res => res.json())
    .then(() => {
      setEditingId(null);
      setEditTask('');
      fetchTodos();
    })
    .catch(err => console.error('Error saving edit:', err));
  };

  const handleDelete = (id) => {
    fetch(`http://localhost:3000/todos/${id}`, {
      method: 'DELETE'
    })
      .then(res => res.json())
      .then(() => fetchTodos())
      .catch(err => console.error('Error deleting todo:', err));
  };

  
  return (
    <div>
      <h2>Todo List</h2>

      <form onSubmit={handleAddTodo}>
        <input
          type='text'
          value={newTask}
          onChange={e => setNewTask(e.target.value)}
          placeholder='New Task'
        />
        <button type='submit'>Add</button>  
      </form>

      <ul>
        {todos.map(todo => (
          <li key={todo.id}>
            <input
              type='checkbox'
              checked={!!todo.completed}
              onChange={() => handleToggleCompleted(todo)}
            />

            {editingId === todo.id ? (
              <>
                <input
                  type='text'
                  value={editTask}
                  onChange={e => setEditTask(e.target.value)}
                />
                <button onClick={() => handleSaveEdit(todo)}>Save</button>
              </>
            ) : (
              <>
                <span><strong>{todo.task}</strong></span>
                <button onClick={() => startEditing(todo)}>Edit</button>
              </>
            )}
            <button onClick={() => handleDelete(todo.id)}>Delete</button>

            <div>
              {todo.completed ? 'Completed✅' : 'Completed❌'}<br />
              <small>Created: {todo.created_at}</small><br />
              <small>Updated: {todo.updated_at}</small>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default TodoList