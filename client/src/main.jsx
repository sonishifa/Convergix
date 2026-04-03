
import React    from 'react';
import ReactDOM from 'react-dom/client';
import App      from './App';
import './index.css';

// StrictMode intentionally double-invokes effects in development.
// TipTap's editor instance manager doesn't handle this gracefully in v3 —
// it triggers a setState-during-render warning. Remove StrictMode for now.
ReactDOM.createRoot(document.getElementById('root')).render(<App />);
