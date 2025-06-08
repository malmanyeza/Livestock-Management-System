import React from 'react';
import { View, StyleSheet, Image, TouchableOpacity, ScrollView } from 'react-native';
import { Settings, LogOut, HelpCircle, Bell, User } from 'lucide-react-native';
import { Text } from '../../components/typography/Text';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import Colors from '../../constants/Colors';
import { Stack, router } from 'expo-router';

export default function ProfileScreen() {
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Profile',
        }}
      />
      <ProfileContent />
    </>
  );
}

function ProfileContent() {
  const menuItems = [
    {
      id: 'settings',
      title: 'Settings',
      icon: <Settings size={24} color={Colors.neutral[600]} />,
      route: '/screens/settings',
    },
    {
      id: 'notifications',
      title: 'Notifications',
      icon: <Bell size={24} color={Colors.neutral[600]} />,
      route: '/screens/notifications',
    },
    {
      id: 'help',
      title: 'Help & Support',
      icon: <HelpCircle size={24} color={Colors.neutral[600]} />,
      route: '/screens/help',
    },
    {
      id: 'logout',
      title: 'Log Out',
      icon: <LogOut size={24} color={Colors.error[500]} />,
      textColor: Colors.error[500],
    },
  ];

  return (
    <ScreenContainer style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.profileInfo}>
            <View style={styles.avatar}>
              <User size={48} color={Colors.neutral[600]} />
            </View>
            <View style={styles.nameContainer}>
              <Text variant="h4" weight="bold">
                John Farmer
              </Text>
              <Text variant="body" color="neutral.500">
                Farm Owner
              </Text>
            </View>
          </View>

          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text variant="h4" weight="bold" color="primary.500">
                247
              </Text>
              <Text variant="caption" color="neutral.500">
                Animals
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text variant="h4" weight="bold" color="primary.500">
                12
              </Text>
              <Text variant="caption" color="neutral.500">
                Years
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.menuContainer}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.menuItem}
              onPress={() => item.route && router.push(item.route as any)}
            >
              {item.icon}
              <Text
                variant="body"
                weight="medium"
                style={styles.menuText}
                color={item.textColor || 'neutral.700'}
              >
                {item.title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral[50],
  },
  header: {
    padding: 24,
    backgroundColor: Colors.white,
    borderRadius: 16,
    margin: 16,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  profileInfo: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
    backgroundColor: Colors.neutral[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  nameContainer: {
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral[100],
  },
  statItem: {
    alignItems: 'center',
  },
  menuContainer: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    margin: 16,
    paddingVertical: 8,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  menuText: {
    marginLeft: 12,
  },
});
