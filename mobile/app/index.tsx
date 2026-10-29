import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useFarmData } from '@/context/FarmDataContext';
import Colors from '@/constants/Colors';

export default function RootIndex() {
  const { user, loadingAuth } = useFarmData();

  useEffect(() => {
    if (!loadingAuth) {
      if (user) {
        router.replace('/(tabs)');
      } else {
        router.replace('/(auth)/login');
      }
    }
  }, [user, loadingAuth]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.white }}>
      <ActivityIndicator size="large" color={Colors.primary[500]} />
    </View>
  );
}
