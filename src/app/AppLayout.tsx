import { NavLink, Outlet } from 'react-router-dom';

const NAV_ITEMS = [
  { to: '/', label: 'Accueil' },
  { to: '/planning', label: 'Planning' },
  { to: '/shopping', label: 'Courses' },
  { to: '/nutrition', label: 'Suivi' },
  { to: '/settings', label: 'Réglages' },
];

export default function AppLayout() {
  return (
    <div className="app-shell">
      <main className="app-content">
        <Outlet />
      </main>
      <nav className="bottom-nav">
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.to === '/'} className={({ isActive }) => (isActive ? 'active' : '')}>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
