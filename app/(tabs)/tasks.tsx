import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text } from '../../components/typography/Text';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { Card } from '../../components/ui/Card';
import { DataTable } from '../../components/tables/DataTable';
import { Button } from '../../components/ui/Button';
import { Plus, Check, X, CircleAlert as AlertCircle } from 'lucide-react-native';
import Colors from '../../constants/Colors';
import { Stack } from 'expo-router';

const farmEvents = [
  {
    id: '1',
    date: '2024-02-20',
    type: 'Mass',
    event: 'Dipping',
    tag: 'ALL',
    diagnosis: '-',
    notes: 'Monthly dipping schedule',
    doneBy: 'Team A',
    status: 'pending',
  },
  {
    id: '2',
    date: '2024-02-19',
    type: 'Individual',
    event: 'Treatment',
    tag: 'TAG123',
    diagnosis: 'Foot rot',
    notes: 'Applied medication',
    doneBy: 'Dr. Smith',
    status: 'completed',
  },
];

const todoList = [
  {
    id: '1',
    date: '2024-02-20',
    description: 'Check fence in paddock 3',
    status: 'pending',
    createdBy: 'John D.',
    lastEdited: '2024-02-18',
    priority: 'high',
  },
  {
    id: '2',
    date: '2024-02-21',
    description: 'Order feed supplies',
    status: 'completed',
    createdBy: 'Sarah M.',
    lastEdited: '2024-02-19',
    priority: 'medium',
  },
];

const observations = [
  {
    id: '1',
    date: '2024-02-19',
    tag: 'TAG456',
    observation: 'Reduced feed intake noticed',
    observer: 'Mike R.',
    severity: 'medium',
  },
  {
    id: '2',
    date: '2024-02-18',
    tag: 'TAG789',
    observation: 'Limping on right hind leg',
    observer: 'Dr. Smith',
    severity: 'high',
  },
];

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

function TasksContent() {
  const [activeTab, setActiveTab] = useState('events');

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

  return (
    <ScreenContainer style={styles.container}>
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
        <View style={styles.actionBar}>
          <Button
            variant="primary"
            startIcon={<Plus size={20} color={Colors.white} />}
            style={styles.addButton}
          >
            Add {activeTab === 'events' ? 'Event' : activeTab === 'todo' ? 'Task' : 'Observation'}
          </Button>
        </View>

        {activeTab === 'events' && (
          <DataTable
            columns={[
              { key: 'date', title: 'Date', width: 100 },
              { key: 'type', title: 'Type', width: 100 },
              { key: 'event', title: 'Event', width: 100 },
              { key: 'tag', title: 'Tag', width: 80 },
              { key: 'diagnosis', title: 'Diagnosis', width: 120 },
              { key: 'notes', title: 'Notes', width: 150 },
              { key: 'doneBy', title: 'Done By', width: 100 },
              {
                key: 'status',
                title: 'Status',
                width: 120,
                render: (value) => renderStatusBadge(value),
              },
            ]}
            data={farmEvents}
          />
        )}

        {activeTab === 'todo' && (
          <DataTable
            columns={[
              {
                key: 'priority',
                title: '',
                width: 40,
                render: (value) => renderPriorityBadge(value),
              },
              { key: 'date', title: 'Date', width: 100 },
              { key: 'description', title: 'Description', width: 200 },
              {
                key: 'status',
                title: 'Status',
                width: 120,
                render: (value) => renderStatusBadge(value),
              },
              { key: 'createdBy', title: 'Created By', width: 100 },
              { key: 'lastEdited', title: 'Last Edited', width: 100 },
            ]}
            data={todoList}
          />
        )}

        {activeTab === 'observations' && (
          <Card style={styles.observationsContainer}>
            {observations.map((observation) => (
              <View key={observation.id} style={styles.observationItem}>
                <View style={styles.observationHeader}>
                  <View style={styles.observationMeta}>
                    <Text variant="caption" color="neutral.600">
                      {observation.date}
                    </Text>
                    <Text variant="caption" color="neutral.600">
                      Tag: {observation.tag}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.severityBadge,
                      {
                        backgroundColor:
                          observation.severity === 'high'
                            ? Colors.error[100]
                            : Colors.warning[100],
                      },
                    ]}
                  >
                    <Text
                      variant="caption"
                      weight="medium"
                      color={
                        observation.severity === 'high' ? 'error.700' : 'warning.700'
                      }
                    >
                      {observation.severity.toUpperCase()}
                    </Text>
                  </View>
                </View>
                <Text variant="body" style={styles.observationText}>
                  {observation.observation}
                </Text>
                <Text variant="caption" color="neutral.600" style={styles.observer}>
                  Observed by {observation.observer}
                </Text>
              </View>
            ))}
          </Card>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral[50],
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[200],
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary[500],
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 16,
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
});