import type React from 'react';
import { NavLink } from 'react-router-dom';
import styles from './sidebar.module.css';

type SidebarItem = {
  path: string;
  label: string;
};

type SidebarProps = {
  items: SidebarItem[];
};

export const Sidebar = ({ items }: SidebarProps): React.JSX.Element => (
  <aside className={styles.sidebar}>
    <div className={styles.brand}>
      <h1 className={styles.title}>Amo Doces</h1>
    </div>

    <nav className={styles.nav} aria-label="Navegacao principal">
      {items.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) =>
            [styles.link, isActive ? styles.linkActive : null].filter(Boolean).join(' ')
          }
          end={item.path === '/'}
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  </aside>
);
