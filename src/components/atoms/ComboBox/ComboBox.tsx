import React, { useState, useRef, useEffect } from 'react';
import styles from './ComboBox.module.scss';

/**
 * Componente SVG para la flecha del dropdown
 */
const DropdownArrowIcon: React.FC = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path 
      d="M3 4.5L6 7.5L9 4.5" 
      stroke="black" 
      strokeOpacity="0.25" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
);

/**
 * Componente SVG para el ícono de limpiar (X)
 */
const ClearIcon: React.FC<{ onClick: (e: React.MouseEvent) => void }> = ({ onClick }) => (
  <svg 
    width="12" 
    height="12" 
    viewBox="0 0 12 12" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    onClick={onClick}
    style={{ cursor: 'pointer' }}
  >
    <path 
      d="M9 3L3 9M3 3L9 9" 
      stroke="black" 
      strokeOpacity="0.25" 
      strokeWidth="1.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
);

/**
 * Interfaz para las opciones del ComboBox
 */
export interface ComboBoxOption {
  /** Valor único de la opción */
  value: string | number;
  /** Texto a mostrar para la opción */
  label: string;
}

/**
 * Props para el componente ComboBox
 */
export interface ComboBoxProps {
  /** Lista de opciones disponibles */
  options: ComboBoxOption[];
  /** Valor seleccionado actualmente */
  value?: string | number;
  /** Función que se ejecuta cuando cambia la selección */
  onChange?: (value: string | number) => void;
  /** Función que se ejecuta cuando cambia el texto de filtro */
  onFilterTextChange?: (text: string) => void;
  /** Texto placeholder cuando no hay selección */
  placeholder?: string;
  /** Si el componente está deshabilitado */
  disabled?: boolean;
  /** Si el componente tiene un error */
  error?: boolean;
  /** ID del elemento para accesibilidad */
  id?: string;
  /** Nombre del campo para formularios */
  name?: string;
  /** Variante visual del componente */
  variant?: 'default' | 'createSale';
  /** Tamaño del componente */
  size?: 'xs' | 'small' | 'medium' | 'large';
  /** Las opciones ya vienen filtradas (búsqueda en el servidor) */
  filtroExterno?: boolean;
}

/**
 * Componente ComboBox - Lista desplegable de opciones
 * Permite seleccionar una opción de una lista predefinida
 */
export const ComboBox: React.FC<ComboBoxProps> = ({
  options = [],
  value,
  onChange,
  onFilterTextChange,
  placeholder = '',
  disabled = false,
  error = false,
  id,
  name,
  variant = 'createSale',
  size = 'medium',
  filtroExterno = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState<ComboBoxOption | null>(
    options.find(option => option.value === value) || null
  );
  const [filterText, setFilterText] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const comboBoxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  /**
   * Maneja el clic fuera del componente para cerrar el dropdown
   */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (comboBoxRef.current && !comboBoxRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsEditing(false);
        setFilterText('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  /**
   * Actualiza la opción seleccionada cuando cambia el valor
   */
  useEffect(() => {
    const newSelectedOption = options.find(option => option.value === value) || null;
    setSelectedOption(newSelectedOption);
  }, [value, options]);

  /**
   * Filtra las opciones basándose en el texto ingresado
   */
  const filteredOptions = filtroExterno
    ? options
    : options.filter((option) =>
        option.label.toLowerCase().includes(filterText.toLowerCase()),
      );

  /**
   * Maneja la selección de una opción
   */
  const handleOptionSelect = (option: ComboBoxOption) => {
    setSelectedOption(option);
    setFilterText('');
    setIsEditing(false);
    setIsOpen(false);
    onChange?.(option.value);
  };

  /**
   * Alterna la apertura/cierre del dropdown
   */
  const toggleDropdown = () => {
    if (!disabled) {
      if (!isOpen) {
        setIsOpen(true);
        setIsEditing(true);
        setTimeout(() => inputRef.current?.focus(), 0);
      } else {
        setIsOpen(false);
        setIsEditing(false);
        setFilterText('');
      }
    }
  };

  /**
   * Limpia la selección actual
   */
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedOption(null);
    setFilterText('');
    setIsEditing(false);
    setIsOpen(false);
    onChange?.('');
  };

  /**
   * Maneja el cambio en el input de filtro
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setFilterText(text);
    onFilterTextChange?.(text);
    if (!isOpen) {
      setIsOpen(true);
    }
  };

  /**
   * Maneja el enfoque en el input
   */
  const handleInputFocus = () => {
    setIsEditing(true);
    setIsOpen(true);
  };

  /**
   * Maneja las teclas presionadas en el input
   */
  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      setIsEditing(false);
      setFilterText('');
    } else if (e.key === 'Enter' && filteredOptions.length > 0) {
      handleOptionSelect(filteredOptions[0]);
    }
  };

  const containerClassName = [
    styles.comboBox,
    styles[`comboBox--${size}`],
    variant !== 'default' && styles[`comboBox--${variant}`],
    error && styles['comboBox--error'],
    disabled && styles['comboBox--disabled'],
    isOpen && styles['comboBox--open'],
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={containerClassName} ref={comboBoxRef}>
      <div 
        className={styles.comboBox__trigger}
        onClick={!isEditing ? toggleDropdown : undefined}
        id={id}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={filterText}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onKeyDown={handleInputKeyDown}
            placeholder={placeholder}
            className={styles.comboBox__input}
            disabled={disabled}
          />
        ) : (
          <span 
            className={styles.comboBox__value}
            onClick={toggleDropdown}
          >
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        )}
        <span className={styles.comboBox__arrow}>
          {selectedOption ? (
            <ClearIcon onClick={handleClear} />
          ) : (
            <DropdownArrowIcon />
          )}
        </span>
      </div>

      {isOpen && (
        <div className={styles.comboBox__dropdown}>
          <ul className={styles.comboBox__options} role="listbox">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <li
                  key={option.value}
                  className={`${styles.comboBox__option} ${
                    selectedOption?.value === option.value ? styles['comboBox__option--selected'] : ''
                  }`}
                  onClick={() => handleOptionSelect(option)}
                  role="option"
                  aria-selected={selectedOption?.value === option.value}
                >
                  {option.label}
                </li>
              ))
            ) : (
              <li className={styles.comboBox__noResults}>
                No se encontraron resultados
              </li>
            )}
          </ul>
        </div>
      )}

      {/* Input oculto para formularios */}
      <input
        type="hidden"
        name={name}
        value={selectedOption?.value || ''}
      />
    </div>
  );
};
