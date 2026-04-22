import React from 'react';
import { format } from 'date-fns';
import { Check, Circle } from 'lucide-react';

export default function HabitList({ habits, toggleHabit, currentDate = new Date() }) {
  const todayStr = format(currentDate, 'yyyy-MM-dd');
  const todayDayName = format(currentDate, 'EEE'); // "Mon", "Tue"

  // Filter active habits for today
  const todaysHabits = habits.filter(habit => {
    if (!habit.active) return false;
    if (habit.type === 'daily') return true;
    if (habit.type === 'custom' && habit.days && habit.days.includes(todayDayName)) return true;
    return false;
  });

  if (todaysHabits.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-gray-500 text-sm italic">No habits scheduled for today. Enjoy your day!</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 mt-4">
      {todaysHabits.map(habit => {
        const isDone = habit.completedDays && habit.completedDays.includes(todayStr);

        return (
          <div 
            key={habit.id}
            onClick={() => toggleHabit(habit.id, isDone, todayStr)}
            className={`
              group flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-300
              ${isDone ? 'bg-brand-900/20 border-brand-500/30' : 'bg-white/5 border-white/5 hover:bg-white/10'}
              border
            `}
          >
            {/* Custom Checkbox */}
            <div className={`
              flex items-center justify-center w-5 h-5 rounded-md border transition-all duration-300
              ${isDone ? 'bg-brand-500 border-brand-500 text-white' : 'border-gray-500 text-transparent group-hover:border-gray-400'}
            `}>
              {isDone ? <Check size={14} strokeWidth={3} /> : <Check size={14} strokeWidth={3} className="opacity-0 group-hover:opacity-20 text-white" />}
            </div>

            {/* Habit Name */}
            <span className={`
              flex-1 text-sm font-medium transition-all duration-300
              ${isDone ? 'text-brand-300 line-through opacity-70' : 'text-gray-200 group-hover:text-white'}
            `}>
              {habit.name}
            </span>
          </div>
        );
      })}
    </div>
  );
}
