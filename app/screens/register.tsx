import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { Text } from '../../components/typography/Text';
import { Card } from '../../components/ui/Card';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { Picker } from '../../components/inputs/Picker';
import { DataTable } from '../../components/tables/DataTable';
import { PieChart } from '../../components/charts/PieChart';
import Colors from '../../constants/Colors';
import { Stack, useRouter } from 'expo-router';

// Sample data for herd totals
const herdTotals = {
  cows: 120,
  bulls: 15,
  heifers: 45,
  steers: 30,
  maleCalves: 25,
  femaleCalves: 28
};

// Sample data for pie charts
interface PieChartData {
  name: string;
  population: number;
  color: string;
}

const breedDistribution: PieChartData[] = [
  { name: 'Brahman', population: 120, color: Colors.primary[500] },
  { name: 'Angus', population: 80, color: Colors.success[500] },
  { name: 'Hereford', population: 60, color: Colors.warning[500] },
  { name: 'Others', population: 40, color: Colors.neutral[500] },
];

const sourceDistribution: PieChartData[] = [
  { name: 'Born', population: 180, color: Colors.primary[500] },
  { name: 'Purchased', population: 120, color: Colors.success[500] },
];

const sexBreakdown: PieChartData[] = [
  { name: 'Male', population: 70, color: Colors.primary[500] },
  { name: 'Female', population: 193, color: Colors.accent[500] },
];

const stockTypeBreakdown: PieChartData[] = [
  { name: 'Cows', population: 120, color: Colors.success[500] },
  { name: 'Bulls', population: 15, color: Colors.error[500] },
  { name: 'Heifers', population: 45, color: Colors.warning[500] },
  { name: 'Steers', population: 30, color: Colors.secondary[500] },
  { name: 'Calves', population: 53, color: Colors.accent[500] },
];

// Sample data for tables
const herdRegisterData = [
  { unitNo: 'B001', tag: 'TAG123', age: '4y 2m', breed: 'Mashona', sex: 'Male', stockType: 'Bull', source: 'Born' },
  { unitNo: 'C045', tag: 'TAG456', age: '3y 6m', breed: 'Brahman', sex: 'Female', stockType: 'Cow', source: 'Purchased' },
];

const calfRegisterData = [
  { unit: 'CLF001', calfId: 'TAG789', age: '2m', deliveryType: 'Normal', observer: 'John D.', birthWeight: '35kg', sex: 'Female' },
];

const drugRegisterData = [
  { drugClass: 'Antibiotic', type: 'Injectable', withdrawal: '14 days', pregnancySafe: 'Yes', stock: 'In Stock' },
];

const mortalityData = [
  { id: 'TAG111', date: '2024-02-15', cause: 'Disease', description: 'Respiratory failure' },
];

const transactionData = [
  { date: '2024-02-10', description: 'Sale of bull B023', amount: 2500, type: 'Sale' },
  { date: '2024-02-05', description: 'Purchase of heifer H045', amount: -3000, type: 'Purchase' },
];

const weightData = [
  { 
    id: 'B001', 
    stockType: 'Bull', 
    age: '4y 2m', 
    jan: '650', 
    feb: '665', 
    mar: '680', 
    apr: '695', 
    may: '705', 
    jun: '720', 
    jul: '735', 
    aug: '750', 
    sep: '765', 
    oct: '780', 
    nov: '790', 
    dec: '800' 
  },
];

// Filter options
const breedOptions = [
  { value: 'all', label: 'All' },
  { value: 'mashona', label: 'Mashona' },
  { value: 'brahman', label: 'Brahman' },
  { value: 'tuli', label: 'Tuli' },
  { value: 'nguni', label: 'Nguni' },
];

const sourceOptions = [
  { value: 'all', label: 'All' },
  { value: 'born', label: 'Born on Farm' },
  { value: 'purchased', label: 'Purchased' },
];

export default function RegisterScreen() {
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Register',
        }}
      />
      <RegisterContent />
    </>
  );
}

function RegisterContent() {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedBreed, setSelectedBreed] = useState('All');
  const [selectedSource, setSelectedSource] = useState('All');
  const router = useRouter();

  return (
    <ScreenContainer>

      
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Herd at a Glance Section */}
        <Card title="Herd at a Glance" style={styles.card}>
          <View style={styles.filters}>
            <Picker
              label="Breed"
              value={selectedBreed}
              onValueChange={setSelectedBreed}
              items={breedOptions}
              style={styles.filter}
            />
            <Picker
              label="Source"
              value={selectedSource}
              onValueChange={setSelectedSource}
              items={sourceOptions}
              style={styles.filter}
            />
          </View>

          <View style={styles.totalsGrid}>
            <View style={styles.totalItem}>
              <Text variant="h3" weight="bold" color="primary.500">{herdTotals.cows}</Text>
              <Text variant="body2">Cows</Text>
            </View>
            <View style={styles.totalItem}>
              <Text variant="h4" weight="bold" color="error.500">{herdTotals.bulls}</Text>
              <Text variant="body2">Bulls</Text>
            </View>
            <View style={styles.totalItem}>
              <Text variant="h4" weight="bold" color="warning.500">{herdTotals.heifers}</Text>
              <Text variant="body2">Heifers</Text>
            </View>
            <View style={styles.totalItem}>
              <Text variant="h4" weight="bold" color="info.500">{herdTotals.steers}</Text>
              <Text variant="body2">Steers</Text>
            </View>
            <View style={styles.totalItem}>
              <Text variant="h4" weight="bold" color="success.500">{herdTotals.maleCalves}</Text>
              <Text variant="body2">Male Calves</Text>
            </View>
            <View style={styles.totalItem}>
              <Text variant="h4" weight="bold" color="accent.500">{herdTotals.femaleCalves}</Text>
              <Text variant="body2">Female Calves</Text>
            </View>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chartsContainer}
          >
            <View style={styles.chart}>
              <Text variant="subtitle1" weight="medium" style={styles.chartTitle}>Breed Distribution</Text>
              <PieChart
                data={breedDistribution}
                height={200}
                width={300}
                accessor="population"
                backgroundColor="transparent"
                paddingLeft="0"
              />
            </View>
            <View style={styles.chart}>
              <Text variant="subtitle1" weight="medium" style={styles.chartTitle}>Source Distribution</Text>
              <PieChart
                data={sourceDistribution}
                height={200}
                width={300}
                accessor="population"
                backgroundColor="transparent"
                paddingLeft="0"
              />
            </View>
            <View style={styles.chart}>
              <Text variant="subtitle1" weight="medium" style={styles.chartTitle}>Sex Breakdown</Text>
              <PieChart
                data={sexBreakdown}
                height={200}
                width={300}
                accessor="population"
                backgroundColor="transparent"
                paddingLeft="0"
              />
            </View>
            <View style={styles.chart}>
              <Text variant="subtitle1" weight="medium" style={styles.chartTitle}>Stock Type Breakdown</Text>
              <PieChart
                data={stockTypeBreakdown}
                height={200}
                width={300}
                accessor="population"
                backgroundColor="transparent"
                paddingLeft="0"
              />
            </View>
          </ScrollView>
        </Card>

        {/* Herd Register Section */}
        <Card title="Herd Register" style={styles.card}>
          <DataTable
            columns={[
              { key: 'unitNo', title: 'Unit No', width: 80 },
              { key: 'tag', title: 'Tag', width: 80 },
              { key: 'age', title: 'Age', width: 80 },
              { key: 'breed', title: 'Breed', width: 100 },
              { key: 'sex', title: 'Sex', width: 80 },
              { key: 'stockType', title: 'Type', width: 100 },
              { key: 'source', title: 'Source', width: 100 },
            ]}
            data={herdRegisterData}
          />
        </Card>

        {/* Calf Register Section */}
        <Card title="Calf Register" style={styles.card}>
          <DataTable
            columns={[
              { key: 'unit', title: 'Unit', width: 80 },
              { key: 'calfId', title: 'Calf ID', width: 80 },
              { key: 'age', title: 'Age', width: 60 },
              { key: 'deliveryType', title: 'Delivery', width: 100 },
              { key: 'observer', title: 'Observer', width: 100 },
              { key: 'birthWeight', title: 'Weight', width: 80 },
              { key: 'sex', title: 'Sex', width: 80 },
            ]}
            data={calfRegisterData}
          />
        </Card>

        {/* Drug Register Section */}
        <Card title="Drug Register" style={styles.card}>
          <DataTable
            columns={[
              { key: 'drugClass', title: 'Class', width: 100 },
              { key: 'type', title: 'Type', width: 100 },
              { key: 'withdrawal', title: 'Withdrawal', width: 100 },
              { key: 'pregnancySafe', title: 'Preg. Safe', width: 100 },
              { key: 'stock', title: 'Stock', width: 100 },
            ]}
            data={drugRegisterData}
          />
        </Card>

        {/* Cull & Mortalities Section */}
        <Card title="Cull & Mortalities" style={styles.card}>
          <DataTable
            columns={[
              { key: 'id', title: 'ID', width: 100 },
              { key: 'date', title: 'Date', width: 100 },
              { key: 'cause', title: 'Cause', width: 100 },
              { key: 'description', title: 'Description', width: 200 },
            ]}
            data={mortalityData}
          />
        </Card>

        {/* Sales & Purchases Section */}
        <Card title="Sales & Purchases" style={styles.card}>
          <DataTable
            columns={[
              { key: 'date', title: 'Date', width: 100 },
              { key: 'description', title: 'Description', width: 200 },
              { 
                key: 'amount', 
                title: 'Amount', 
                width: 100,
                render: (value: number) => (
                  <Text color={value >= 0 ? 'success.500' : 'error.500'}>
                    {value >= 0 ? '+' : ''}{value}
                  </Text>
                )
              },
              { key: 'type', title: 'Type', width: 100 },
            ]}
            data={transactionData}
          />
        </Card>

        {/* Weight Record Section */}
        <Card title="Weight Record" style={styles.card}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <DataTable
              columns={[
                { key: 'id', title: 'ID', width: 80 },
                { key: 'stockType', title: 'Type', width: 80 },
                { key: 'age', title: 'Age', width: 80 },
                { key: 'jan', title: 'Jan', width: 70 },
                { key: 'feb', title: 'Feb', width: 70 },
                { key: 'mar', title: 'Mar', width: 70 },
                { key: 'apr', title: 'Apr', width: 70 },
                { key: 'may', title: 'May', width: 70 },
                { key: 'jun', title: 'Jun', width: 70 },
                { key: 'jul', title: 'Jul', width: 70 },
                { key: 'aug', title: 'Aug', width: 70 },
                { key: 'sep', title: 'Sep', width: 70 },
                { key: 'oct', title: 'Oct', width: 70 },
                { key: 'nov', title: 'Nov', width: 70 },
                { key: 'dec', title: 'Dec', width: 70 },
              ]}
              data={weightData}
            />
          </ScrollView>
        </Card>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  filters: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 16,
  },
  filter: {
    flex: 1,
  },
  totalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 24,
  },
  totalItem: {
    flex: 1,
    minWidth: 100,
    alignItems: 'center',
    backgroundColor: Colors.neutral[50],
    padding: 12,
    borderRadius: 8,
  },
  chartsContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  chart: {
    flex: 1,
    alignItems: 'center',
  },
  chartTitle: {
    marginBottom: 8,
    textAlign: 'center',
  },
});
