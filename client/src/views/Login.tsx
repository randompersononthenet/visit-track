import React from 'react';

export function Login() {
  return (
    <div className="max-w-sm mx-auto mt-20">
      <h2 className="text-xl font-semibold mb-4">Login</h2>
      <form className="space-y-3">
        <input className="w-full border rounded px-3 py-2" placeholder="Username" />
        <input className="w-full border rounded px-3 py-2" placeholder="Password" type="password" />
        <button className="w-full bg-blue-600 text-white px-3 py-2 rounded">Sign in</button>
      </form>
    </div>
  );
}
