import React from 'react';

function InputField({ label, type, name, value, onChange, placeholder, required }) {
  return (
    <div style={{ marginBottom: '1rem' }}>
      {label && <label htmlFor={name}>{label}</label>}
      <input
        id={name}
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        style={{
          display: 'block',
          width: '100%',
          padding: '0.3rem 0.5rem',
          fontSize: '0.95rem',
          background: '#181824',
          color: '#f8f9fa',
          border: '1px solid #333',
          borderRadius: '6px',
          marginTop: '0.25rem',
        }}
      />
    </div>
  );
}

export default InputField;