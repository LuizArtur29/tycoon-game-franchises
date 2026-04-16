
import Decimal from 'break_infinity.js';
import { formatMoney } from '@/engine/utils';
import './CurrencyDisplay.css';

interface CurrencyDisplayProps {
  value: Decimal;
  icon?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'money' | 'premium';
  showPlus?: boolean;
}

export function CurrencyDisplay({
  value,
  icon = '💰',
  size = 'md',
  variant = 'money',
  showPlus = false,
}: CurrencyDisplayProps) {
  const formatted = formatMoney(value);
  const displayValue = showPlus && value.gt(0) && !formatted.startsWith('-') 
    ? `+${formatted}` 
    : formatted;

  return (
    <div className={`tf-currency tf-currency-${size} tf-currency-${variant}`}>
      <span className="tf-currency-icon">{icon}</span>
      <span className="tf-currency-value">{displayValue}</span>
    </div>
  );
}
