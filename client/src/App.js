import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import Chat from './components/Chat/Chat';
import HomePage from './components/Layout/HomePage';
import ContactPage from './components/Layout/ContactPage';
import Header from './components/Layout/Header';
import PrivateRoute from './components/Auth/PrivateRoute';
import ProfilePage from './components/Profile/ProfilePage';
import './App.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <SocketProvider>
          <MainApp />
        </SocketProvider>
      </AuthProvider>
    </Router>
  );
}

function MainApp() {
  const { user } = useAuth(); // Ensure context is available

  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/chat"
          element={
            <PrivateRoute>
              <Chat />
            </PrivateRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <ProfilePage />
            </PrivateRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default App;
