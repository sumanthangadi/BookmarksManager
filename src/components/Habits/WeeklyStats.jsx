import React from 'react';
import { format, subDays } from 'date-fns';

export default function WeeklyStats({ habits, currentDate = new Date() }) {
  // Generate the last 7 days (including today as the last one)
  const last7Days = Array.from({ length: 7 }).map((_, i) => subDays(currentDate, 6 - i));

  const stats = last7Days.map((date, i) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayName = format(date, 'EEE');
    
    // Filter habits scheduled for this day
    const scheduledHabits = habits.filter(habit => {
      if (!habit.active) return false;
      if (habit.type === 'daily') return true;
      if (habit.type === 'custom' && habit.days && habit.days.includes(dayName)) return true;
      return false;
    });

    const total = scheduledHabits.length;
    let completed = 0;

    scheduledHabits.forEach(habit => {
      if (habit.completedDays && habit.completedDays.includes(dateStr)) {
        completed++;
      }
    });

    const percentage = total > 0 ? completed / total : 0;

    // Determine the color intensity based on completion percentage
    let bgClass = 'bg-white/5 border-white/5'; // Empty/0%
    if (percentage > 0 && percentage < 0.5) {
      bgClass = 'bg-brand-500/30 border-brand-500/30'; // Low activity
    } else if (percentage >= 0.5 && percentage < 1) {
      bgClass = 'bg-brand-500/60 border-brand-500/50'; // Medium activity
    } else if (percentage === 1 && total > 0) {
      bgClass = 'bg-brand-500 border-brand-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]'; // 100% activity
    }

    return {
      dateStr,
      dayName,
      bgClass,
      tooltip: `${format(date, 'MMM d')}: ${completed}/${total} completed`,
      isToday: i === 6
    };
  });

  return (
    <div className="mt-4 pt-4 border-t border-white/5">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-medium text-gray-400">Last 7 Days</h4>
      </div>
      
      <div className="flex items-center gap-2 justify-between">
        {stats.map(stat => (
          <div key={stat.dateStr} className="flex flex-col items-center gap-1.5 group relative">
            <div 
              className={`w-6 h-6 rounded border transition-all duration-300 ${stat.bgClass} ${stat.isToday ? 'ring-1 ring-white/20 ring-offset-1 ring-offset-transparent' : ''}`}
            />
            <span className={`text-[9px] font-medium uppercase ${stat.isToday ? 'text-brand-300' : 'text-gray-500'}`}>
              {stat.dayName.slice(0, 1)}
            </span>
            
            {/* Simple tooltip on hover */}
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-gray-900 text-gray-200 text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10 border border-white/10 shadow-xl">
              {stat.tooltip}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
