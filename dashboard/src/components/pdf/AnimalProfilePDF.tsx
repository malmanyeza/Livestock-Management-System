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
  timelineEvent: {
    marginBottom: 8,
    paddingLeft: 10,
    borderLeftWidth: 2,
    borderLeftColor: '#7AC142',
  },
  timelineDate: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#6C757D',
    marginBottom: 2,
  },
  timelineTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#121416',
    marginBottom: 2,
  },
  timelineDetails: {
    fontSize: 9,
    color: '#495057',
  }
});

interface AnimalProfilePDFProps {
  animal: any;
  pedigree: any;
  timeline: any[];
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

export default function AnimalProfilePDF({ animal, pedigree, timeline, farmer }: AnimalProfilePDFProps) {
  return (
    <DocumentTemplate 
      title={`Animal Profile: ${animal.tag}`}
      subtitle={`Generated on: ${new Date().toLocaleDateString()}`}
    >
      {farmer && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Farmer & Farm Details</Text>
          <FieldRow label="Farmer Name" value={farmer.name} />
          {farmer.farm && <FieldRow label="Farm Name" value={farmer.farm} />}
          {farmer.phone && <FieldRow label="Contact Phone" value={farmer.phone} />}
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>General Information</Text>
        <FieldRow label="Tag" value={animal.tag} />
        <FieldRow label="Sex" value={animal.sex} />
        <FieldRow label="Breed" value={animal.breed} />
        <FieldRow label="Stock Type" value={animal.stock_type} />
        <FieldRow label="Age" value={animal.age} />
        <FieldRow label="Source" value={animal.source} />
        <FieldRow label="Description / Notes" value={animal.description} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Metrics</Text>
        <FieldRow label="Current Weight" value={animal.weight ? `${animal.weight} kg` : null} />
        <FieldRow label="Body Condition Score (BCS)" value={animal.bcs} />
        <FieldRow label="Birth Weight" value={animal.birth_weight ? `${animal.birth_weight} kg` : null} />
        <FieldRow label="Weaning Date" value={animal.date_of_weaning} />
        <FieldRow label="Weaning Weight" value={animal.weaning_weight ? `${animal.weaning_weight} kg` : null} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Pedigree summary</Text>
        <FieldRow label="Sire (Father)" value={pedigree.sire} />
        <FieldRow label="Dam (Mother)" value={pedigree.dam} />
        <FieldRow label="Paternal Grandsire" value={pedigree.sireSire} />
        <FieldRow label="Paternal Granddam" value={pedigree.sireDam} />
        <FieldRow label="Maternal Grandsire" value={pedigree.damSire} />
        <FieldRow label="Maternal Granddam" value={pedigree.damDam} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Lifetime History</Text>
        {timeline && timeline.length > 0 ? timeline.map((evt, idx) => (
          <View key={idx} style={styles.timelineEvent}>
            <Text style={styles.timelineDate}>{new Date(evt.date).toLocaleDateString()}</Text>
            <Text style={styles.timelineTitle}>{evt.title}</Text>
            <Text style={styles.timelineDetails}>{evt.details}</Text>
          </View>
        )) : <Text style={styles.timelineDetails}>No history events recorded.</Text>}
      </View>
    </DocumentTemplate>
  );
}
