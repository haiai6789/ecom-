
import React from 'react';

interface InputGroupProps {
  label: string;
  value: number;
  onChange: (val: number) => void;
  suffix?: string;
  placeholder?: string;
  step?: number;
  helperText?: string;
}

const InputGroup: React.FC<InputGroupProps> = ({ 
  label, 
  value, 
  onChange, 
  suffix = 'VNĐ', 
  placeholder, 
  step = 1000,
  helperText
}) => {
  return (
    <div className="mb-4">
      <label className="block text-sm font-semibold text-slate-700 mb-1">{label}</label>
      <div className="relative rounded-md shadow-sm">
        <input
          type="number"
          step={step}
          value={value === 0 ? '' : value}
          onChange={(e) => onChange(Number(e.target.value))}
          placeholder={placeholder}
          className="block w-full rounded-lg border-slate-200 border p-2.5 pr-12 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-white"
        />
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
          <span className="text-slate-400 sm:text-sm font-medium">{suffix}</span>
        </div>
      </div>
      {helperText && <p className="mt-1 text-xs text-slate-500 italic">{helperText}</p>}
    </div>
  );
};

export default InputGroup;
