import type React from 'react';

import { formatCurrencyMaskedDisplay } from '../../shared/currency-input';

export type CurrencyMaskedInputProps = {
  name?: string;
  id?: string;
  className?: string;
  digits: string;
  onDigitsChange: (digits: string) => void;
  autoComplete?: string;
  required?: boolean;
  ariaInvalid?: boolean;
  ariaDescribedBy?: string;
};

export const CurrencyMaskedInput = ({
  name,
  id,
  className,
  digits,
  onDigitsChange,
  autoComplete = 'off',
  required = false,
  ariaInvalid = false,
  ariaDescribedBy,
}: CurrencyMaskedInputProps): React.JSX.Element => {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextDigits = event.target.value.replace(/\D/g, '');
    onDigitsChange(nextDigits);
  };

  return (
    <input
      autoComplete={autoComplete}
      aria-describedby={ariaDescribedBy}
      aria-invalid={ariaInvalid}
      className={className}
      id={id}
      inputMode="numeric"
      name={name}
      onChange={handleChange}
      required={required}
      type="text"
      value={formatCurrencyMaskedDisplay(digits)}
    />
  );
};
