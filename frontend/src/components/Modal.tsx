import { ReactNode, useEffect, useRef, useId } from 'react';

export default function Modal({ title, subtitle, onClose, children, className = '', open = true, preload = false, hideHeader = false }: { title: string; subtitle?: string; onClose: () => void; children: ReactNode; className?: string; open?: boolean; preload?: boolean; hideHeader?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    if (!open) { ref.current?.close(); return; }
    const previous = document.activeElement as HTMLElement | null;
    const dialog = ref.current;
    dialog?.showModal();
    return () => { dialog?.close(); if (previous?.isConnected) previous.focus(); };
  }, [open]);
  return <dialog ref={ref} className={`explore-dialog ${preload ? 'preload-dialog' : ''} ${className}`} aria-hidden={!open} {...(!open ? { inert: '' } : {})} aria-labelledby={titleId} onCancel={e => { e.preventDefault(); onClose(); }} onClick={e => { if (open && e.target === ref.current) onClose(); }}>
    <div className="dialog-inner">
      {hideHeader ? <h2 id={titleId} className="sr-only">{title}</h2> : <header className="dialog-header"><div>{subtitle && <p className="eyebrow">{subtitle}</p>}<h2 id={titleId}>{title}</h2></div><button className="icon-button" onClick={onClose} aria-label="Đóng cửa sổ">✕</button></header>}
      {children}
    </div>
  </dialog>;
}
