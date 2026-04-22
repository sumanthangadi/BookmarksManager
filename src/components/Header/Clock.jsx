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
        <p className="text-brand-300 text-sm font-medium tracking-wide mb-1 opacity-80">
          {greeting}{displayName}
        </p>
      )}
      <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white tabular-nums">
        {time}
      </h1>
      <p className="text-gray-400 text-sm mt-1.5 font-light">
        {date}
      </p>
    </div>
  );
}
