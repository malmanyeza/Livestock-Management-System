import { Tabs } from 'expo-router';
import { View, StyleSheet, Platform } from 'react-native';
import { Home, ListTodo, PlusCircle, User } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/Colors';

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  // Dynamic bottom padding to ensure the tab bar icons & labels are placed comfortably above
  // Android system navigation buttons (3-button or gesture bar) and iOS home indicator.
  // On Android with 3-button navigation, insets.bottom is typically 48dp.
  const safeBottom = (insets.bottom > 0 ? insets.bottom : (Platform.OS === 'android' ? 24 : 12)) + (Platform.OS === 'android' ? 8 : 4);
  const tabBarHeight = 56 + safeBottom;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary[500],
        tabBarInactiveTintColor: Colors.neutral[400],
        tabBarStyle: [
          styles.tabBar,
          {
            height: tabBarHeight,
            paddingBottom: safeBottom,
          },
        ],
        tabBarShowLabel: true,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarItemStyle: styles.tabBarItem,
        tabBarHideOnKeyboard: true,
        headerShown: false,
        tabBarBackground: () => (
          <View
            style={[
              StyleSheet.absoluteFill,
              {
                backgroundColor: Platform.select({
                  ios: 'rgba(255, 255, 255, 0.95)',
                  default: Colors.white,
                }),
              },
            ]}
          />
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ size, color }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: 'Task Panel',
          tabBarIcon: ({ size, color }) => <ListTodo size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          title: 'Add Animal',
          tabBarIcon: ({ size, color }) => <PlusCircle size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ size, color }) => <User size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    paddingTop: 6,
    backgroundColor: Platform.select({
      ios: 'rgba(255, 255, 255, 0.95)',
      android: Colors.white,
      default: Colors.white,
    }),
    borderTopWidth: 1,
    borderTopColor: Colors.neutral[200],
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    elevation: 8,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  tabBarItem: {
    paddingTop: 2,
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
});