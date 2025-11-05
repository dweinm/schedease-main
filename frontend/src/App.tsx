import React, { useState } from 'react';
import { AuthProvider, useAuth } from './components/AuthContext';
import { LoginForm } from './components/auth/LoginForm';
import { AdminDashboard } from './components/dashboards/AdminDashboard';
import { InstructorDashboard } from './components/dashboards/InstructorDashboard';
import { StudentDashboard } from './components/dashboards/StudentDashboard';
import { LoadingSpinner } from './components/ui/LoadingSpinner';
import { Toaster } from 'react-hot-toast';
import LandingPage from './components/LandingPage';

function AppContent() {
  const { user, isLoading } = useAuth();
  const { showLanding, continueLanding } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return <LoginForm />;
  }

  if (showLanding) {
    return <LandingPage user={user} onContinue={continueLanding || (() => {})} />;
  }

  switch (user.role) {
    case 'admin':
      return <AdminDashboard />;
    case 'instructor':
      return <InstructorDashboard />;
    case 'student':
      return <StudentDashboard />;
    default:
      return <LoginForm />;
  }
}

export default function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-background">
        <AppContent />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              style: {
                background: '#059669',
              },
            },
            error: {
              duration: 5000,
              style: {
                background: '#dc2626',
              },
            },
          }}
        />
      </div>
    </AuthProvider>
  );
}