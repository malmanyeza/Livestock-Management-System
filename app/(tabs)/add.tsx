import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text } from '../../components/typography/Text';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { Card } from '../../components/ui/Card';
import { ClipboardList, Baby, Pill, Skull, FileHeart, DollarSign } from 'lucide-react-native';
import Colors from '../../constants/Colors';
import { Stack } from 'expo-router';

interface RegisterType {
  id: string;
  title: string;
  icon: React.ReactNode;
  color: string;
}

export default function AddScreen() {
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Add Record',
        }}
      />
      <AddContent />
    </>
  );
}

function AddContent() {
  const [selectedRegister, setSelectedRegister] = useState<string | null>(null);

  const registerTypes: RegisterType[] = [
    {
      id: 'herd',
      title: 'Herd Register',
      icon: <ClipboardList size={24} color={Colors.white} />,
      color: Colors.primary[500],
    },
    {
      id: 'calf',
      title: 'Calf Register',
      icon: <Baby size={24} color={Colors.white} />,
      color: Colors.success[500],
    },
    {
      id: 'drug',
      title: 'Drug Register',
      icon: <Pill size={24} color={Colors.white} />,
      color: Colors.warning[500],
    },
    {
      id: 'mortality',
      title: 'Cull & Mortalities',
      icon: <Skull size={24} color={Colors.white} />,
      color: Colors.error[500],
    },
    {
      id: 'pregnancy',
      title: 'Pregnancy Diagnosis & Calving',
      icon: <FileHeart size={24} color={Colors.white} />,
      color: Colors.accent[500],
    },
    {
      id: 'sales',
      title: 'Sales & Purchases',
      icon: <DollarSign size={24} color={Colors.white} />,
      color: Colors.secondary[500],
    },
  ];

  const renderRegisterForm = () => {
    switch (selectedRegister) {
      case 'herd':
        return (
          <Card title="Add to Herd Register" style={styles.formCard}>
            {/* Add Herd Register form components here */}
            <Text>Herd Register Form</Text>
          </Card>
        );
      case 'calf':
        return (
          <Card title="Add to Calf Register" style={styles.formCard}>
            {/* Add Calf Register form components here */}
            <Text>Calf Register Form</Text>
          </Card>
        );
      case 'drug':
        return (
          <Card title="Add to Drug Register" style={styles.formCard}>
            {/* Add Drug Register form components here */}
            <Text>Drug Register Form</Text>
          </Card>
        );
      case 'mortality':
        return (
          <Card title="Add to Cull & Mortalities" style={styles.formCard}>
            {/* Add Mortality Register form components here */}
            <Text>Mortality Register Form</Text>
          </Card>
        );
      case 'pregnancy':
        return (
          <Card title="Add to Pregnancy & Calving" style={styles.formCard}>
            {/* Add Pregnancy Register form components here */}
            <Text>Pregnancy Register Form</Text>
          </Card>
        );
      case 'sales':
        return (
          <Card title="Add to Sales & Purchases" style={styles.formCard}>
            {/* Add Sales Register form components here */}
            <Text>Sales Register Form</Text>
          </Card>
        );
      default:
        return null;
    }
  };

  return (
    <ScreenContainer style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Card style={styles.stepCard}>
          <Text variant="subtitle1" weight="medium" style={styles.stepTitle}>
            Step 1: Select Record Type
          </Text>
          <Text variant="body2" color="neutral.500" style={styles.stepDescription}>
            Choose the type of record you want to add to your farm management system.
          </Text>

          <View style={styles.grid}>
            {registerTypes.map((type) => (
              <TouchableOpacity
                key={type.id}
                style={[styles.gridItem, selectedRegister === type.id && styles.selectedItem]}
                onPress={() => setSelectedRegister(type.id)}
                activeOpacity={0.7}
              >
                <View style={[styles.iconContainer, { backgroundColor: type.color }]}>
                  {type.icon}
                </View>
                <Text
                  variant="body2"
                  weight={selectedRegister === type.id ? 'bold' : 'medium'}
                  style={styles.itemTitle}
                  color={selectedRegister === type.id ? type.color : 'neutral.700'}
                >
                  {type.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {selectedRegister && (
          <Card style={styles.stepCard}>
            <Text variant="subtitle1" weight="medium" style={styles.stepTitle}>
              Step 2: Fill in Details
            </Text>
            <Text variant="body2" color="neutral.500" style={styles.stepDescription}>
              Provide the necessary information for your {registerTypes.find(t => t.id === selectedRegister)?.title.toLowerCase()}.
            </Text>
            {renderRegisterForm()}
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
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  stepCard: {
    padding: 16,
  },
  stepTitle: {
    marginBottom: 8,
  },
  stepDescription: {
    marginBottom: 24,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    margin: -8,
  },
  gridItem: {
    width: '50%',
    padding: 8,
  },
  selectedItem: {
    backgroundColor: Colors.neutral[50],
    borderRadius: 12,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    alignSelf: 'center',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  itemTitle: {
    textAlign: 'center',
    paddingHorizontal: 8,
  },
});
