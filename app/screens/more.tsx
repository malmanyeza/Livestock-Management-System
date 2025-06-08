import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { ClipboardList, ShoppingCart, CalendarDays, CirclePlus as PlusCircle, Settings, LifeBuoy, FileSpreadsheet, CircleHelp as HelpCircle } from 'lucide-react-native';
import { Text } from '@/components/typography/Text';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import Colors from '@/constants/Colors';

interface MenuItem {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  route: string;
}

const menuItems: MenuItem[] = [
  {
    id: 'records',
    title: 'Records',
    description: 'Access and manage all farm records',
    icon: <ClipboardList size={24} color={Colors.primary[500]} />,
    route: '/records',
  },
  {
    id: 'marketplace',
    title: 'Marketplace',
    description: 'Buy, sell, and find livestock',
    icon: <ShoppingCart size={24} color={Colors.accent[500]} />,
    route: '/marketplace',
  },
  {
    id: 'task-panel',
    title: 'Task Panel',
    description: 'Manage farm events and to-do lists',
    icon: <CalendarDays size={24} color={Colors.secondary[500]} />,
    route: '/task-panel',
  },
  {
    id: 'register',
    title: 'Register',
    description: 'View and manage livestock registers',
    icon: <FileSpreadsheet size={24} color={Colors.success[500]} />,
    route: '/register',
  },
  {
    id: 'new-registration',
    title: 'New Registration',
    description: 'Add new livestock or records',
    icon: <PlusCircle size={24} color={Colors.error[500]} />,
    route: '/new-registration',
  },
  {
    id: 'settings',
    title: 'Settings',
    description: 'Configure app preferences',
    icon: <Settings size={24} color={Colors.neutral[700]} />,
    route: '/settings',
  },
  {
    id: 'help',
    title: 'Help & Support',
    description: 'Get assistance and resources',
    icon: <HelpCircle size={24} color={Colors.primary[600]} />,
    route: '/help',
  },
];

export default function MoreScreen() {
  return (
    <ScreenContainer style={styles.container}>
      <Header title="More Options" />

      <ScrollView contentContainerStyle={styles.content}>
        <Text variant="h5" weight="medium" style={styles.sectionTitle}>
          All Features
        </Text>

        <View style={styles.menuGrid}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.menuItem}
              onPress={() => router.push(item.route as any)}
              activeOpacity={0.7}
            >
              <Card style={styles.menuCard}>
                <View style={styles.iconContainer}>{item.icon}</View>
                <Text variant="h6" weight="medium" style={styles.menuTitle}>
                  {item.title}
                </Text>
                <Text variant="caption" color="neutral.600" style={styles.menuDescription}>
                  {item.description}
                </Text>
              </Card>
            </TouchableOpacity>
          ))}
        </View>

        <Card style={styles.supportCard}>
          <View style={styles.supportContent}>
            <LifeBuoy size={32} color={Colors.primary[500]} style={styles.supportIcon} />
            <Text variant="h5" weight="medium" style={styles.supportTitle}>
              Need Help?
            </Text>
            <Text variant="body" color="neutral.600" style={styles.supportDescription}>
              Our support team is ready to assist you with any questions or issues you may have.
            </Text>
            <TouchableOpacity
              style={styles.supportButton}
              onPress={() => router.push('/help' as any)}
            >
              <Text variant="button" color="primary.500">
                Contact Support
              </Text>
            </TouchableOpacity>
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
  content: {
    padding: 16,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  menuItem: {
    width: '48%',
    marginBottom: 16,
  },
  menuCard: {
    padding: 16,
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 12,
  },
  menuTitle: {
    textAlign: 'center',
    marginBottom: 4,
  },
  menuDescription: {
    textAlign: 'center',
  },
  supportCard: {
    marginBottom: 24,
  },
  supportContent: {
    padding: 16,
    alignItems: 'center',
  },
  supportIcon: {
    marginBottom: 12,
  },
  supportTitle: {
    marginBottom: 8,
  },
  supportDescription: {
    textAlign: 'center',
    marginBottom: 16,
  },
  supportButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: Colors.primary[500],
    borderRadius: 8,
  },
});