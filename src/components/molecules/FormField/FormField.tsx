import React from 'react';
import styles from './FormField.module.scss';

import {
  ComboBox,
  type ComboBoxProps,
  Input,
  type InputProps,
  PasswordInput,
  Text,
} from '@/components';

type BaseProps = {
  label: string;
  errorMessage?: string;
  helperText?: string;
  id?: string;
  error?: boolean;
  required?: boolean;
};

// Discriminated union based on 'type'
type FormFieldInputProps = BaseProps & InputProps & { type: InputProps['type'] };
type FormFieldPasswordProps = BaseProps & Omit<InputProps, 'type' | 'id' | 'error'> & { type: 'password' }
type FormFieldComboBoxProps = BaseProps & ComboBoxProps & { type: 'combobox' };

export type FormFieldProps =
  | FormFieldInputProps
  | FormFieldPasswordProps
  | FormFieldComboBoxProps;

export const FormField: React.FC<FormFieldProps> = ({
  label,
  errorMessage,
  helperText,
  error = false,
  id,
  ...props
}) => {
  const renderField = () => {
    const { type } = props;

    switch (type) {
      case 'password':
        return <PasswordInput id={id} error={error} {...(props as Omit<InputProps, 'type'>)} />;
      case 'combobox':
        return <ComboBox id={id} error={error} {...(props as ComboBoxProps)} />;
      default:
        return <Input placeholder='Ingresa tu correo' variant='createSale' id={id} type={type} error={error} {...(props as InputProps)} />;
    }
  };

  return (
    <div className={styles.formField}>
      <Text as="label" size="md" weight={500} color="neutral-secondary" align="left">
        {label}
      </Text>
      <div className={styles.inputContainer}>
        {renderField()}
        {error && errorMessage && (
          <Text as="span" size="xs" color="danger" className={styles.errorMessage}>
            {errorMessage}
          </Text>
        )}
        {!error && helperText && (
          <Text as="span" size="xs" color="neutral-secondary" className={styles.helperText}>
            {helperText}
          </Text>
        )}
      </div>
    </div>
  );
};

export default FormField;