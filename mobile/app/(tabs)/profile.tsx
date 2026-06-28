import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Alert, Platform, Modal, TextInput, KeyboardAvoidingView, ActivityIndicator } from 'react-native';
import { Settings, LogOut, HelpCircle, Bell, User, ShieldCheck, Trash2, Plus, X, Users } from 'lucide-react-native';
import { Text } from '../../components/typography/Text';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import Colors from '../../constants/Colors';
import { Card } from '../../components/ui/Card';
import { Stack, router } from 'expo-router';
import { useFarmData } from '../../context/FarmDataContext';
import * as WebBrowser from 'expo-web-browser';
import { createClient } from '@supabase/supabase-js';
import { supabase } from '../../utils/supabase';

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
  const { profile, animals, logout, deleteAccount, updateProfile, selectedFarmer } = useFarmData();

  const [isEditProfileModalVisible, setIsEditProfileModalVisible] = useState(false);
  const [editingProfile, setEditingProfile] = useState<Partial<typeof profile> | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Worker account management states
  const [workers, setWorkers] = useState<any[]>([]);
  const [loadingWorkers, setLoadingWorkers] = useState(false);
  const [isAddWorkerVisible, setIsAddWorkerVisible] = useState(false);
  const [newWorkerName, setNewWorkerName] = useState('');
  const [newWorkerPassword, setNewWorkerPassword] = useState('');
  const [addingWorker, setAddingWorker] = useState(false);

  const isSystemAdmin = profile?.role === 'admin';
  const targetFarmer = isSystemAdmin ? selectedFarmer : profile;
  const targetFarmerId = targetFarmer?.id;
  const targetFarmerEmail = targetFarmer?.email;
  const targetFarmerName = isSystemAdmin ? (selectedFarmer?.full_name || selectedFarmer?.email) : (profile?.full_name || profile?.email);

  const fetchWorkers = async () => {
    if (!supabase || !targetFarmerId) {
      setWorkers([]);
      return;
    }
    setLoadingWorkers(true);
    try {
      const { data, error } = await supabase
        .from('workers')
        .select('*')
        .eq('farmer_id', targetFarmerId)
        .order('created_at', { ascending: false });
      if (!error && data) {
        setWorkers(data);
      }
    } catch (err) {
      console.error('Error fetching workers:', err);
    } finally {
      setLoadingWorkers(false);
    }
  };

  useEffect(() => {
    fetchWorkers();
  }, [targetFarmerId]);

  const handleAddWorker = async () => {
    if (!newWorkerName.trim() || !newWorkerPassword.trim()) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }
    if (newWorkerPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters.');
      return;
    }
    if (!targetFarmerEmail || !targetFarmerId) return;

    setAddingWorker(true);
    try {
      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://odtlbpsjwhlmiwgmkrxa.supabase.co';
      const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9kdGxicHNqd2hsbWl3Z21rcnhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODExNjIyMDEsImV4cCI6MjA5NjczODIwMX0.owMEl-lvuaRE8stDdCoAH0q3ln4EDxNZ5PhJy0trozA';
      
      const workerAuthClient = createClient(supabaseUrl, supabaseAnonKey, {
        auth: { persistSession: false, autoRefreshToken: false }
      });

      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const sanitizedName = newWorkerName.toLowerCase().replace(/[^a-z0-9]/g, '');
      const authEmail = `${targetFarmerEmail.split('@')[0]}+${sanitizedName}_${randomSuffix}@zvipfuwo.internal`;

      // 1. SignUp
      const { data: signUpData, error: signUpError } = await workerAuthClient.auth.signUp({
        email: authEmail,
        password: newWorkerPassword,
        options: {
          data: {
            full_name: newWorkerName,
            role: 'worker'
          }
        }
      });

      if (signUpError) throw signUpError;
      if (!signUpData.user) throw new Error('Worker auth account registration failed.');

      // 2. DB Insert
      const { error: insertError } = await supabase.from('workers').insert({
        farmer_id: targetFarmerId,
        farmer_email: targetFarmerEmail,
        worker_name: newWorkerName,
        password: newWorkerPassword,
        auth_email: authEmail
      });

      if (insertError) throw insertError;

      if (Platform.OS === 'web') {
        alert(`Worker ${newWorkerName} registered successfully.`);
      } else {
        Alert.alert('Success', `Worker ${newWorkerName} registered successfully.`);
      }
      setNewWorkerName('');
      setNewWorkerPassword('');
      setIsAddWorkerVisible(false);
      fetchWorkers();
    } catch (err: any) {
      if (Platform.OS === 'web') {
        alert(err.message || 'Failed to create worker account.');
      } else {
        Alert.alert('Error', err.message || 'Failed to create worker account.');
      }
    } finally {
      setAddingWorker(false);
    }
  };

  const handleDeleteWorker = async (worker: any) => {
    const performDelete = async () => {
      try {
        if (!supabase) return;
        const { error } = await supabase
          .from('workers')
          .delete()
          .eq('id', worker.id);
        if (error) throw error;
        fetchWorkers();
      } catch (err: any) {
        if (Platform.OS === 'web') {
          alert('Failed to delete worker: ' + err.message);
        } else {
          Alert.alert('Error', 'Failed to delete worker: ' + err.message);
        }
      }
    };

    if (Platform.OS === 'web') {
      const confirmed = window.confirm(`Are you sure you want to delete worker "${worker.worker_name}"? This will immediately revoke their access.`);
      if (confirmed) performDelete();
    } else {
      Alert.alert(
        'Delete Worker',
        `Are you sure you want to delete worker "${worker.worker_name}"? This will immediately revoke their access.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: performDelete }
        ]
      );
    }
  };

  const handleEditProfile = () => {
    if (!profile) return;
    setEditingProfile({
      farm_name: profile.farm_name || '',
      owner_first_name: profile.owner_first_name || '',
      owner_last_name: profile.owner_last_name || '',
      address: profile.address || '',
      location: profile.location || '',
      province: profile.province || '',
      email: profile.email || '',
      phone_number: profile.phone_number || '',
    });
    setIsEditProfileModalVisible(true);
  };

  const handleSaveProfile = async () => {
    if (!editingProfile) return;
    setIsSubmitting(true);
    try {
      await updateProfile(editingProfile);
      setIsEditProfileModalVisible(false);
      setEditingProfile(null);
      if (Platform.OS === 'web') {
        alert('Profile updated successfully.');
      } else {
        Alert.alert('Success', 'Profile updated successfully.');
      }
    } catch (e: any) {
      if (Platform.OS === 'web') {
        alert('Failed to update profile: ' + e.message);
      } else {
        Alert.alert('Error', 'Failed to update profile: ' + e.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

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

  const handleDeleteAccount = () => {
    const performDeletion = async () => {
      try {
        await deleteAccount();
        setTimeout(() => {
          router.replace('/(auth)/login');
        }, 100);
      } catch (err) {
        console.error("Account deletion execution error:", err);
        if (Platform.OS === 'web') {
          alert('Failed to delete account. Please try again.');
        } else {
          Alert.alert('Error', 'Failed to delete account. Please try again.');
        }
      }
    };

    if (Platform.OS === 'web') {
      const confirmed = window.confirm(
        'Delete Account: This action is permanent and cannot be undone. All of your farm records, animal registries, and profile details will be permanently erased. Are you sure you want to proceed?'
      );
      if (confirmed) {
        performDeletion();
      }
    } else {
      Alert.alert(
        'Delete Account',
        'This action is permanent and cannot be undone. All of your farm records, animal registries, and profile details will be permanently erased. Are you sure you want to proceed?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete Account',
            style: 'destructive',
            onPress: performDeletion,
          },
        ]
      );
    }
  };

  const menuItems = [
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
  ];

  const displayName = profile?.full_name || profile?.email || 'Farmer';
  const roleLabel = profile?.role === 'admin' ? 'Administrator' : (profile?.role === 'worker' ? 'Farm Worker' : 'Farm Owner');

  return (
    <ScreenContainer 
      style={styles.container} 
      scrollable={true}
      contentContainerStyle={{ paddingBottom: 100 }}
    >
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
            {profile?.farm_name && (
              <Text variant="body2" color="primary.600" weight="medium" style={{ marginTop: 2 }}>
                🚜 {profile.farm_name}
              </Text>
            )}
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
              {profile?.role === 'admin' ? '👑' : (profile?.role === 'worker' ? '🛠️' : '🌾')}
            </Text>
            <Text variant="caption" color="neutral.500">
              {profile?.role === 'admin' ? 'Admin' : (profile?.role === 'worker' ? 'Worker' : 'Farmer')}
            </Text>
          </View>
        </View>
      </View>

      <Card
        title="Farm Profile"
        style={styles.detailsCard}
        headerRight={
          profile?.role !== 'worker' ? (
            <TouchableOpacity onPress={handleEditProfile} style={styles.editButton} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text variant="body2" color="primary.600" weight="bold">Edit</Text>
            </TouchableOpacity>
          ) : null
        }
      >
        <View style={styles.detailRow}>
          <Text variant="body2" color="neutral.500" style={styles.detailLabel}>Farm Name</Text>
          <Text variant="body" weight="medium" color="neutral.800">{profile?.farm_name || 'Not Set'}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text variant="body2" color="neutral.500" style={styles.detailLabel}>Owner First Name</Text>
          <Text variant="body" weight="medium" color="neutral.800">{profile?.owner_first_name || 'Not Set'}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text variant="body2" color="neutral.500" style={styles.detailLabel}>Owner Last Name</Text>
          <Text variant="body" weight="medium" color="neutral.800">{profile?.owner_last_name || 'Not Set'}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text variant="body2" color="neutral.500" style={styles.detailLabel}>Email</Text>
          <Text variant="body" weight="medium" color="neutral.800">{profile?.email || 'Not Set'}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text variant="body2" color="neutral.500" style={styles.detailLabel}>Phone Number</Text>
          <Text variant="body" weight="medium" color="neutral.800">{profile?.phone_number || 'Not Set'}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text variant="body2" color="neutral.500" style={styles.detailLabel}>Address</Text>
          <Text variant="body" weight="medium" color="neutral.800">{profile?.address || 'Not Set'}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text variant="body2" color="neutral.500" style={styles.detailLabel}>Location</Text>
          <Text variant="body" weight="medium" color="neutral.800">{profile?.location || 'Not Set'}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text variant="body2" color="neutral.500" style={styles.detailLabel}>Province</Text>
          <Text variant="body" weight="medium" color="neutral.800">{profile?.province || 'Not Set'}</Text>
        </View>
      </Card>

      {/* Farm Workers Management Section for Farmers and Admins */}
      {(profile?.role === 'farmer' || (isSystemAdmin && selectedFarmer)) ? (
        <Card
          title="Farm Workers"
          style={styles.detailsCard}
          headerRight={
            <TouchableOpacity onPress={() => setIsAddWorkerVisible(true)} style={styles.editButton}>
              <Text variant="body2" color="primary.600" weight="bold">+ Add Worker</Text>
            </TouchableOpacity>
          }
        >
          <View style={styles.workerInfoBox}>
            <Text variant="caption" color="neutral.600" style={{ lineHeight: 16 }}>
              Workers log in using {isSystemAdmin ? `${targetFarmerName}'s` : 'your'} email ({targetFarmerEmail}) and their assigned password. They cannot view marketplace or financial/sales records.
            </Text>
          </View>

          {loadingWorkers ? (
            <ActivityIndicator size="small" color={Colors.primary[500]} style={{ marginVertical: 12 }} />
          ) : workers.length === 0 ? (
            <View style={{ paddingVertical: 12 }}>
              <Text variant="body2" color="neutral.400">No worker accounts registered yet.</Text>
            </View>
          ) : (
            workers.map((w) => (
              <View key={w.id} style={styles.workerRow}>
                <View style={{ flex: 1 }}>
                  <Text variant="body" weight="bold" color="neutral.800">{w.worker_name}</Text>
                  <Text variant="caption" color="neutral.500">
                    Login Email: <Text weight="medium" style={{ fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>{w.farmer_email}</Text>
                  </Text>
                  <Text variant="caption" color="neutral.500">
                    Password: <Text weight="medium" style={{ fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>{w.password}</Text>
                  </Text>
                </View>
                <TouchableOpacity onPress={() => handleDeleteWorker(w)} style={styles.workerDeleteBtn}>
                  <Trash2 size={16} color={Colors.error[500]} />
                </TouchableOpacity>
              </View>
            ))
          )}
        </Card>
      ) : isSystemAdmin ? (
        <Card title="Farm Workers" style={styles.detailsCard}>
          <View style={styles.promptContainer}>
            <Users size={32} color={Colors.neutral[400]} style={{ marginBottom: 8 }} />
            <Text variant="body2" color="neutral.500" style={{ textAlign: 'center' }}>
              Please select a farmer portal from the home screen quick access list to view or manage their farm workers.
            </Text>
          </View>
        </Card>
      ) : null}

      <View style={styles.menuContainer}>
        {menuItems.map((item, idx) => (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.menuItem,
              idx < menuItems.length - 1 && { borderBottomWidth: 1, borderBottomColor: Colors.neutral[100] }
            ]}
            onPress={item.onPress ?? (() => item.route && router.push(item.route as any))}
          >
            {item.icon}
            <Text
              variant="body"
              weight="medium"
              style={styles.menuText}
              color="neutral.700"
            >
              {item.title}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={styles.menuContainer}
        onPress={handleLogout}
      >
        <View style={styles.menuItem}>
          <LogOut size={24} color={Colors.error[500]} />
          <Text variant="body" weight="medium" style={styles.menuText} color={Colors.error[500]}>
            Log Out
          </Text>
        </View>
      </TouchableOpacity>

      {profile?.role !== 'worker' && (
        <View style={styles.dangerZoneContainer}>
          <Text variant="body2" weight="bold" color="error.500" style={styles.dangerZoneTitle}>
            DANGER ZONE
          </Text>
          <Text variant="caption" color="neutral.500" style={styles.dangerZoneText}>
            Deleting your account will permanently erase your profile, farm records, livestock register, and all associated data. This action is irreversible.
          </Text>
          <TouchableOpacity
            style={styles.deleteAccountButton}
            onPress={handleDeleteAccount}
          >
            <Trash2 size={18} color={Colors.white} />
            <Text variant="body" weight="bold" color="white" style={{ marginLeft: 8 }}>
              Delete Account Permanently
            </Text>
          </TouchableOpacity>
        </View>
      )}
      
      {/* Edit Profile Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isEditProfileModalVisible}
        onRequestClose={() => setIsEditProfileModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text variant="h6" weight="bold" style={styles.modalTitle}>Edit Profile Details</Text>
              <ScrollView 
                style={{ flexShrink: 1 }}
                contentContainerStyle={{ flexGrow: 1 }}
                keyboardShouldPersistTaps="always"
              >
                <View style={styles.formGroup}>
                  <Text variant="body2" style={styles.label}>Owner First Name</Text>
                  <TextInput
                    style={styles.input}
                    value={editingProfile?.owner_first_name || ''}
                    onChangeText={(text) => editingProfile && setEditingProfile({...editingProfile, owner_first_name: text})}
                    placeholder="e.g. John"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text variant="body2" style={styles.label}>Owner Last Name</Text>
                  <TextInput
                    style={styles.input}
                    value={editingProfile?.owner_last_name || ''}
                    onChangeText={(text) => editingProfile && setEditingProfile({...editingProfile, owner_last_name: text})}
                    placeholder="e.g. Farmer"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text variant="body2" style={styles.label}>Farm Name</Text>
                  <TextInput
                    style={styles.input}
                    value={editingProfile?.farm_name || ''}
                    onChangeText={(text) => editingProfile && setEditingProfile({...editingProfile, farm_name: text})}
                    placeholder="e.g. Green Valley Farm"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text variant="body2" style={styles.label}>Phone Number</Text>
                  <TextInput
                    style={styles.input}
                    value={editingProfile?.phone_number || ''}
                    onChangeText={(text) => editingProfile && setEditingProfile({...editingProfile, phone_number: text})}
                    placeholder="e.g. +263 77 123 4567"
                    keyboardType="phone-pad"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text variant="body2" style={styles.label}>Email</Text>
                  <TextInput
                    style={styles.input}
                    value={editingProfile?.email || ''}
                    onChangeText={(text) => editingProfile && setEditingProfile({...editingProfile, email: text})}
                    placeholder="e.g. owner@farm.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text variant="body2" style={styles.label}>Address</Text>
                  <TextInput
                    style={styles.input}
                    value={editingProfile?.address || ''}
                    onChangeText={(text) => editingProfile && setEditingProfile({...editingProfile, address: text})}
                    placeholder="e.g. Stand 45, Valley Road"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text variant="body2" style={styles.label}>Location</Text>
                  <TextInput
                    style={styles.input}
                    value={editingProfile?.location || ''}
                    onChangeText={(text) => editingProfile && setEditingProfile({...editingProfile, location: text})}
                    placeholder="e.g. Bindura"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text variant="body2" style={styles.label}>Province</Text>
                  <TextInput
                    style={styles.input}
                    value={editingProfile?.province || ''}
                    onChangeText={(text) => editingProfile && setEditingProfile({...editingProfile, province: text})}
                    placeholder="e.g. Mashonaland Central"
                  />
                </View>
              </ScrollView>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setIsEditProfileModalVisible(false)}
                  disabled={isSubmitting}
                >
                  <Text variant="body" weight="bold" color="neutral.700" style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleSaveProfile}
                  disabled={isSubmitting}
                >
                  <Text variant="body" weight="bold" color="white" style={styles.saveButtonText}>
                    {isSubmitting ? 'Saving...' : 'Save Profile'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Add Worker Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isAddWorkerVisible}
        onRequestClose={() => setIsAddWorkerVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text variant="h6" weight="bold" style={styles.modalTitle}>Register Farm Worker</Text>
              
              <View style={styles.formGroup}>
                <Text variant="body2" style={styles.label}>Worker Name</Text>
                <TextInput
                  style={styles.input}
                  value={newWorkerName}
                  onChangeText={setNewWorkerName}
                  placeholder="e.g. John"
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.formGroup}>
                <Text variant="body2" style={styles.label}>Worker Password</Text>
                <TextInput
                  style={styles.input}
                  value={newWorkerPassword}
                  onChangeText={setNewWorkerPassword}
                  placeholder="Enter worker password"
                  secureTextEntry
                  autoCapitalize="none"
                />
                <Text variant="caption" color="neutral.400" style={{ marginTop: 4 }}>
                  Minimum 6 characters. Used with the farmer's email to log in.
                </Text>
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setIsAddWorkerVisible(false)}
                  disabled={addingWorker}
                >
                  <Text variant="body" weight="bold" color="neutral.700" style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleAddWorker}
                  disabled={addingWorker}
                >
                  <Text variant="body" weight="bold" color="white" style={styles.saveButtonText}>
                    {addingWorker ? 'Registering...' : 'Register Worker'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral[50],
  },
  header: {
    backgroundColor: Colors.white,
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[150],
    alignItems: 'stretch',
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.neutral[50],
    borderWidth: 1,
    borderColor: Colors.neutral[150],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
  },
  nameContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.neutral[50],
    borderRadius: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: Colors.neutral[150],
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statDivider: {
    width: 1,
    height: '60%',
    backgroundColor: Colors.neutral[200],
    alignSelf: 'center',
  },
  menuContainer: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: Colors.neutral[150],
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  menuText: {
    marginLeft: 12,
  },
  dangerZoneContainer: {
    margin: 16,
    padding: 16,
    backgroundColor: '#FFF5F5',
    borderWidth: 1,
    borderColor: '#FEB2B2',
    borderRadius: 16,
    alignItems: 'stretch',
  },
  dangerZoneTitle: {
    color: '#C53030',
    marginBottom: 8,
    letterSpacing: 1,
  },
  dangerZoneText: {
    color: '#742A2A',
    marginBottom: 16,
    lineHeight: 16,
  },
  deleteAccountButton: {
    backgroundColor: '#E53E3E',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  detailsCard: {
    margin: 16,
    padding: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[100],
  },
  detailLabel: {
    color: Colors.neutral[500],
  },
  editButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxHeight: '90%',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  modalTitle: {
    marginBottom: 20,
    textAlign: 'center',
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 6,
    color: Colors.neutral[600],
  },
  input: {
    backgroundColor: Colors.neutral[50],
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: Colors.neutral[900],
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 20,
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.neutral[300],
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: Colors.primary[500],
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: Colors.white,
    fontWeight: 'bold',
  },
  cancelButtonText: {
    color: Colors.neutral[600],
  },
  workerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[100],
  },
  workerDeleteBtn: {
    padding: 8,
  },
  workerInfoBox: {
    backgroundColor: '#F5EEF8',
    borderColor: '#EBDEF0',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  promptContainer: {
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
