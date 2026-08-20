import { PDFDownloadLink } from '@react-pdf/renderer';
import { Download } from 'lucide-react';
import React from 'react';

interface ExportButtonProps {
  document: React.ReactElement;
  fileName: string;
  label?: string;
  className?: string;
}

export default function ExportButton({ document, fileName, label = "Download PDF", className = "" }: ExportButtonProps) {
  return (
    <PDFDownloadLink
      document={document}
      fileName={fileName}
      className={`inline-flex items-center gap-2 px-4 py-2 bg-[#7AC142] hover:bg-[#639A34] text-white text-sm font-bold rounded-xl transition-all shadow-sm active:scale-95 ${className}`}
    >
      {({ blob, url, loading, error }) => (
        <>
          <Download size={16} />
          {loading ? 'Generating PDF...' : label}
        </>
      )}
    </PDFDownloadLink>
  );
}
