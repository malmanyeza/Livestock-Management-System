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

  // Event Form States
  const [eventType, setEventType] = useState('Vaccination');
  const [eventName, setEventName] = useState('');
  const [eventTag, setEventTag] = useState('');
  const [eventDiagnosis, setEventDiagnosis] = useState('');
  const [eventNotes, setEventNotes] = useState('');
  const [eventDoneBy, setEventDoneBy] = useState('');

  // Todo Form States
  const [todoDesc, setTodoDesc] = useState('');
  const [todoPriority, setTodoPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [todoCreatedBy, setTodoCreatedBy] = useState('');

  // Observation Form States
  const [obsText, setObsText] = useState('');
  const [obsTag, setObsTag] = useState('');
  const [obsSeverity, setObsSeverity] = useState<'high' | 'medium' | 'low'>('medium');
  const [obsObserver, setObsObserver] = useState('');

  const handleSave = async () => {
    setFormError('');
    const dateStr = format(selectedDate, 'yyyy-MM-dd');

    try {
      if (activeTab === 'events') {
        if (!eventName || !eventTag || !eventDoneBy) {
          setFormError('Please fill out all required fields.');
          return;
        }
        await addFarmEvent({
          date: dateStr,
          type: eventType,
          event: eventName,
          tag: eventTag,
          diagnosis: eventDiagnosis || 'Routine',
          notes: eventNotes || 'No notes',
          doneBy: eventDoneBy,
          status: 'pending',
        });
        // Reset
        setEventName('');
        setEventTag('');
        setEventDiagnosis('');
        setEventNotes('');
        setEventDoneBy('');
      } else if (activeTab === 'todo') {
        if (!todoDesc || !todoCreatedBy) {
          setFormError('Please fill out all required fields.');
          return;
        }
        await addTodoTask({
          date: dateStr,
          description: todoDesc,
          status: 'pending',
          createdBy: todoCreatedBy,
          lastEdited: dateStr,
          priority: todoPriority,
        });
        // Reset
        setTodoDesc('');
        setTodoCreatedBy('');
        setTodoPriority('medium');
      } else if (activeTab === 'observations') {
        if (!obsText || !obsTag || !obsObserver) {
          setFormError('Please fill out all required fields.');
          return;
        }
        await addObservation({
          date: dateStr,
          tag: obsTag,
          observation: obsText,
          severity: obsSeverity,
          observer: obsObserver,
        });
        // Reset
        setObsText('');
        setObsTag('');
        setObsObserver('');
        setObsSeverity('medium');
      }
      setModalVisible(false);
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
        const start = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
        const end = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
        const days = eachDayOfInterval({ start, end });
        return days.flatMap(day => getEventsForDate(day));
      }
      case 'year': {
        const months = Array.from({ length: 12 }, (_, i) => 
          new Date(selectedDate.getFullYear(), i, 1)
        );
        return months.flatMap(month => getEventsForDate(month));
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
        <View style={styles.eventItem}>
          <View style={[styles.eventDot, { backgroundColor: Colors.primary[500] }]} />
          <View style={styles.eventContent}>
            <Text weight="medium">{item.event}</Text>
            <Text variant="caption" color="neutral.600">{item.type} • {item.tag}</Text>
          </View>
          <View style={styles.eventTime}>
            <Text variant="caption">{format(parseISO(item.date), 'MMM d, yyyy')}</Text>
            {renderStatusBadge(item.status)}
          </View>
        </View>
      );
    } else if ('description' in item) {
      // Todo
      return (
        <TouchableOpacity 
          style={styles.eventItem} 
          onPress={() => toggleTodoStatus(item.id, item.status)}
          activeOpacity={0.7}
        >
          <View style={[styles.eventDot, { backgroundColor: Colors.warning[500] }]} />
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
        <View style={styles.eventItem}>
          <View style={[styles.eventDot, { backgroundColor: Colors.error[500] }]} />
          <View style={styles.eventContent}>
            <Text weight="medium">{item.observation}</Text>
            <Text variant="caption" color="neutral.600">Tag: {item.tag}</Text>
          </View>
          <View style={styles.eventTime}>
            <Text variant="caption">{format(parseISO(item.date), 'MMM d, yyyy')}</Text>
            <View style={[
              styles.severityBadge,
              {
                backgroundColor: item.severity === 'high' ? 'rgba(239, 68, 68, 0.1)' : 
                                item.severity === 'medium' ? 'rgba(234, 179, 8, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                borderColor: item.severity === 'high' ? Colors.error[400] : 
                            item.severity === 'medium' ? Colors.warning[400] : Colors.success[400],
              }
            ]}>
              <Text 
                variant="caption" 
                weight="medium"
                color={item.severity === 'high' ? 'error.600' : 
                      item.severity === 'medium' ? 'warning.600' : 'success.600'}
              >
                {item.severity.toUpperCase()}
              </Text>
            </View>
          </View>
        </View>
      );
    }
    return null;
  };

  const renderStatusBadge = (status: string) => {
    const getStatusColor = () => {
      switch (status.toLowerCase()) {
        case 'completed':
          return {
            bg: Colors.success[100],
            text: Colors.success[700],
            icon: <Check size={14} color={Colors.success[700]} />,
          };
        case 'pending':
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
  };

  const renderCalendar = () => {
    return (
      <View style={styles.calendarContainer}>
        <View style={styles.calendarHeader}>
          <TouchableOpacity onPress={() => navigateDate('prev')} style={styles.navButton}>
            <Text>‹</Text>
          </TouchableOpacity>
          <Text weight="medium">
            {dateTitle}
          </Text>
          <TouchableOpacity onPress={() => navigateDate('next')} style={styles.navButton}>
            <Text>›</Text>
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

        {viewType !== 'list' && (
          <Calendar
            current={format(selectedDate, 'yyyy-MM-dd')}
            onDayPress={handleDayPress}
            markedDates={markedDates}
            hideExtraDays={viewType === 'month'}
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
            onPress={() => setModalVisible(true)}
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
                  Add {activeTab === 'events' ? 'Event' : activeTab === 'todo' ? 'Task' : 'Observation'}
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
                      ]}
                    />
                    <TextField
                      label="Event Name (Required)"
                      value={eventName}
                      onChangeText={setEventName}
                      placeholder="e.g. Vaccine A, Antibiotics"
                    />
                    <TextField
                      label="Animal Tag (Required)"
                      value={eventTag}
                      onChangeText={setEventTag}
                      placeholder="e.g. #120"
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
                    <TextField
                      label="Animal Tag (Required)"
                      value={obsTag}
                      onChangeText={setObsTag}
                      placeholder="e.g. #123"
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
                  </>
                )}
              </ScrollView>

              <View style={styles.modalFooter}>
                <Button
                  variant="outline"
                  onPress={() => setModalVisible(false)}
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
});