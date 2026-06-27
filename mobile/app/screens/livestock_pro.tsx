import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Modal, TextInput, FlatList, ActivityIndicator } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { ChevronLeft, Plus, X, Calendar, User, Phone, Briefcase, FileText } from 'lucide-react-native';
import { Text } from '@/components/typography/Text';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Picker } from '@/components/inputs/Picker';
import Colors from '@/constants/Colors';
import { supabase } from '@/utils/supabase';
import { useFarmData } from '@/context/FarmDataContext';

export default function LivestockProScreen() {
  const router = useRouter();
  const { profile, farmers = [] } = useFarmData();
  const isAdmin = profile?.role === 'admin';

  const [missions, setMissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Form states
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [selectedFarmerId, setSelectedFarmerId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [visitCategory, setVisitCategory] = useState('Vaccination');
  const [clientPhone, setClientPhone] = useState('');
  const [attendingTeam, setAttendingTeam] = useState('Team Vet');
  const [reviewClient, setReviewClient] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchMissions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('missions')
        .select('*')
        .order('date', { ascending: false });
      if (error) throw error;
      setMissions(data || []);
    } catch (e) {
      console.error('Error fetching missions:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchMissions();
    }
  }, [isAdmin]);

  const handleAddMission = async () => {
    if (!selectedFarmerId) {
      alert('Please select a farmer.');
      return;
    }
    const farmer = farmers.find((f: any) => f.id === selectedFarmerId);
    if (!farmer) return;

    setSubmitting(true);
    const missionNumber = `LP-${Math.floor(1000 + Math.random() * 9000)}`;

    try {
      const { data, error } = await supabase
        .from('missions')
        .insert({
          mission_number: missionNumber,
          date,
          visit_category: visitCategory,
          farm_name: farmer.farm_name || farmer.full_name || 'Generic Farm',
          client_phone: clientPhone || farmer.phone_number || '',
          province: farmer.province || 'International',
          attending_team: attendingTeam,
          review_client: reviewClient,
          user_id: selectedFarmerId,
        })
        .select()
        .single();

      if (error) throw error;
      setMissions((prev) => [data, ...prev]);
      setIsAddModalVisible(false);
      
      // Reset form
      setSelectedFarmerId('');
      setVisitCategory('Vaccination');
      setClientPhone('');
      setAttendingTeam('Team Vet');
      setReviewClient('');
    } catch (e: any) {
      alert('Failed to log mission: ' + e.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAdmin) {
    return (
      <ScreenContainer style={styles.container}>
        <View style={styles.center}>
          <Text variant="h6" color="neutral.500">Access Denied. Admins only.</Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Livestock Pro Suite',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <ChevronLeft size={22} color={Colors.neutral[800]} />
              <Text variant="body" weight="medium" color={Colors.neutral[800]} style={{ marginLeft: 2 }}>
                Back
              </Text>
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity onPress={() => setIsAddModalVisible(true)} style={styles.headerAddBtn}>
              <Plus size={22} color={Colors.primary[600]} />
            </TouchableOpacity>
          ),
        }}
      />

      <ScreenContainer style={styles.container} scrollable={false}>
        {loading && !refreshing ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={Colors.primary[500]} />
          </View>
        ) : (
          <FlatList
            data={missions}
            keyExtractor={(item) => item.id}
            onRefresh={() => { setRefreshing(true); fetchMissions(); }}
            refreshing={refreshing}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text variant="body" color="neutral.500">No logged missions found.</Text>
              </View>
            }
            renderItem={({ item }) => (
              <Card style={styles.missionCard}>
                <View style={styles.cardHeader}>
                  <View>
                    <Text variant="body" weight="bold" color="neutral.900">{item.visit_category}</Text>
                    <Text variant="caption" color="neutral.500">No: {item.mission_number}</Text>
                  </View>
                  <Text variant="caption" color="primary.600" weight="bold" style={styles.dateText}>
                    {item.date}
                  </Text>
                </View>
                <View style={styles.cardDivider} />
                <View style={styles.cardBody}>
                  <View style={styles.infoRow}>
                    <Briefcase size={16} color={Colors.neutral[500]} style={styles.rowIcon} />
                    <Text variant="body2" color="neutral.700">Farm: <Text weight="medium">{item.farm_name}</Text></Text>
                  </View>
                  {item.client_phone ? (
                    <View style={styles.infoRow}>
                      <Phone size={16} color={Colors.neutral[500]} style={styles.rowIcon} />
                      <Text variant="body2" color="neutral.700">Phone: {item.client_phone}</Text>
                    </View>
                  ) : null}
                  <View style={styles.infoRow}>
                    <User size={16} color={Colors.neutral[500]} style={styles.rowIcon} />
                    <Text variant="body2" color="neutral.700">Team: {item.attending_team}</Text>
                  </View>
                  {item.review_client ? (
                    <View style={styles.commentContainer}>
                      <FileText size={16} color={Colors.neutral[400]} style={styles.commentIcon} />
                      <Text variant="caption" color="neutral.600" style={styles.commentText}>
                        {item.review_client}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </Card>
            )}
          />
        )}
      </ScreenContainer>

      {/* Add Mission Modal */}
      <Modal visible={isAddModalVisible} animationType="slide" transparent={true} onRequestClose={() => setIsAddModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text variant="h5" weight="bold">Log New Mission</Text>
              <TouchableOpacity onPress={() => setIsAddModalVisible(false)}>
                <X size={22} color={Colors.neutral[500]} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.formScroll} keyboardShouldPersistTaps="handled">
              <View style={styles.formGroup}>
                <Picker
                  label="Select Farmer"
                  value={selectedFarmerId}
                  onValueChange={(value) => {
                    setSelectedFarmerId(value);
                    const farmer = farmers.find((f: any) => f.id === value);
                    if (farmer) {
                      setClientPhone(farmer.phone_number || '');
                    }
                  }}
                  items={[
                    { label: 'Choose a farmer...', value: '' },
                    ...farmers.map((f: any) => ({
                      label: `${f.full_name || f.email} (${f.farm_name || 'No Farm'})`,
                      value: f.id,
                    })),
                  ]}
                />
              </View>

              <View style={styles.formGroup}>
                <Text variant="body2" style={styles.label}>Date (YYYY-MM-DD)</Text>
                <TextInput
                  style={styles.input}
                  value={date}
                  onChangeText={setDate}
                  placeholder="YYYY-MM-DD"
                />
              </View>

              <View style={styles.formGroup}>
                <Picker
                  label="Visit Category"
                  value={visitCategory}
                  onValueChange={setVisitCategory}
                  items={[
                    { label: 'Vaccination', value: 'Vaccination' },
                    { label: 'Treatment', value: 'Treatment' },
                    { label: 'Insemination', value: 'Insemination' },
                    { label: 'Weaning', value: 'Weaning' },
                    { label: 'Sale', value: 'Sale' },
                    { label: 'Purchase', value: 'Purchase' },
                    { label: 'Other', value: 'Other' },
                  ]}
                />
              </View>

              <View style={styles.formGroup}>
                <Text variant="body2" style={styles.label}>Client Phone</Text>
                <TextInput
                  style={styles.input}
                  value={clientPhone}
                  onChangeText={setClientPhone}
                  placeholder="Phone number"
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.formGroup}>
                <Text variant="body2" style={styles.label}>Attending Team</Text>
                <TextInput
                  style={styles.input}
                  value={attendingTeam}
                  onChangeText={setAttendingTeam}
                  placeholder="e.g. Team Vet"
                />
              </View>

              <View style={styles.formGroup}>
                <Text variant="body2" style={styles.label}>Review / Comments</Text>
                <TextInput
                  style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                  value={reviewClient}
                  onChangeText={setReviewClient}
                  placeholder="Enter notes or feedback..."
                  multiline
                  numberOfLines={3}
                />
              </View>
            </ScrollView>

            <View style={styles.modalButtons}>
              <Button variant="outline" onPress={() => setIsAddModalVisible(false)} style={styles.cancelButton}>
                Cancel
              </Button>
              <Button onPress={handleAddMission} disabled={submitting || !selectedFarmerId}>
                {submitting ? 'Logging...' : 'Log Mission'}
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral[50],
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  headerAddBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  emptyState: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  missionCard: {
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.neutral[100],
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  dateText: {
    backgroundColor: Colors.primary[50],
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: 'hidden',
  },
  cardDivider: {
    height: 1,
    backgroundColor: Colors.neutral[100],
    marginVertical: 12,
  },
  cardBody: {
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowIcon: {
    marginRight: 8,
  },
  commentContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.neutral[50],
    padding: 10,
    borderRadius: 8,
    marginTop: 4,
    borderLeftWidth: 3,
    borderLeftColor: Colors.neutral[300],
  },
  commentIcon: {
    marginRight: 6,
    marginTop: 2,
  },
  commentText: {
    flex: 1,
    lineHeight: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  formScroll: {
    maxHeight: 400,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 6,
    color: Colors.neutral[600],
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: Colors.neutral[50],
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
  },
});
