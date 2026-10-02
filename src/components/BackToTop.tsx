'use client';
import { useEffect, useState } from 'react';

export default function BackToTop() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const handleScroll = () => setVisible(window.scrollY > 150);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });
  if (!visible) return null;
  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="Back to top"
      title="返回顶部"
      style={{
        position: 'fixed',
        right: '24px',
        bottom: '28px',
        zIndex: 9999,
        width: '46px',
        height: '46px',
        borderRadius: '50%',
        backgroundColor: '#24231f',
        border: '1.5px solid #f0b24a',
        color: '#f0b24a',
        boxShadow: '0 6px 20px rgba(240, 178, 74, 0.25), 0 2px 8px rgba(0,0,0,0.8)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-3px)';
        e.currentTarget.style.borderColor = '#ffd27a';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.borderColor = '#f0b24a';
      }}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 15l-6-6-6 6" />
      </svg>
    </button>
  );
}
