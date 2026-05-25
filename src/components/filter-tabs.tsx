import React from 'react';

interface FilterTab<T extends string> {
  key: T;
  label: string;
  icon: React.ReactNode;
}

interface FilterTabsProps<T extends string> {
  filter: T;
  setFilter: (key: T) => void;
  tabs: FilterTab<T>[];
}

export function FilterTabs<T extends string>({ filter, setFilter, tabs }: FilterTabsProps<T>) {
  const filterBarStyle: React.CSSProperties = {
    display: 'flex',
    gap: '8px',
    padding: '0 16px 20px',
    overflowX: 'auto',
    scrollbarWidth: 'none' as any,
  };

  return (
    <div style={filterBarStyle}>
      {tabs.map((tab) => {
        const active = filter === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '7px 14px',
              borderRadius: '999px',
              border: active ? '1px solid rgba(255,193,7,0.5)' : '1px solid rgba(255,255,255,0.07)',
              background: active
                ? 'linear-gradient(135deg, rgba(255,193,7,0.2), rgba(230,168,0,0.1))'
                : 'rgba(255,255,255,0.04)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              color: active ? '#FFC107' : '#555',
              fontSize: '12px',
              fontWeight: active ? 700 : 500,
              fontFamily: "'Space Grotesk', system-ui, sans-serif",
              cursor: 'pointer',
              transform: active ? 'translateY(-2px)' : 'translateY(0)',
              boxShadow: active
                ? '0 0 14px rgba(255,193,7,0.2), 0 4px 12px rgba(0,0,0,0.4)'
                : '0 2px 8px rgba(0,0,0,0.2)',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap',
            }}
          >
            <span style={{ color: active ? '#FFC107' : '#444' }}>{tab.icon}</span>
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
