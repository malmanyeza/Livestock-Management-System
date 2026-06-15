import { View, StyleSheet, TouchableOpacity, ScrollView, Alert, Platform } from 'react-native';
import { Settings, LogOut, HelpCircle, Bell, User, ShieldCheck } from 'lucide-react-native';
import { Text } from '../../components/typography/Text';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import Colors from '../../constants/Colors';
import { Stack, router } from 'expo-router';
import { useFarmData } from '../../context/FarmDataContext';
import * as WebBrowser from 'expo-web-browser';

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
  const { profile, animals, logout } = useFarmData();

  const handleLogout = () => {
    const performLogout = async () => {
      try {
        await logout();
        setTimeout(() => {
          router.replace('/(auth)/login');
        }, 100);
      } catch (err) {
        console.error("Logout execution error:", err);
      }
    };

    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Are you sure you want to log out?');
      if (confirmed) {
        performLogout();
      }
    } else {
      Alert.alert(
        'Log Out',
        'Are you sure you want to log out?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Log Out',
            style: 'destructive',
            onPress: performLogout,
          },
        ]
      );
    }
  };

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
      id: 'privacy',
      title: 'Privacy Policy',
      icon: <ShieldCheck size={24} color={Colors.neutral[600]} />,
      onPress: () => WebBrowser.openBrowserAsync('https://malmanyeza.github.io/Livestock-Management-System/'),
    },
    {
      id: 'logout',
      title: 'Log Out',
      icon: <LogOut size={24} color={Colors.error[500]} />,
      textColor: Colors.error[500],
      onPress: handleLogout,
    },
  ];

  const displayName = profile?.full_name || profile?.email || 'Farmer';
  const roleLabel = profile?.role === 'admin' ? 'Administrator' : 'Farm Owner';

  return (
    <ScreenContainer style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.profileInfo}>
            <View style={styles.avatar}>
              {profile?.role === 'admin' ? (
                <ShieldCheck size={48} color={Colors.primary[600]} />
              ) : (
                <User size={48} color={Colors.neutral[600]} />
              )}
            </View>
            <View style={styles.nameContainer}>
              <Text variant="h4" weight="bold">
                {displayName}
              </Text>
              <Text variant="body" color="neutral.500">
                {roleLabel}
              </Text>
              {profile?.email && (
                <Text variant="caption" color="neutral.400" style={{ marginTop: 4 }}>
                  {profile.email}
                </Text>
              )}
            </View>
          </View>

          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text variant="h4" weight="bold" color="primary.500">
                {animals.length}
              </Text>
              <Text variant="caption" color="neutral.500">
                Animals
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text variant="h4" weight="bold" color="primary.500">
                {profile?.role === 'admin' ? '👑' : '🌾'}
              </Text>
              <Text variant="caption" color="neutral.500">
                {profile?.role === 'admin' ? 'Admin' : 'Farmer'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.menuContainer}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.menuItem}
              onPress={item.onPress ?? (() => item.route && router.push(item.route as any))}
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
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral[100],
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.neutral[200],
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
