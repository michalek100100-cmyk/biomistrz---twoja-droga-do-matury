import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Play, ArrowLeft } from 'lucide-react';
import { Topic, Unit } from '../types';
import { isReviewDue } from '../services/srsService';

interface CalendarSectionProps {
    units: Unit[];
    onStartQuiz: (topic: Topic) => void;
    onBack?: () => void;
}

const DAYS = ['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Ndz'];
const MONTHS = [
    'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
    'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'
];

const SRS_INTERVALS = [1, 3, 7, 14, 21, 90];

const CalendarSection: React.FC<CalendarSectionProps> = ({ units, onStartQuiz, onBack }) => {
    const today = new Date();
    const [currentMonth, setCurrentMonth] = useState(today.getMonth());
    const [currentYear, setCurrentYear] = useState(today.getFullYear());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);

    // Get all topics in calendar with their projected dates
    const calendarTopics = useMemo(() => {
        const topics: (Topic & { unitTitle: string; projectedDates: string[] })[] = [];
        units.forEach(unit => {
            unit.topics.forEach(topic => {
                if (topic.inCalendar && topic.nextReviewDate) {
                    const projectedDates: string[] = [];
                    let currentNext = new Date(topic.nextReviewDate);

                    // Add the immediate next review date
                    projectedDates.push(currentNext.toISOString().split('T')[0]);

                    // Project subsequent reviews based on current srsLevel
                    for (let i = topic.srsLevel; i < SRS_INTERVALS.length; i++) {
                        const nextInterval = SRS_INTERVALS[i];
                        const projectedDate = new Date(currentNext);
                        projectedDate.setDate(projectedDate.getDate() + nextInterval);
                        projectedDates.push(projectedDate.toISOString().split('T')[0]);
                        currentNext = projectedDate;
                    }

                    topics.push({ ...topic, unitTitle: unit.title, projectedDates });
                }
            });
        });
        return topics;
    }, [units]);

    // Get topics for a specific date
    const getTopicsForDate = (date: Date) => {
        const dateStr = date.toISOString().split('T')[0];
        return calendarTopics.filter(topic => {
            return topic.projectedDates.includes(dateStr);
        });
    };

    // Check if a date has any reviews
    const hasReviews = (date: Date) => {
        return getTopicsForDate(date).length > 0;
    };

    // Check if date is today's due review
    const isDueToday = (date: Date) => {
        const topics = getTopicsForDate(date);
        return topics.some(t => isReviewDue(t.nextReviewDate));
    };

    // Generate calendar days
    const generateCalendarDays = () => {
        const firstDay = new Date(currentYear, currentMonth, 1);
        const lastDay = new Date(currentYear, currentMonth + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = (firstDay.getDay() + 6) % 7; // Convert to Mon=0

        const days: (Date | null)[] = [];

        // Add empty cells for days before month starts
        for (let i = 0; i < startingDayOfWeek; i++) {
            days.push(null);
        }

        // Add days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            days.push(new Date(currentYear, currentMonth, day));
        }

        return days;
    };

    const calendarDays = generateCalendarDays();

    const previousMonth = () => {
        if (currentMonth === 0) {
            setCurrentMonth(11);
            setCurrentYear(currentYear - 1);
        } else {
            setCurrentMonth(currentMonth - 1);
        }
    };

    const nextMonth = () => {
        if (currentMonth === 11) {
            setCurrentMonth(0);
            setCurrentYear(currentYear + 1);
        } else {
            setCurrentMonth(currentMonth + 1);
        }
    };

    const isToday = (date: Date | null) => {
        if (!date) return false;
        return date.toDateString() === today.toDateString();
    };

    const isSelected = (date: Date | null) => {
        if (!date || !selectedDate) return false;
        return date.toDateString() === selectedDate.toDateString();
    };

    const selectedTopics = selectedDate ? getTopicsForDate(selectedDate) : [];

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
        >
            {/* Header */}
            <div className="flex items-center justify-between">
                {onBack && (
                    <button
                        onClick={onBack}
                        className="p-2 hover:bg-gray-100  rounded-full transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                )}
                <div className="flex items-center gap-2">
                    <CalendarIcon className="w-6 h-6 text-orange-500" />
                    <h1 className="text-2xl font-black">Kalendarz Nauki</h1>
                </div>
                <div className="w-9" /> {/* Spacer */}
            </div>

            {/* Stats */}
            <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl p-5 text-white">
                <div className="flex items-center justify-around">
                    <div className="text-center">
                        <p className="text-2xl font-black">{calendarTopics.length}</p>
                        <p className="text-xs text-orange-100 font-bold">Tematów w planie</p>
                    </div>
                    <div className="w-px h-10 bg-white/20"></div>
                    <div className="text-center">
                        <p className="text-2xl font-black">
                            {calendarTopics.filter(t => isReviewDue(t.nextReviewDate)).length}
                        </p>
                        <p className="text-xs text-orange-100 font-bold">Do powtórki dziś</p>
                    </div>
                </div>
            </div>

            {/* Calendar */}
            <div className="bg-white  rounded-2xl border-2 border-gray-200  p-6 shadow-sm">
                {/* Month Navigator */}
                <div className="flex items-center justify-between mb-6">
                    <button
                        onClick={previousMonth}
                        className="p-2 hover:bg-gray-100  rounded-full transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <h2 className="text-lg font-black">
                        {MONTHS[currentMonth]} {currentYear}
                    </h2>
                    <button
                        onClick={nextMonth}
                        className="p-2 hover:bg-gray-100  rounded-full transition-colors"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>

                {/* Day Headers */}
                <div className="grid grid-cols-7 gap-2 mb-2">
                    {DAYS.map(day => (
                        <div key={day} className="text-center text-xs font-bold text-gray-500 uppercase">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-2">
                    {calendarDays.map((date, index) => {
                        if (!date) {
                            return <div key={`empty-${index}`} className="aspect-square" />;
                        }

                        const hasScheduled = hasReviews(date);
                        const isDue = isDueToday(date);
                        const isTodayDate = isToday(date);
                        const isSelectedDate = isSelected(date);

                        return (
                            <button
                                key={date.toISOString()}
                                onClick={() => setSelectedDate(date)}
                                className={`
                  aspect-square rounded-xl font-bold text-sm transition-all relative
                  ${isSelectedDate
                                        ? 'bg-blue-500 text-white ring-2 ring-blue-500 ring-offset-2'
                                        : isTodayDate
                                            ? 'bg-orange-100  text-orange-600 '
                                            : hasScheduled
                                                ? 'bg-green-50  text-green-600  hover:bg-green-100 '
                                                : 'hover:bg-gray-100  text-gray-700 '
                                    }
                `}
                            >
                                {date.getDate()}
                                {isDue && (
                                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                                )}
                                {hasScheduled && !isDue && (
                                    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-green-500 rounded-full" />
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Selected Date Topics */}
            <AnimatePresence>
                {selectedDate && selectedTopics.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="bg-white  rounded-2xl border-2 border-gray-200  p-6 shadow-sm"
                    >
                        <h3 className="text-lg font-black mb-4">
                            {selectedDate.toLocaleDateString('pl-PL', { day: 'numeric', month: 'long' })}
                        </h3>
                        <div className="space-y-3">
                            {selectedTopics.map(topic => {
                                const due = isReviewDue(topic.nextReviewDate);
                                return (
                                    <div
                                        key={topic.id}
                                        className={`flex items-center justify-between p-4 rounded-xl border-2 ${due
                                            ? 'bg-red-50  border-red-200 '
                                            : 'bg-gray-50  border-gray-200 '
                                            }`}
                                    >
                                        <div className="flex-1">
                                            <p className="font-bold text-sm">{topic.title}</p>
                                            <p className="text-xs text-gray-500">{topic.unitTitle}</p>
                                            {due && (
                                                <p className="text-xs text-red-500 font-bold mt-1">⚡ Do powtórki!</p>
                                            )}
                                            {!due && topic.nextReviewDate && new Date(topic.nextReviewDate).toISOString().split('T')[0] !== selectedDate?.toISOString().split('T')[0] && (
                                                <p className="text-xs text-blue-500 font-bold mt-1">📅 Planowana powtórka</p>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => onStartQuiz(topic)}
                                            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all ${due
                                                ? 'bg-red-500 text-white hover:bg-red-600'
                                                : 'bg-blue-500 text-white hover:bg-blue-600'
                                                }`}
                                        >
                                            <Play className="w-4 h-4" />
                                            Powtórz
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Empty State */}
            {calendarTopics.length === 0 && (
                <div className="text-center py-12">
                    <div className="w-20 h-20 bg-gray-100  rounded-3xl flex items-center justify-center mx-auto mb-4">
                        <CalendarIcon className="w-10 h-10 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-black text-gray-800  mb-2">
                        Brak zaplanowanych powtórek
                    </h3>
                    <p className="text-sm text-gray-500">
                        Ukończ quiz i dodaj temat do kalendarza, aby zacząć planować naukę!
                    </p>
                </div>
            )}
        </motion.div>
    );
};

export default CalendarSection;
