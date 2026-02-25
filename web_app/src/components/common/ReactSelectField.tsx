import React, { useMemo } from 'react';
import Select, {
  MultiValue,
  SingleValue,
  StylesConfig,
  GroupBase,
} from 'react-select';

export type Option = {
  label: string;
  value: string;
};

interface ReactSelectFieldProps {
  options: Option[];
  value: Option | Option[] | null;
  onChange: (value: Option | Option[] | null) => void;
  isMulti?: boolean;
  placeholder?: string;
  isLoading?: boolean;
  isClearable?: boolean;
  isDisabled?: boolean;
  className?: string;
}

export const ReactSelectField: React.FC<ReactSelectFieldProps> = ({
  options,
  value,
  onChange,
  isMulti = false,
  placeholder = 'Select...',
  isLoading = false,
  isClearable = true,
  isDisabled = false,
  className,
}) => {
  const handleChange = (
    selected: MultiValue<Option> | SingleValue<Option>
  ): void => {
    if (isMulti) {
      onChange(selected as Option[]);
    } else {
      onChange(selected as Option | null);
    }
  };

  console.log(options);

  const customStyles: StylesConfig<Option, boolean, GroupBase<Option>> = useMemo(
    () => ({
      control: (base, state) => ({
        ...base,
        minHeight: '48px',
        borderRadius: '12px',
        backgroundColor: 'var(--select-bg, #f8fafc)',
        borderColor: state.isFocused ? '#3b82f6' : '#e2e8f0',
        boxShadow: state.isFocused ? '0 0 0 2px rgba(59,130,246,0.2)' : 'none',
        transition: 'all 0.2s ease',
        '&:hover': {
          borderColor: '#3b82f6',
        },
      }),
      menu: (base) => ({
        ...base,
        borderRadius: '12px',
        overflow: 'hidden',
        zIndex: 50,
      }),
      option: (base, state) => ({
        ...base,
        backgroundColor: state.isSelected
          ? '#e2e8f0'
          : state.isFocused
            ? '#f1f5f9'
            : 'white',
        color: '#1e293b',
        cursor: 'pointer',
        transition: 'background-color 0.2s ease',
      }),
      multiValue: (base) => ({
        ...base,
        backgroundColor: '#e2e8f0',
        borderRadius: '8px',
      }),
      multiValueLabel: (base) => ({
        ...base,
        padding: '4px 8px',
      }),
      multiValueRemove: (base) => ({
        ...base,
        borderRadius: '0 8px 8px 0',
        '&:hover': {
          backgroundColor: '#cbd5e1',
          color: '#475569',
        },
      }),
      placeholder: (base) => ({
        ...base,
        color: '#94a3b8',
      }),
      indicatorSeparator: (base) => ({
        ...base,
        backgroundColor: '#e2e8f0',
      }),
      // Add this to style the input container
      input: (base) => ({
        ...base,
        '& input': {
          boxShadow: 'none !important',
          outline: 'none !important',
        },
      }),
    }),
    []
  );

  return (
    <Select<Option, boolean>
      options={options}
      value={value}
      onChange={handleChange}
      isMulti={isMulti}
      isLoading={isLoading}
      isClearable={isClearable}
      isDisabled={isDisabled}
      placeholder={placeholder}
      styles={customStyles}
      className={className}
      // Change this to remove the default class names
      classNamePrefix="custom-select" // Change from "react-select" to something else
      // OR remove it completely by setting it to undefined
      // classNamePrefix={undefined}
      unstyled={false}
    />
  );
};