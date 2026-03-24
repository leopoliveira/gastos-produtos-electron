import type React from 'react';
import { Link } from 'react-router-dom';
import ui from '../../styles/shared-ui.module.css';
import styles from './configuration-page.module.css';

export const ConfigurationPage = (): React.JSX.Element => (
  <section className={ui.page}>
    <header className="page-header">
      <p className={ui.eyebrow}>Central de parametros</p>
      <h2 className="page-header__title">Configurações</h2>
      <p className="page-header__description">
        Organize os cadastros auxiliares usados por outras funcionalidades do aplicativo.
      </p>
    </header>

    <div className={styles.configurationGrid}>
      <Link aria-label="Grupos de Receitas" className={styles.configurationCard} to="/configuration/groups">
        <p className={styles.configurationCardEyebrow}>Dependencia de receitas</p>
        <h3 className={styles.configurationCardTitle}>Grupos de Receitas</h3>
        <p className={styles.configurationCardDescription}>
          Cadastre e mantenha as classificações obrigatórias usadas no fluxo de receitas.
        </p>
        <span className={styles.configurationCardAction}>Abrir cadastro</span>
      </Link>
    </div>
  </section>
);
