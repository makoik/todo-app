// src/components/TodoList.jsx
import React, { useCallback, useEffect, useState, useRef } from 'react';

function TodoList() {
  const [todos, setTodos] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editTask, setEditTask] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [sortField, setSortField] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('ASC');
  const [filterField, setFilterField] = useState('');
  const [filterValue, setFilterValue] = useState('');
  const filterInputRef = useRef(null);


  const fetchTodos = useCallback(() => {
    const params = new URLSearchParams();
    
  // Add filter
  if (filterField && filterValue) {
    const isDateFilter = filterField === 'created_at' || filterField === 'updated_at';
    
    if (isDateFilter) {
      const isDateValid = /^\d{4}-\d{2}-\d{2}$/.test(filterValue);
      
      if (isDateValid) {
        if (filterField === 'created_at') {
          params.append('date', filterValue);
        } else {
          params.append(filterField, filterValue);
        }
        setErrorMsg(''); // Clear error if valid date
      } else if (filterValue.length >= 10) {
        setErrorMsg('Date must be in format: YYYY-MM-DD');
        return; // Don't fetch with invalid date
      } else {
        return;
      }
      } else if (filterField === 'task') {
        params.append('task', filterValue);
      } else if (filterField === 'completed') {
        params.append('completed', filterValue);
      }
  }

    // Add sort
    params.append('sort_by', sortField);
    params.append('order', sortOrder);

    const url = `http://localhost:3000/todos?${params.toString()}`;

    fetch(url)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          console.log('Fetched todos: ', data);
          setTodos(data);
        } else {
          console.error('Unexpected response: ', data);
          setTodos([]);
          setErrorMsg(data.error || 'Unexpected server response.');
        }
      })
      .catch(err => {
        console.error('Error fetching todos:', err);
        setTodos([]);
        setErrorMsg('Failed to fetch todos. Please try again.');
    });
  }, [filterField, filterValue, sortField, sortOrder]);

  useEffect(() => {
    fetchTodos();
   }, [fetchTodos]);

  useEffect(() => {
  if (errorMsg) {
    const timer = setTimeout(() => setErrorMsg(''), 4000);
    return () => clearTimeout(timer);
  }
  }, [errorMsg]);

  const handleAddTodo = async () => {
    if (!newTask.trim()) return;

    try {
      const res = await fetch('http://localhost:3000/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task: newTask })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Unknown error');
      }

      setNewTask('');
      fetchTodos(); // Refresh the list
    } catch (err) {
      console.error('Error adding todo:', err);
      setErrorMsg('Failed to add todo. Please try again.');
    }
  };

  const handleFilterSubmit = () => {
    fetchTodos();
  };

  const handleToggleCompleted = (todo) => {
    fetch(`http://localhost:3000/todos/${todo.id}`, {
      method: 'PUT',
      headers: { 'Content-type': 'application/json' },
      body: JSON.stringify({ completed: !todo.completed, task: todo.task })
    })
    .then(res => res.json())
    .then(() => fetchTodos())
    .catch(err => {
        console.error('Error updating todo:', err);
        setErrorMsg('Failed to update todo. Please try again.');
      });
  };

  const startEditing = (todo) => {
    setEditingId(todo.id);
    setEditTask(todo.task);
  };

  const handleSaveEdit = (todo) => {
    fetch(`http://localhost:3000/todos/${todo.id}`, {
      method: 'PUT',
      headers: { 'Content-type': 'application/json' },
      body: JSON.stringify({
        task: editTask,
        completed: todo.completed === 1 || todo.completed === true
      })
    })
    .then(res => res.json())
    .then(() => {
      setEditingId(null);
      setEditTask('');
      fetchTodos();
    })
    .catch(err => {
        console.error('Error editing todo:', err);
        setErrorMsg('Failed to edit todo. Please try again.');
      });
  };

  const handleDelete = (id) => {
    if (window.confirm('Delete this task?')) {
      fetch(`http://localhost:3000/todos/${id}`, {
        method: 'DELETE'
      })
        .then(res => res.json())
        .then(() => fetchTodos())
        .catch(err => {
          console.error('Error deleting todo:', err);
          setErrorMsg('Failed to delete todo. Please try again.');
        });
      }
  };

  
  return (
    <div className=''>
      <h2 className='mb-5 flex justify-center text-2xl'><b>Todo List</b></h2>
      <form onSubmit={e => { 
        e.preventDefault(); 
        handleAddTodo(); 
        }}>
        <input
          className='border rounded px-2 py-1 mb-2'
          type='text'
          value={newTask}
          onChange={e => setNewTask(e.target.value)}
          placeholder='New Task'
        />
        <button className='ml-3 border rounded px-2 py-1 bg-gray-900 hover:bg-blue-900' type='submit'>Add</button>  
      </form>

      <div className='flex items-center gap-x-4 mb-4'>
        <label className='flex items-center gap-2'>
          <span>Sorting: </span>
          <select
            className='border rounded px-2 py-1 focus:bg-blue-900'
            value={sortField}
            onChange={(e) => {
              setSortField(e.target.value);
              handleFilterSubmit();
            }}
          >
            <option value="task">Task name</option>
            <option value="completed">Completed</option>
            <option value="created_at">Created at</option>
            <option value="updated_at">Updated at</option>
          </select>
        </label>
        <button
          onClick={() => setSortOrder((sortOrder === 'ASC' ? 'DESC' : 'ASC'))}
          className='border rounded px-3 py-1 bg-gray-900 hover:bg-blue-900'
          title='Toggle sort order'
        >
          Sort: {sortOrder === 'ASC' ? ' ↑ ' : ' ↓ '}
        </button>
      </div>

      <div className="filter-section mb-4">
        <span>Filter: </span>
        <select
          value={filterField}
          onChange={(e) => {
            setFilterField(e.target.value);
            setFilterValue(''); // reset filterValue when filterField changes
            if (filterInputRef.current) {
              filterInputRef.current.focus();
            }
          }}
          className="border rounded px-2 py-1 focus:bg-blue-900"
        >
          <option value="">Select filter field</option>
          <option value="task">Task name</option>
          <option value="created_at">Created at</option>
          <option value="updated_at">Updated at</option>
        </select>
        <br></br>
        {filterField && (
          <>
            <input
              type="text"
              placeholder={
                filterField === 'task'
                  ? 'Enter task name'
                  : 'YYYY-MM-DD'
              }
              value={filterValue}
              onChange={(e) => {
                setFilterValue(e.target.value)
              }
            }
            ref={filterInputRef}
            className="border rounded px-2 py-1 mt-2"
        />
      {filterValue && (
        <button 
          onClick={() => {
            setFilterField('');
            setFilterValue('');
            // trigger fetchTodos via dependency change
          }}
          className="ml-4 border rounded px-3 py-1 bg-red-950 hover:text-white"
          title="Clear filter"
        >
          ×
        </button>
      )}
    </>
  )}
</div>
        {errorMsg && (
        <div style={{ color: 'red', marginTop: '1em' }}>
          <small>{errorMsg}</small>
        </div>
      )}
      <ul className=''>
        {todos.map(todo => (
        <li key={todo.id} className="mb-4">
          <div className="flex justify-between items-center w-full">
            <div className="flex items-center">
              <input
                className="mr-2"
                type="checkbox"
                checked={!!todo.completed}
                onChange={() => handleToggleCompleted(todo)}
              />

              {editingId === todo.id ? (
                <input
                  className="w-28 px-2 py-1 border rounded bg-gray-800 text-white"
                  type="text"
                  value={editTask}
                  onChange={e => setEditTask(e.target.value)}
                />
              ) : (
                <span className="font-bold">{todo.task}</span>
              )}
            </div>

            <div className="flex">
              {editingId === todo.id ? (
                <button
                  className="ml-2 border rounded px-2 py-1 bg-green-800 hover:bg-green-700"
                  onClick={() => handleSaveEdit(todo)}
                >
                  Save
                </button>
              ) : (
                <button
                  className="ml-2 border rounded px-2 py-1 bg-gray-900 hover:bg-blue-900"
                  onClick={() => startEditing(todo)}
                >
                  Edit
                </button>
              )}
              <button
                className="ml-2 border rounded px-2 py-1 bg-gray-900 hover:bg-[#9d0d0c]"
                onClick={() => handleDelete(todo.id)}
              >
                Delete
              </button>
            </div>
          </div>

          <div className="ml-6 mt-1 text-sm">
            {todo.completed ? 'Completed✅' : 'Completed❌'}
            <br />
            <small>Created: {todo.created_at}</small>
            <br />
            <small>Updated: {todo.updated_at}</small>
          </div>
        </li>
        ))}
      </ul>
    </div>
  );
}

export default TodoList