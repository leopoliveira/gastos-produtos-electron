import type React from 'react';
import { Toaster } from 'sonner';

type AppProvidersProps = {
  children: React.ReactNode;
};

export const AppProviders = ({ children }: AppProvidersProps): React.JSX.Element => (
  <>
    {children}
    <Toaster richColors position="top-right" />
  </>
);
