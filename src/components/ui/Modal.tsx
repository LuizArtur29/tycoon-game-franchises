import React, { useEffect } from 'react';
import './Modal.css';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  disableBackdropClick?: boolean;
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  disableBackdropClick = false,
}: ModalProps) {
  // Prevent body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="tf-modal-overlay"
      onClick={disableBackdropClick ? undefined : onClose}
    >
      <div 
        className="tf-modal-content"
        onClick={e => e.stopPropagation()} // Prevent bubbling to overlay
      >
        <div className="tf-modal-header">
          <div className="tf-modal-title">
            <span className="tf-modal-title-text">{title}</span>
          </div>
          {!disableBackdropClick && (
            <button className="tf-modal-close" onClick={onClose}>
              ×
            </button>
          )}
        </div>
        <div className="tf-modal-body">
          {children}
        </div>
      </div>
    </div>
  );
}
