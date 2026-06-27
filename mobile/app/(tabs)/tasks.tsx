import React, { useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, FlatList, Modal, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { format, parseISO, isSameDay, isSameWeek, isSameMonth, isSameYear, addDays, subDays, addMonths, subMonths, addYears, subYears, startOfWeek, endOfWeek, eachDayOfInterval, getDay } from 'date-fns';
import { Text } from '../../components/typography/Text';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { Card } from '../../components/ui/Card';
import { DataTable } from '../../components/tables/DataTable';
import { Button } from '../../components/ui/Button';
import { Plus, Check, X, CircleAlert as AlertCircle } from 'lucide-react-native';
import Colors from '../../constants/Colors';
import { Stack } from 'expo-router';
import { useFarmData, FarmEvent as Event, TodoTask as Todo, Observation } from '../../context/FarmDataContext';
import { TextField } from '../../components/inputs/TextField';
import { Picker } from '../../components/inputs/Picker';

export default function TasksScreen() {
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Task Panel',
        }}
      />
      <TasksContent />
    </>
  );
}

type ViewType = 'day' | 'week' | 'month' | 'year' | 'list';
type CalendarEvent = Event | Todo | Observation;

function TasksContent() {
  const {
    farmEvents,
    todoList,
    observations,
    addFarmEvent,
    addTodoTask,
    addObservation,
    toggleTodoStatus,
    updateFarmEvent,
    updateTodoTask,
    updateObservation,
    animals = [],
    profile,
  } = useFarmData();

  const [activeTab, setActiveTab] = useState<'events' | 'todo' | 'observations'>('events');
  const [viewType, setViewType] = useState<ViewType>('month');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const dateTitle = useMemo(() => {
    switch (viewType) {
      case 'day':
        return format(selectedDate, 'MMMM d, yyyy');
      case 'week':
        return `${format(startOfWeek(selectedDate, { weekStartsOn: 1 }), 'MMM d')} - ${format(endOfWeek(selectedDate, { weekStartsOn: 1 }), 'MMM d, yyyy')}`;
      case 'month':
        return format(selectedDate, 'MMMM yyyy');
      case 'year':
        return selectedDate.getFullYear().toString();
      default:
        return '';
    }
  }, [viewType, selectedDate]);

  const actionBarTitle = useMemo(() => {
    switch (viewType) {
      case 'day':
        return format(selectedDate, 'EEEE, MMMM d, yyyy');
      case 'week':
        return `${format(startOfWeek(selectedDate, { weekStartsOn: 1 }), 'MMM d')} - ${format(endOfWeek(selectedDate, { weekStartsOn: 1 }), 'MMM d, yyyy')}`;
      case 'month':
        return format(selectedDate, 'MMMM yyyy');
      case 'year':
        return selectedDate.getFullYear().toString();
      case 'list':
        return 'All Events';
      default:
        return '';
    }
  }, [viewType, selectedDate]);

  // Modal & Form States
  const [modalVisible, setModalVisible] = useState(false);
  const [formError, setFormError] = useState('');
  
  // Editing state
  const [editingItem, setEditingItem] = useState<CalendarEvent | null>(null);
  const isEditing = editingItem !== null;

  // Event Form States
  const [eventType, setEventType] = useState('Vaccination');
  const [customEventType, setCustomEventType] = useState('');
  const [eventName, setEventName] = useState('');
  const [eventTag, setEventTag] = useState('Whole Herd');
  const [eventDiagnosis, setEventDiagnosis] = useState('');
  const [eventNotes, setEventNotes] = useState('');
  const [eventDoneBy, setEventDoneBy] = useState('');
  const [eventStatus, setEventStatus] = useState<'pending' | 'completed'>('pending');

  // Todo Form States
  const [todoDesc, setTodoDesc] = useState('');
  const [todoPriority, setTodoPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [todoCreatedBy, setTodoCreatedBy] = useState('');
  const [todoStatus, setTodoStatus] = useState<'pending' | 'completed'>('pending');

  // Observation Form States
  const [obsText, setObsText] = useState('');
  const [obsTag, setObsTag] = useState('Whole Herd');
  const [obsSeverity, setObsSeverity] = useState<'high' | 'medium' | 'low'>('medium');
  const [obsObserver, setObsObserver] = useState('');
  const [obsStatus, setObsStatus] = useState<'resolved' | 'unresolved'>('unresolved');

  // Edit Permissions
  const hasEditPermission = useMemo(() => {
    return profile?.role === 'farmer' || profile?.role === 'admin';
  }, [profile]);

  // Dynamic Animal Tag list items
  const getAnimalTagItems = (currentTagValue: string) => {
    const presets = [
      { label: 'Whole Herd', value: 'Whole Herd' },
      { label: 'Calves (All)', value: 'Calves' },
      { label: 'Cows (All)', value: 'Cows' },
      { label: 'Bulls (All)', value: 'Bulls' },
      { label: 'Heifers (All)', value: 'Heifers' },
    ];

    const tags = Array.from(new Set(animals.map(a => a.tag)))
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }))
      .map(tag => ({ label: `Animal: ${tag}`, value: tag }));

    const items = [...presets, ...tags];
    
    if (currentTagValue && !items.some(item => item.value === currentTagValue)) {
      items.push({ label: `Animal: ${currentTagValue}`, value: currentTagValue });
    }
    
    return items;
  };

  const handleAddNew = () => {
    setEditingItem(null);
    setFormError('');
    
    setEventType('Vaccination');
    setCustomEventType('');
    setEventName('');
    setEventTag('Whole Herd');
    setEventDiagnosis('');
    setEventNotes('');
    setEventDoneBy('');
    setEventStatus('pending');

    setTodoDesc('');
    setTodoPriority('medium');
    setTodoCreatedBy('');
    setTodoStatus('pending');

    setObsText('');
    setObsTag('Whole Herd');
    setObsSeverity('medium');
    setObsObserver('');
    setObsStatus('unresolved');

    setModalVisible(true);
  };

  const handleEditItem = (item: CalendarEvent) => {
    setEditingItem(item);
    setFormError('');

    if ('event' in item) {
      const typeIsCustom = !['Vaccination', 'Treatment', 'Check-up', 'Breeding', 'Weaning'].includes(item.type);
      setEventType(typeIsCustom ? 'Other' : item.type);
      setCustomEventType(typeIsCustom ? item.type : '');
      setEventName(item.event);
      setEventTag(item.tag || 'Whole Herd');
      setEventDiagnosis(item.diagnosis || '');
      setEventNotes(item.notes || '');
      setEventDoneBy(item.doneBy || '');
      setEventStatus(item.status === 'completed' ? 'completed' : 'pending');
    } else if ('description' in item) {
      setTodoDesc(item.description);
      setTodoPriority(item.priority || 'medium');
      setTodoCreatedBy(item.createdBy || '');
      setTodoStatus(item.status === 'completed' ? 'completed' : 'pending');
    } else if ('observation' in item) {
      setObsText(item.observation);
      setObsTag(item.tag || 'Whole Herd');
      setObsSeverity(item.severity || 'medium');
      setObsObserver(item.observer || '');
      setObsStatus(item.status === 'resolved' ? 'resolved' : 'unresolved');
    }
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (isEditing && !hasEditPermission) {
      setFormError('Only farmers and administrators are allowed to edit records.');
      return;
    }
    
    setFormError('');
    const dateStr = format(selectedDate, 'yyyy-MM-dd');

    try {
      if (activeTab === 'events') {
        if (!eventName || !eventTag || !eventDoneBy) {
          setFormError('Please fill out all required fields.');
          return;
        }
        
        const finalType = eventType === 'Other' ? customEventType.trim() : eventType;
        if (!finalType) {
          setFormError('Please specify the custom event type.');
          return;
        }

        if (isEditing && editingItem && 'event' in editingItem) {
          await updateFarmEvent(editingItem.id, {
            type: finalType,
            event: eventName,
            tag: eventTag,
            diagnosis: eventDiagnosis || 'Routine',
            notes: eventNotes || 'No notes',
            doneBy: eventDoneBy,
            status: eventStatus,
          });
        } else {
          await addFarmEvent({
            date: dateStr,
            type: finalType,
            event: eventName,
            tag: eventTag,
            diagnosis: eventDiagnosis || 'Routine',
            notes: eventNotes || 'No notes',
            doneBy: eventDoneBy,
            status: 'pending',
          });
        }
      } else if (activeTab === 'todo') {
        if (!todoDesc || !todoCreatedBy) {
          setFormError('Please fill out all required fields.');
          return;
        }
        
        if (isEditing && editingItem && 'description' in editingItem) {
          await updateTodoTask(editingItem.id, {
            description: todoDesc,
            priority: todoPriority,
            createdBy: todoCreatedBy,
            status: todoStatus,
            lastEdited: dateStr,
          });
        } else {
          await addTodoTask({
            date: dateStr,
            description: todoDesc,
            status: 'pending',
            createdBy: todoCreatedBy,
            lastEdited: dateStr,
            priority: todoPriority,
          });
        }
      } else if (activeTab === 'observations') {
        if (!obsText || !obsTag || !obsObserver) {
          setFormError('Please fill out all required fields.');
          return;
        }

        if (isEditing && editingItem && 'observation' in editingItem) {
          await updateObservation(editingItem.id, {
            tag: obsTag,
            observation: obsText,
            severity: obsSeverity,
            observer: obsObserver,
            status: obsStatus,
          });
        } else {
          await addObservation({
            date: dateStr,
            tag: obsTag,
            observation: obsText,
            severity: obsSeverity,
            observer: obsObserver,
            status: obsStatus,
          });
        }
      }
      setModalVisible(false);
      setEditingItem(null);
    } catch (err: any) {
      console.error(err);
      setFormError(err.message || 'Failed to save record.');
    }
  };

  const markedDates = useMemo(() => {
    const marked: { [date: string]: any } = {};
    
    // Count events by type for each date
    const eventsByDate: { [date: string]: { farm: number; todo: number; observation: number } } = {};
    
    // Count farm events
    farmEvents.forEach(event => {
      const date = event.date;
      if (!eventsByDate[date]) eventsByDate[date] = { farm: 0, todo: 0, observation: 0 };
      eventsByDate[date].farm++;
    });
    
    // Count todo items
    todoList.forEach(todo => {
      const date = todo.date;
      if (!eventsByDate[date]) eventsByDate[date] = { farm: 0, todo: 0, observation: 0 };
      eventsByDate[date].todo++;
    });
    
    // Count observations
    observations.forEach(obs => {
      const date = obs.date;
      if (!eventsByDate[date]) eventsByDate[date] = { farm: 0, todo: 0, observation: 0 };
      eventsByDate[date].observation++;
    });
    
    // Create marked dates with custom markers
    Object.entries(eventsByDate).forEach(([date, counts]) => {
      const hasFarm = counts.farm > 0;
      const hasTodo = counts.todo > 0;
      const hasObservation = counts.observation > 0;
      
      const dots = [];
      if (hasFarm) dots.push({ key: 'events', color: Colors.primary[500] });
      if (hasTodo) dots.push({ key: 'todo', color: Colors.warning[500] });
      if (hasObservation) dots.push({ key: 'observations', color: Colors.error[500] });
      
      marked[date] = {
        dots,
      };
    });
    
    // Mark selected date
    const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
    if (marked[selectedDateStr]) {
      marked[selectedDateStr].selected = true;
    } else {
      marked[selectedDateStr] = {
        selected: true,
      };
    }
    
    return marked;
  }, [farmEvents, todoList, observations, selectedDate]);

  const getEventsForDate = (date: Date): CalendarEvent[] => {
    const dateStr = format(date, 'yyyy-MM-dd');
    
    switch (activeTab) {
      case 'events':
        return farmEvents.filter(event => event.date === dateStr);
      case 'todo':
        return todoList.filter(todo => todo.date === dateStr);
      case 'observations':
        return observations.filter(obs => obs.date === dateStr);
      default:
        return [];
    }
  };

  const getEventsForView = (): CalendarEvent[] => {
    switch (viewType) {
      case 'day':
        return getEventsForDate(selectedDate);
      case 'week': {
        const start = startOfWeek(selectedDate, { weekStartsOn: 1 });
        const end = endOfWeek(selectedDate, { weekStartsOn: 1 });
        const days = eachDayOfInterval({ start, end });
        return days.flatMap(day => getEventsForDate(day));
      }
      case 'month': {
        const yearMonthPrefix = format(selectedDate, 'yyyy-MM');
        switch (activeTab) {
          case 'events':
            return farmEvents.filter(e => e.date.startsWith(yearMonthPrefix));
          case 'todo':
            return todoList.filter(t => t.date.startsWith(yearMonthPrefix));
          case 'observations':
            return observations.filter(o => o.date.startsWith(yearMonthPrefix));
          default:
            return [];
        }
      }
      case 'year': {
        const yearPrefix = selectedDate.getFullYear().toString();
        switch (activeTab) {
          case 'events':
            return farmEvents.filter(e => e.date.startsWith(yearPrefix));
          case 'todo':
            return todoList.filter(t => t.date.startsWith(yearPrefix));
          case 'observations':
            return observations.filter(o => o.date.startsWith(yearPrefix));
          default:
            return [];
        }
      }
      case 'list':
        switch (activeTab) {
          case 'events':
            return [...farmEvents].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
          case 'todo':
            return [...todoList].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
          case 'observations':
            return [...observations].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
          default:
            return [];
        }
      default:
        return [];
    }
  };

  const handleDayPress = (day: any) => {
    setSelectedDate(parseISO(day.dateString));
    if (viewType === 'month') {
      setViewType('day');
    }
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    switch (viewType) {
      case 'day':
        setSelectedDate(prev => direction === 'prev' ? subDays(prev, 1) : addDays(prev, 1));
        break;
      case 'week':
        setSelectedDate(prev => direction === 'prev' ? subDays(prev, 7) : addDays(prev, 7));
        break;
      case 'month':
        setSelectedDate(prev => direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1));
        break;
      case 'year':
        setSelectedDate(prev => direction === 'prev' ? subYears(prev, 1) : addYears(prev, 1));
        break;
    }
  };

  const renderEventItem = (item: CalendarEvent) => {
    if ('event' in item) {
      // Farm Event
      return (
        <TouchableOpacity 
          style={styles.eventItem} 
          onPress={() => handleEditItem(item)}
          activeOpacity={0.7}
        >
          <TouchableOpacity
            style={styles.statusToggleArea}
            onPress={(e) => {
              e.stopPropagation();
              const newStatus = item.status === 'completed' ? 'pending' : 'completed';
              updateFarmEvent(item.id, { status: newStatus });
            }}
          >
            <View style={[
              styles.checkboxCircle,
              item.status === 'completed' && styles.checkboxCircleCompleted
            ]}>
              {item.status === 'completed' && <Check size={12} color="white" />}
            </View>
          </TouchableOpacity>
          <View style={styles.eventContent}>
            <Text weight="medium" style={item.status === 'completed' ? styles.completedText : undefined}>
              {item.event}
            </Text>
            <Text variant="caption" color="neutral.600">{item.type} • {item.tag}</Text>
          </View>
          <View style={styles.eventTime}>
            <Text variant="caption">{format(parseISO(item.date), 'MMM d, yyyy')}</Text>
            {renderStatusBadge(item.status)}
          </View>
        </TouchableOpacity>
      );
    } else if ('description' in item) {
      // Todo
      return (
        <TouchableOpacity 
          style={styles.eventItem} 
          onPress={() => handleEditItem(item)}
          activeOpacity={0.7}
        >
          <TouchableOpacity
            style={styles.statusToggleArea}
            onPress={(e) => {
              e.stopPropagation();
              toggleTodoStatus(item.id, item.status);
            }}
          >
            <View style={[
              styles.checkboxCircle,
              item.status === 'completed' && styles.checkboxCircleCompleted
            ]}>
              {item.status === 'completed' && <Check size={12} color="white" />}
            </View>
          </TouchableOpacity>
          <View style={styles.eventContent}>
            <Text weight="medium" style={item.status === 'completed' ? styles.completedText : undefined}>
              {item.description}
            </Text>
            <Text variant="caption" color="neutral.600">Priority: {item.priority}</Text>
          </View>
          <View style={styles.eventTime}>
            <Text variant="caption">{format(parseISO(item.date), 'MMM d, yyyy')}</Text>
            {renderStatusBadge(item.status)}
          </View>
        </TouchableOpacity>
      );
    } else if ('observation' in item) {
      // Observation
      return (
        <TouchableOpacity 
          style={styles.eventItem} 
          onPress={() => handleEditItem(item)}
          activeOpacity={0.7}
        >
          <TouchableOpacity
            style={styles.statusToggleArea}
            onPress={(e) => {
              e.stopPropagation();
              const newStatus = (item.status === 'resolved' ? 'unresolved' : 'resolved');
              updateObservation(item.id, { status: newStatus });
            }}
          >
            <View style={[
              styles.checkboxCircle,
              item.status === 'resolved' && styles.checkboxCircleCompleted
            ]}>
              {item.status === 'resolved' && <Check size={12} color="white" />}
            </View>
          </TouchableOpacity>
          <View style={styles.eventContent}>
            <Text weight="medium" style={item.status === 'resolved' ? styles.completedText : undefined}>
              {item.observation}
            </Text>
            <Text variant="caption" color="neutral.600">Tag: {item.tag}</Text>
          </View>
          <View style={styles.eventTime}>
            <Text variant="caption">{format(parseISO(item.date), 'MMM d, yyyy')}</Text>
            {renderStatusBadge(item.status || 'unresolved')}
          </View>
        </TouchableOpacity>
      );
    }
    return null;
  };

  const renderStatusBadge = (status: string) => {
    const getStatusColor = () => {
      switch (status.toLowerCase()) {
        case 'completed':
        case 'resolved':
          return {
            bg: Colors.success[100],
            text: Colors.success[700],
            icon: <Check size={14} color={Colors.success[700]} />,
          };
        case 'pending':
        case 'unresolved':
          return {
            bg: Colors.warning[100],
            text: Colors.warning[700],
            icon: <AlertCircle size={14} color={Colors.warning[700]} />,
          };
        default:
          return {
            bg: Colors.neutral[100],
            text: Colors.neutral[700],
            icon: <X size={14} color={Colors.neutral[700]} />,
          };
      }
    };

    const statusStyle = getStatusColor();

    return (
      <View
        style={[
          styles.statusBadge,
          { backgroundColor: statusStyle.bg },
        ]}
      >
        {statusStyle.icon}
        <Text
          variant="caption"
          weight="medium"
          color={statusStyle.text}
          style={styles.statusText}
        >
          {status.toUpperCase()}
        </Text>
      </View>
    );
  };

  const renderPriorityBadge = (priority: string) => {
    const getPriorityColor = () => {
      switch (priority.toLowerCase()) {
        case 'high':
          return Colors.error[500];
        case 'medium':
          return Colors.warning[500];
        default:
          return Colors.neutral[500];
      }
    };

    return (
      <View
        style={[
          styles.priorityDot,
          { backgroundColor: getPriorityColor() },
        ]}
      />
    );
  };  const weekDays = useMemo(() => {
    const start = startOfWeek(selectedDate, { weekStartsOn: 1 });
    const end = endOfWeek(selectedDate, { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [selectedDate]);

  const monthCounts = useMemo(() => {
    const counts = Array(12).fill(0);
    const yearStr = selectedDate.getFullYear().toString();
    const activeItems = activeTab === 'events' ? farmEvents :
                        activeTab === 'todo' ? todoList : observations;
    
    activeItems.forEach(item => {
      if (item.date.startsWith(yearStr)) {
        const monthIndex = parseInt(item.date.split('-')[1], 10) - 1;
        if (monthIndex >= 0 && monthIndex < 12) {
          counts[monthIndex]++;
        }
      }
    });
    return counts;
  }, [farmEvents, todoList, observations, selectedDate, activeTab]);

  const renderWeekStrip = () => {
    return (
      <View style={styles.weekStripContainer}>
        {weekDays.map((day) => {
          const isSelected = isSameDay(day, selectedDate);
          const dayStr = format(day, 'yyyy-MM-dd');
          const dayMarking = markedDates[dayStr];
          
          return (
            <TouchableOpacity
              key={dayStr}
              style={[
                styles.weekDayCell,
                isSelected && styles.selectedWeekDayCell
              ]}
              onPress={() => setSelectedDate(day)}
            >
              <Text 
                variant="caption" 
                color={isSelected ? 'white' : 'neutral.500'} 
                weight="medium"
                style={styles.weekDayLabel}
              >
                {format(day, 'E')}
              </Text>
              <Text 
                variant="body" 
                color={isSelected ? 'white' : 'neutral.900'} 
                weight="bold"
                style={styles.weekDayNumber}
              >
                {format(day, 'd')}
              </Text>
              
              <View style={styles.weekDayDots}>
                {dayMarking?.dots?.map((dot: any) => (
                  <View 
                    key={dot.key} 
                    style={[styles.weekDayDot, { backgroundColor: dot.color }]} 
                  />
                ))}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  const renderYearGrid = () => {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    
    return (
      <View style={styles.yearGridContainer}>
        {months.map((monthName, index) => {
          const isCurrentMonth = selectedDate.getMonth() === index;
          const count = monthCounts[index];
          
          return (
            <TouchableOpacity
              key={monthName}
              style={[
                styles.yearMonthCell,
                isCurrentMonth && styles.currentYearMonthCell
              ]}
              onPress={() => {
                const newDate = new Date(selectedDate.getFullYear(), index, 1);
                setSelectedDate(newDate);
                setViewType('month');
              }}
            >
              <Text 
                variant="body" 
                weight="bold" 
                color={isCurrentMonth ? 'primary.500' : 'neutral.900'}
              >
                {monthName}
              </Text>
              {count > 0 ? (
                <View style={styles.monthBadge}>
                  <Text variant="caption" color="white" weight="medium">
                    {count}
                  </Text>
                </View>
              ) : (
                <Text variant="caption" color="neutral.400">
                  No events
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  const renderCalendar = () => {
    return (
      <View style={styles.calendarContainer}>
        <View style={styles.calendarHeader}>
          <TouchableOpacity onPress={() => navigateDate('prev')} style={styles.navButton}>
            <Text style={styles.navButtonText}>‹</Text>
          </TouchableOpacity>
          <Text weight="medium">
            {dateTitle}
          </Text>
          <TouchableOpacity onPress={() => navigateDate('next')} style={styles.navButton}>
            <Text style={styles.navButtonText}>›</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.viewTypeContainer}>
          {(['day', 'week', 'month', 'year', 'list'] as ViewType[]).map((view) => (
            <TouchableOpacity
              key={view}
              style={[
                styles.viewTypeButton,
                viewType === view && styles.activeViewType
              ]}
              onPress={() => setViewType(view)}
            >
              <Text
                variant="caption"
                weight={viewType === view ? 'medium' : 'regular'}
                color={viewType === view ? 'white' : 'neutral.600'}
              >
                {view.charAt(0).toUpperCase() + view.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {(viewType === 'day' || viewType === 'week') && renderWeekStrip()}

        {viewType === 'month' && (
          <Calendar
            current={format(selectedDate, 'yyyy-MM-dd')}
            onDayPress={handleDayPress}
            markedDates={markedDates}
            hideExtraDays={true}
            markingType={'multi-dot'}
            theme={{
              selectedDayBackgroundColor: Colors.primary[200],
              selectedDayTextColor: Colors.primary[700],
              todayTextColor: Colors.primary[500],
              arrowColor: Colors.primary[500],
              textDayFontWeight: '500',
              textMonthFontWeight: '600',
              textDayHeaderFontWeight: '600',
              textDayFontSize: 14,
              textMonthFontSize: 16,
              textDayHeaderFontSize: 14,
            }}
            style={styles.calendar}
          />
        )}

        {viewType === 'year' && renderYearGrid()}
      </View>
    );
  };

  return (
    <ScreenContainer style={styles.container} scrollable={false}>
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'events' && styles.activeTab]}
          onPress={() => setActiveTab('events')}
        >
          <Text
            variant="body"
            weight={activeTab === 'events' ? 'medium' : 'regular'}
            color={activeTab === 'events' ? 'primary.500' : 'neutral.600'}
          >
            Farm Events
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'todo' && styles.activeTab]}
          onPress={() => setActiveTab('todo')}
        >
          <Text
            variant="body"
            weight={activeTab === 'todo' ? 'medium' : 'regular'}
            color={activeTab === 'todo' ? 'primary.500' : 'neutral.600'}
          >
            To-Do List
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'observations' && styles.activeTab]}
          onPress={() => setActiveTab('observations')}
        >
          <Text
            variant="body"
            weight={activeTab === 'observations' ? 'medium' : 'regular'}
            color={activeTab === 'observations' ? 'primary.500' : 'neutral.600'}
          >
            Observations
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {renderCalendar()}
        
        <View style={styles.actionBar}>
          <Text variant="h6" weight="medium">
            {actionBarTitle}
          </Text>
          <Button
            variant="primary"
            startIcon={<Plus size={20} color={Colors.white} />}
            style={styles.addButton}
            onPress={handleAddNew}
          >
            Add {activeTab === 'events' ? 'Event' : activeTab === 'todo' ? 'Task' : 'Observation'}
          </Button>
        </View>

        {viewType === 'list' ? (
          <FlatList
            data={getEventsForView()}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => renderEventItem(item)}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            scrollEnabled={false}
            contentContainerStyle={styles.listContainer}
          />
        ) : (
          <View style={styles.eventsList}>
            {getEventsForView().length > 0 ? (
              getEventsForView().map((event) => (
                <View key={event.id} style={styles.eventItemWrapper}>
                  {renderEventItem(event)}
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Text color="neutral.500">No {activeTab} found for this {viewType}</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
          style={styles.modalKeyboardView}
        >
          <Pressable 
            style={styles.modalOverlay}
            onPress={() => setModalVisible(false)}
          >
            <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalHeader}>
                <Text variant="h6" weight="medium">
                  {isEditing ? 'Edit' : 'Add'} {activeTab === 'events' ? 'Event' : activeTab === 'todo' ? 'Task' : 'Observation'}
                </Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <X size={20} color={Colors.neutral[500]} />
                </TouchableOpacity>
              </View>

              <ScrollView contentContainerStyle={styles.formContainer}>
                {formError ? (
                  <View style={styles.errorBanner}>
                    <Text variant="caption" color="error.600">{formError}</Text>
                  </View>
                ) : null}

                {activeTab === 'events' && (
                  <>
                    <Picker
                      label="Event Type"
                      value={eventType}
                      onValueChange={setEventType}
                      items={[
                        { label: 'Vaccination', value: 'Vaccination' },
                        { label: 'Treatment', value: 'Treatment' },
                        { label: 'Check-up', value: 'Check-up' },
                        { label: 'Breeding', value: 'Breeding' },
                        { label: 'Weaning', value: 'Weaning' },
                        { label: 'Other (Custom Type)', value: 'Other' },
                      ]}
                    />
                    {eventType === 'Other' && (
                      <TextField
                        label="Custom Event Type (Required)"
                        value={customEventType}
                        onChangeText={setCustomEventType}
                        placeholder="e.g. Dehorning, Hoof Trimming"
                      />
                    )}
                    <TextField
                      label="Event Name (Required)"
                      value={eventName}
                      onChangeText={setEventName}
                      placeholder="e.g. Vaccine A, Antibiotics"
                    />
                    <Picker
                      label="Animal Tag (Required)"
                      value={eventTag}
                      onValueChange={setEventTag}
                      items={getAnimalTagItems(eventTag)}
                    />
                    <TextField
                      label="Diagnosis"
                      value={eventDiagnosis}
                      onChangeText={setEventDiagnosis}
                      placeholder="e.g. Preventive, Infection"
                    />
                    <TextField
                      label="Notes"
                      value={eventNotes}
                      onChangeText={setEventNotes}
                      placeholder="Any relevant notes"
                    />
                    <TextField
                      label="Done By (Required)"
                      value={eventDoneBy}
                      onChangeText={setEventDoneBy}
                      placeholder="e.g. Dr. Wilson, John Doe"
                    />
                    {isEditing && (
                      <Picker
                        label="Status"
                        value={eventStatus}
                        onValueChange={(val: any) => setEventStatus(val)}
                        items={[
                          { label: 'Pending', value: 'pending' },
                          { label: 'Completed', value: 'completed' },
                        ]}
                      />
                    )}
                  </>
                )}

                {activeTab === 'todo' && (
                  <>
                    <TextField
                      label="Task Description (Required)"
                      value={todoDesc}
                      onChangeText={setTodoDesc}
                      placeholder="e.g. Clean the barn, Order feed"
                    />
                    <Picker
                      label="Priority"
                      value={todoPriority}
                      onValueChange={(val: any) => setTodoPriority(val)}
                      items={[
                        { label: 'High', value: 'high' },
                        { label: 'Medium', value: 'medium' },
                        { label: 'Low', value: 'low' },
                      ]}
                    />
                    <TextField
                      label="Created By (Required)"
                      value={todoCreatedBy}
                      onChangeText={setTodoCreatedBy}
                      placeholder="e.g. Farm Manager"
                    />
                    {isEditing && (
                      <Picker
                        label="Status"
                        value={todoStatus}
                        onValueChange={(val: any) => setTodoStatus(val)}
                        items={[
                          { label: 'Pending', value: 'pending' },
                          { label: 'Completed', value: 'completed' },
                        ]}
                      />
                    )}
                  </>
                )}

                {activeTab === 'observations' && (
                  <>
                    <TextField
                      label="Observation (Required)"
                      value={obsText}
                      onChangeText={setObsText}
                      placeholder="e.g. Reduced appetite, slight limp"
                    />
                    <Picker
                      label="Animal Tag (Required)"
                      value={obsTag}
                      onValueChange={setObsTag}
                      items={getAnimalTagItems(obsTag)}
                    />
                    <Picker
                      label="Severity"
                      value={obsSeverity}
                      onValueChange={(val: any) => setObsSeverity(val)}
                      items={[
                        { label: 'High', value: 'high' },
                        { label: 'Medium', value: 'medium' },
                        { label: 'Low', value: 'low' },
                      ]}
                    />
                    <TextField
                      label="Observer (Required)"
                      value={obsObserver}
                      onChangeText={setObsObserver}
                      placeholder="e.g. John Doe"
                    />
                    <Picker
                      label="Status"
                      value={obsStatus}
                      onValueChange={(val: any) => setObsStatus(val)}
                      items={[
                        { label: 'Unresolved', value: 'unresolved' },
                        { label: 'Resolved', value: 'resolved' },
                      ]}
                    />
                  </>
                )}
              </ScrollView>

              <View style={styles.modalFooter}>
                <Button
                  variant="outline"
                  onPress={() => {
                    setModalVisible(false);
                    setEditingItem(null);
                  }}
                  style={styles.footerButton}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onPress={handleSave}
                  style={styles.footerButton}
                >
                  Save
                </Button>
              </View>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </ScreenContainer>
  );
}

// Custom day component styles
const styles = StyleSheet.create({
  dayContainer: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 2,
    borderRadius: 18,
  },
  dayText: {
    fontSize: 14,
    color: Colors.neutral[900],
  },
  disabledText: {
    color: Colors.neutral[400],
  },
  selectedDay: {
    backgroundColor: Colors.primary[100],
  },
  today: {
    borderWidth: 1,
    borderColor: Colors.primary[500],
  },
  markersContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  marker: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginHorizontal: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  markerText: {
    color: 'white',
    fontSize: 8,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 14,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.neutral[50],
  },
  calendarContainer: {
    backgroundColor: Colors.white,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[200],
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[200],
  },
  calendar: {
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  navButton: {
    padding: 8,
  },
  viewTypeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[200],
  },
  viewTypeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginHorizontal: 4,
  },
  activeViewType: {
    backgroundColor: Colors.primary[500],
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[200],
    backgroundColor: Colors.white,
    marginBottom: 0,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary[500],
  },
  content: {
    flex: 1,
    paddingHorizontal: 0,
  },
  listContainer: {
    padding: 16,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.neutral[200],
    marginVertical: 8,
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[200],
    backgroundColor: Colors.white,
  },
  addButton: {
    minWidth: 120,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    gap: 4,
  },
  statusText: {
    marginLeft: 4,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  eventItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: Colors.white,
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  eventDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  eventContent: {
    flex: 1,
    marginRight: 8,
  },
  eventTime: {
    alignItems: 'flex-end',
  },
  eventsList: {
    padding: 16,
  },
  eventItemWrapper: {
    marginBottom: 8,
  },
  emptyState: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  observationsContainer: {
    padding: 0,
  },
  observationItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[200],
  },
  observationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  observationMeta: {
    flexDirection: 'row',
    gap: 16,
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  observationText: {
    marginBottom: 8,
  },
  observer: {
    fontStyle: 'italic',
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: Colors.neutral[400],
  },
  modalKeyboardView: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    maxHeight: '90%',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[100],
    marginBottom: 16,
  },
  formContainer: {
    paddingBottom: 16,
  },
  errorBanner: {
    backgroundColor: Colors.error[50],
    borderWidth: 1,
    borderColor: Colors.error[200],
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 12,
  },
  footerButton: {
    flex: 1,
  },
  weekStripContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[200],
  },
  weekDayCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 12,
    marginHorizontal: 2,
  },
  selectedWeekDayCell: {
    backgroundColor: Colors.primary[500],
  },
  weekDayLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  weekDayNumber: {
    fontSize: 16,
    marginBottom: 4,
  },
  weekDayDots: {
    flexDirection: 'row',
    height: 6,
    alignItems: 'center',
    gap: 2,
  },
  weekDayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  yearGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    backgroundColor: Colors.white,
    justifyContent: 'space-between',
  },
  yearMonthCell: {
    width: '30%',
    aspectRatio: 1.2,
    backgroundColor: Colors.neutral[50],
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 6,
    padding: 8,
  },
  currentYearMonthCell: {
    borderColor: Colors.primary[500],
    backgroundColor: Colors.primary[50],
  },
  monthBadge: {
    backgroundColor: Colors.primary[500],
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 4,
  },
  statusToggleArea: {
    paddingRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.neutral[400],
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  checkboxCircleCompleted: {
    borderColor: Colors.success[500],
    backgroundColor: Colors.success[500],
  },
  navButtonText: {
    fontSize: 24,
    lineHeight: 24,
    color: Colors.primary[500],
    fontWeight: 'bold',
  },
});