import { Text, View, StyleSheet } from '@react-pdf/renderer';
import DocumentTemplate from './DocumentTemplate';

const styles = StyleSheet.create({
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#121416',
    backgroundColor: '#E9ECEF',
    padding: 5,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F9FA',
    paddingBottom: 2,
  },
  label: {
    width: '40%',
    fontSize: 10,
    fontWeight: 'bold',
    color: '#495057',
  },
  value: {
    width: '60%',
    fontSize: 10,
    color: '#121416',
  },
  textArea: {
    fontSize: 10,
    color: '#121416',
    marginTop: 4,
    marginBottom: 8,
    lineHeight: 1.4,
  }
});

interface VetReportPDFProps {
  data: any; // We can type this better based on the actual report data structure
  farmer?: {
    name: string;
    farm?: string;
    phone?: string;
  } | null;
}

const FieldRow = ({ label, value }: { label: string, value: any }) => (
  <View style={styles.row}>
    <Text style={styles.label}>{label}</Text>
    <Text style={styles.value}>{value || 'N/A'}</Text>
  </View>
);

const TextAreaField = ({ label, value }: { label: string, value: any }) => (
  <View style={{ marginBottom: 8 }}>
    <Text style={styles.label}>{label}</Text>
    <Text style={styles.textArea}>{value || 'N/A'}</Text>
  </View>
);

export default function VetReportPDF({ data, farmer }: VetReportPDFProps) {
  return (
    <DocumentTemplate 
      title="Veterinary Consultation Report" 
      subtitle={`Report Date: ${data.report_date || new Date().toLocaleDateString()}`}
    >
      {farmer && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Farmer & Farm Details</Text>
          <FieldRow label="Farmer Name" value={farmer.name} />
          {farmer.farm && <FieldRow label="Farm Name (System)" value={farmer.farm} />}
          {farmer.phone && <FieldRow label="Contact Phone" value={farmer.phone} />}
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>1. General Admin & Farm Profile</Text>
        <FieldRow label="Case Number" value={data.case_number} />
        <FieldRow label="Attending Vet" value={data.attending_vet} />
        <FieldRow label="Client / Farm Name" value={data.client_name} />
        <FieldRow label="Contact Person" value={data.contact_person} />
        <FieldRow label="Address" value={data.address} />
        <FieldRow label="Holding Number" value={data.holding_number} />
        <FieldRow label="Enterprise Type" value={data.enterprise_type} />
        <FieldRow label="Total Stock" value={data.total_stock} />
        <FieldRow label="Primary Purpose" value={data.primary_purpose} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>2. Farm History & Presenting Problem</Text>
        <TextAreaField label="Presenting Complaints" value={data.presenting_complaints} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>3. Clinical Examination & Observations</Text>
        <FieldRow label="Herd/Group Behavior" value={data.group_behavior} />
        <FieldRow label="Average BCS" value={data.average_bcs} />
        <TextAreaField label="Clinical Signs Noted" value={data.clinical_signs} />
        <TextAreaField label="Individual Examinations" value={data.individual_exams} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>4. Diagnoses & Treatment Plan</Text>
        <TextAreaField label="Preliminary Diagnosis" value={data.preliminary_diagnosis} />
        <TextAreaField label="Definitive Diagnosis" value={data.definitive_diagnosis} />
        <TextAreaField label="Medications Prescribed" value={data.prescriptions} />
        <FieldRow label="Meat Withdrawal" value={data.meat_withdrawal} />
        <FieldRow label="Milk Withdrawal" value={data.milk_withdrawal} />
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>5. Veterinary Recommendations</Text>
        <TextAreaField label="Isolation / Quarantine" value={data.isolate_management} />
        <TextAreaField label="Husbandry Changes" value={data.husbandry_changes} />
        <FieldRow label="Vaccination Updates" value={data.vaccination_updates} />
        <FieldRow label="Nutritional Adjustments" value={data.nutritional_adjustments} />
        <FieldRow label="Follow-Up Required" value={data.follow_up_required ? 'Yes' : 'No'} />
        {data.follow_up_required && <FieldRow label="Follow-Up Date" value={data.follow_up_date} />}
      </View>
    </DocumentTemplate>
  );
}
