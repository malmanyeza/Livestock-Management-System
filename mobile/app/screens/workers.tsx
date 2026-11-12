import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  ActivityIndicator,
} from 'react-native';
import { Stack } from 'expo-router';
import { Trash2, Users } from 'lucide-react-native';
import { createClient } from '@supabase/supabase-js';
import { Text } from '../../components/typography/Text';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { Card } from '../../components/ui/Card';
import Colors from '../../constants/Colors';
import { useFarmData } from '../../context/FarmDataContext';
import { supabase } from '../../utils/supabase';

export default function WorkersScreen() {
  const { profile, selectedFarmer } = useFarmData();

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
  const targetFarmerName = isSystemAdmin
    ? selectedFarmer?.full_name || selectedFarmer?.email
    : profile?.full_name || profile?.email;

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
      const supabaseUrl =
        process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://odtlbpsjwhlmiwgmkrxa.supabase.co';
      const supabaseAnonKey =
        process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9kdGxicHNqd2hsbWl3Z21rcnhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODExNjIyMDEsImV4cCI6MjA5NjczODIwMX0.owMEl-lvuaRE8stDdCoAH0q3ln4EDxNZ5PhJy0trozA';

      const workerAuthClient = createClient(supabaseUrl, supabaseAnonKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });

      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const sanitizedName = newWorkerName.toLowerCase().replace(/[^a-z0-9]/g, '');
      const authEmail = `${targetFarmerEmail.split('@')[0]}+${sanitizedName}_${randomSuffix}@zvipfuwo.internal`;

      const { data: signUpData, error: signUpError } = await workerAuthClient.auth.signUp({
        email: authEmail,
        password: newWorkerPassword,
        options: {
          data: {
            full_name: newWorkerName,
            role: 'worker',
          },
        },
      });

      if (signUpError) throw signUpError;
      if (!signUpData.user) throw new Error('Worker auth account registration failed.');

      if (!supabase) throw new Error('Supabase client is not initialized.');
      const { error: insertError } = await supabase.from('workers').insert({
        farmer_id: targetFarmerId,
        farmer_email: targetFarmerEmail,
        worker_name: newWorkerName,
        password: newWorkerPassword,
        auth_email: authEmail,
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
        const { error } = await supabase.from('workers').delete().eq('id', worker.id);
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
      const confirmed = window.confirm(
        `Are you sure you want to delete worker "${worker.worker_name}"? This will immediately revoke their access.`
      );
      if (confirmed) performDelete();
    } else {
      Alert.alert(
        'Delete Worker',
        `Are you sure you want to delete worker "${worker.worker_name}"? This will immediately revoke their access.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: performDelete },
        ]
      );
    }
  };

  const canManageWorkers = profile?.role === 'farmer' || (isSystemAdmin && selectedFarmer);

  return (
    <>
      <Stack.Screen options={{ title: 'Farm Workers' }} />
      <ScreenContainer style={styles.container}>
        {canManageWorkers ? (
          <Card
            title="Farm Workers"
            style={styles.card}
            headerRight={
              <TouchableOpacity
                onPress={() => setIsAddWorkerVisible(true)}
                style={styles.addButton}
              >
                <Text variant="body2" color="primary.600" weight="bold">
                  + Add Worker
                </Text>
              </TouchableOpacity>
            }
          >
            <View style={styles.workerInfoBox}>
              <Text variant="caption" color="neutral.600" style={{ lineHeight: 16 }}>
                Workers log in using {isSystemAdmin ? `${targetFarmerName}'s` : 'your'} email (
                {targetFarmerEmail}) and their assigned password. They cannot view marketplace or
                financial/sales records.
              </Text>
            </View>

            {loadingWorkers ? (
              <ActivityIndicator
                size="small"
                color={Colors.primary[500]}
                style={{ marginVertical: 16 }}
              />
            ) : workers.length === 0 ? (
              <View style={{ paddingVertical: 16 }}>
                <Text variant="body2" color="neutral.400">
                  No worker accounts registered yet.
                </Text>
              </View>
            ) : (
              workers.map((w) => (
                <View key={w.id} style={styles.workerRow}>
                  <View style={{ flex: 1 }}>
                    <Text variant="body" weight="bold" color="neutral.800">
                      {w.worker_name}
                    </Text>
                    <Text variant="caption" color="neutral.500">
                      Login Email:{' '}
                      <Text
                        weight="medium"
                        style={{ fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}
                      >
                        {w.farmer_email}
                      </Text>
                    </Text>
                    <Text variant="caption" color="neutral.500">
                      Password:{' '}
                      <Text
                        weight="medium"
                        style={{ fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}
                      >
                        {w.password}
                      </Text>
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleDeleteWorker(w)}
                    style={styles.workerDeleteBtn}
                  >
                    <Trash2 size={16} color={Colors.error[500]} />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </Card>
        ) : (
          <Card title="Farm Workers" style={styles.card}>
            <View style={styles.promptContainer}>
              <Users size={32} color={Colors.neutral[400]} style={{ marginBottom: 8 }} />
              <Text variant="body2" color="neutral.500" style={{ textAlign: 'center' }}>
                {isSystemAdmin
                  ? 'Please select a farmer portal from the home screen quick access list to view or manage their farm workers.'
                  : 'Only farm owners and administrators can manage farm worker accounts.'}
              </Text>
            </View>
          </Card>
        )}

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
                <Text variant="h6" weight="bold" style={styles.modalTitle}>
                  Register Farm Worker
                </Text>

                <View style={styles.formGroup}>
                  <Text variant="body2" style={styles.label}>
                    Worker Name
                  </Text>
                  <TextInput
                    style={styles.input}
                    value={newWorkerName}
                    onChangeText={setNewWorkerName}
                    placeholder="e.g. John"
                    autoCapitalize="words"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text variant="body2" style={styles.label}>
                    Worker Password
                  </Text>
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
                    <Text variant="body" weight="bold" color="neutral.700">
                      Cancel
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.saveButton}
                    onPress={handleAddWorker}
                    disabled={addingWorker}
                  >
                    <Text variant="body" weight="bold" color="white">
                      {addingWorker ? 'Registering...' : 'Register Worker'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </ScreenContainer>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  addButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  workerInfoBox: {
    backgroundColor: Colors.neutral[50],
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
  },
  workerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[100],
  },
  workerDeleteBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: Colors.error[50],
  },
  promptContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    marginBottom: 16,
    color: Colors.neutral[900],
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 6,
    color: Colors.neutral[700],
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.neutral[300],
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: Colors.neutral[900],
    backgroundColor: Colors.white,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: Colors.neutral[100],
    alignItems: 'center',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: Colors.primary[500],
    alignItems: 'center',
  },
});

