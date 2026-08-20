import { Text, View, StyleSheet } from '@react-pdf/renderer';
import DocumentTemplate from './DocumentTemplate';

const styles = StyleSheet.create({
  section: {
    marginBottom: 15,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F9FA',
    paddingBottom: 4,
    paddingTop: 2,
  },
  label: {
    width: '40%',
    fontSize: 10,
    fontWeight: 'bold',
    color: '#495057',
    textTransform: 'uppercase',
  },
  value: {
    width: '60%',
    fontSize: 10,
    color: '#121416',
  }
});

interface GenericReportPDFProps {
  title: string;
  data: any;
  farmer?: {
    name: string;
    farm?: string;
    phone?: string;
  } | null;
}

export default function GenericReportPDF({ title, data, farmer }: GenericReportPDFProps) {
  return (
    <DocumentTemplate 
      title={title} 
      subtitle={`Generated on: ${new Date().toLocaleDateString()}`}
    >
      {farmer && (
        <View style={styles.section}>
          <Text style={{ fontSize: 14, fontWeight: 'bold', backgroundColor: '#E9ECEF', padding: 5, marginBottom: 8 }}>Farmer & Farm Details</Text>
          <View style={styles.row}><Text style={styles.label}>Farmer Name</Text><Text style={styles.value}>{farmer.name}</Text></View>
          {farmer.farm && <View style={styles.row}><Text style={styles.label}>Farm Name</Text><Text style={styles.value}>{farmer.farm}</Text></View>}
          {farmer.phone && <View style={styles.row}><Text style={styles.label}>Contact Phone</Text><Text style={styles.value}>{farmer.phone}</Text></View>}
        </View>
      )}

      <View style={styles.section}>
        <Text style={{ fontSize: 14, fontWeight: 'bold', backgroundColor: '#E9ECEF', padding: 5, marginBottom: 8 }}>Report Data</Text>
        {Object.entries(data).map(([key, value]) => {
          if (key === 'id' || key === 'user_id' || key === 'created_at' || value === null || value === '') return null;
          return (
            <View key={key} style={styles.row}>
              <Text style={styles.label}>{key.replace(/_/g, ' ')}</Text>
              <Text style={styles.value}>{String(value)}</Text>
            </View>
          );
        })}
      </View>
    </DocumentTemplate>
  );
}
