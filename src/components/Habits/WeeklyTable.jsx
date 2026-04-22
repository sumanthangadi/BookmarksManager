import React from 'react';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import { Check } from 'lucide-react';

export default function WeeklyTable({ habits, toggleHabit }) {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(today);
  monday.setDate(today.getDate() + mondayOffset);

  // Generate 7 days of the current week (preserving local time so toISOString matches backend)
  const weekDays = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });

  const format12h = (timeStr) => {
    if (!timeStr) return '';
    const [h, m] = timeStr.split(':');
    let hours = parseInt(h);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${hours}:${m} ${ampm}`;
  };

  return (
    <div className="w-full overflow-x-auto pb-2">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr>
            <th className="pb-4 text-xs font-semibold text-gray-400 uppercase tracking-wider min-w-[140px]">
              Habit
            </th>
            {weekDays.map(date => (
              <th key={date.toISOString()} className="pb-4 text-center min-w-[44px]">
                <div className={`text-[10px] font-bold uppercase ${isSameDay(date, today) ? 'text-brand-400' : 'text-gray-500'}`}>
                  {format(date, 'EEE')}
                </div>
                <div className={`text-xs mt-0.5 ${isSameDay(date, today) ? 'text-brand-300 font-bold' : 'text-gray-400'}`}>
                  {format(date, 'd')}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {habits.filter(h => h.active).map(habit => (
            <tr key={habit.id} className="group hover:bg-white/[0.02] transition-colors">
              <td className="py-3 pr-2 align-middle">
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-200 group-hover:text-white transition-colors truncate max-w-[180px]">
                    {habit.name}
                  </span>
                  {habit.startTime && (
                    <span className="text-[10px] text-gray-500 mt-0.5">
                      {format12h(habit.startTime)}
                    </span>
                  )}
                </div>
              </td>
              
              {weekDays.map(date => {
                const dateStr = date.toISOString().split('T')[0];
                const dayName = format(date, 'EEE');
                const isPastOrToday = date <= today || isSameDay(date, today);
                
                // Check if habit is scheduled for this day
                const isScheduled = habit.type === 'daily' || (habit.type === 'custom' && habit.days?.includes(dayName));
                const isDone = habit.completedDays?.includes(dateStr);

                return (
                  <td key={dateStr} className="py-3 text-center align-middle">
                    {isScheduled ? (
                      <button
                        onClick={() => isPastOrToday && toggleHabit(habit.id, isDone, dateStr)}
                        disabled={!isPastOrToday}
                        className={`
                          mx-auto flex items-center justify-center w-5 h-5 rounded-md border transition-all duration-200
                          ${!isPastOrToday ? 'opacity-30 cursor-not-allowed border-gray-600' : 'cursor-pointer'}
                          ${isDone ? 'bg-brand-500 border-brand-500 text-white shadow-[0_0_8px_rgba(239,68,68,0.3)]' : 'border-gray-500 text-transparent hover:border-brand-400'}
                        `}
                      >
                        {isDone && <Check size={13} strokeWidth={3} />}
                      </button>
                    ) : (
                      <div className="w-5 h-5 mx-auto rounded-md border border-dashed border-white/10" />
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
          {habits.filter(h => h.active).length === 0 && (
            <tr>
              <td colSpan={8} className="py-8 text-center text-gray-500 text-sm italic">
                No active habits found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
