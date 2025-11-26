// frontend/src/components/Modal.tsx
import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    }}>
      <div style={{
        backgroundColor: 'var(--surface)',
        color: 'var(--text)',
        border: '1px solid var(--line)',
        padding: '20px 10px', // Intermediate horizontal padding
        borderRadius: '14px', // var(--radius)
        boxShadow: '0 10px 30px rgba(0,0,0,.5)', // Adjusted shadow for dark mode
        width: '90%',
        maxWidth: '500px', // Reverted max-width
        maxHeight: '90vh',
        overflowY: 'auto',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--line)', paddingBottom: '10px' }}>
          <h3 style={{ margin: 0 }}>{title}</h3>
          <button onClick={onClose} style={{ border: 'none', background: 'transparent', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--muted)' }}>
            &times;
          </button>
        </div>
        <div>
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
