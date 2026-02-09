import React from 'react';
import { Navigate } from 'react-router-dom';
import { isAuthenticated, hasPermission } from '../lib/auth';

function NoPermission() {
    return (
        <div className="flex flex-col items-center justify-center p-8 text-center">
            <div className="text-4xl mb-4">🚫</div>
            <h2 className="text-xl font-bold mb-2">Access Denied</h2>
            <p className="text-slate-600 dark:text-slate-400">You do not have permission to view this page.</p>
        </div>
    );
}

export function PermissionRoute({ permission, children }: { permission: string; children: React.ReactElement }) {
    if (!isAuthenticated()) return <Navigate to="/login" replace />;
    if (!hasPermission(permission)) return <NoPermission />;
    return children;
}
