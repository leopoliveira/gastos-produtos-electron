import type React from 'react';
import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

import { exportDatabaseBackup, importDatabaseBackup } from '../../services/backup-service';
import ui from '../../styles/shared-ui.module.css';
import styles from './configuration-page.module.css';

const getErrorMessage = (error: unknown, fallbackMessage: string): string => {
  if (typeof error === 'object' && error !== null) {
    const candidate = error as { detail?: string; message?: string };
    return candidate.detail ?? candidate.message ?? fallbackMessage;
  }

  return fallbackMessage;
};

export const ConfigurationPage = (): React.JSX.Element => {
  const [backupBusy, setBackupBusy] = useState(false);

  const handleExportBackup = useCallback(async () => {
    if (backupBusy) {
      return;
    }

    setBackupBusy(true);

    try {
      const result = await exportDatabaseBackup();

      if (result.canceled) {
        toast.info('Exportação cancelada.');
        return;
      }

      toast.success('Backup exportado com sucesso.');
    } catch (exportError) {
      toast.error(
        getErrorMessage(exportError, 'Não foi possível exportar o backup.'),
      );
    } finally {
      setBackupBusy(false);
    }
  }, [backupBusy]);

  const handleImportBackup = useCallback(async () => {
    if (backupBusy) {
      return;
    }

    setBackupBusy(true);

    try {
      const result = await importDatabaseBackup();

      if (result.canceled) {
        toast.info('Importação cancelada.');
        return;
      }

      toast.success('Backup importado com sucesso. A página será recarregada em instantes.');
    } catch (importError) {
      toast.error(getErrorMessage(importError, 'Não foi possível importar o backup.'));
    } finally {
      setBackupBusy(false);
    }
  }, [backupBusy]);

  return (
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

        <button
          aria-label="Exportar backup do banco de dados"
          className={styles.configurationCard}
          disabled={backupBusy}
          type="button"
          onClick={() => void handleExportBackup()}
        >
          <p className={styles.configurationCardEyebrow}>Dados locais</p>
          <h3 className={styles.configurationCardTitle}>Exportar backup</h3>
          <p className={styles.configurationCardDescription}>
            Abre a pasta de Documentos do sistema com um nome sugerido; você pode navegar para qualquer pasta
            e definir o nome final do arquivo .db antes de salvar.
          </p>
          <span className={styles.configurationCardAction}>
            {backupBusy ? 'Aguarde…' : 'Exportar backup…'}
          </span>
        </button>

        <button
          aria-label="Importar backup do banco de dados"
          className={styles.configurationCard}
          disabled={backupBusy}
          type="button"
          onClick={() => void handleImportBackup()}
        >
          <p className={styles.configurationCardEyebrow}>Dados locais</p>
          <h3 className={styles.configurationCardTitle}>Importar backup</h3>
          <p className={styles.configurationCardDescription}>
            Restaure os dados a partir de um arquivo .db gerado por este aplicativo. O conteúdo atual será
            substituído.
          </p>
          <span className={styles.configurationCardAction}>
            {backupBusy ? 'Aguarde…' : 'Escolher arquivo e importar'}
          </span>
        </button>
      </div>
    </section>
  );
};
