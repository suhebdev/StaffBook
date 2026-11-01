import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/features/auth/AuthProvider';
import { ThemeProvider, useTheme } from '@/components/layout/ThemeContext';
import { router } from './routes';

function ThemedToaster() {
  const { isDark } = useTheme();
  return (
    <Toaster
      theme={isDark ? 'dark' : 'light'}
      position="top-right"
      richColors
      closeButton
      toastOptions={{
        duration: 3500,
        className: 'text-sm font-medium',
      }}
    />
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <RouterProvider router={router} />
        <ThemedToaster />
      </AuthProvider>
    </ThemeProvider>
  );
}
