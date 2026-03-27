import React from 'react';

export function Card({ children, style }) {
  return <div style={{ ...cardStyle, ...style }}>{children}</div>;
}

export function Button({ children, onClick, type = 'button', variant = 'primary', disabled, style }) {
  const base = {
    padding: '10px 20px',
    borderRadius: '8px',
    border: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontWeight: 600,
    fontSize: '0.9rem',
    opacity: disabled ? 0.6 : 1,
    transition: 'all 0.2s',
    ...style,
  };
  const variants = {
    primary: { background: '#2563eb', color: '#fff' },
    danger: { background: '#dc2626', color: '#fff' },
    success: { background: '#16a34a', color: '#fff' },
    secondary: { background: '#6b7280', color: '#fff' },
    outline: { background: 'transparent', color: '#2563eb', border: '2px solid #2563eb' },
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled} style={{ ...base, ...variants[variant] }}>
      {children}
    </button>
  );
}

export function Input({ label, id, error, ...props }) {
  return (
    <div style={{ marginBottom: '16px' }}>
      {label && <label htmlFor={id} style={labelStyle}>{label}</label>}
      <input id={id} style={{ ...inputStyle, ...(error ? { borderColor: '#dc2626' } : {}) }} {...props} />
      {error && <p style={{ color: '#dc2626', fontSize: '0.8rem', marginTop: '4px' }}>{error}</p>}
    </div>
  );
}

export function Alert({ type = 'info', children }) {
  const colors = {
    info: { background: '#dbeafe', color: '#1e40af', border: '#93c5fd' },
    success: { background: '#dcfce7', color: '#15803d', border: '#86efac' },
    error: { background: '#fee2e2', color: '#b91c1c', border: '#fca5a5' },
    warning: { background: '#fef9c3', color: '#a16207', border: '#fde047' },
  };
  const c = colors[type];
  return (
    <div style={{
      padding: '12px 16px',
      borderRadius: '8px',
      background: c.background,
      color: c.color,
      border: `1px solid ${c.border}`,
      marginBottom: '16px',
      fontSize: '0.9rem',
    }}>
      {children}
    </div>
  );
}

export function Spinner() {
  return (
    <div style={{ textAlign: 'center', padding: '40px' }}>
      <div style={{
        display: 'inline-block',
        width: '40px',
        height: '40px',
        border: '4px solid #e5e7eb',
        borderTop: '4px solid #2563eb',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export function Table({ columns, rows, emptyMessage = 'No data available' }) {
  if (!rows || rows.length === 0) {
    return <p style={{ color: '#6b7280', textAlign: 'center', padding: '24px' }}>{emptyMessage}</p>;
  }
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
        <thead>
          <tr style={{ background: '#f1f5f9' }}>
            {columns.map((col) => (
              <th key={col.key} style={thStyle}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ borderBottom: '1px solid #e5e7eb', background: i % 2 === 0 ? '#fff' : '#f8fafc' }}>
              {columns.map((col) => (
                <td key={col.key} style={tdStyle}>
                  {col.render ? col.render(row[col.key], row) : row[col.key] ?? '-'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const cardStyle = {
  background: '#fff',
  borderRadius: '12px',
  padding: '24px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  marginBottom: '24px',
};

const labelStyle = {
  display: 'block',
  marginBottom: '6px',
  fontWeight: 600,
  color: '#374151',
  fontSize: '0.9rem',
};

const inputStyle = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: '8px',
  border: '1.5px solid #d1d5db',
  fontSize: '0.95rem',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.2s',
};

const thStyle = {
  padding: '12px 16px',
  textAlign: 'left',
  fontWeight: 600,
  color: '#374151',
  borderBottom: '2px solid #e5e7eb',
};

const tdStyle = {
  padding: '10px 16px',
  color: '#374151',
};
