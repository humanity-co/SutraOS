import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './Login';
import Dashboard from './Dashboard';
import Directory from './Directory';
import FinanceHR from './FinanceHR';
import Academics from './Academics';
import PlacementsCampus from './PlacementsCampus';
import Facilities from './Facilities';
import Research from './Research';
import Documents from './Documents';
import Admissions from './Admissions';
import Layout from './Layout';

function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={
          !token ? <Login setAuthToken={setToken} /> : <Navigate to="/" replace />
        } />
        <Route path="/" element={
          token ? <Layout setAuthToken={setToken}><Dashboard setAuthToken={setToken} /></Layout> : <Navigate to="/login" replace />
        } />
        <Route path="/directory" element={
          token ? <Layout setAuthToken={setToken}><Directory setAuthToken={setToken} /></Layout> : <Navigate to="/login" replace />
        } />
        <Route path="/finance-hr" element={
          token ? <Layout setAuthToken={setToken}><FinanceHR setAuthToken={setToken} /></Layout> : <Navigate to="/login" replace />
        } />
        <Route path="/academics" element={
          token ? <Layout setAuthToken={setToken}><Academics setAuthToken={setToken} /></Layout> : <Navigate to="/login" replace />
        } />
        <Route path="/facilities" element={
          token ? <Layout setAuthToken={setToken}><Facilities /></Layout> : <Navigate to="/login" replace />
        } />
        <Route path="/placements-campus" element={
          token ? <Layout setAuthToken={setToken}><PlacementsCampus setAuthToken={setToken} /></Layout> : <Navigate to="/login" replace />
        } />
        <Route path="/research" element={
          token ? <Layout setAuthToken={setToken}><Research /></Layout> : <Navigate to="/login" replace />
        } />
        <Route path="/documents" element={
          token ? <Layout setAuthToken={setToken}><Documents /></Layout> : <Navigate to="/login" replace />
        } />
        <Route path="/admissions" element={
          token ? <Layout setAuthToken={setToken}><Admissions /></Layout> : <Navigate to="/login" replace />
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
