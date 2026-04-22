import React from 'react';
import { Target, AlertCircle } from 'lucide-react';
import GlassCard from '../UI/GlassCard';
import WeeklyTable from './WeeklyTable';
import PerformanceStats from './PerformanceStats';
import { useHabits } from '../../hooks/useHabits';

export default function HabitTrackerWidget() {
  const { habits, loading, error, toggleHabit } = useHabits();

  return (
    <div className="px-4 md:px-8 py-4 mb-8">
      <div className="w-full">
        <GlassCard className="animate-fade-in relative overflow-hidden group">
          {/* Subtle background gradient glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-brand-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          
          <div className="relative z-10 flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex flex-col">
                <div className="flex items-center gap-2 mb-1">
                  <div className="p-1.5 rounded-lg bg-brand-600/15 text-brand-400">
                    <Target size={16} />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-200 tracking-wide">
                    Habit Tracker
                  </h3>
                </div>
                <p className="text-xs text-gray-500">
                  Track your weekly schedule and monitor your performance.
                </p>
              </div>
            </div>

            {/* Content Area */}
            {error ? (
              <div className="flex flex-col items-center justify-center py-6 text-red-400 gap-2">
                <AlertCircle size={24} />
                <span className="text-xs text-center">{error}</span>
              </div>
            ) : loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-6 h-6 rounded-full border-2 border-brand-500/30 border-t-brand-500 animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Weekly Table (Takes up 2/3 space) */}
                <div className="lg:col-span-2">
                  <WeeklyTable habits={habits} toggleHabit={toggleHabit} />
                </div>
                
                {/* Right Column: Performance Stats (Takes up 1/3 space) */}
                <div className="lg:col-span-1 min-h-[250px]">
                  <PerformanceStats habits={habits} />
                </div>
              </div>
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
