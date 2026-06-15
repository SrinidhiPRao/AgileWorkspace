import { useState } from 'react';

export function Toggle({ defaultChecked = false, onChange }) {
  const [checked, setChecked] = useState(defaultChecked);

  const handleChange = (e) => {
    setChecked(e.target.checked);
    onChange?.(e.target.checked);
  };

  return (
    <label className="toggle-switch">
      <input type="checkbox" checked={checked} onChange={handleChange} />
      <span className="toggle-track" />
    </label>
  );
}
