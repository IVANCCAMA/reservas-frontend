import React from 'react';
import { UseFormRegister } from 'react-hook-form';

interface TextInputProps {
  name: string;
  label: React.ReactNode;
  handleChange?: (newValue: string | readonly string[] | number | undefined) => string | undefined;
  handleFocus?: (newValue: string | readonly string[] | number | undefined) => string | undefined;
  handleBlur?: (newValue: string | readonly string[] | number | undefined) => string | undefined;
  afterChange?: (newValue: string | readonly string[] | number | undefined) => void;
  afterFocus?: (newValue: string | readonly string[] | number | undefined) => void;
  afterBlur?: (newValue: string | readonly string[] | number | undefined) => void;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  placeholder?: string;
  autoComplete?: string;
  datalist?: string[];
  error?: string;
}

const TextInput = React.forwardRef<
  HTMLInputElement,
  TextInputProps & ReturnType<UseFormRegister<any>>
>(
  (
    {
      name,
      label,
      onChange = () => {},
      onBlur = () => {},
      handleChange = () => {},
      handleFocus = () => {},
      handleBlur = () => {},
      afterChange = () => {},
      afterFocus = () => {},
      afterBlur = () => {},
      required = false,
      minLength = 0,
      maxLength = 40,
      placeholder = undefined,
      autoComplete = undefined,
      datalist = undefined,
      error = undefined,
      disabled = false,
    },
    ref,
  ) => (
    <div className="input-component">
      <label htmlFor={name} className="form-label fw-bold">
        {label}
      </label>

      <input
        ref={ref}
        required={required}
        autoComplete={autoComplete || undefined}
        id={name}
        name={name}
        list={`datalist-${name}`}
        disabled={disabled}
        className="form-control"
        onChange={(e) => {
          const newValue = handleChange(e.target.value);
          if (newValue) {
            e.target.value = newValue;
          }
          onChange(e);
          afterChange(e.target.value);
        }}
        onFocus={(e) => {
          const newValue = handleFocus(e.target.value);
          if (newValue) {
            e.target.value = newValue;
          }
          afterFocus(e.target.value);
        }}
        onBlur={(e) => {
          const newValue = handleBlur(e.target.value);
          if (newValue) {
            e.target.value = newValue;
          }
          onBlur(e);
          afterBlur(e.target.value);
        }}
        minLength={minLength || undefined}
        maxLength={maxLength || undefined}
        placeholder={placeholder || undefined}
      />
      {error && <span className="text-danger">{error}</span>}

      {datalist && (
        <datalist id={`datalist-${name}`}>
          {datalist.map((value, index) => (
            <option key={`datalist-${name}-item-${index}`} value={value} />
          ))}
        </datalist>
      )}
    </div>
  ),
);

export default TextInput;
