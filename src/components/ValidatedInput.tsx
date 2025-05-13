import React, { useState, useRef, useEffect } from 'react';
import { Form } from 'react-bootstrap';

interface ValidatedInputProps {
  type: 'number';
  id: string;
  label?: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  size?: 'sm' | 'lg';
  required?: boolean;
  helpText?: string;
  className?: string;
  defaultValue?: number;
}

const ValidatedInput: React.FC<ValidatedInputProps> = ({
  type,
  id,
  label,
  value,
  onChange,
  min = 0,
  max = Infinity,
  step = 1,
  size,
  required = false,
  helpText,
  className,
  defaultValue
}) => {
  // We maintain an internal display value for editing
  const [displayValue, setDisplayValue] = useState<string>(value?.toString() || '');
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Update internal state when external value changes
  useEffect(() => {
    if (value !== undefined && value !== null && !isNaN(value)) {
      setDisplayValue(value.toString());
    }
  }, [value]);
  
  // Handle focus - select all text when focused
  const handleFocus = () => {
    if (inputRef.current) {
      inputRef.current.select();
    }
  };
  
  // Handle input change - update internal display value only
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDisplayValue(e.target.value);
  };
  
  // Handle blur - validate and update parent
  const handleBlur = () => {
    validateAndUpdate();
  };
  
  // Handle Enter key press - validate and update parent
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      validateAndUpdate();
      // Unfocus the input
      inputRef.current?.blur();
    }
  };
  
  // Validate input and update parent with valid value
  const validateAndUpdate = () => {
    let numValue = parseFloat(displayValue);
    
    // If empty or invalid, use default or minimum value
    if (displayValue === '' || isNaN(numValue)) {
      numValue = defaultValue !== undefined ? defaultValue : min;
    }
    
    // Clamp to min/max values
    numValue = Math.max(min, Math.min(max, numValue));
    
    // Update display value with validated number
    setDisplayValue(numValue.toString());
    
    // Notify parent component
    onChange(numValue);
  };
  
  return (
    <Form.Group controlId={id} className={className}>
      {label && <Form.Label>{label}</Form.Label>}
      <Form.Control
        ref={inputRef}
        type="number"
        value={displayValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        min={min}
        max={max}
        step={step}
        size={size}
        required={required}
      />
      {helpText && <Form.Text className="text-muted">{helpText}</Form.Text>}
    </Form.Group>
  );
};

export default ValidatedInput;
