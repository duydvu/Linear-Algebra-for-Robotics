import { type ReactNode } from 'react';

interface ControlsProps {
  children: ReactNode;
  className?: string;
}

/**
 * Controls - Container for interactive control elements
 */
export default function Controls({ children, className = '' }: ControlsProps) {
  return (
    <div className={`controls-container p-4 bg-base-200/30 rounded-xl border border-base-content/[0.06] space-y-4 ${className}`}>
      <div className="flex items-center gap-2 pb-3 border-b border-base-content/10">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
        </svg>
        <span className="text-xs font-semibold tracking-wide uppercase text-base-content/50">Controls</span>
      </div>
      {children}
    </div>
  );
}

interface SliderControlProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  showValue?: boolean;
  className?: string;
}

/**
 * SliderControl - Slider input with label and value display
 */
export function SliderControl({
  label,
  value,
  onChange,
  min,
  max,
  step = 0.01,
  unit = '',
  showValue = true,
  className = ''
}: SliderControlProps) {
  return (
    <div className={`slider-control ${className}`}>
      <div className="flex justify-between items-center mb-2">
        <label className="text-sm font-medium">{label}</label>
        {showValue && (
          <span className="text-sm font-mono bg-base-300 px-2 py-1 rounded">
            {value.toFixed(3)}{unit}
          </span>
        )}
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="range range-primary range-sm w-full"
      />
      <div className="flex justify-between text-xs text-base-content/60 mt-1">
        <span>{min}{unit}</span>
        <span>{max}{unit}</span>
      </div>
    </div>
  );
}

interface NumberInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  className?: string;
}

/**
 * NumberInput - Number input field with label
 */
export function NumberInput({
  label,
  value,
  onChange,
  min,
  max,
  step = 0.1,
  unit = '',
  className = ''
}: NumberInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value);
    if (!isNaN(newValue)) {
      if (min !== undefined && newValue < min) return;
      if (max !== undefined && newValue > max) return;
      onChange(newValue);
    }
  };

  return (
    <div className={`number-input ${className}`}>
      <label className="text-sm font-medium block mb-2">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={value}
          onChange={handleChange}
          min={min}
          max={max}
          step={step}
          className="input input-bordered input-sm w-full max-w-xs"
        />
        {unit && <span className="text-sm text-base-content/60">{unit}</span>}
      </div>
    </div>
  );
}

interface VectorInputProps {
  label: string;
  value: { x: number; y: number; z?: number };
  onChange: (value: { x: number; y: number; z?: number }) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
}

/**
 * VectorInput - Input for 2D or 3D vectors
 */
export function VectorInput({
  label,
  value,
  onChange,
  min = -10,
  max = 10,
  step = 0.1,
  className = ''
}: VectorInputProps) {
  const is3D = 'z' in value && value.z !== undefined;

  return (
    <div className={`vector-input ${className}`}>
      <label className="text-sm font-medium block mb-2">{label}</label>
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="text-xs text-base-content/60">x</label>
          <input
            type="number"
            value={value.x}
            onChange={(e) => onChange({ ...value, x: parseFloat(e.target.value) || 0 })}
            min={min}
            max={max}
            step={step}
            className="input input-bordered input-sm w-full"
          />
        </div>
        <div>
          <label className="text-xs text-base-content/60">y</label>
          <input
            type="number"
            value={value.y}
            onChange={(e) => onChange({ ...value, y: parseFloat(e.target.value) || 0 })}
            min={min}
            max={max}
            step={step}
            className="input input-bordered input-sm w-full"
          />
        </div>
        {is3D && (
          <div>
            <label className="text-xs text-base-content/60">z</label>
            <input
              type="number"
              value={value.z}
              onChange={(e) => onChange({ ...value, z: parseFloat(e.target.value) || 0 })}
              min={min}
              max={max}
              step={step}
              className="input input-bordered input-sm w-full"
            />
          </div>
        )}
      </div>
    </div>
  );
}

interface ButtonControlProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
}

/**
 * ButtonControl - Button with various styles
 */
export function ButtonControl({
  label,
  onClick,
  variant = 'primary',
  size = 'sm',
  disabled = false,
  className = ''
}: ButtonControlProps) {
  const variantClass = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    outline: 'btn-outline'
  }[variant];

  const sizeClass = {
    sm: 'btn-sm',
    md: 'btn-md',
    lg: 'btn-lg'
  }[size];

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`btn ${variantClass} ${sizeClass} ${className}`}
    >
      {label}
    </button>
  );
}

interface SelectControlProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  className?: string;
}

/**
 * SelectControl - Dropdown select control
 */
export function SelectControl({
  label,
  value,
  onChange,
  options,
  className = ''
}: SelectControlProps) {
  return (
    <div className={`select-control ${className}`}>
      <label className="text-sm font-medium block mb-2">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="select select-bordered select-sm w-full max-w-xs"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

interface CheckboxControlProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
}

/**
 * CheckboxControl - Checkbox with label
 */
export function CheckboxControl({
  label,
  checked,
  onChange,
  className = ''
}: CheckboxControlProps) {
  return (
    <div className={`checkbox-control flex items-center gap-2 ${className}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="checkbox checkbox-primary checkbox-sm"
      />
      <label className="text-sm cursor-pointer" onClick={() => onChange(!checked)}>
        {label}
      </label>
    </div>
  );
}

interface ResultDisplayProps {
  title?: string;
  children: ReactNode;
  className?: string;
}

/**
 * ResultDisplay - Display computed results
 */
export function ResultDisplay({ title, children, className = '' }: ResultDisplayProps) {
  return (
    <div className={`result-display bg-primary/[0.04] border border-primary/10 p-3 rounded-lg ${className}`}>
      {title && <h4 className="text-sm font-semibold mb-2">{title}</h4>}
      <div className="text-sm font-mono space-y-1">{children}</div>
    </div>
  );
}

interface MatrixDisplayProps {
  title?: string;
  matrix: number[][];
  precision?: number;
  highlight?: boolean;
  className?: string;
}

/**
 * MatrixDisplay - Display a matrix in formatted style
 */
export function MatrixDisplay({
  title,
  matrix,
  precision = 3,
  highlight = false,
  className = ''
}: MatrixDisplayProps) {
  return (
    <div className={`matrix-display ${className}`}>
      {title && <h4 className="text-sm font-semibold mb-2">{title}</h4>}
      <div
        className={`font-mono text-xs p-3 rounded-lg ${
          highlight ? 'bg-primary/10 border-2 border-primary' : 'bg-base-300/50'
        }`}
      >
        <table className="mx-auto">
          <tbody>
            {matrix.map((row, i) => (
              <tr key={i}>
                <td className="pr-1">[</td>
                {row.map((val, j) => (
                  <td key={j} className="px-2 text-right">
                    {val.toFixed(precision)}
                  </td>
                ))}
                <td className="pl-1">]</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
