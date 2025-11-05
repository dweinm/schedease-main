import React, { useEffect, useMemo, useState } from 'react';
import { Button } from './ui/button';
import { User, GraduationCap, Monitor, Book } from 'lucide-react';

type Role = 'admin' | 'instructor' | 'student';
type Tip = { title: string; body: string };

// Show duration in ms (choose a value between 8000 and 10000)
const AUTO_CONTINUE_MS = 9000;

export default function LandingPage({ user, onContinue }: { user: any; onContinue: () => void; }) {
  const [progress, setProgress] = useState(0);
  const [activeTip, setActiveTip] = useState<number | null>(null);

  const role = (user?.role || 'student') as Role;

  const roleConfig = useMemo(() => {
    const mapping: Record<Role, { title: string; accent: string; icon: any }> = {
      admin: { title: 'Administrator', accent: 'from-rose-500 to-pink-500', icon: Monitor },
      instructor: { title: 'Instructor', accent: 'from-indigo-500 to-blue-500', icon: GraduationCap },
      student: { title: 'Student', accent: 'from-emerald-500 to-teal-500', icon: Book }
    };
    return mapping[role] || { title: 'User', accent: 'from-slate-500 to-gray-500', icon: User };
  }, [role]);

  const tips = useMemo<Tip[]>(() => {
    const mapping: Record<Role, Tip[]> = {
      admin: [
        { title: 'System health', body: 'Quickly review analytics and system settings for the day.' },
        { title: 'Manage users', body: 'Approve new accounts, manage roles and permissions.' },
        { title: 'Schedules', body: 'Run conflict checks and publish updates.' }
      ],
      instructor: [
        { title: 'My courses', body: 'View your assigned courses and preferred rooms.' },
        { title: 'Availability', body: 'Update your availability to help scheduling.' },
        { title: 'Notifications', body: 'See important announcements from admins.' }
      ],
      student: [
        { title: 'My timetable', body: 'Your schedule for the semester is loading.' },
        { title: 'Enrollments', body: 'Check enrolled courses and waitlists.' },
        { title: 'Resources', body: 'Access course materials and contact instructors.' }
      ]
    };
    return mapping[role] || [];
  }, [role]);

  const displayName = useMemo(() => {
    const src = user || (() => {
      try {
        const raw = localStorage.getItem('currentUser');
        return raw ? JSON.parse(raw) : null;
      } catch (e) {
        return null;
      }
    })();
    if (!src) return 'User';
    const nameFields = [src.name, src.fullName, src.displayName, src.firstName ? `${src.firstName} ${src.lastName || ''}` : undefined];
    for (const f of nameFields) {
      if (f && typeof f === 'string' && f.trim()) return f.trim();
    }
    const email = src.email;
    if (email && typeof email === 'string') {
      const local = email.split('@')[0];
      const parts = local.split(/[._\-]/).filter(Boolean);
      const human = parts.map((p: string) => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
      if (human) return human;
    }
    return 'User';
  }, [user]);

  useEffect(() => {
    // progress updater: fill to 100 over AUTO_CONTINUE_MS
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const pct = Math.min(100, Math.round((elapsed / AUTO_CONTINUE_MS) * 100));
      setProgress(pct);
      if (pct >= 100) return;
      requestAnimationFrame(tick);
    };
    const raf = requestAnimationFrame(tick);

    const auto = setTimeout(() => onContinue(), AUTO_CONTINUE_MS);
    return () => { clearTimeout(auto); cancelAnimationFrame(raf); };
  }, [onContinue]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white to-blue-50 p-6">
      <div className="relative max-w-4xl w-full text-center bg-white rounded-3xl shadow-2xl p-8 md:p-12 overflow-hidden">
        {/* Decorative animated blobs */}
        <div
          aria-hidden
          className={`absolute -left-20 -top-20 w-56 h-56 rounded-full bg-gradient-to-br ${roleConfig.accent} opacity-30 blur-3xl animate-blob`}
        />
        <div
          aria-hidden
          className={`absolute -right-28 -bottom-24 w-72 h-72 rounded-full bg-gradient-to-br from-yellow-300 to-amber-400 opacity-25 blur-2xl animate-blob animation-delay-2000`}
        />

        <div className="relative z-10">
          <div className="flex items-center justify-center space-x-4 mb-6">
            <div className={`p-3 rounded-full bg-gradient-to-r ${roleConfig.accent} text-white shadow-lg`}>
              {/* role icon */}
              {React.createElement(roleConfig.icon, { className: 'w-7 h-7' })}
            </div>
            <div className="text-left">
              <h2 className="text-2xl md:text-3xl font-extrabold">Welcome back, {displayName}</h2>
              <p className="text-sm text-gray-600">Preparing your {roleConfig.title} dashboard</p>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4 mb-6">
            {tips.map((t: Tip, i: number) => (
              <button
                key={t.title}
                onClick={() => setActiveTip(i === activeTip ? null : i)}
                className={`text-left p-4 rounded-xl border transition-shadow hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 ${activeTip === i ? 'bg-white shadow-lg border-gray-200' : 'bg-gray-50 border-transparent'}`}
                aria-expanded={activeTip === i}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">{t.title}</p>
                    <p className="text-xs text-gray-500">{activeTip === i ? t.body : t.body.substring(0, 40) + (t.body.length > 40 ? '…' : '')}</p>
                  </div>
                  <div className="ml-3 text-xs text-gray-400">Tip</div>
                </div>
                {activeTip === i && (
                  <div className="mt-3 text-sm text-gray-600">{t.body}</div>
                )}
              </button>
            ))}
          </div>

          <div className="mt-4">
            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-indigo-500 to-blue-500 transition-all" style={{ width: `${progress}%` }} />
            </div>
            <div className="flex items-center justify-between mt-3">
              <p className="text-xs text-gray-500">Finishing setup — {progress}%</p>
              <div className="flex items-center gap-3">
                <Button variant="ghost" onClick={onContinue}>Skip</Button>
                <Button onClick={onContinue}>Continue</Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .animate-blob{animation:blob 8s infinite}
        .animation-delay-2000{animation-delay:2s}
        @keyframes blob{0%{transform:translate(0px,0px) scale(1)}33%{transform:translate(15px,-10px) scale(1.05)}66%{transform:translate(-10px,15px) scale(0.95)}100%{transform:translate(0px,0px) scale(1)}}
      `}</style>
    </div>
  );
}

