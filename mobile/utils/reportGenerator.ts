export const generateReportHTML = (
  title: string,
  data: any,
  farmerName: string,
  date: string
) => {
  const rows = Object.entries(data)
    .filter(([k, v]) => k !== 'id' && k !== 'user_id' && k !== 'created_at' && v !== null && v !== '')
    .map(([key, value]) => {
      const formattedKey = key.replace(/_/g, ' ').toUpperCase();
      return `
        <div class="row">
          <div class="label">${formattedKey}</div>
          <div class="value">${String(value)}</div>
        </div>
      `;
    })
    .join('');

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #121416; padding: 20px; line-height: 1.5; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #7AC142; padding-bottom: 10px; }
        .title { font-size: 24px; font-weight: bold; color: #639A34; margin: 0; }
        .subtitle { font-size: 14px; color: #6C757D; }
        .section { margin-bottom: 20px; }
        .section-title { font-size: 16px; font-weight: bold; background-color: #E9ECEF; padding: 8px; margin-bottom: 10px; border-radius: 4px; }
        .row { display: flex; border-bottom: 1px solid #E9ECEF; padding: 6px 0; }
        .label { width: 40%; font-size: 12px; font-weight: bold; color: #495057; }
        .value { width: 60%; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1 class="title">${title}</h1>
        <div class="subtitle">Generated on: ${date}</div>
      </div>
      
      <div class="section">
        <div class="section-title">Client Details</div>
        <div class="row">
          <div class="label">CLIENT NAME</div>
          <div class="value">${farmerName || 'N/A'}</div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Report Data</div>
        ${rows}
      </div>
    </body>
    </html>
  `;
};
