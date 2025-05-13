import React from 'react';
import TodoList from './components/TodoList';

function App() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-800 text-gray-100 p-4">
      <TodoList />
    </div>
  );
}

export default App;