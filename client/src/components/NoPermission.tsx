import React from 'react';

export function NoPermission() {
  return (
    <div className="max-w-lg mx-auto mt-16 text-center">
      <div className="text-2xl font-semibold mb-2">No Permission</div>
      <div className="text-slate-400">You do not have access to view this page. Please contact your administrator if you believe this is an error.</div>
    </div>
  );
}
