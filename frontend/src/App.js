// src/App.jsx
import React from 'react';
import './App.css';
import TodoList from './components/TodoList';

function App() {
  return (
    <div className='App' style={{ padding: '2rem' }}>
      <h1>My Todo App</h1>
      <TodoList />
    </div>
  );
}

export default App;
