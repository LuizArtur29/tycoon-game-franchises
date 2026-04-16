
import './ProgressBar.css';

interface ProgressBarProps {
  progress: number; // 0 a 100
  color?: string;
  height?: number;
  label?: string;
}

export function ProgressBar({
  progress,
  color = '#2ecc71',
  height = 20,
  label,
}: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, progress));

  return (
    <div className="tf-progress-container" style={{ height }}>
      <div 
        className="tf-progress-fill" 
        style={{ width: `${percentage}%`, backgroundColor: color }}
      >
        <div className="tf-progress-highlight"></div>
      </div>
      {label && <span className="tf-progress-label">{label}</span>}
    </div>
  );
}
