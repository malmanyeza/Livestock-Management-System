import React, { useState } from 'react';
import { View, StyleSheet, Modal, TouchableOpacity, Pressable } from 'react-native';
import { ChevronDown } from 'lucide-react-native';
import { Text } from '../typography/Text';
import Colors from '../../constants/Colors';

interface PickerItem {
  label: string;
  value: string;
}

interface PickerProps {
  label?: string;
  value: string;
  onValueChange: (value: string) => void;
  items: PickerItem[] | readonly PickerItem[];
  style?: any;
}

export function Picker({ label, value, onValueChange, items = [], style }: PickerProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const selectedItem = items.find(item => item.value === value);

  return (
    <View style={[styles.container, style]}>
      {label ? (
        <Text variant="body2" color="neutral.600" style={styles.label}>
          {label}
        </Text>
      ) : null}
      <TouchableOpacity
        style={styles.pickerContainer}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.7}
      >
        <Text style={styles.selectedText}>{selectedItem?.label || 'Select...'}</Text>
        <ChevronDown size={20} color={Colors.neutral[400]} />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text variant="h6" weight="medium">{label || 'Select'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text variant="body2" color="primary.500">Done</Text>
              </TouchableOpacity>
            </View>
            {items.map((item, index) => (
              <TouchableOpacity
                key={item.value}
                style={[
                  styles.option,
                  index === items.length - 1 && styles.lastOption,
                  item.value === value && styles.selectedOption
                ]}
                onPress={() => {
                  onValueChange(item.value);
                  setModalVisible(false);
                }}
              >
                <Text
                  variant="body"
                  color={item.value === value ? 'primary.500' : 'neutral.900'}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    height: 48,
  },
  selectedText: {
    fontSize: 16,
    color: Colors.neutral[900],
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    maxHeight: '80%',
    width: '100%',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[100],
  },
  option: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[100],
  },
  lastOption: {
    borderBottomWidth: 0,
  },
  selectedOption: {
    backgroundColor: Colors.primary[50],
  },
});
