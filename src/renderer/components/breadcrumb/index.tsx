import React from 'react';
import { Link } from 'react-router-dom';
import styles from './breadcrumb.module.css';

type BreadcrumbItem = {
  label: string;
  to?: string;
};

type BreadcrumbProps = {
  items: BreadcrumbItem[];
};

export const Breadcrumb = ({ items }: BreadcrumbProps): React.JSX.Element => (
  <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
    {items.map((item, index) => (
      <React.Fragment key={`${item.label}-${index}`}>
        {index > 0 ? (
          <span className={styles.separator} aria-hidden="true">
            /
          </span>
        ) : null}
        {item.to ? <Link to={item.to}>{item.label}</Link> : item.label}
      </React.Fragment>
    ))}
  </nav>
);
