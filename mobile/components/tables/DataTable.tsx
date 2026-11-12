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
  emptyState?: React.ReactNode;
  rowStyle?: (rowData: any) => any;
  frozenColumnsCount?: number;
}

export function DataTable({
  columns,
  data,
  emptyText = 'No data available',
  emptyState,
  rowStyle,
  frozenColumnsCount = 0,
}: DataTableProps) {
  const hasFrozen = frozenColumnsCount > 0 && frozenColumnsCount < columns.length;
  const frozenColumns = hasFrozen ? columns.slice(0, frozenColumnsCount) : [];
  const scrollableColumns = hasFrozen ? columns.slice(frozenColumnsCount) : columns;

  const renderHeaderRow = (cols: Column[], isFrozen = false) => (
    <View style={[styles.headerRow, hasFrozen && styles.fixedHeaderRow, isFrozen && styles.frozenHeaderRow]}>
      {cols.map((column) => (
        <View
          key={column.key}
          style={[
            styles.headerCell,
            column.width ? { width: column.width, minWidth: column.width } : { flex: 1, minWidth: 100 },
            column.align ? { justifyContent: getAlignment(column.align) } : {},
          ]}
        >
          <Text variant="caption" weight="bold" color="neutral.500" numberOfLines={1}>
            {column.title}
          </Text>
        </View>
      ))}
    </View>
  );

  const renderDataRows = (cols: Column[]) =>
    data.map((row, rowIndex) => (
      <View
        key={row.id || rowIndex}
        style={[
          styles.dataRow,
          hasFrozen && styles.fixedDataRow,
          rowIndex === data.length - 1 && styles.lastDataRow,
          rowStyle ? rowStyle(row) : undefined,
        ]}
      >
        {cols.map((column) => (
          <View
            key={`${rowIndex}-${column.key}`}
            style={[
              styles.dataCell,
              column.width ? { width: column.width, minWidth: column.width } : { flex: 1, minWidth: 100 },
              column.align ? { justifyContent: getAlignment(column.align) } : {},
            ]}
          >
            {column.render ? (
              column.render(row[column.key], row)
            ) : (
              <Text variant="body2" numberOfLines={1}>{row[column.key]}</Text>
            )}
          </View>
        ))}
      </View>
    ));

  if (hasFrozen) {
    return (
      <View style={styles.container}>
        {data.length > 0 ? (
          <View style={styles.frozenSplitWrapper}>
            <View style={styles.frozenPane}>
              {renderHeaderRow(frozenColumns, true)}
              <View>{renderDataRows(frozenColumns)}</View>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={true}
              style={styles.scrollablePane}
              contentContainerStyle={styles.scrollablePaneContent}
            >
              <View>
                {renderHeaderRow(scrollableColumns)}
                <View>{renderDataRows(scrollableColumns)}</View>
              </View>
            </ScrollView>
          </View>
        ) : (
          <>
            {renderHeaderRow(columns)}
            {emptyState ? (
              emptyState
            ) : (
              <View style={styles.emptyContainer}>
                <Text variant="body" color="neutral.500">
                  {emptyText}
                </Text>
              </View>
            )}
          </>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.tableInner}>
          {/* Header Row */}
          {renderHeaderRow(columns)}

          {/* Data Rows */}
          <View>
            {data.length > 0 ? (
              renderDataRows(columns)
            ) : (
              emptyState ? (
                emptyState
              ) : (
                <View style={styles.emptyContainer}>
                  <Text variant="body" color="neutral.500">
                    {emptyText}
                  </Text>
                </View>
              )
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
    backgroundColor: Colors.white,
  },
  scrollContent: {
    minWidth: '100%',
  },
  tableInner: {
    minWidth: '100%',
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: Colors.neutral[100],
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[200],
    minWidth: '100%',
  },
  headerCell: {
    paddingVertical: 12,
    paddingHorizontal: 10,
    minWidth: 80,
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
    minWidth: '100%',
  },
  lastDataRow: {
    borderBottomWidth: 0,
  },
  dataCell: {
    paddingVertical: 12,
    paddingHorizontal: 10,
    minWidth: 80,
    flexDirection: 'row',
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  frozenSplitWrapper: {
    flexDirection: 'row',
    width: '100%',
  },
  frozenPane: {
    backgroundColor: Colors.white,
    borderRightWidth: 1,
    borderRightColor: Colors.neutral[200],
    zIndex: 1,
  },
  frozenHeaderRow: {
    minWidth: 0,
  },
  fixedHeaderRow: {
    height: 44,
  },
  fixedDataRow: {
    height: 58,
  },
  scrollablePane: {
    flex: 1,
  },
  scrollablePaneContent: {
    minWidth: '100%',
  },
});