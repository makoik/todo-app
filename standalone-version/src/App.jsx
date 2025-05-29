import { useEffect, useState, useRef } from 'react';

function AutoExpandTextArea({ value, onChange, placeholder, isEditing, onEnter, onShiftEnter }) {
  const textareaRef = useRef(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [value]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        if (onShiftEnter) onShiftEnter(e);
      } else {
        e.preventDefault();
        if (onEnter) onEnter(e);
      }
    }
  };

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={onChange}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      rows={1}
      className={`p-2 rounded text-white w-full mb-3 ${isEditing ? 'bg-zinc-600' : 'bg-zinc-700'}`}
      style={{ overflow: 'hidden' }}
    />
  );
}

function App() {
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [editId, setEditId] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [editDetails, setEditDetails] = useState('');
  const [expandedIds, setExpandedIds] = useState([]);
  const [showFiltersInput, setShowFilters] = useState(false);

  
  const [filters, setFilters] = useState({
    completed: '',
    date: '',
    field: 'task',
    task: '',
    updated_at: '',
    sort_by: 'created_at',
    order: 'ASC',
    value: '',
    hasDetails: ''
  });

  const [newTask, setNewTask] = useState('');
  const [newDetails, setNewDetails] = useState('');
  const [showDetailsInput, setShowDetailsInput] = useState(false);

  // Load tasks from JSON via Electron IPC
  useEffect(() => {
    if (window.electronAPI?.getTasks) {
      window.electronAPI.getTasks().then(setTasks);
    } /* else {
      console.log("Running in browser (dev mode), skipping Electron data load.");
      setTasks([]); // Mock data
    } */
  }, []);

  // Apply filters and sorting
  useEffect(() => {
    let result = [...tasks];

    const field = filters.field;
    const value = filters.value.trim().toLowerCase();

    if (filters.completed === 'has_details') {
      result = result.filter(task => !!task.details);
    } else if (filters.completed === 'no_details') {
      result = result.filter(task => !task.details);
    } else if (filters.completed !== '') {
      const boolVal = filters.completed === 'true';
      result = result.filter(task => task.completed === boolVal);
    }

    if (value) {
      result = result.filter((task) => {
        if (field === 'completed') {
          const boolVal = value === 'true' || value === '1';
          return task.completed === boolVal;
        }
        if (field === 'task') {
          return task.task.toLowerCase().includes(value);
        }
        if (field === 'created_at' || field === 'updated_at') {
          return task[field]?.startsWith(value); // "YYYY-MM-DD" or partial match
        }
        return true;
      });
    }

    // Sort
    result.sort((a, b) => {
      const valA = a[filters.sort_by];
      const valB = b[filters.sort_by];
      if (valA < valB) return filters.order === 'ASC' ? -1 : 1;
      if (valA > valB) return filters.order === 'ASC' ? 1 : -1;
      return 0;
    });

    setFilteredTasks(result);
  }, [tasks, filters]);

  // Add task
  const addTask = () => {
    if (!newTask.trim()) return;
    const timestamp = new Date().toLocaleString();
    const updated = [
      ...tasks,
      {
        id: Date.now(),
        task: newTask,
        completed: false,
        details: newDetails.trim(),
        created_at: timestamp,
        updated_at: timestamp
      }
    ];
    setTasks(updated);
    setNewTask('');
    setNewDetails('');
    setShowDetailsInput(false);
    if (window.electronAPI?.saveTasks) {
      window.electronAPI.saveTasks(updated);
    }
  };

  // Task details
  const toggleDetails = (id) => {
  setExpandedIds((prev) =>
    prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // Toggle completed
  const toggleComplete = (id) => {
    const updated = tasks.map((t) =>
      t.id === id ? { ...t, completed: !t.completed, updated_at: new Date().toLocaleString() } : t
    );
    setTasks(updated);
    if (window.electronAPI?.saveTasks) {
      window.electronAPI.saveTasks(updated);
    }
  };

  // Edit task & details
  const editTask = (id, newTask, newDetails) => {
    if (!newTask.trim()) return;
    
    const updated = tasks.map((t) =>
      t.id === id ? { ...t, task: newTask, details: newDetails, updated_at: new Date().toLocaleString() } : t
    );
    setTasks(updated);
    if (window.electronAPI?.saveTasks) {
      window.electronAPI.saveTasks(updated);
    }
  };

  const handleEditClick = (task) => {
  setEditId(task.id);
  setEditValue(task.task);
  setEditDetails(task.details || '');
  setExpandedIds((prev) => prev.filter((x) => x !== task.id));
  };
  
  const newTaskInputRef = useRef(null);
  // Delete task
  const deleteTask = async (id) => {
    const shouldDelete = await window.electronAPI.showConfirm('Delete this task?');
    if (shouldDelete) {
      const updated = tasks.filter((t) => t.id !== id);
      setTasks(updated);
      
      if (editId === id) setEditId(null);
      setExpandedIds((prev) => prev.filter((x) => x !== id));

      if (window.electronAPI?.saveTasks) {
        window.electronAPI.saveTasks(updated);
      }

      setTimeout(() => {
        newTaskInputRef.current?.focus({ preventScroll: true });
      }, 50)
    }
  };

  return (
    <div className="min-h-screen min-w-screen flex flex-col items-center  bg-zinc-800 text-gray-100">
      <h1 className="text-3xl font-bold mt-10">Todo List</h1>

      {/* Add task, details, filters container */}
      <div className='flex flex-col items-start w-[250px] mt-10'>

        {/* Add task */}
        <div className="flex gap-2 mb-3">
          <input
            className="bg-zinc-700 p-2 rounded text-white"
            ref={newTaskInputRef}
            placeholder="Add task..."
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            onEnter={addTask}
          />
          <button onClick={addTask} className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded">
            Add
          </button>
        </div>

        {/* Add details */}
        <div className='flex flex-col w-[80%] items-center justify-center text-center'>
          <button
            type="button"
            className="text-sm text-white rounded-md px-1 py-0.5 mb-2 bg-zinc-700"
            onClick={() => setShowDetailsInput(!showDetailsInput)}
          >
            {showDetailsInput ? 'Hide Details' : 'Add Details?'}
          </button>

          {showDetailsInput && (
            <AutoExpandTextArea
              value={newDetails}
              onChange={(e) => setNewDetails(e.target.value)}
              placeholder="Optional details..."
              isEditing={false}
              onEnter={addTask}
              onShiftEnter={{} = {}}
            />
          )}
        </div>

        {/* Filters and sort */}
        <div className="flex flex-col w-[80%] items-center justify-center text-center">
          <button
            type="button"
            className="text-sm text-white rounded-md px-1 py-0.5 mb-4 bg-zinc-700"
            onClick={() => setShowFilters(!showFiltersInput)}
          >
           {showFiltersInput ? 'Hide Filters' : 'Show Filters'}
          </button>

          {/* Filters and sort container - conditionally rendered */}
          {showFiltersInput && (
            <div className="flex flex-col gap-2 text-sm">
              <select
                className="bg-zinc-700 p-1 rounded-md p-0.5 text-center"
                value={filters.completed}
                onChange={(e) => setFilters({ ...filters, completed: e.target.value })}
              >
                <option value="">Show All</option>
                <option value="true">✔ Completed</option>
                <option value="false">✘ Incomplete</option>
                <option value="has_details">Has Details</option>
                <option value="no_details">No Details</option>
              </select>
              <input
                className="bg-zinc-700 p-1 rounded-md text-center"
                placeholder="Task name or YYYY-MM-DD"
                value={filters.value}
                onChange={(e) => {
                  setFilters({ ...filters, value: e.target.value });
                }}
              />
              <div className="grid gap-2 mb-1">
                <div className="grid grid-cols-[auto_1fr] items-center gap-2">
                  <label>Filter by: </label>
                  <select
                    className="bg-zinc-700 p-1 rounded-md text-center"
                    value={filters.field}
                    onChange={(e) => setFilters({ ...filters, field: e.target.value, value: '' })}
                  >
                    <option value="task">Task Name</option>
                    <option value="created_at">Created At</option>
                    <option value="updated_at">Updated At</option>
                    <option value="completed">Completed</option>
                    <option value="hasDetails">Has Details</option>
                  </select>
                </div>
                <div className="grid grid-cols-[auto_1fr] items-center gap-2">
                  <label>Sort by: </label>
                  <select
                    className="bg-zinc-700 p-1 rounded-md text-center"
                    value={filters.sort_by}
                    onChange={(e) => setFilters({ ...filters, sort_by: e.target.value })}
                  >
                    <option value="task">Task</option>
                    <option value="created_at">Created At</option>
                    <option value="updated_at">Updated At</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>
              <button
                className="bg-zinc-700 p-1 rounded-md mb-4"
                onClick={() =>
                  setFilters({
                    ...filters,
                    order: filters.order === 'ASC' ? 'DESC' : 'ASC',
                  })
                }
              >
                Sort: {filters.order === 'ASC' ? ' DESC ↓ ' : ' ASC ↑ '}
              </button>
            </div>
          )}
        </div>
      </div>
      {/* Task list render */}
      <div className="w-full max-w-xl h-full space-y-2 mt-4">
        {filteredTasks.map((task) => (
          <div
            key={task.id}
            className="flex flex-col sm:flex-row sm:justify-between sm:items-center bg-zinc-700 rounded px-3 py-2 gap-2"
          >
            {editId === task.id ? (
              <>
                <div className="flex-1 min-w-0">
                  {/* Task name input */}
                  <input
                    className="bg-zinc-600 p-2 rounded w-full text-white mb-1"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        if (editValue.trim()) {
                          editTask(task.id, editValue, editDetails);
                        }
                        setEditId(null);
                        setExpandedIds((prev) => prev.filter((x) => x !== task.id));
                      }
                    }}
                  />
                  {/* Details toggle */}
                    <button
                      className="text-xs text-white mt-1 hover:underline flex items-center gap-1 self-start"
                      onClick={() => toggleDetails(task.id)}
                    >
                      {task.details ? 'Edit Details' : 'Add Details?'}
                      <span className={`pl-1 font-bold text-sm transition-transform ${expandedIds.includes(task.id) ? 'rotate-90' : 'rotate-0'}`}>
                        ❯
                      </span>
                    </button>

                    {/* Edit Details input - show when expanded */}
                    {expandedIds.includes(task.id) && (
                      <AutoExpandTextArea
                        value={editDetails}
                        onChange={(e) => setEditDetails(e.target.value)}
                        placeholder="Enter task details..."
                        isEditing={true}
                        onEnter={() => {
                          if (editValue.trim()) {
                            editTask(task.id, editValue, editDetails);
                          }
                          setEditId(null);
                          setExpandedIds((prev) => prev.filter((x) => x !== task.id));
                        }}
                        onShiftEnter={() => {}}
                      />
                    )}
                </div>
                <div className="flex gap-2 flex-shrink-0 mt-2 sm:mt-0 sm:ml-4">
                  <button
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
                    onClick={() => {
                      if (editValue.trim()) {
                        editTask(task.id, editValue, editDetails);
                      }
                      setEditId(null);
                      setExpandedIds((prev) => prev.filter((x) => x !== task.id));
                    }}
                  >
                    Save
                  </button>
                  <button
                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                    onClick={() => {
                      setEditId(null);
                      setExpandedIds((prev) => prev.filter((x) => x !== task.id));
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="flex-1 min-w-0">
                  <span
                    className={`block text-lg break-words ${task.completed ? 'line-through text-green-400' : ''}`}
                  >
                    {task.task}
                  </span>
                  <span className="text-xs text-gray-400">
                    Created: {task.created_at} | Updated: {task.updated_at}
                  </span>

                  {/* Task details section */}
                  {task.details && (
                    <button
                      onClick={() => toggleDetails(task.id)}
                      className='text-xs text-white mt-1 hover:underline flex items-center gap-1 self-start'
                    >
                      Show Details
                      <span className={`pl-1 font-bold text-sm transition-transform ${expandedIds.includes(task.id) ? 'rotate-90' : 'rotate-0'}`}>
                        ❯
                      </span>
                    </button>
                  )}

                  {/* Details content */}
                  {expandedIds.includes(task.id) && (
                    <div className='text-sm text-gray-300 mt-2 break-words whitespace-pre-wrap'>
                      {task.details}
                    </div>
                  )}
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => toggleComplete(task.id)}
                    className="bg-green-600 hover:bg-green-700 px-2 py-1 rounded text-sm text-black"
                  >
                    {task.completed ? 'Undo' : 'Done'}
                  </button>
                  <button
                    className="bg-yellow-600 hover:bg-yellow-700 px-2 py-1 rounded text-sm text-black"
                    onClick={() => {
                      handleEditClick(task);
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteTask(task.id)}
                    className="bg-red-600 hover:bg-red-500 px-2 py-1 rounded text-sm text-white"
                  >
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;