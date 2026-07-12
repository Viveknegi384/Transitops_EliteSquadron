'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function TopHeader() {
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) setUser(JSON.parse(userData));
  }, []);

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  return (
    <header className="top-header">
      {/* Search bar */}
      <div className="search-bar" style={{ flex: '0 1 384px' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#45556c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input type="text" placeholder="Search trips, vehicles, drivers..." readOnly />
        <span className="search-kbd">⌘K</span>
      </div>

      {/* Right side actions */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12 }}>
        {/* Notification bell */}
        <button className="notif-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          <span className="notif-dot" />
        </button>

        {/* Role badge */}
        {user && (
          <span className="role-badge-header">{user.role}</span>
        )}

        {/* Avatar + name */}
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="user-avatar">{initials}</div>
            <span style={{ fontSize: 14, fontWeight: 500, color: '#fff', whiteSpace: 'nowrap' }}>
              {user.name}
            </span>
          </div>
        )}
      </div>
    </header>
  );
}
