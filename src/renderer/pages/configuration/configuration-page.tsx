import type React from 'react';
import { Link } from 'react-router-dom';

export const ConfigurationPage = (): React.JSX.Element => (
  <section className="products-page">
    <header className="page-header">
      <p className="products-page__eyebrow">Central de parametros</p>
      <h2 className="page-header__title">Configurações</h2>
      <p className="page-header__description">
        Organize os cadastros auxiliares usados por outras funcionalidades do aplicativo.
      </p>
    </header>

    <div className="configuration-grid">
      <Link aria-label="Grupos de Receitas" className="configuration-card" to="/configuration/groups">
        <p className="configuration-card__eyebrow">Dependencia de receitas</p>
        <h3 className="configuration-card__title">Grupos de Receitas</h3>
        <p className="configuration-card__description">
          Cadastre e mantenha as classificações obrigatórias usadas no fluxo de receitas.
        </p>
        <span className="configuration-card__action">Abrir cadastro</span>
      </Link>
    </div>
  </section>
);
