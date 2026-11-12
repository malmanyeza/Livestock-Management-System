import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Pressable,
  ScrollView,
  TextInput,
} from 'react-native';
import { Repeat, Check, ChevronDown, Minus, Plus, X } from 'lucide-react-native';
import { Text } from '../typography/Text';
import Colors from '../../constants/Colors';
import {
  RecurrenceRule,
  RepeatFrequency,
  CustomRepeatUnit,
  formatRecurrenceLabel,
} from '../../utils/recurrence';

interface RepeatPickerProps {
  label?: string;
  value: RecurrenceRule;
  onChange: (rule: RecurrenceRule) => void;
  style?: any;
}

const PRESET_OPTIONS: { label: string; value: RepeatFrequency }[] = [
  { label: 'Does not repeat', value: 'none' },
  { label: 'Every day', value: 'daily' },
  { label: 'Every week', value: 'weekly' },
  { label: 'Every month', value: 'monthly' },
  { label: 'Every year', value: 'yearly' },
];

const CUSTOM_UNITS: { label: string; value: CustomRepeatUnit }[] = [
  { label: 'Day', value: 'day' },
  { label: 'Week', value: 'week' },
  { label: 'Month', value: 'month' },
  { label: 'Year', value: 'year' },
];

const WEEKDAYS: { label: string; value: number }[] = [
  { label: 'S', value: 0 },
  { label: 'M', value: 1 },
  { label: 'T', value: 2 },
  { label: 'W', value: 3 },
  { label: 'T', value: 4 },
  { label: 'F', value: 5 },
  { label: 'S', value: 6 },
];

export function RepeatPicker({ label = 'Repeat', value, onChange, style }: RepeatPickerProps) {
  const [menuVisible, setMenuVisible] = useState(false);
  const [customVisible, setCustomVisible] = useState(false);

  // Draft state for Custom modal
  const [customInterval, setCustomInterval] = useState('1');
  const [customUnit, setCustomUnit] = useState<CustomRepeatUnit>('week');
  const [customDays, setCustomDays] = useState<number[]>([]);
  const [hasEndDate, setHasEndDate] = useState(false);
  const [endDateInput, setEndDateInput] = useState('');
  const [customError, setCustomError] = useState('');

  useEffect(() => {
    if (customVisible) {
      setCustomInterval(String(value?.interval && value.interval >= 1 ? value.interval : 1));
      setCustomUnit(value?.unit || 'week');
      setCustomDays(value?.daysOfWeek ? [...value.daysOfWeek] : []);
      setHasEndDate(Boolean(value?.endDate));
      setEndDateInput(value?.endDate || '');
      setCustomError('');
    }
  }, [customVisible, value]);

  const handleSelectPreset = (frequency: RepeatFrequency) => {
    onChange({ frequency });
    setMenuVisible(false);
  };

  const handleOpenCustom = () => {
    setMenuVisible(false);
    setCustomVisible(true);
  };

  const toggleDay = (dayVal: number) => {
    setCustomDays((prev) =>
      prev.includes(dayVal) ? prev.filter((d) => d !== dayVal) : [...prev, dayVal]
    );
  };

  const adjustInterval = (delta: number) => {
    const current = parseInt(customInterval, 10) || 1;
    const next = Math.max(1, Math.min(365, current + delta));
    setCustomInterval(String(next));
  };

  const handleSaveCustom = () => {
    const parsedInterval = parseInt(customInterval, 10);
    if (isNaN(parsedInterval) || parsedInterval < 1) {
      setCustomError('Interval must be at least 1.');
      return;
    }

    let trimmedEndDate: string | undefined;
    if (hasEndDate) {
      trimmedEndDate = endDateInput.trim();
      if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmedEndDate)) {
        setCustomError('End date must be in YYYY-MM-DD format.');
        return;
      }
    }

    onChange({
      frequency: 'custom',
      interval: parsedInterval,
      unit: customUnit,
      daysOfWeek: customUnit === 'week' && customDays.length > 0 ? customDays : undefined,
      endDate: trimmedEndDate,
    });
    setCustomVisible(false);
  };

  const displayLabel = formatRecurrenceLabel(value);
  const currentFreq = value?.frequency || 'none';

  return (
    <View style={[styles.container, style]}>
      {label ? (
        <Text variant="body2" color="neutral.600" style={styles.label}>
          {label}
        </Text>
      ) : null}

      <TouchableOpacity
        style={styles.pickerButton}
        onPress={() => setMenuVisible(true)}
        activeOpacity={0.7}
      >
        <View style={styles.pickerLeft}>
          <Repeat size={18} color={Colors.neutral[600]} style={styles.repeatIcon} />
          <Text style={styles.selectedText} numberOfLines={1}>
            {displayLabel}
          </Text>
        </View>
        <ChevronDown size={20} color={Colors.neutral[400]} />
      </TouchableOpacity>

      {/* Preset Options Menu Modal */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setMenuVisible(false)}>
          <Pressable style={styles.menuContent} onPress={(e) => e.stopPropagation()}>
            <View style={styles.menuHeader}>
              <Text variant="h6" weight="medium">
                Repeat
              </Text>
              <TouchableOpacity onPress={() => setMenuVisible(false)}>
                <X size={20} color={Colors.neutral[500]} />
              </TouchableOpacity>
            </View>

            <ScrollView>
              {PRESET_OPTIONS.map((opt) => {
                const isSelected = currentFreq === opt.value;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    style={[styles.menuOption, isSelected && styles.menuOptionSelected]}
                    onPress={() => handleSelectPreset(opt.value)}
                  >
                    <View style={styles.checkSlot}>
                      {isSelected && <Check size={18} color={Colors.primary[600]} />}
                    </View>
                    <Text
                      variant="body"
                      weight={isSelected ? 'medium' : 'regular'}
                      color={isSelected ? 'primary.600' : 'neutral.900'}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}

              <View style={styles.divider} />

              <TouchableOpacity
                style={[
                  styles.menuOption,
                  styles.lastMenuOption,
                  currentFreq === 'custom' && styles.menuOptionSelected,
                ]}
                onPress={handleOpenCustom}
              >
                <View style={styles.checkSlot}>
                  {currentFreq === 'custom' && <Check size={18} color={Colors.primary[600]} />}
                </View>
                <Text
                  variant="body"
                  weight={currentFreq === 'custom' ? 'medium' : 'regular'}
                  color={currentFreq === 'custom' ? 'primary.600' : 'neutral.900'}
                >
                  Custom...
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Custom Recurrence Modal */}
      <Modal
        visible={customVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCustomVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setCustomVisible(false)}>
          <Pressable style={styles.customContent} onPress={(e) => e.stopPropagation()}>
            <View style={styles.menuHeader}>
              <Text variant="h6" weight="medium">
                Custom Recurrence
              </Text>
              <TouchableOpacity onPress={() => setCustomVisible(false)}>
                <X size={20} color={Colors.neutral[500]} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.customBody}>
              {customError ? (
                <View style={styles.errorBanner}>
                  <Text variant="caption" color="error.600">
                    {customError}
                  </Text>
                </View>
              ) : null}

              <Text variant="body2" weight="medium" color="neutral.700" style={styles.sectionLabel}>
                Repeats every
              </Text>

              <View style={styles.intervalRow}>
                <TouchableOpacity
                  style={styles.stepperButton}
                  onPress={() => adjustInterval(-1)}
                >
                  <Minus size={18} color={Colors.neutral[700]} />
                </TouchableOpacity>

                <TextInput
                  style={styles.intervalInput}
                  value={customInterval}
                  onChangeText={(txt) => setCustomInterval(txt.replace(/[^0-9]/g, ''))}
                  keyboardType="number-pad"
                  maxLength={3}
                />

                <TouchableOpacity
                  style={styles.stepperButton}
                  onPress={() => adjustInterval(1)}
                >
                  <Plus size={18} color={Colors.neutral[700]} />
                </TouchableOpacity>
              </View>

              <View style={styles.unitRow}>
                {CUSTOM_UNITS.map((u) => {
                  const active = customUnit === u.value;
                  const count = parseInt(customInterval, 10) || 1;
                  return (
                    <TouchableOpacity
                      key={u.value}
                      style={[styles.unitPill, active && styles.unitPillActive]}
                      onPress={() => setCustomUnit(u.value)}
                    >
                      <Text
                        variant="caption"
                        weight="medium"
                        color={active ? 'white' : 'neutral.700'}
                      >
                        {count === 1 ? u.label : `${u.label}s`}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {customUnit === 'week' && (
                <View style={styles.weekdaysSection}>
                  <Text
                    variant="body2"
                    weight="medium"
                    color="neutral.700"
                    style={styles.sectionLabel}
                  >
                    Repeat on (optional)
                  </Text>
                  <View style={styles.weekdaysRow}>
                    {WEEKDAYS.map((day) => {
                      const active = customDays.includes(day.value);
                      return (
                        <TouchableOpacity
                          key={day.value}
                          style={[styles.dayCircle, active && styles.dayCircleActive]}
                          onPress={() => toggleDay(day.value)}
                        >
                          <Text
                            variant="caption"
                            weight="bold"
                            color={active ? 'white' : 'neutral.700'}
                          >
                            {day.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}

              <View style={styles.endsSection}>
                <Text
                  variant="body2"
                  weight="medium"
                  color="neutral.700"
                  style={styles.sectionLabel}
                >
                  Ends
                </Text>

                <View style={styles.endsToggleRow}>
                  <TouchableOpacity
                    style={[styles.endsPill, !hasEndDate && styles.endsPillActive]}
                    onPress={() => setHasEndDate(false)}
                  >
                    <Text
                      variant="caption"
                      weight="medium"
                      color={!hasEndDate ? 'white' : 'neutral.700'}
                    >
                      Never
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.endsPill, hasEndDate && styles.endsPillActive]}
                    onPress={() => setHasEndDate(true)}
                  >
                    <Text
                      variant="caption"
                      weight="medium"
                      color={hasEndDate ? 'white' : 'neutral.700'}
                    >
                      On date
                    </Text>
                  </TouchableOpacity>
                </View>

                {hasEndDate && (
                  <TextInput
                    style={styles.endDateInput}
                    value={endDateInput}
                    onChangeText={setEndDateInput}
                    placeholder="YYYY-MM-DD (e.g. 2026-12-31)"
                    placeholderTextColor={Colors.neutral[400]}
                    autoCapitalize="none"
                  />
                )}
              </View>
            </ScrollView>

            <View style={styles.customFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setCustomVisible(false)}
              >
                <Text variant="body2" weight="medium" color="neutral.700">
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.doneButton} onPress={handleSaveCustom}>
                <Text variant="body2" weight="medium" color="white">
                  Done
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
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
  pickerButton: {
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
  pickerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  repeatIcon: {
    marginRight: 10,
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
    paddingHorizontal: 20,
  },
  menuContent: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    overflow: 'hidden',
    maxHeight: '75%',
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[200],
  },
  menuOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  lastMenuOption: {
    paddingBottom: 18,
  },
  menuOptionSelected: {
    backgroundColor: Colors.primary[50],
  },
  checkSlot: {
    width: 28,
    alignItems: 'flex-start',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.neutral[200],
    marginVertical: 4,
  },
  customContent: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    overflow: 'hidden',
    maxHeight: '85%',
  },
  customBody: {
    padding: 16,
  },
  errorBanner: {
    backgroundColor: Colors.error[50],
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  sectionLabel: {
    marginBottom: 8,
  },
  intervalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 12,
  },
  stepperButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.neutral[300],
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.neutral[50],
  },
  intervalInput: {
    width: 64,
    height: 40,
    borderWidth: 1,
    borderColor: Colors.neutral[300],
    borderRadius: 8,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    color: Colors.neutral[900],
    backgroundColor: Colors.white,
  },
  unitRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 18,
  },
  unitPill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.neutral[300],
    alignItems: 'center',
    backgroundColor: Colors.white,
  },
  unitPillActive: {
    backgroundColor: Colors.primary[500],
    borderColor: Colors.primary[500],
  },
  weekdaysSection: {
    marginBottom: 18,
  },
  weekdaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.neutral[300],
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.white,
  },
  dayCircleActive: {
    backgroundColor: Colors.primary[500],
    borderColor: Colors.primary[500],
  },
  endsSection: {
    marginBottom: 8,
  },
  endsToggleRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  endsPill: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.neutral[300],
    backgroundColor: Colors.white,
  },
  endsPillActive: {
    backgroundColor: Colors.primary[500],
    borderColor: Colors.primary[500],
  },
  endDateInput: {
    borderWidth: 1,
    borderColor: Colors.neutral[300],
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
    fontSize: 15,
    color: Colors.neutral[900],
    backgroundColor: Colors.white,
  },
  customFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral[200],
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.neutral[300],
  },
  doneButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: Colors.primary[500],
  },
});

