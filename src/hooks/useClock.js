import { useState, useEffect, useMemo } from 'react';

/**
 * Live clock hook — updates every second.
 * @param {object} options
 * @param {string} options.format - '12h' or '24h'
 * @param {boolean} options.showSeconds - show seconds in time string
 * @returns {{ time: string, date: string, greeting: string, hours: number }}
 */
export function useClock({ format = '12h', showSeconds = true } = {}) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return useMemo(() => {
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();

    let timeStr;
    if (format === '12h') {
      const h = hours % 12 || 12;
      const ampm = hours >= 12 ? 'PM' : 'AM';
      timeStr = `${h}:${minutes.toString().padStart(2, '0')}`;
      if (showSeconds) timeStr += `:${seconds.toString().padStart(2, '0')}`;
      timeStr += ` ${ampm}`;
    } else {
      timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      if (showSeconds) timeStr += `:${seconds.toString().padStart(2, '0')}`;
    }

    const dateStr = now.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });

    let greeting;
    if (hours < 12) greeting = 'Good Morning';
    else if (hours < 17) greeting = 'Good Afternoon';
    else greeting = 'Good Evening';

    return { time: timeStr, date: dateStr, greeting, hours };
  }, [now, format, showSeconds]);
}
