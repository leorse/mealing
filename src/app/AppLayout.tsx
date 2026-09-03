import { NavLink, Outlet } from 'react-router-dom';

const NAV_ITEMS = [
  { to: '/', icon: '/icons/nav/home.svg', label: 'Accueil' },
  { to: '/planning', icon: '/icons/nav/planning.svg', label: 'Planning' },
  { to: '/recipes', icon: '/icons/nav/legume.svg', label: 'Recettes' },
  { to: '/shopping', icon: '/icons/nav/caddie.svg', label: 'Courses' },
  { to: '/nutrition', icon: '/icons/nav/suivi.svg', label: 'Suivi' },
  { to: '/settings', icon: '/icons/nav/settings.svg', label: 'Réglages' },
];

export default function AppLayout() {
  return (
    <div className="app-shell">
      <main className="app-content">
        <Outlet />
      </main>
      <nav className="bottom-nav">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) => (isActive ? 'active' : '')}
            aria-label={item.label}
          >
            <img src={item.icon} alt="" className="nav-icon dark-invert" />
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
