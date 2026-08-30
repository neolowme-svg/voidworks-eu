"use client";

import { useEffect, useRef, useState } from "react";

type Option = { value: string; label: string };

export function CustomSelect({ name, value, onChange, options, placeholder }: { name: string; value: string; onChange: (value: string) => void; options: Option[]; placeholder: string }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement | null>(null);
  const selected = options.find((option) => option.value === value);

  useEffect(() => {
    function close(event: MouseEvent) {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return <div className="custom-select" ref={root}>
    <input type="hidden" name={name} value={value} />
    <button className={`custom-select-trigger ${open ? "open" : ""}`} type="button" aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen((current) => !current)}>
      <span>{selected?.label || placeholder}</span><i aria-hidden="true" />
    </button>
    {open && <div className="custom-select-menu" role="listbox">
      {options.map((option) => <button key={option.value} type="button" role="option" aria-selected={option.value === value} className={option.value === value ? "selected" : ""} onClick={() => { onChange(option.value); setOpen(false); }}>
        <span>{option.label}</span>{option.value === value && <b>✓</b>}
      </button>)}
    </div>}
  </div>;
}
