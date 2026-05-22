import React from 'react';
import { useClock } from '../../hooks/useClock';
import { useApp } from '../../context/AppContext';

export default function Clock() {
  const { state } = useApp();
  const { time, date, greeting } = useClock({
    format: state.settings.clockFormat,
    showSeconds: state.settings.showSeconds,
  });

  const displayName = state.settings.userName ? `, ${state.settings.userName}` : '';

  return (
    <div className="animate-fade-in select-none">
      {state.settings.showGreeting && (
        <p className="text-sm font-medium tracking-wide mb-1 opacity-80" style={{ color: 'var(--accent-color)' }}>
          {greeting}{displayName}
        </p>
      )}
      <h1 className="text-4xl md:text-5xl font-bold tracking-tight tabular-nums" style={{ color: 'var(--text-primary)' }}>
        {time}
      </h1>
      <p className="text-sm mt-1.5 font-light" style={{ color: 'var(--text-secondary)' }}>
        {date}
      </p>
    </div>
  );
}
