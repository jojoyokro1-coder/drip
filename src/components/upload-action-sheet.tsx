'use client';

import { useCallback, useRef } from 'react';
import { Camera, Images, X } from 'lucide-react';

interface UploadActionSheetProps {
  open: boolean;
  onClose: () => void;
  onFile: (file: File) => void;
}

export function UploadActionSheet({ open, onClose, onFile }: UploadActionSheetProps) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) onFile(f);
  }, [onFile]);

  if (!open) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        background: 'rgba(0,0,0,0.55)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.15s ease',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '400px',
          background: 'rgba(12,12,16,0.96)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '28px',
          padding: '8px',
          boxShadow: '0 24px 80px rgba(0,0,0,0.55)',
          marginBottom: 'calc(env(safe-area-inset-bottom, 0px) + 90px)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 12px 8px' }}>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: '15px' }}>Ajouter un look</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', padding: '4px' }}>
            <X size={20} />
          </button>
        </div>

        <button
          onClick={() => cameraRef.current?.click()}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: '14px',
            padding: '16px', border: 'none', background: 'none', cursor: 'pointer',
            borderRadius: '16px', color: '#fff', fontSize: '15px', fontWeight: 600,
            fontFamily: "'Space Grotesk', sans-serif", transition: 'background 0.15s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
        >
          <div style={{
            width: '48px', height: '48px', borderRadius: '14px',
            background: 'linear-gradient(135deg, rgba(255,59,92,0.2), rgba(192,19,94,0.1))',
            border: '1px solid rgba(255,59,92,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Camera size={22} color="#FF3B5C" />
          </div>
          <span>Prendre une photo</span>
        </button>

        <button
          onClick={() => galleryRef.current?.click()}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: '14px',
            padding: '16px', border: 'none', background: 'none', cursor: 'pointer',
            borderRadius: '16px', color: '#fff', fontSize: '15px', fontWeight: 600,
            fontFamily: "'Space Grotesk', sans-serif", transition: 'background 0.15s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
        >
          <div style={{
            width: '48px', height: '48px', borderRadius: '14px',
            background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(79,70,229,0.1))',
            border: '1px solid rgba(99,102,241,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Images size={22} color="#818cf8" />
          </div>
          <span>Choisir dans la galerie</span>
        </button>
      </div>

      <input ref={cameraRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={handleFileChange} />
      <input ref={galleryRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
    </div>
  );
}
