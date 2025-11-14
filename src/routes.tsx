import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App';
import ImportedProblemsPage from './pages/ImportedProblemsPage';

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/imported-problems" element={<ImportedProblemsPage />} />
      </Routes>
    </BrowserRouter>
  );
}
