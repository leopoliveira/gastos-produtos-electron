import type React from 'react';
import { NavLink } from 'react-router-dom';

type SidebarItem = {
  path: string;
  label: string;
};

type SidebarProps = {
  items: SidebarItem[];
};

export const Sidebar = ({ items }: SidebarProps): React.JSX.Element => (
  <aside className="sidebar">
    <div className="sidebar__brand">
      <h1 className="sidebar__title">Amo Doces</h1>
    </div>

    <nav className="sidebar__nav" aria-label="Navegacao principal">
      {items.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) => `sidebar__link${isActive ? ' sidebar__link--active' : ''}`}
          end={item.path === '/'}
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  </aside>
);
