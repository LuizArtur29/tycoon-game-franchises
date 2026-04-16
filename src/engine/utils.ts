import Decimal from 'break_infinity.js';

/**
 * Formata um valor Decimal para exibição humana
 * Ex: 1000 → "1.00K", 1000000 → "1.00M"
 */
export function formatMoney(value: Decimal): string {
  const suffixes = [
    '', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc',
    'UDc', 'DDc', 'TDc', 'QaDc', 'QiDc', 'SxDc', 'SpDc', 'OcDc', 'NoDc', 'Vg',
  ];

  if (value.lt(1000)) {
    return `$${value.toFixed(0)}`;
  }

  const exponent = Math.floor(value.e / 3);
  const suffixIndex = Math.min(exponent, suffixes.length - 1);
  const mantissa = value.dividedBy(new Decimal(10).pow(exponent * 3));

  if (suffixIndex >= suffixes.length) {
    return `$${value.toExponential(2)}`;
  }

  return `$${mantissa.toFixed(2)}${suffixes[suffixIndex]}`;
}

/**
 * Formata um valor por segundo
 */
export function formatMoneyPerSecond(value: Decimal): string {
  return `${formatMoney(value)}/s`;
}

/**
 * Gera um ID único
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Formata segundos em tempo legível
 */
export function formatTime(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}
