import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text } from '../../components/typography/Text';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { Card } from '../../components/ui/Card';
import { DataTable } from '../../components/tables/DataTable';
import Colors from '../../constants/Colors';
import { Stack } from 'expo-router';

// Record System Traceability data
const traceabilityData = [
  { id: 1, metric: 'Birth Registration', attained: '95%', target: '100%', mark: 'A-' },
  { id: 2, metric: 'Movement Records', attained: '87%', target: '95%', mark: 'B+' },
  { id: 3, metric: 'Health Treatments', attained: '92%', target: '100%', mark: 'A-' },
  { id: 4, metric: 'Mortality Records', attained: '100%', target: '100%', mark: 'A+' },
  { id: 5, metric: 'Feed Records', attained: '78%', target: '90%', mark: 'C+' },
];

// Identification data
const identificationData = [
  { id: 1, method: 'Ear Tags', attained: '100%', target: '100%', mark: 'A+' },
  { id: 2, method: 'Electronic ID', attained: '85%', target: '90%', mark: 'B' },
  { id: 3, method: 'Brand Registration', attained: '92%', target: '95%', mark: 'A-' },
  { id: 4, method: 'DNA Profiles', attained: '65%', target: '70%', mark: 'B' },
];

// Observer Awards data
const observerAwards = [
  { id: 1, category: 'Heat Detection', name: 'John Smith', count: 28, badge: 'Gold' },
  { id: 2, category: 'Calving Observer', name: 'Maria Garcia', count: 32, badge: 'Platinum' },
  { id: 3, category: 'Health Monitor', name: 'David Johnson', count: 45, badge: 'Diamond' },
];

// Helper function to get color based on mark
function getMarkColor(mark: string): string {
  switch (mark.charAt(0)) {
    case 'A':
      return Colors.success[500];
    case 'B':
      return Colors.primary[500];
    case 'C':
      return Colors.warning[500];
    case 'D':
      return Colors.error[400];
    case 'F':
      return Colors.error[600];
    default:
      return Colors.neutral[500];
  }
}

// Helper function to get color based on badge
function getBadgeColor(badge: string): string {
  switch (badge) {
    case 'Gold':
      return '#FFD700';
    case 'Platinum':
      return '#E5E4E2';
    case 'Diamond':
      return '#B9F2FF';
    default:
      return Colors.accent[500];
  }
}

export default function RecordsScreen() {
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Records',
        }}
      />
      <RecordsContent />
    </>
  );
}

function RecordsContent() {
  return (
    <ScreenContainer>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Record System Traceability Section */}
        <Card title="Record System Traceability" style={styles.card}>
          <DataTable
            columns={[
              { key: 'metric', title: 'Metric', width: 150 },
              { key: 'attained', title: 'Attained', width: 100, align: 'center' },
              { key: 'target', title: 'Target', width: 100, align: 'center' },
              { 
                key: 'mark', 
                title: 'Mark', 
                width: 80, 
                align: 'center',
                render: (value: string) => (
                  <View style={[
                    styles.markBadge, 
                    { backgroundColor: getMarkColor(value) }
                  ]}>
                    <Text variant="body2" weight="medium" color="white">
                      {value}
                    </Text>
                  </View>
                )
              },
            ]}
            data={traceabilityData}
          />
        </Card>

        {/* Identification Section */}
        <Card title="Identification" style={styles.card}>
          <DataTable
            columns={[
              { key: 'method', title: 'Method', width: 150 },
              { key: 'attained', title: 'Attained', width: 100, align: 'center' },
              { key: 'target', title: 'Target', width: 100, align: 'center' },
              { 
                key: 'mark', 
                title: 'Mark', 
                width: 80, 
                align: 'center',
                render: (value: string) => (
                  <View style={[
                    styles.markBadge, 
                    { backgroundColor: getMarkColor(value) }
                  ]}>
                    <Text variant="body2" weight="medium" color="white">
                      {value}
                    </Text>
                  </View>
                )
              },
            ]}
            data={identificationData}
          />
        </Card>

        {/* Observer Awards Section */}
        <Card title="Observer Awards" style={styles.card}>
          <DataTable
            columns={[
              { key: 'category', title: 'Category', width: 150 },
              { key: 'name', title: 'Observer', width: 150 },
              { key: 'count', title: 'Count', width: 80, align: 'center' },
              { 
                key: 'badge', 
                title: 'Badge', 
                width: 100, 
                align: 'center',
                render: (value: string) => (
                  <View style={[
                    styles.badgeContainer, 
                    { backgroundColor: getBadgeColor(value) }
                  ]}>
                    <Text variant="body2" weight="medium" color="white">
                      {value}
                    </Text>
                  </View>
                )
              },
            ]}
            data={observerAwards}
          />
        </Card>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: Colors.neutral[50],
  },
  card: {
    marginBottom: 16,
  },
  markBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeContainer: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});