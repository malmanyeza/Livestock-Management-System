import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
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
  const total = data.reduce((sum, item) => sum + item.population, 0);

  return (
    <View style={styles.container}>
      {title && <Text style={styles.title}>{title}</Text>}
      
      {/* Horizontal Segmented Bar representing the distribution */}
      <View style={styles.barContainer}>
        {data.map((item, index) => {
          const percentage = total > 0 ? (item.population / total) * 100 : 0;
          if (percentage === 0) return null;
          
          return (
            <View
              key={index}
              style={[
                styles.barSegment,
                {
                  width: `${percentage}%`,
                  backgroundColor: item.color || '#3b82f6',
                  // Round the start and end of the full bar
                  borderTopLeftRadius: index === 0 ? 8 : 0,
                  borderBottomLeftRadius: index === 0 ? 8 : 0,
                  borderTopRightRadius: index === data.length - 1 ? 8 : 0,
                  borderBottomRightRadius: index === data.length - 1 ? 8 : 0,
                }
              ]}
            />
          );
        })}
      </View>

      {/* Legends and details below */}
      <View style={styles.legendContainer}>
        {data.map((item, index) => {
          const percentage = total > 0 ? ((item.population / total) * 100).toFixed(0) : '0';
          return (
            <View key={index} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: item.color }]} />
              <View style={styles.legendTextContainer}>
                <Text style={styles.legendName} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.legendValues}>
                  {item.population} ({percentage}%)
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    padding: 16,
    backgroundColor: Colors.white || '#ffffff',
    borderRadius: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
    color: Colors.neutral?.[800] || '#1f2937',
  },
  barContainer: {
    flexDirection: 'row',
    height: 16,
    backgroundColor: Colors.neutral?.[100] || '#f3f4f6',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 20,
    width: '100%',
  },
  barSegment: {
    height: '100%',
  },
  legendContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '45%', // Two column layout
    marginBottom: 4,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  legendTextContainer: {
    flex: 1,
  },
  legendName: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.neutral?.[700] || '#374151',
  },
  legendValues: {
    fontSize: 11,
    color: Colors.neutral?.[500] || '#6b7280',
    marginTop: 1,
  },
});
