import React, { useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, PanResponder } from 'react-native';

interface WeekDayStripProps {
  selectedDate: string;
  onSelectDate: (date: string) => void;
  plannedDates?: string[];
  completedDates?: string[];
  lockedDates?: string[];
  collapsible?: boolean;
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_NAMES_MON_FIRST = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function getWeekDates(referenceDate: string): Date[] {
  const ref = new Date(referenceDate + 'T00:00:00');
  const dayOfWeek = ref.getDay(); // 0 = Sunday
  const monday = new Date(ref);
  monday.setDate(ref.getDate() - ((dayOfWeek + 6) % 7)); // Monday of this week
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function toIso(date: Date): string {
  return date.toISOString().split('T')[0];
}

function getMonthGrid(year: number, month: number): (string | null)[] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDow = (firstDay.getDay() + 6) % 7; // Monday-first offset
  const cells: (string | null)[] = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= lastDay.getDate(); d++) {
    const mm = String(month + 1).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    cells.push(`${year}-${mm}-${dd}`);
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

const SWIPE_THRESHOLD = 50;

function offsetWeek(referenceDate: string, weeks: number): string {
  const ref = new Date(referenceDate + 'T00:00:00');
  ref.setDate(ref.getDate() + weeks * 7);
  return toIso(ref);
}

export default function WeekDayStrip({
  selectedDate,
  onSelectDate,
  plannedDates = [],
  completedDates = [],
  lockedDates = [],
  collapsible = false,
}: WeekDayStripProps) {
  const refDate = new Date(selectedDate + 'T00:00:00');
  const [expanded, setExpanded] = useState(false);
  const [calView, setCalView] = useState({ year: refDate.getFullYear(), month: refDate.getMonth() });
  const { year: calYear, month: calMonth } = calView;

  const today = new Date().toISOString().split('T')[0];
  const weekDates = getWeekDates(selectedDate);

  // Keep refs to avoid stale closures in PanResponder callbacks
  const selectedDateRef = useRef(selectedDate);
  selectedDateRef.current = selectedDate;
  const onSelectDateRef = useRef(onSelectDate);
  onSelectDateRef.current = onSelectDate;

  const weekPanResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, { dx, dy }) =>
        Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 10,
      onPanResponderRelease: (_, { dx }) => {
        if (dx < -SWIPE_THRESHOLD) {
          onSelectDateRef.current(offsetWeek(selectedDateRef.current, 1));
        } else if (dx > SWIPE_THRESHOLD) {
          onSelectDateRef.current(offsetWeek(selectedDateRef.current, -1));
        }
      },
    })
  ).current;

  const monthPanResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, { dx, dy }) =>
        Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 10,
      onPanResponderRelease: (_, { dx }) => {
        if (dx < -SWIPE_THRESHOLD) {
          setCalView(({ year, month }) =>
            month === 11 ? { year: year + 1, month: 0 } : { year, month: month + 1 }
          );
        } else if (dx > SWIPE_THRESHOLD) {
          setCalView(({ year, month }) =>
            month === 0 ? { year: year - 1, month: 11 } : { year, month: month - 1 }
          );
        }
      },
    })
  ).current;

  function prevMonth() {
    setCalView(({ year, month }) =>
      month === 0 ? { year: year - 1, month: 11 } : { year, month: month - 1 }
    );
  }

  function nextMonth() {
    setCalView(({ year, month }) =>
      month === 11 ? { year: year + 1, month: 0 } : { year, month: month + 1 }
    );
  }

  if (expanded && collapsible) {
    const cells = getMonthGrid(calYear, calMonth);
    const rows: (string | null)[][] = [];
    for (let i = 0; i < cells.length; i += 7) {
      rows.push(cells.slice(i, i + 7));
    }

    return (
      <View style={styles.monthContainer} {...monthPanResponder.panHandlers}>
        <View style={styles.monthHeader}>
          <TouchableOpacity onPress={prevMonth} style={styles.navButton} activeOpacity={0.7}>
            <Text style={styles.navArrow}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.monthLabel}>{MONTH_NAMES[calMonth]} {calYear}</Text>
          <TouchableOpacity onPress={nextMonth} style={styles.navButton} activeOpacity={0.7}>
            <Text style={styles.navArrow}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setExpanded(false)} style={styles.toggleButton} activeOpacity={0.7}>
            <Text style={styles.toggleArrow}>▲</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.dayNamesRow}>
          {DAY_NAMES_MON_FIRST.map((name) => (
            <Text key={name} style={styles.monthDayName}>{name}</Text>
          ))}
        </View>

        {rows.map((row, ri) => (
          <View key={ri} style={styles.weekRow}>
            {row.map((iso, di) => {
              if (!iso) return <View key={di} style={styles.emptyCell} />;
              const isSelected = iso === selectedDate;
              const isToday = iso === today;
              const isCompleted = completedDates.includes(iso);
              const isPlanned = plannedDates.includes(iso);
              const isLocked = lockedDates.includes(iso);

              return (
                <TouchableOpacity
                  key={iso}
                  onPress={() => { onSelectDate(iso); setExpanded(false); }}
                  style={styles.monthDayWrapper}
                  activeOpacity={0.7}
                >
                  <View style={[
                    styles.monthDateCircle,
                    isSelected && styles.activeDateCircle,
                    !isSelected && isToday && styles.todayCircle,
                  ]}>
                    <Text style={[
                      styles.monthDateNumber,
                      isSelected && styles.activeDateText,
                      !isSelected && isToday && styles.todayText,
                    ]}>
                      {parseInt(iso.split('-')[2], 10)}
                    </Text>
                  </View>
                  <View style={styles.dotRow}>
                    {isLocked ? (
                      <Text style={styles.lockIcon} accessibilityLabel="Locked">🔒</Text>
                    ) : isCompleted ? (
                      <View style={[styles.dot, styles.completedDot]} />
                    ) : isPlanned ? (
                      <View style={[styles.dot, styles.plannedDot]} />
                    ) : (
                      <View style={styles.dotPlaceholder} />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>
    );
  }

  // Weekly strip (default view)
  return (
    <View style={collapsible ? styles.weekStripWrapper : undefined} {...weekPanResponder.panHandlers}>
      <View
        style={[
          styles.container,
          collapsible ? styles.weekScrollView : undefined,
        ]}
      >
        {weekDates.map((date) => {
          const iso = toIso(date);
          const isSelected = iso === selectedDate;
          const isCompleted = completedDates.includes(iso);
          const isPlanned = plannedDates.includes(iso);
          const isLocked = lockedDates.includes(iso);

          return (
            <TouchableOpacity
              key={iso}
              onPress={() => onSelectDate(iso)}
              style={styles.dayWrapper}
              activeOpacity={0.7}
            >
              <Text style={[styles.dayName, !isSelected && styles.inactiveText]}>
                {DAY_NAMES[date.getDay()]}
              </Text>
              <View style={[styles.dateCircle, isSelected && styles.activeDateCircle]}>
                <Text style={[styles.dateNumber, isSelected && styles.activeDateText, !isSelected && styles.inactiveText]}>
                  {date.getDate()}
                </Text>
              </View>
              <View style={styles.dotRow}>
                {isLocked ? (
                  <Text style={styles.lockIcon} accessibilityLabel="Locked">🔒</Text>
                ) : isCompleted ? (
                  <View style={[styles.dot, styles.completedDot]} />
                ) : isPlanned ? (
                  <View style={[styles.dot, styles.plannedDot]} />
                ) : (
                  <View style={styles.dotPlaceholder} />
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
      {collapsible && (
        <TouchableOpacity onPress={() => setExpanded(true)} style={styles.toggleButton} activeOpacity={0.7}>
          <Text style={styles.toggleArrow}>▼</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  // Weekly strip styles
  weekStripWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weekScrollView: {
    flex: 1,
  },
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 4,
  },
  dayWrapper: {
    alignItems: 'center',
    width: 44,
    marginHorizontal: 2,
  },
  dayName: {
    fontSize: 11,
    fontWeight: '500',
    color: '#8E8E93',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  inactiveText: {
    color: '#C7C7CC',
  },
  dateCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeDateCircle: {
    backgroundColor: '#E8470A',
  },
  dateNumber: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  activeDateText: {
    color: '#FFFFFF',
  },
  dotRow: {
    marginTop: 3,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockIcon: {
    fontSize: 10,
    lineHeight: 14,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  completedDot: {
    backgroundColor: '#34C759',
  },
  plannedDot: {
    backgroundColor: '#E8470A',
  },
  dotPlaceholder: {
    width: 5,
    height: 5,
  },
  toggleButton: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleArrow: {
    fontSize: 12,
    color: '#8E8E93',
  },
  // Monthly calendar styles
  monthContainer: {
    paddingHorizontal: 12,
    paddingBottom: 8,
    paddingTop: 4,
  },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  monthLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
    textAlign: 'center',
  },
  navButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navArrow: {
    fontSize: 22,
    color: '#1A1A1A',
    lineHeight: 26,
  },
  dayNamesRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  monthDayName: {
    flex: 1,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '500',
    color: '#8E8E93',
    textTransform: 'uppercase',
  },
  weekRow: {
    flexDirection: 'row',
  },
  monthDayWrapper: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
  },
  emptyCell: {
    flex: 1,
  },
  monthDateCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayCircle: {
    borderWidth: 1.5,
    borderColor: '#E8470A',
  },
  monthDateNumber: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1A1A1A',
  },
  todayText: {
    color: '#E8470A',
    fontWeight: '700',
  },
});
