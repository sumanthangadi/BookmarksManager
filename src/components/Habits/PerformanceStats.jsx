import React from 'react';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';

export default function PerformanceStats({ habits }) {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(today);
  monday.setDate(today.getDate() + mondayOffset);

  const weekDays = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });

  let totalScheduledForWeek = 0;
  let totalCompletedThisWeek = 0;

  const dailyData = weekDays.map(date => {
    const dateStr = date.toISOString().split('T')[0];
    const dayName = format(date, 'EEE');
    const isPastOrToday = date <= today || isSameDay(date, today);

    let dayScheduled = 0;
    let dayCompleted = 0;

    habits.forEach(habit => {
      if (!habit.active) return;
      const isScheduled = habit.type === 'daily' || (habit.type === 'custom' && habit.days?.includes(dayName));
      if (isScheduled) {
        dayScheduled++;
        if (isPastOrToday) totalScheduledForWeek++;
        
        if (habit.completedDays?.includes(dateStr)) {
          dayCompleted++;
          totalCompletedThisWeek++;
        }
      }
    });

    return {
      dayName: dayName.slice(0, 1),
      percentage: dayScheduled === 0 ? 0 : Math.round((dayCompleted / dayScheduled) * 100),
      isPastOrToday,
      isToday: isSameDay(date, today),
      dayCompleted,
      dayScheduled,
    };
  });

  const todayStats = dailyData.find(d => d.isToday) || { percentage: 0, dayCompleted: 0, dayScheduled: 0 };
  const displayPercentage = todayStats.percentage;

  return (
    <div className="flex flex-col h-full bg-white/[0.02] rounded-xl border border-white/5 p-5 relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
        {/* Background decorative element */}
        <div className="w-32 h-32 rounded-full border-[10px] border-brand-500 blur-[4px]" />
      </div>

      <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-6 z-10">
        Daily Performance
      </h4>

      <div className="flex-1 flex flex-col items-center justify-center mb-6 z-10 mt-2">
        <div className="relative flex items-center justify-center">
          <svg className="w-32 h-32 transform -rotate-90">
            <circle
              className="text-white/5"
              strokeWidth="8"
              stroke="currentColor"
              fill="transparent"
              r="56"
              cx="64"
              cy="64"
            />
            <circle
              className="text-brand-500 transition-all duration-1000 ease-out"
              strokeWidth="8"
              strokeDasharray={56 * 2 * Math.PI}
              strokeDashoffset={56 * 2 * Math.PI - (displayPercentage / 100) * 56 * 2 * Math.PI}
              strokeLinecap="round"
              stroke="currentColor"
              fill="transparent"
              r="56"
              cx="64"
              cy="64"
            />
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="text-3xl font-bold text-gray-100">{displayPercentage}%</span>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-4">
          <span className="text-brand-300 font-medium text-sm">{todayStats.dayCompleted}</span> / {todayStats.dayScheduled} habits completed
        </p>
      </div>

      {/* Mini Bar Chart */}
      <div className="flex items-end justify-between h-20 gap-2 z-10 mt-auto">
        {dailyData.map((data, i) => (
          <div key={i} className="flex flex-col items-center gap-2 flex-1 group">
            <div className="w-full bg-white/5 rounded-md flex items-end h-full relative overflow-hidden">
              <div 
                className={`w-full rounded-md transition-all duration-500 ${data.isPastOrToday ? 'bg-brand-500/80 group-hover:bg-brand-400' : 'bg-transparent'}`}
                style={{ height: `${data.isPastOrToday ? Math.max(data.percentage, 5) : 0}%` }}
              />
            </div>
            <span className={`text-[10px] uppercase font-semibold ${data.isPastOrToday ? 'text-gray-400' : 'text-gray-600'}`}>
              {data.dayName}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
