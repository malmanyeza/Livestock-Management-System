import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer';

// Register standard fonts
// Font.register({
//   family: 'Inter',
//   fonts: [
//     { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff2', fontWeight: 400 },
//     { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuI6fAZ9hiA.woff2', fontWeight: 700 }
//   ]
// });

const styles = StyleSheet.create({
  page: {
    padding: 40,
    backgroundColor: '#ffffff',
    // fontFamily: 'Inter',
    fontSize: 10,
    color: '#343A40'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#7AC142',
    paddingBottom: 15,
    marginBottom: 20
  },
  headerLeft: {
    flex: 1
  },
  headerRight: {
    textAlign: 'right'
  },
  title: {
    fontSize: 24,
    color: '#121416',
    fontWeight: 'bold',
    marginBottom: 4
  },
  subtitle: {
    fontSize: 12,
    color: '#6C757D'
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
    paddingTop: 10,
    fontSize: 8,
    color: '#6C757D'
  }
});

interface DocumentTemplateProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export default function DocumentTemplate({ title, subtitle, children }: DocumentTemplateProps) {
  const currentDate = new Date().toLocaleDateString();

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>{title}</Text>
            {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          </View>
          <View style={styles.headerRight}>
            <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#7AC142', marginBottom: 2 }}>Livestock Pro</Text>
            <Text>Generated: {currentDate}</Text>
          </View>
        </View>

        {/* Content */}
        {children}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text>Livestock Management System - Confidential</Text>
          <Text render={({ pageNumber, totalPages }) => (`Page ${pageNumber} of ${totalPages}`)} />
        </View>
      </Page>
    </Document>
  );
}
