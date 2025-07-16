'use client';

import { useState, useEffect } from 'react';
import { sessionManager } from '@/lib/session';

export default function DebugPage() {
  const [sessionInfo, setSessionInfo] = useState<any>(null);

  useEffect(() => {
    const session = sessionManager.getSession();
    const user = sessionManager.getUser();
    const isAuth = sessionManager.isAuthenticated();
    
    setSessionInfo({
      session,
      user,
      isAuthenticated: isAuth,
      localStorage: typeof window !== 'undefined' ? window.localStorage.getItem('assessment-tracker-session') : null
    });
  }, []);

  const createTestUser = () => {
    const testUser = {
      id: 'test-user-1',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      role: 'user'
    };
    sessionManager.createSession(testUser, 'test-token');
    window.location.reload();
  };

  const loginAsSuperAdmin = () => {
    const user = {
      id: 'super1',
      email: 'superadmin@example.com',
      firstName: 'Super',
      lastName: 'Admin',
      role: 'super-admin'
    };
    sessionManager.createSession(user, 'super-admin-token');
    window.location.reload();
  };

  const loginAsAdmin = () => {
    const user = {
      id: 'admin1',
      email: 'admin@example.com',
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin'
    };
    sessionManager.createSession(user, 'admin-token');
    window.location.reload();
  };

  const loginAsManager = () => {
    const user = {
      id: 'manager1',
      email: 'manager@example.com',
      firstName: 'Manager',
      lastName: 'User',
      role: 'manager'
    };
    sessionManager.createSession(user, 'manager-token');
    window.location.reload();
  };

  const loginAsEmployee = () => {
    const user = {
      id: 'employee1',
      email: 'employee@example.com',
      firstName: 'Employee',
      lastName: 'User',
      role: 'user'
    };
    sessionManager.createSession(user, 'employee-token');
    window.location.reload();
  };

  const clearSession = () => {
    sessionManager.clearSession();
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Session Debug</h1>
        
        <div className="bg-white rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Session Information</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto">
            {JSON.stringify(sessionInfo, null, 2)}
          </pre>
        </div>

        <div className="bg-white rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Role Permissions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border-l-4 border-purple-600 pl-4">
              <h3 className="font-semibold text-purple-600">Super Admin</h3>
              <ul className="text-sm text-gray-600 mt-1">
                <li>• Template Builder</li>
                <li>• All Admin Features</li>
                <li>• User Management</li>
                <li>• System Configuration</li>
              </ul>
            </div>
            <div className="border-l-4 border-blue-600 pl-4">
              <h3 className="font-semibold text-blue-600">Admin</h3>
              <ul className="text-sm text-gray-600 mt-1">
                <li>• Admin Dashboard</li>
                <li>• Token Management</li>
                <li>• Assessment Periods</li>
                <li>• User Management</li>
              </ul>
            </div>
            <div className="border-l-4 border-teal-600 pl-4">
              <h3 className="font-semibold text-teal-600">Manager</h3>
              <ul className="text-sm text-gray-600 mt-1">
                <li>• Team Assessments</li>
                <li>• Subordinate Management</li>
                <li>• Team Reporting</li>
                <li>• Personal Dashboard</li>
              </ul>
            </div>
            <div className="border-l-4 border-green-600 pl-4">
              <h3 className="font-semibold text-green-600">Employee</h3>
              <ul className="text-sm text-gray-600 mt-1">
                <li>• Personal Dashboard</li>
                <li>• Self Assessments</li>
                <li>• Assessment Completion</li>
                <li>• Personal Reports</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Quick Login</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <button 
              onClick={loginAsSuperAdmin}
              className="bg-purple-600 text-white px-3 py-2 rounded hover:bg-purple-700 text-sm"
            >
              Super Admin
            </button>
            <button 
              onClick={loginAsAdmin}
              className="bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700 text-sm"
            >
              Admin
            </button>
            <button 
              onClick={loginAsManager}
              className="bg-teal-600 text-white px-3 py-2 rounded hover:bg-teal-700 text-sm"
            >
              Manager
            </button>
            <button 
              onClick={loginAsEmployee}
              className="bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700 text-sm"
            >
              Employee
            </button>
          </div>
          
          <h3 className="text-lg font-semibold mb-3">Other Actions</h3>
          <div className="space-x-4">
            <button 
              onClick={createTestUser}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            >
              Create Test User
            </button>
            <button 
              onClick={clearSession}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              Clear Session
            </button>
            <a 
              href="/dashboard"
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 inline-block"
            >
              Go to Dashboard
            </a>
          </div>
        </div>
      </div>
    </div>
  );
} 