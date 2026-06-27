import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text } from '../../components/typography/Text';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { Card } from '../../components/ui/Card';
import { ClipboardList, Baby, Pill, Skull, FileHeart, DollarSign, Activity, Package, Stethoscope } from 'lucide-react-native';
import Colors from '../../constants/Colors';
import { Stack, router } from 'expo-router';
import { useFarmData } from '../../context/FarmDataContext';

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
  const { profile } = useFarmData();
  const isAdmin = profile?.role === 'admin';

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
      title: 'Pregnancy & Calving',
      icon: <FileHeart size={24} color={Colors.white} />,
      color: Colors.accent[500],
    },
    {
      id: 'sales',
      title: 'Sales & Purchases',
      icon: <DollarSign size={24} color={Colors.white} />,
      color: Colors.secondary[500],
    },
    {
      id: 'breeding',
      title: 'Bull Breeding Soundness',
      icon: <Activity size={24} color={Colors.white} />,
      color: Colors.secondary[700],
    },
    {
      id: 'feed',
      title: 'Feed Inventory',
      icon: <Package size={24} color={Colors.white} />,
      color: Colors.warning[600],
    },
    {
      id: 'health',
      title: 'Health Record',
      icon: <Stethoscope size={24} color={Colors.white} />,
      color: Colors.success[600],
    },
  ].filter(t => t.id !== 'breeding' || isAdmin);

  const handlePressRegister = (id: string) => {
    const tabMap: Record<string, string> = {
      herd: 'herd',
      calf: 'calves',
      drug: 'drugs',
      mortality: 'mortality',
      pregnancy: 'pregnancy',
      sales: 'sales',
      breeding: 'bulls',
      feed: 'feed',
      health: 'health'
    };
    const targetTab = tabMap[id] || 'overview';
    router.push({
      pathname: '/screens/register',
      params: { tab: targetTab }
    });
  };

  return (
    <ScreenContainer style={styles.container} scrollable={false}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Card style={styles.stepCard}>
          <Text variant="h6" weight="medium" style={styles.stepTitle}>
            Select Record Type
          </Text>
          <Text variant="body2" color="neutral.500" style={styles.stepDescription}>
            Choose the type of record register you want to access or add entries to.
          </Text>

          <View style={styles.grid}>
            {registerTypes.map((type) => (
              <TouchableOpacity
                key={type.id}
                style={styles.gridItem}
                onPress={() => handlePressRegister(type.id)}
                activeOpacity={0.7}
              >
                <View style={[styles.iconContainer, { backgroundColor: type.color }]}>
                  {type.icon}
                </View>
                <Text
                  variant="body2"
                  weight="medium"
                  style={styles.itemTitle}
                  color="neutral.700"
                >
                  {type.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>
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
  formCard: {
    marginTop: 16,
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
    width: '33.33%',
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
