import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Modal, TextInput, FlatList, ActivityIndicator, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { ChevronLeft, Plus, X, Calendar, User, Phone, Briefcase, FileText, ShieldCheck, MapPin, BarChart3, Layers, Edit, Trash2, Bell } from 'lucide-react-native';
import { Text } from '@/components/typography/Text';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Picker } from '@/components/inputs/Picker';
import Colors from '@/constants/Colors';
import { supabase } from '@/utils/supabase';
import { useFarmData } from '@/context/FarmDataContext';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { generateReportHTML } from '../../utils/reportGenerator';

export default function LivestockProScreen() {
  const router = useRouter();
  const { profile, farmers = [] } = useFarmData();
  const isAdmin = profile?.role === 'admin';

  const [activeTab, setActiveTab] = useState<'missions' | 'coverage' | 'reminders' | 'reports' | 'saved_reports'>('missions');
  const [savedReports, setSavedReports] = useState<any[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [missions, setMissions] = useState<any[]>([]);
  const [animalsCount, setAnimalsCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedProvince, setSelectedProvince] = useState('All');
  const [selectedTeam, setSelectedTeam] = useState('All');

  // Form states for log mission
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<{title: string, desc: string} | null>(null);
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportDetails, setReportDetails] = useState('');
  const [editingMission, setEditingMission] = useState<any | null>(null);
  const [customCategory, setCustomCategory] = useState('');
  const [selectedFarmerId, setSelectedFarmerId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [visitCategory, setVisitCategory] = useState('Vaccination');
  const [clientPhone, setClientPhone] = useState('');
  const [province, setProvince] = useState('Harare');
  const [attendingTeam, setAttendingTeam] = useState('Team Vet');
  const [reviewClient, setReviewClient] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Reminders form states
  const [reminderType, setReminderType] = useState<'guideline' | 'outbreak'>('guideline');
  const [reminderTitle, setReminderTitle] = useState('');
  const [reminderDetails, setReminderDetails] = useState('');
  const [reminderAdvice, setReminderAdvice] = useState('');
  const [reminderTargetFarmerId, setReminderTargetFarmerId] = useState('all');
  const [reminderPriority, setReminderPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [sendingReminder, setSendingReminder] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (!supabase) {
        setMissions([]);
        setAnimalsCount(0);
        return;
      }
      const [mRes, aRes] = await Promise.all([
        supabase.from('missions').select('*').order('date', { ascending: false }),
        supabase.from('animals').select('id', { count: 'estimated', head: true })
      ]);

      if (mRes.error) throw mRes.error;
      setMissions(mRes.data || []);
      setAnimalsCount(aRes.count || 0);
    } catch (e) {
      console.error('Error loading Livestock Pro data:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin]);

  // Unique filter options gathered dynamically
  const categories = useMemo(() => {
    const list = new Set(missions.map(m => m.visit_category).filter(Boolean));
    return ['All', ...Array.from(list)];
  }, [missions]);

  const provinces = useMemo(() => {
    const list = new Set(missions.map(m => m.province).filter(Boolean));
    return ['All', ...Array.from(list)];
  }, [missions]);

  const teams = useMemo(() => {
    const list = new Set(missions.map(m => m.attending_team).filter(Boolean));
    return ['All', ...Array.from(list)];
  }, [missions]);

  // Filtered Missions
  const filteredMissions = useMemo(() => {
    return missions.filter(m => {
      const farmName = m.farm_name || '';
      const missionNo = m.mission_number || '';
      const phone = m.client_phone || '';
      const matchSearch = farmName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          missionNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          phone.includes(searchQuery);
      const matchCat = selectedCategory === 'All' || m.visit_category === selectedCategory;
      const matchProv = selectedProvince === 'All' || m.province === selectedProvince;
      const matchTeam = selectedTeam === 'All' || m.attending_team === selectedTeam;
      return matchSearch && matchCat && matchProv && matchTeam;
    });
  }, [missions, searchQuery, selectedCategory, selectedProvince, selectedTeam]);

  // Coverage statistics computations
  const totalFarms = useMemo(() => {
    return new Set(missions.map(m => (m.farm_name || '').toLowerCase().trim()).filter(Boolean)).size;
  }, [missions]);

  const categoryDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    missions.forEach(m => {
      if (!m.visit_category) return;
      counts[m.visit_category] = (counts[m.visit_category] || 0) + 1;
    });
    const total = missions.length || 1;
    return Object.entries(counts).map(([name, count]) => ({
      name,
      count,
      pct: Math.round((count / total) * 100)
    })).sort((a, b) => b.count - a.count);
  }, [missions]);

  const provinceDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    missions.forEach(m => {
      if (!m.province) return;
      counts[m.province] = (counts[m.province] || 0) + 1;
    });
    const total = missions.length || 1;
    return Object.entries(counts).map(([name, count]) => ({
      name,
      count,
      pct: Math.round((count / total) * 100)
    })).sort((a, b) => b.count - a.count);
  }, [missions]);

  const fetchSavedReports = async () => {
    setLoadingReports(true);
    try {
      if (!supabase) throw new Error('Supabase client not available');
      const qLab = supabase.from('vet_lab_reports').select('*');
      const qConsult = supabase.from('vet_consultation_reports').select('*');
      const qPostMortem = supabase.from('vet_post_mortem_reports').select('*');
      const qAI = supabase.from('vet_ai_reports').select('*');
      const qPregnancy = supabase.from('vet_pregnancy_reports').select('*');
      const qSpecial = supabase.from('vet_special_consult_reports').select('*');

      const [rLab, rConsult, rPostMortem, rAI, rPregnancy, rSpecial] = await Promise.all([
        qLab, qConsult, qPostMortem, qAI, qPregnancy, qSpecial
      ]);

      const combined = [
        ...(rLab.data || []).map(r => ({ id: r.id, type: 'Laboratory Diagnostic', date: r.report_date, user_id: r.user_id, data: r })),
        ...(rConsult.data || []).map(r => ({ id: r.id, type: 'Consultation', date: r.report_date, user_id: r.user_id, data: r })),
        ...(rPostMortem.data || []).map(r => ({ id: r.id, type: 'Post Mortem Report', date: r.report_date, user_id: r.user_id, data: r })),
        ...(rAI.data || []).map(r => ({ id: r.id, type: 'Artificial Insemination', date: r.record_date, user_id: r.user_id, data: r })),
        ...(rPregnancy.data || []).map(r => ({ id: r.id, type: 'Pregnancy Diagnosis', date: r.report_date, user_id: r.user_id, data: r })),
        ...(rSpecial.data || []).map(r => ({ id: r.id, type: 'Special Consultation', date: r.report_date, user_id: r.user_id, data: r }))
      ];
      combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setSavedReports(combined);
    } catch (e) {
      console.error("Error fetching saved reports:", e);
    } finally {
      setLoadingReports(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'saved_reports') {
      fetchSavedReports();
    }
  }, [activeTab]);

  const hotTopics = useMemo(() => {
    const provinceMap: Record<string, Record<string, number>> = {};
    missions.forEach(m => {
      if (!m.province || !m.visit_category) return;
      if (!provinceMap[m.province]) {
        provinceMap[m.province] = {};
      }
      provinceMap[m.province][m.visit_category] = (provinceMap[m.province][m.visit_category] || 0) + 1;
    });

    return Object.entries(provinceMap).map(([provinceName, catCounts]) => {
      const topIssue = Object.entries(catCounts).sort((a, b) => b[1] - a[1])[0];
      return {
        province: provinceName,
        issue: topIssue ? topIssue[0] : 'None',
        count: topIssue ? topIssue[1] : 0
      };
    }).sort((a, b) => b.count - a.count);
  }, [missions]);

  const handleEditMissionPress = (mission: any) => {
    setEditingMission(mission);
    setSelectedFarmerId(mission.user_id || '');
    setDate(mission.date);
    const predefined = ['Vaccination', 'Treatment', 'Insemination', 'Weaning', 'Sale', 'Purchase', 'Other'];
    if (predefined.includes(mission.visit_category)) {
      setVisitCategory(mission.visit_category);
      setCustomCategory('');
    } else {
      setVisitCategory('Custom...');
      setCustomCategory(mission.visit_category);
    }
    setClientPhone(mission.client_phone || '');
    setProvince(mission.province || 'Harare');
    setAttendingTeam(mission.attending_team || 'Team Vet');
    setReviewClient(mission.review_client || '');
    setIsAddModalVisible(true);
  };

  const handleDeleteMission = async (id: string) => {
    const performDelete = async () => {
      try {
        if (!supabase) throw new Error('Supabase client is not available');
        const { error } = await supabase.from('missions').delete().eq('id', id);
        if (error) throw error;
        setMissions(prev => prev.filter(m => m.id !== id));
      } catch (e: any) {
        alert('Failed to delete mission: ' + e.message);
      }
    };

    Alert.alert(
      'Delete Mission',
      'Are you sure you want to delete this logged mission?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: performDelete }
      ]
    );
  };

  const handleAddMission = async () => {
    if (!selectedFarmerId) {
      alert('Please select a farmer.');
      return;
    }
    const farmer = farmers.find((f: any) => f.id === selectedFarmerId);
    if (!farmer) return;

    const categoryToSave = visitCategory === 'Custom...' ? customCategory.trim() : visitCategory;
    if (!categoryToSave) {
      alert('Please enter or select a category.');
      return;
    }

    setSubmitting(true);
    const missionNumber = editingMission ? editingMission.mission_number : `LP-${Math.floor(1000 + Math.random() * 9000)}`;

    try {
      const dbPayload = {
        mission_number: missionNumber,
        date,
        visit_category: categoryToSave,
        farm_name: farmer.farm_name || farmer.full_name || 'Generic Farm',
        client_phone: clientPhone || farmer.phone_number || '',
        province: province || farmer.province || 'International',
        attending_team: attendingTeam,
        review_client: reviewClient,
        user_id: selectedFarmerId,
      };

      if (!supabase) throw new Error('Supabase client is not available');
      if (editingMission) {
        const { data, error } = await supabase
          .from('missions')
          .update(dbPayload)
          .eq('id', editingMission.id)
          .select()
          .single();

        if (error) throw error;
        setMissions((prev) => prev.map((m) => m.id === editingMission.id ? data : m));
      } else {
        const { data, error } = await supabase
          .from('missions')
          .insert(dbPayload)
          .select()
          .single();

        if (error) throw error;
        setMissions((prev) => [data, ...prev]);
      }
      
      setIsAddModalVisible(false);
      setEditingMission(null);
      
      // Reset form
      setSelectedFarmerId('');
      setVisitCategory('Vaccination');
      setCustomCategory('');
      setClientPhone('');
      setProvince('Harare');
      setAttendingTeam('Team Vet');
      setReviewClient('');
    } catch (e: any) {
      alert('Failed to save mission: ' + e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const seasonalTemplates = [
    {
      title: 'Summer Tick Dipping',
      details: 'Weekly dipping in summer is critical to prevent tick-borne diseases (Heartwater, Anaplasmosis, Babesiosis).',
      advice: 'Dip all cattle weekly. Check ears and tail-head for ticks. Report any fever or loss of coordination.'
    },
    {
      title: 'Winter BVD & Leptospirosis Vaccination',
      details: 'Vaccinate breeding herds for Bovine Viral Diarrhea (BVD) and Leptospirosis before the winter season.',
      advice: 'Administer booster shots to cows. Ensure dry calving environment. Monitor pregnant stock closely.'
    },
    {
      title: 'Spring Deworming',
      details: 'Deworming treatments for calves in spring to control worm build-up from fresh pasture grazing.',
      advice: 'Dose all calves under 12 months. Rotate grazing pastures if possible to reduce parasite load.'
    }
  ];

  const outbreakTemplates = [
    {
      title: 'Anthrax Outbreak Alert',
      details: 'Active anthrax outbreak reported in the local region. Anthrax is highly contagious and fatal.',
      advice: 'Strictly restrict livestock movement. Arrange immediate emergency vaccinations. Report any sudden deaths to veterinary services.'
    },
    {
      title: 'Foot & Mouth Disease Alert',
      details: 'Foot and mouth disease cases detected in the province. High transmission risk.',
      advice: 'Isolate new stock. Disinfect vehicle tires entering the farm. Report any salivation or limping immediately.'
    },
    {
      title: 'Lumpy Skin Disease Alert',
      details: 'Lumpy Skin Disease outbreak confirmed. Transmitted by biting insects during warm/wet weather.',
      advice: 'Vaccinate non-infected animals. Apply insect repellents/dips. Quarantine affected animals immediately.'
    }
  ];

  const handleApplyTemplate = (tpl: { title: string; details: string; advice: string }) => {
    setReminderTitle(tpl.title);
    setReminderDetails(tpl.details);
    setReminderAdvice(tpl.advice);
  };

  const handleSendReminder = async () => {
    if (!reminderTitle.trim() || !reminderDetails.trim()) {
      Alert.alert('Error', 'Please enter a title and details.');
      return;
    }

    setSendingReminder(true);
    try {
      const dateStr = new Date().toISOString().split('T')[0];
      const fullDescription = `${reminderType === 'outbreak' ? '🚨 OUTBREAK ALERT' : '📅 SEASONAL GUIDELINE'}\n${reminderTitle}\n\nDetails: ${reminderDetails}\n\nAdvice: ${reminderAdvice}`;

      let targets: string[] = [];
      if (reminderTargetFarmerId === 'all') {
        targets = farmers.map((f: any) => f.id);
      } else {
        targets = [reminderTargetFarmerId];
      }

      if (targets.length === 0) {
        Alert.alert('Error', 'No recipient farmers found.');
        setSendingReminder(false);
        return;
      }

      const inserts = targets.map(userId => ({
        date: dateStr,
        description: fullDescription,
        status: 'pending',
        created_by: 'admin',
        last_edited: dateStr,
        priority: reminderPriority,
        user_id: userId
      }));

      if (!supabase) throw new Error('Supabase client is not available');
      const { error } = await supabase.from('todo_tasks').insert(inserts);
      if (error) throw error;

      Alert.alert('Success', `Successfully sent ${reminderType === 'outbreak' ? 'alert' : 'reminder'} to ${reminderTargetFarmerId === 'all' ? 'all' : 'selected'} farm(s).`);
      
      setReminderTitle('');
      setReminderDetails('');
      setReminderAdvice('');
      setReminderTargetFarmerId('all');
      setReminderPriority('medium');
    } catch (e: any) {
      Alert.alert('Error', 'Failed to send: ' + e.message);
    } finally {
      setSendingReminder(false);
    }
  };

  const reportTemplates = [
    { title: 'Post Mortem Report', desc: 'Generate a detailed post mortem examination report.' },
    { title: 'Consult Report', desc: 'Generate a general consultation and advisory report.' },
    { title: 'Benchmark Mission Report', desc: 'Generate a benchmark analysis for mission visits.' },
    { title: 'Laboratory Report', desc: 'Generate a standardized laboratory test results report.' },
    { title: 'Artificial Insemination Report', desc: 'Generate an AI procedure and outcome report.' },
    { title: 'Pregnancy Diagnosis Report', desc: 'Generate a pregnancy checking and ultrasound report.' },
    { title: 'Other', desc: 'Generate a custom report with a blank template.' }
  ];

  const renderReportsTab = () => (
    <ScrollView contentContainerStyle={styles.listContent} keyboardShouldPersistTaps="handled">
      <Card style={styles.sectionCard}>
        <Text variant="body" weight="bold" color="neutral.900" style={{ marginBottom: 4 }}>
          Generate Reports
        </Text>
        <Text variant="caption" color="neutral.500" style={{ marginBottom: 16 }}>
          Select a report template to generate a standardized document.
        </Text>

        {reportTemplates.map((report, idx) => (
          <TouchableOpacity
            key={idx}
            style={{
              padding: 16,
              borderWidth: 1,
              borderColor: Colors.neutral[200],
              borderRadius: 12,
              marginBottom: 12,
              backgroundColor: Colors.white,
              flexDirection: 'row',
              alignItems: 'center',
            }}
            onPress={() => {
              setSelectedReport(report);
              setReportDate(new Date().toISOString().split('T')[0]);
              setReportDetails('');
              setIsReportModalOpen(true);
            }}
          >
            <View style={{ padding: 8, backgroundColor: Colors.neutral[50], borderRadius: 8, marginRight: 12 }}>
              <FileText size={20} color={Colors.neutral[500]} />
            </View>
            <View style={{ flex: 1 }}>
              <Text variant="body2" weight="bold" color="neutral.900">{report.title}</Text>
              <Text variant="caption" color="neutral.500">{report.desc}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </Card>
    </ScrollView>
  );

  const renderSavedReportsTab = () => (
    <ScrollView contentContainerStyle={styles.listContent} keyboardShouldPersistTaps="handled">
      <Card style={styles.sectionCard}>
        <Text variant="body" weight="bold" color="neutral.900" style={{ marginBottom: 16 }}>
          Report History
        </Text>
        {loadingReports ? (
          <ActivityIndicator size="small" color={Colors.primary[500]} />
        ) : savedReports.length === 0 ? (
          <Text variant="body2" color="neutral.500" style={{ textAlign: 'center', padding: 20 }}>No saved reports found.</Text>
        ) : (
          savedReports.map((report, idx) => {
            const farmer = farmers.find((f: any) => f.id === report.user_id);
            return (
              <View key={report.id || idx} style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: Colors.neutral[100], flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ flex: 1 }}>
                  <Text variant="body2" weight="bold">{report.type}</Text>
                  <Text variant="caption" color="neutral.500">Date: {report.date} • Farmer: {farmer?.full_name || 'N/A'}</Text>
                </View>
                <TouchableOpacity onPress={async () => {
                  try {
                    const html = generateReportHTML(report.type, report.data, farmer?.full_name || 'N/A', report.date);
                    const { uri } = await Print.printToFileAsync({ html });
                    if (await Sharing.isAvailableAsync()) {
                      await Sharing.shareAsync(uri);
                    }
                  } catch (e: any) {
                    Alert.alert('Error', 'Failed to generate PDF: ' + e.message);
                  }
                }} style={{ padding: 8, backgroundColor: Colors.primary[50], borderRadius: 8 }}>
                  <FileText size={16} color={Colors.primary[600]} />
                </TouchableOpacity>
              </View>
            )
          })
        )}
      </Card>
    </ScrollView>
  );

  const renderRemindersTab = () => (
    <ScrollView contentContainerStyle={styles.listContent} keyboardShouldPersistTaps="handled">
      <Card style={styles.sectionCard}>
        <Text variant="body" weight="bold" color="neutral.900" style={{ marginBottom: 16 }}>
          Publish Veterinary Guidelines & Outbreaks
        </Text>

        <View style={styles.formGroup}>
          <Picker
            label="Notification Type"
            value={reminderType}
            onValueChange={(val: any) => {
              setReminderType(val);
              setReminderTitle('');
              setReminderDetails('');
              setReminderAdvice('');
            }}
            items={[
              { label: '📅 Seasonal Veterinary Guideline', value: 'guideline' },
              { label: '🚨 Outbreak Emergency Alert', value: 'outbreak' },
            ]}
          />
        </View>

        <Text variant="caption" color="neutral.500" style={{ marginBottom: 8, fontWeight: 'bold' }}>
          Select Template
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginBottom: 16, paddingBottom: 4 }}>
          {(reminderType === 'guideline' ? seasonalTemplates : outbreakTemplates).map((tpl, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => handleApplyTemplate(tpl)}
              style={{
                backgroundColor: reminderTitle === tpl.title ? Colors.primary[50] : Colors.neutral[50],
                borderColor: reminderTitle === tpl.title ? Colors.primary[400] : Colors.neutral[200],
                borderWidth: 1,
                borderRadius: 8,
                paddingHorizontal: 12,
                paddingVertical: 8,
              }}
            >
              <Text variant="caption" weight="bold" color={reminderTitle === tpl.title ? 'primary.600' : 'neutral.700'}>
                {tpl.title}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.formGroup}>
          <Text variant="body2" style={styles.label}>Title</Text>
          <TextInput
            style={styles.input}
            value={reminderTitle}
            onChangeText={setReminderTitle}
            placeholder="e.g. Anthrax outbreak in Mashonaland Central"
          />
        </View>

        <View style={styles.formGroup}>
          <Text variant="body2" style={styles.label}>Details & Description</Text>
          <TextInput
            style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
            value={reminderDetails}
            onChangeText={setReminderDetails}
            placeholder="Describe the outbreak or guideline in detail..."
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={styles.formGroup}>
          <Text variant="body2" style={styles.label}>Veterinary Action Advice</Text>
          <TextInput
            style={[styles.input, { height: 60, textAlignVertical: 'top' }]}
            value={reminderAdvice}
            onChangeText={setReminderAdvice}
            placeholder="Advice e.g. Deworm immediately, dip twice weekly"
            multiline
            numberOfLines={2}
          />
        </View>

        <View style={styles.formGroup}>
          <Picker
            label="Priority Level"
            value={reminderPriority}
            onValueChange={(val: any) => setReminderPriority(val)}
            items={[
              { label: 'Low', value: 'low' },
              { label: 'Medium', value: 'medium' },
              { label: 'High', value: 'high' },
            ]}
          />
        </View>

        <View style={styles.formGroup}>
          <Picker
            label="Destination Farm(s)"
            value={reminderTargetFarmerId}
            onValueChange={(val: any) => setReminderTargetFarmerId(val)}
            items={[
              { label: '📢 All Active Farms (Broadcast)', value: 'all' },
              ...farmers.map((f: any) => ({
                label: `🚜 ${f.farm_name || f.full_name || f.email}`,
                value: f.id,
              })),
            ]}
          />
        </View>

        <Button
          onPress={handleSendReminder}
          disabled={sendingReminder || !reminderTitle || !reminderDetails}
          style={{ marginTop: 8 }}
        >
          {sendingReminder ? 'Publishing...' : 'Publish Reminder / Alert'}
        </Button>
      </Card>
    </ScrollView>
  );

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
            <TouchableOpacity onPress={() => { setEditingMission(null); setIsAddModalVisible(true); }} style={styles.headerAddBtn}>
              <Plus size={22} color={Colors.primary[600]} />
            </TouchableOpacity>
          ),
        }}
      />

      <ScreenContainer style={styles.container} scrollable={false}>
        {/* Tab switch header segment */}
        <View style={styles.tabContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabScrollContent}
          >
            <TouchableOpacity 
              style={[styles.tabButton, activeTab === 'missions' && styles.tabButtonActive]} 
              onPress={() => setActiveTab('missions')}
            >
              <Layers size={16} color={activeTab === 'missions' ? Colors.primary[600] : Colors.neutral[500]} style={{ marginRight: 6 }} />
              <Text variant="body2" weight="bold" color={activeTab === 'missions' ? 'primary.600' : 'neutral.500'} numberOfLines={1}>
                Missions Register
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tabButton, activeTab === 'coverage' && styles.tabButtonActive]} 
              onPress={() => setActiveTab('coverage')}
            >
              <BarChart3 size={16} color={activeTab === 'coverage' ? Colors.primary[600] : Colors.neutral[500]} style={{ marginRight: 6 }} />
              <Text variant="body2" weight="bold" color={activeTab === 'coverage' ? 'primary.600' : 'neutral.500'} numberOfLines={1}>
                Coverage Analysis
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tabButton, activeTab === 'reminders' && styles.tabButtonActive]} 
              onPress={() => setActiveTab('reminders')}
            >
              <Bell size={16} color={activeTab === 'reminders' ? Colors.primary[600] : Colors.neutral[500]} style={{ marginRight: 6 }} />
              <Text variant="body2" weight="bold" color={activeTab === 'reminders' ? 'primary.600' : 'neutral.500'} numberOfLines={1}>
                Disease & Reminders
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tabButton, activeTab === 'reports' && styles.tabButtonActive]} 
              onPress={() => setActiveTab('reports')}
            >
              <FileText size={16} color={activeTab === 'reports' ? Colors.primary[600] : Colors.neutral[500]} style={{ marginRight: 6 }} />
              <Text variant="body2" weight="bold" color={activeTab === 'reports' ? 'primary.600' : 'neutral.500'} numberOfLines={1}>
                Generate Reports
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tabButton, activeTab === 'saved_reports' && styles.tabButtonActive]} 
              onPress={() => setActiveTab('saved_reports')}
            >
              <Briefcase size={16} color={activeTab === 'saved_reports' ? Colors.primary[600] : Colors.neutral[500]} style={{ marginRight: 6 }} />
              <Text variant="body2" weight="bold" color={activeTab === 'saved_reports' ? 'primary.600' : 'neutral.500'} numberOfLines={1}>
                Report History
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {loading && !refreshing ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={Colors.primary[500]} />
          </View>
        ) : activeTab === 'missions' ? (
          <View style={{ flex: 1 }}>
            {/* Search Input */}
            <View style={styles.searchBar}>
              <TextInput
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search farm, mission no or phone..."
              />
              {searchQuery ? (
                <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.searchClear}>
                  <X size={16} color={Colors.neutral[500]} />
                </TouchableOpacity>
              ) : null}
            </View>

            {/* Quick Filters */}
            <View style={styles.filterRow}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
                <View style={styles.filterItem}>
                  <Text variant="caption" color="neutral.500">Category: </Text>
                  <TouchableOpacity style={styles.pickerTrigger}>
                    <Text variant="caption" weight="bold">
                      {selectedCategory}
                    </Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.filterItem}>
                  <Text variant="caption" color="neutral.500">Province: </Text>
                  <TouchableOpacity style={styles.pickerTrigger}>
                    <Text variant="caption" weight="bold">
                      {selectedProvince}
                    </Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>

            <FlatList
              data={filteredMissions}
              keyExtractor={(item) => item.id}
              onRefresh={fetchData}
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
                    <View style={{ flex: 1 }}>
                      <Text variant="body" weight="bold" color="neutral.900">{item.visit_category}</Text>
                      <Text variant="caption" color="neutral.500">No: {item.mission_number}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text variant="caption" color="primary.600" weight="bold" style={styles.dateText}>
                        {item.date}
                      </Text>
                      <TouchableOpacity onPress={() => handleEditMissionPress(item)} style={{ padding: 4 }}>
                        <Edit size={16} color={Colors.neutral[500]} />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleDeleteMission(item.id)} style={{ padding: 4 }}>
                        <Trash2 size={16} color={Colors.error[500]} />
                      </TouchableOpacity>
                    </View>
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
                      <MapPin size={16} color={Colors.neutral[500]} style={styles.rowIcon} />
                      <Text variant="body2" color="neutral.700">Location: {item.province || 'International'}</Text>
                    </View>
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
          </View>
        ) : activeTab === 'coverage' ? (
          <ScrollView contentContainerStyle={styles.listContent}>
            {/* Quick Metrics Grid */}
            <View style={styles.metricsGrid}>
              <View style={styles.metricCard}>
                <Text variant="caption" color="neutral.500" weight="bold" align="center" style={{ textTransform: 'uppercase', fontSize: 10 }} numberOfLines={1}>Total Missions</Text>
                <Text variant="h4" weight="bold" color="neutral.900" style={{ marginTop: 4 }}>{missions.length}</Text>
              </View>
              <View style={styles.metricCard}>
                <Text variant="caption" color="neutral.500" weight="bold" align="center" style={{ textTransform: 'uppercase', fontSize: 10 }} numberOfLines={1}>Farms Visited</Text>
                <Text variant="h4" weight="bold" color="primary.600" style={{ marginTop: 4 }}>{totalFarms}</Text>
              </View>
              <View style={styles.metricCard}>
                <Text variant="caption" color="neutral.500" weight="bold" align="center" style={{ textTransform: 'uppercase', fontSize: 10 }} numberOfLines={1}>Animals Covered</Text>
                <Text variant="h4" weight="bold" color="secondary.600" style={{ marginTop: 4 }}>{animalsCount}</Text>
              </View>
            </View>

            {/* Visit Category Distribution */}
            <Card style={styles.sectionCard}>
              <Text variant="body" weight="bold" color="neutral.900" style={{ marginBottom: 16 }}>
                Missions by Category
              </Text>
              {categoryDistribution.map((item) => (
                <View key={item.name} style={styles.distRow}>
                  <View style={styles.distRowHeader}>
                    <Text variant="body2" color="neutral.800" style={{ flex: 1, marginRight: 8 }} numberOfLines={1} ellipsizeMode="tail">{item.name}</Text>
                    <Text variant="body2" weight="bold" color="neutral.900">{item.count} ({item.pct}%)</Text>
                  </View>
                  <View style={styles.progressTrack}>
                    <View style={[styles.progressBar, { width: `${item.pct}%`, backgroundColor: Colors.primary[500] }]} />
                  </View>
                </View>
              ))}
            </Card>

            {/* Geographic Coverage */}
            <Card style={styles.sectionCard}>
              <Text variant="body" weight="bold" color="neutral.900" style={{ marginBottom: 16 }}>
                Geographic Coverage
              </Text>
              {provinceDistribution.map((item) => (
                <View key={item.name} style={styles.distRow}>
                  <View style={styles.distRowHeader}>
                    <Text variant="body2" color="neutral.800" style={{ flex: 1, marginRight: 8 }} numberOfLines={1} ellipsizeMode="tail">{item.name}</Text>
                    <Text variant="body2" weight="bold" color="neutral.900">{item.count} ({item.pct}%)</Text>
                  </View>
                  <View style={styles.progressTrack}>
                    <View style={[styles.progressBar, { width: `${item.pct}%`, backgroundColor: Colors.secondary[500] }]} />
                  </View>
                </View>
              ))}
            </Card>

            {/* Top Visit Issues by Location */}
            <Card style={styles.sectionCard}>
              <Text variant="body" weight="bold" color="neutral.900" style={{ marginBottom: 16 }}>
                Top Visit Issue by Province
              </Text>
              {hotTopics.map((item) => (
                <View key={item.province} style={styles.hotTopicRow}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text variant="body2" weight="bold" color="neutral.800" numberOfLines={1} ellipsizeMode="tail">{item.province}</Text>
                    <Text variant="caption" color="neutral.500" numberOfLines={1}>Most frequent visit reason</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end', flexShrink: 1 }}>
                    <Text variant="body2" weight="bold" color="primary.600" style={{ textAlign: 'right' }} numberOfLines={1} ellipsizeMode="tail">{item.issue}</Text>
                    <Text variant="caption" color="neutral.400">{item.count} missions</Text>
                  </View>
                </View>
              ))}
            </Card>
          </ScrollView>
        ) : activeTab === 'reminders' ? (
          renderRemindersTab()
        ) : activeTab === 'saved_reports' ? (
          renderSavedReportsTab()
        ) : (
          renderReportsTab()
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
                      setProvince(farmer.province || 'Harare');
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
                    { label: 'Custom...', value: 'Custom...' },
                  ]}
                />
              </View>

              {visitCategory === 'Custom...' && (
                <View style={styles.formGroup}>
                  <Text variant="body2" style={styles.label}>Custom Category Name</Text>
                  <TextInput
                    style={styles.input}
                    value={customCategory}
                    onChangeText={setCustomCategory}
                    placeholder="Enter custom category"
                  />
                </View>
              )}

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
                <Text variant="body2" style={styles.label}>Province / Region</Text>
                <TextInput
                  style={styles.input}
                  value={province}
                  onChangeText={setProvince}
                  placeholder="e.g. Harare, Midlands"
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
              <Button onPress={handleAddMission} disabled={submitting || !selectedFarmerId} style={{ flex: 1 }}>
                {submitting ? 'Logging...' : 'Log Mission'}
              </Button>
            </View>
          </View>
        </View>
      </Modal>

      {/* Generate Report Modal */}
      <Modal visible={isReportModalOpen} animationType="slide" transparent={true} onRequestClose={() => setIsReportModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1, paddingRight: 16 }}>
                <Text variant="h5" weight="bold">Generate {selectedReport?.title}</Text>
                <Text variant="caption" color="neutral.500" numberOfLines={2}>{selectedReport?.desc}</Text>
              </View>
              <TouchableOpacity onPress={() => setIsReportModalOpen(false)}>
                <X size={22} color={Colors.neutral[500]} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.formScroll} keyboardShouldPersistTaps="handled">
              <View style={styles.formGroup}>
                <Picker
                  label="Target Farmer / Client"
                  value={selectedFarmerId}
                  onValueChange={(val) => setSelectedFarmerId(val)}
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
                <Text variant="body2" style={styles.label}>Report Date</Text>
                <TextInput
                  style={styles.input}
                  value={reportDate}
                  onChangeText={setReportDate}
                  placeholder="YYYY-MM-DD"
                />
              </View>

              <View style={styles.formGroup}>
                <Text variant="body2" style={styles.label}>Report Details & Findings</Text>
                <TextInput
                  style={[styles.input, { height: 120, textAlignVertical: 'top' }]}
                  value={reportDetails}
                  onChangeText={setReportDetails}
                  placeholder="Enter the main content, observations, and findings for the report..."
                  multiline
                  numberOfLines={6}
                />
              </View>

              <View style={{ padding: 12, backgroundColor: '#EFF6FF', borderRadius: 8, borderWidth: 1, borderColor: '#BFDBFE', flexDirection: 'row', gap: 8, marginTop: 4 }}>
                <FileText size={16} color="#1E40AF" style={{ marginTop: 2 }} />
                <Text variant="caption" color="#1E40AF" style={{ flex: 1, lineHeight: 18 }}>
                  Generating this report will compile the details into a standardized PDF document layout.
                </Text>
              </View>
            </ScrollView>

            <View style={styles.modalButtons}>
              <Button variant="outline" onPress={() => setIsReportModalOpen(false)} style={styles.cancelButton}>
                Cancel
              </Button>
              <Button onPress={async () => {
                if (!selectedFarmerId) return Alert.alert('Error', 'Please select a farmer.');
                setSubmitting(true);
                try {
                  const farmer = farmers.find((f: any) => f.id === selectedFarmerId);
                  const dataObj = { report_date: reportDate, user_id: selectedFarmerId, diagnostic_summary: reportDetails, comments: reportDetails };
                  
                  let tableName = 'vet_consultation_reports';
                  if (selectedReport?.title === 'Post Mortem Report') tableName = 'vet_post_mortem_reports';
                  else if (selectedReport?.title === 'Laboratory Report') tableName = 'vet_lab_reports';
                  else if (selectedReport?.title === 'Artificial Insemination Report') tableName = 'vet_ai_reports';
                  else if (selectedReport?.title === 'Pregnancy Diagnosis Report') tableName = 'vet_pregnancy_reports';
                  else if (selectedReport?.title === 'Other') tableName = 'vet_special_consult_reports';

                  if (supabase) {
                    const { error } = await supabase.from(tableName).insert([dataObj]);
                    if (error) throw error;
                  }
                  
                  const html = generateReportHTML(selectedReport?.title || 'Report', dataObj, farmer?.full_name || 'N/A', reportDate);
                  const { uri } = await Print.printToFileAsync({ html });
                  if (await Sharing.isAvailableAsync()) {
                    await Sharing.shareAsync(uri);
                  } else {
                    Alert.alert('Success', `Successfully generated ${selectedReport?.title}!`);
                  }
                  
                  setIsReportModalOpen(false);
                  if (activeTab === 'saved_reports') fetchSavedReports();
                } catch (e: any) {
                  Alert.alert('Error', 'Failed to generate report: ' + e.message);
                } finally {
                  setSubmitting(false);
                }
              }} style={{ flex: 1 }} loading={submitting}>
                Generate & Save
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
  tabContainer: {
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[200],
  },
  tabScrollContent: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 16,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabButtonActive: {
    borderBottomColor: Colors.primary[600],
  },
  searchBar: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    borderRadius: 12,
    paddingHorizontal: 12,
    alignItems: 'center',
    height: 44,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.neutral[800],
  },
  searchClear: {
    padding: 4,
  },
  filterRow: {
    marginHorizontal: 16,
    marginBottom: 8,
  },
  filterScroll: {
    gap: 12,
  },
  filterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  pickerTrigger: {
    paddingHorizontal: 4,
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
  metricsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  metricCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionCard: {
    padding: 16,
    marginBottom: 16,
  },
  distRow: {
    marginBottom: 14,
  },
  distRowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressTrack: {
    height: 8,
    backgroundColor: Colors.neutral[100],
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  hotTopicRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[100],
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
