import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Picker as RNPicker } from '@react-native-picker/picker';
import { Text } from '../typography/Text';
import Colors from '../../constants/Colors';

interface PickerItem {
  label: string;
  value: string;
}

interface PickerProps {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  items: PickerItem[];
  style?: any;
}

export function Picker({ label, value, onValueChange, items, style }: PickerProps) {
  return (
    <View style={[styles.container, style]}>
      <Text variant="body2" color="neutral.600" style={styles.label}>
        {label}
      </Text>
      <View style={styles.pickerContainer}>
        <RNPicker
          selectedValue={value}
          onValueChange={onValueChange}
          style={styles.picker}
        >
          {items.map((item) => (
            <RNPicker.Item key={item.value} label={item.label} value={item.value} />
          ))}
        </RNPicker>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 4,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    borderRadius: 8,
    backgroundColor: Colors.white,
  },
  picker: {
    height: 40,
  },
});
