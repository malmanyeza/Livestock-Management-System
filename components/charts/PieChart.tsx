import React from 'react';
import { View, StyleSheet, Dimensions, Text } from 'react-native';
import { PieChart as RNPieChart } from 'react-native-chart-kit';
import Colors from '@/constants/Colors';

interface PieChartData {
  name: string;
  population: number;
  color: string;
  legendFontColor?: string;
  legendFontSize?: number;
}

interface PieChartProps {
  data: PieChartData[];
  title?: string;
  height?: number;
  width?: number;
}

export function PieChart({ data, title, height = 200, width }: PieChartProps) {
  const screenWidth = width || Dimensions.get('window').width - 64;

  return (
    <View style={styles.container}>
      {title && <Text style={styles.title}>{title}</Text>}
      <RNPieChart
        data={data}
        width={screenWidth}
        height={height}
        chartConfig={{
          backgroundColor: Colors.white,
          backgroundGradientFrom: Colors.white,
          backgroundGradientTo: Colors.white,
          color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
          labelColor: () => Colors.neutral[700],
          style: {
            borderRadius: 16,
          },
        }}
        accessor="population"
        backgroundColor="transparent"
        paddingLeft="15"
        absolute
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
    color: Colors.neutral[700],
  },
});