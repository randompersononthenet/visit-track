import React, { useState } from 'react';
import { hasRole, hasPermission } from '../lib/auth';

function Section({ title, children, defaultOpen = false }: { title: string, children: React.ReactNode, defaultOpen?: boolean }) {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden mb-4">
            <button
                onClick={() => setOpen(!open)}
                className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left"
            >
                <span className="font-semibold text-slate-900 dark:text-slate-100">{title}</span>
                <svg
                    className={`w-5 h-5 text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                >
                    <path d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            {open && (
                <div className="p-4 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-sm leading-relaxed space-y-2">
                    {children}
                </div>
            )}
        </div>
    );
}

export function Help() {
    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Help & User Guide</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1">
                    Learn how to use the VisitTrack system effectively.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-2">
                    <Section title="Getting Started" defaultOpen>
                        <p>Welcome to VisitTrack! This system helps manage visitor flow and personnel logging efficiently.</p>
                        <ul className="list-disc pl-5 space-y-1 mt-2">
                            <li><strong>Dashboard:</strong> View real-time statistics, trends, and heatmaps. customize your forecast view.</li>
                            <li><strong>Navigation:</strong> Use the sidebar on the left (or hamburger menu on mobile) to access different modules.</li>
                            <li><strong>Theme:</strong> Toggle Light/Dark mode using the sun/moon icon in the sidebar.</li>
                        </ul>
                    </Section>

                    {hasPermission('visitors:create') && (
                        <Section title="Registering Visitors">
                            <p>To register a new visitor or personnel entry:</p>
                            <ol className="list-decimal pl-5 space-y-1 mt-2">
                                <li>Go to the <strong>Visitor/Official</strong> page.</li>
                                <li>Fill in the required details (Name, Purpose, Person to Visit).</li>
                                <li>Capture a photo if required.</li>
                                <li>Click <strong>Submit</strong> to generate a pass and log the entry.</li>
                                <li>A QR code will be generated for the visitor.</li>
                            </ol>
                        </Section>
                    )}

                    {hasPermission('scan:perform') && (
                        <Section title="Scanning & Monitoring">
                            <p>For security personnel at entry/exit points:</p>
                            <ul className="list-disc pl-5 space-y-1 mt-2">
                                <li>Navigate to the <strong>Scan</strong> page.</li>
                                <li>Use the camera or a handheld scanner to scan a visitor's QR code.</li>
                                <li>The system will automatically log them <strong>IN</strong> or <strong>OUT</strong>.</li>
                                <li>Use the <strong>Manual Entry</strong> tab if the QR code is unreadable.</li>
                                <li>View the <strong>Currently On-site</strong> list to see who is inside the facility.</li>
                            </ul>
                        </Section>
                    )}

                    {hasPermission('reports:view') && (
                        <Section title="Reports & Analytics">
                            <p>Access detailed logs and generate reports:</p>
                            <ul className="list-disc pl-5 space-y-1 mt-2">
                                <li><strong>Visit Logs:</strong> View a chronological list of all entries and exits.</li>
                                <li><strong>Reports:</strong> Download CSV/PDF summaries for specific date ranges.</li>
                                <li><strong>Dashboard:</strong> Monitor peak hours with heatmaps and check forecasting trends.</li>
                            </ul>
                        </Section>
                    )}

                    {hasPermission('users:manage') && (
                        <Section title="Admin Management">
                            <p>For System Administrators:</p>
                            <ul className="list-disc pl-5 space-y-1 mt-2">
                                <li><strong>Users:</strong> Add new staff accounts or reset passwords in the Users implementation.</li>
                                <li><strong>Roles:</strong> Configure permissions for different user levels (e.g., Staff, Guard).</li>
                                <li><strong>Audit Logs:</strong> Review system actions for security and accountability.</li>
                            </ul>
                        </Section>
                    )}
                </div>

                <div className="space-y-6">
                    <div className="bg-indigo-50 dark:bg-indigo-900/20 p-5 rounded-xl border border-indigo-100 dark:border-indigo-800">
                        <h3 className="font-semibold text-indigo-900 dark:text-indigo-100 mb-2 flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            Quick Tips
                        </h3>
                        <ul className="text-sm text-indigo-800 dark:text-indigo-200 space-y-2">
                            <li>• Double-click a row in logs to view full details.</li>
                            <li>• Use the search bar in lists to quickly find records.</li>
                            <li>• Archived records can be restored if needed.</li>
                        </ul>
                    </div>

                    <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                        <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Need Support?</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                            If you encounter technical issues or need account assistance, please contact the system administrator.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
