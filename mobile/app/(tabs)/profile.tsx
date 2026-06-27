import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Alert, Platform, Modal, TextInput, KeyboardAvoidingView } from 'react-native';
import { Settings, LogOut, HelpCircle, Bell, User, ShieldCheck, Trash2 } from 'lucide-react-native';
import { Text } from '../../components/typography/Text';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import Colors from '../../constants/Colors';
import { Card } from '../../components/ui/Card';
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
  const { profile, animals, logout, deleteAccount, updateProfile } = useFarmData();

  const [isEditProfileModalVisible, setIsEditProfileModalVisible] = useState(false);
  const [editingProfile, setEditingProfile] = useState<Partial<typeof profile> | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
  const roleLabel = profile?.role === 'admin' ? 'Administrator' : 'Farm Owner';

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
                {profile?.role === 'admin' ? '👑' : '🌾'}
              </Text>
              <Text variant="caption" color="neutral.500">
                {profile?.role === 'admin' ? 'Admin' : 'Farmer'}
              </Text>
            </View>
          </View>
        </View>

        <Card
          title="Farm Profile"
          style={styles.detailsCard}
          headerRight={
            <TouchableOpacity onPress={handleEditProfile} style={styles.editButton} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text variant="body2" color="primary.600" weight="bold">Edit</Text>
            </TouchableOpacity>
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
                    placeholder="e.g. Marondera"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text variant="body2" style={styles.label}>Province</Text>
                  <TextInput
                    style={styles.input}
                    value={editingProfile?.province || ''}
                    onChangeText={(text) => editingProfile && setEditingProfile({...editingProfile, province: text})}
                    placeholder="e.g. Mashonaland East"
                  />
                </View>
              </ScrollView>

              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={styles.cancelButton} 
                  onPress={() => { setIsEditProfileModalVisible(false); setEditingProfile(null); }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.saveButton} 
                  onPress={handleSaveProfile}
                  disabled={isSubmitting}
                >
                  <Text style={styles.saveButtonText}>
                    {isSubmitting ? 'Saving...' : 'Save Changes'}
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
});
