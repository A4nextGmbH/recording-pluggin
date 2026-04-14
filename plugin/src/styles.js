export const cssStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');

  :host {
    --primary: #06b6d4; /* bright cyan */
    --primary-hover: #0891b2;
    --danger: #ef4444;
    --danger-hover: #dc2828;
    --bg-surface: rgba(255, 255, 255, 0.95);
    --border: rgba(0, 0, 0, 0.1);
    --text-main: #111827;
    --text-muted: #6b7280;
    --shadow-sm: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    --shadow-lg: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    
    font-family: 'Inter', system-ui, sans-serif;
  }

  * {
    box-sizing: border-box;
  }

  .trigger-btn {
    position: fixed;
    bottom: 24px;
    right: 24px;
    background: var(--primary);
    color: white;
    border: none;
    border-radius: 50%;
    padding: 8px;
    width: 40px;
    height: 40px;
    font-weight: 600;
    font-size: 0; /* hide any text, use icon only */
    cursor: pointer;
    box-shadow: var(--shadow-sm);
    transition: all 0.2s ease;
    z-index: 999999;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0;
  }

  .trigger-btn:hover {
    background: var(--primary-hover);
    transform: translateY(-2px);
    box-shadow: var(--shadow-lg);
  }

  .trigger-btn.recording {
    background: var(--danger);
    animation: pulse 2s infinite;
  }

  .trigger-btn.recording:hover {
    background: var(--danger-hover);
  }

  .trigger-btn svg {
    width: 18px;
    height: 18px;
    display: block;
    margin: 0 auto;
  }

  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(4px);
    z-index: 999999;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.3s ease;
  }

  .modal-overlay.open {
    opacity: 1;
    pointer-events: all;
  }

  .modal-content {
    background: var(--bg-surface);
    backdrop-filter: blur(16px);
    width: 100%;
    max-width: 500px;
    border-radius: 16px;
    padding: 32px;
    box-shadow: var(--shadow-lg);
    border: 1px solid var(--border);
    transform: scale(0.95) translateY(10px);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .modal-overlay.open .modal-content {
    transform: scale(1) translateY(0);
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
  }

  .header h2 {
    margin: 0;
    font-size: 20px;
    font-weight: 600;
    color: var(--text-main);
  }

  .close-btn {
    background: transparent;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    transition: background 0.2s;
  }

  .close-btn:hover {
    background: rgba(0,0,0,0.05);
    color: var(--text-main);
  }

  .form-group {
    margin-bottom: 20px;
  }

  .form-group label {
    display: block;
    font-size: 14px;
    font-weight: 500;
    color: var(--text-main);
    margin-bottom: 8px;
  }

  .input-field {
    width: 100%;
    padding: 10px 14px;
    border: 1px solid var(--border);
    border-radius: 8px;
    font-size: 14px;
    font-family: inherit;
    transition: border-color 0.2s, box-shadow 0.2s;
  }

  .input-field:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
  }

  textarea.input-field {
    resize: vertical;
    min-height: 80px;
  }

  .record-section {
    background: #f9fafb;
    border: 1px dashed var(--border);
    border-radius: 12px;
    padding: 24px;
    text-align: center;
    margin-bottom: 24px;
    transition: all 0.3s ease;
  }

  .record-btn {
    background: var(--primary);
    color: white;
    border: none;
    border-radius: 8px;
    padding: 10px 20px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.2s;
  }

  .record-btn:hover {
    background: var(--primary-hover);
  }

  .record-btn.recording {
    background: var(--danger);
    animation: pulse 2s infinite;
  }

  .record-btn.recording:hover {
    background: var(--danger-hover);
  }

  .video-preview {
    width: 100%;
    border-radius: 8px;
    margin-top: 16px;
    display: none;
    background: black;
  }

  .recording-indicator {
    display: none;
    align-items: center;
    justify-content: center;
    gap: 8px;
    color: var(--danger);
    font-weight: 500;
    font-size: 14px;
    margin-top: 12px;
  }

  .indicator-dot {
    width: 8px;
    height: 8px;
    background: var(--danger);
    border-radius: 50%;
    animation: pulse-dot 1s infinite;
  }

  .actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 32px;
  }

  .btn-secondary {
    background: transparent;
    color: var(--text-main);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 10px 20px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-secondary:hover {
    background: #f3f4f6;
  }

  .btn-primary {
    background: var(--primary);
    color: white;
    border: none;
    border-radius: 8px;
    padding: 10px 20px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.2s;
  }

  .btn-primary:hover {
    background: var(--primary-hover);
  }

  .btn-primary:disabled {
    background: #c7d2fe;
    cursor: not-allowed;
  }

  .error-message {
    color: var(--danger);
    font-size: 13px;
    margin-top: 8px;
    display: none;
  }

  .success-message {
    color: #10b981;
    background: #d1fae5;
    padding: 12px;
    border-radius: 8px;
    margin-bottom: 20px;
    font-size: 14px;
    font-weight: 500;
    display: none;
    text-align: center;
  }

  @keyframes pulse {
    0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
    70% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
    100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
  }

  @keyframes pulse-dot {
    0% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.5); opacity: 0.5; }
    100% { transform: scale(1); opacity: 1; }
  }
`;
