import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text } from '@/components/typography/Text';
import Colors from '@/constants/Colors';

interface Column {
  key: string;
  title: string;
  width?: number;
  align?: 'left' | 'center' | 'right';
  render?: (value: any, rowData: any) => React.ReactNode;
}

interface DataTableProps {
  columns: Column[];
  data: any[];
  emptyText?: string;
}

export function DataTable({ columns, data, emptyText = 'No data available' }: DataTableProps) {
  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View>
          {/* Header Row */}
          <View style={styles.headerRow}>
            {columns.map((column) => (
              <View
                key={column.key}
                style={[
                  styles.headerCell,
                  column.width ? { width: column.width } : {},
                  column.align ? { justifyContent: getAlignment(column.align) } : {},
                ]}
              >
                <Text variant="body2" weight="medium" color="neutral.600">
                  {column.title}
                </Text>
              </View>
            ))}
          </View>

          {/* Data Rows */}
          <View style={styles.dataRows}>
            {data.length > 0 ? (
              data.map((row, rowIndex) => (
                <View key={rowIndex} style={styles.dataRow}>
                  {columns.map((column) => (
                    <View
                      key={`${rowIndex}-${column.key}`}
                      style={[
                        styles.dataCell,
                        column.width ? { width: column.width } : {},
                        column.align ? { justifyContent: getAlignment(column.align) } : {},
                      ]}
                    >
                      {column.render ? (
                        column.render(row[column.key], row)
                      ) : (
                        <Text variant="body2">{row[column.key]}</Text>
                      )}
                    </View>
                  ))}
                </View>
              ))
            ) : (
              <View style={styles.emptyContainer}>
                <Text variant="body" color="neutral.500">
                  {emptyText}
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

// Helper function to convert align string to flexbox justifyContent
function getAlignment(align: 'left' | 'center' | 'right'): 'flex-start' | 'center' | 'flex-end' {
  switch (align) {
    case 'center':
      return 'center';
    case 'right':
      return 'flex-end';
    default:
      return 'flex-start';
  }
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    borderRadius: 8,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: Colors.neutral[100],
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[200],
  },
  headerCell: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    minWidth: 100,
    flexDirection: 'row',
    alignItems: 'center',
  },
  dataRows: {
    backgroundColor: Colors.white,
  },
  dataRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[200],
  },
  dataCell: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    minWidth: 100,
    flexDirection: 'row',
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});