import React, { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { RequireAuth } from '@/features/auth/RequireAuth';
import { AppShell } from '@/components/layout/AppShell';
import { Loading } from '@/components/shared/Loading';

// Public pages
import { Landing } from '@/pages/public/Landing';
import { Login } from '@/pages/public/Login';
import { Signup } from '@/pages/public/Signup';
import { ForgotPassword } from '@/pages/public/ForgotPassword';
import { Privacy } from '@/pages/public/Privacy';
import { NotFound } from '@/pages/public/NotFound';

// Lazy-loaded App pages (to keep initial landing bundle < 300 KB gzipped)
const Today = lazy(() => import('@/pages/app/Today').then((m) => ({ default: m.Today })));
const Sheet = lazy(() => import('@/pages/app/Sheet').then((m) => ({ default: m.Sheet })));
const Employees = lazy(() => import('@/pages/app/Employees').then((m) => ({ default: m.Employees })));
const EmployeeNew = lazy(() => import('@/pages/app/EmployeeNew').then((m) => ({ default: m.EmployeeNew })));
const EmployeeDetail = lazy(() => import('@/pages/app/EmployeeDetail').then((m) => ({ default: m.EmployeeDetail })));
const EmployeeEdit = lazy(() => import('@/pages/app/EmployeeEdit').then((m) => ({ default: m.EmployeeEdit })));
const Summary = lazy(() => import('@/pages/app/Summary').then((m) => ({ default: m.Summary })));
const Settings = lazy(() => import('@/pages/app/Settings').then((m) => ({ default: m.Settings })));

// Component to enforce <meta name="robots" content="noindex"> on app routes per ARCHITECTURE_WEB.md §8
function AppRouteWrapper() {
  React.useEffect(() => {
    let meta = document.querySelector('meta[name="robots"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'robots');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', 'noindex');

    return () => {
      meta?.setAttribute('content', 'all');
    };
  }, []);

  return (
    <Suspense fallback={<Loading fullScreen message="Loading page..." />}>
      <Outlet />
    </Suspense>
  );
}

export const router = createBrowserRouter([
  // Public routes
  { path: '/', element: <Landing /> },
  { path: '/login', element: <Login /> },
  { path: '/signup', element: <Signup /> },
  { path: '/forgot-password', element: <ForgotPassword /> },
  { path: '/privacy', element: <Privacy /> },

  // Guarded App routes
  {
    path: '/app',
    element: (
      <RequireAuth>
        <AppRouteWrapper />
      </RequireAuth>
    ),
    children: [
      {
        element: <AppShell />,
        children: [
          { index: true, element: <Today /> },
          { path: 'sheet', element: <Sheet /> },
          { path: 'employees', element: <Employees /> },
          { path: 'employees/new', element: <EmployeeNew /> },
          { path: 'employees/:id', element: <EmployeeDetail /> },
          { path: 'employees/:id/edit', element: <EmployeeEdit /> },
          { path: 'summary', element: <Summary /> },
          { path: 'settings', element: <Settings /> },
        ],
      },
    ],
  },

  // 404
  { path: '*', element: <NotFound /> },
]);
