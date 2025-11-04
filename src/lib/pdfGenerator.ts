import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Helper to fetch an image and convert it to a data URL
const fetchImageAsDataURL = async (url: string, token: string) => {
  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    if (!response.ok) return null;
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error fetching image:', error);
    return null;
  }
};

export const generatePayslipPDF = async (payslipDetails: any, token: string, formatPrice: (price: number) => string) => {
  const doc = new jsPDF();

  // Fetch logo
  const logoUrl = payslipDetails.tenant?.logo_url 
    ? `${import.meta.env.VITE_SUPABASE_FUNCTIONS_URL}/proxy-google-drive-image?fileId=${payslipDetails.tenant.logo_url}`
    : '/glamtica.app.png';
  const logoDataUrl = await fetchImageAsDataURL(logoUrl, token);

  // Add header
  const pageWidth = doc.internal.pageSize.getWidth();
  if (logoDataUrl) {
    const img = new Image();
    img.src = logoDataUrl;
    await new Promise(resolve => img.onload = resolve);
    const imgWidth = 40;
    const imgHeight = img.height * (imgWidth / img.width);
    doc.addImage(logoDataUrl, 'PNG', pageWidth - imgWidth - 14, 10, imgWidth, imgHeight);
  }
  doc.setFontSize(18);
  doc.text(payslipDetails.tenant?.name || '', 14, 15);
  doc.setFontSize(10);
  doc.text(payslipDetails.tenant?.billing_address || '', 14, 20);
  doc.text(`NIT: ${payslipDetails.tenant?.tax_id || ''}` , 14, 25);
  doc.text(`Tel: ${payslipDetails.tenant?.contact_phone || ''}`, 14, 30);

  // Add professional and payslip info
  doc.setFontSize(10);
  doc.text(`Profesional: ${payslipDetails.professional.first_name} ${payslipDetails.professional.last_name}`, 14, 40);
  doc.text(`Email: ${payslipDetails.professional.email}`, 14, 45);
  doc.text(`Fecha de Liquidación: ${new Date(payslipDetails.payslip.payslip_date).toLocaleDateString()}`, 14, 50);

  // Group commissions by day
  const commissionsByDay = (payslipDetails.commissions || []).reduce((acc: any, commission: any) => {
    const date = new Date(commission.attention_date).toLocaleDateString();
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(commission);
    return acc;
  }, {});

  let finalY = 60;

  // Add tables for each day
  for (const date in commissionsByDay) {
    const commissions = commissionsByDay[date];
    const tableColumn = ["Cliente", "Descripción", "Precio Unitario", "Valor Comisión"];
    const tableRows: any[] = [];
    let dailyItemPriceTotal = 0;
    let dailyCommissionTotal = 0;

    commissions.forEach((commission: any) => {
      const commissionData = [
        commission.client_name,
        commission.item_name,
        formatPrice(commission.item_price),
        formatPrice(commission.commission_amount),
      ];
      tableRows.push(commissionData);
      dailyItemPriceTotal += commission.item_price;
      dailyCommissionTotal += commission.commission_amount;
    });

    doc.setFontSize(12);
    doc.text(`Fecha: ${date}`, 14, finalY);
    finalY += 5;

    autoTable(doc, {
      startY: finalY,
      head: [tableColumn],
      body: tableRows,
      tableWidth: 182,
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 40, halign: 'right' },
        3: { cellWidth: 40, halign: 'right' },
      },
      didDrawPage: (data: any) => {
        finalY = data.cursor.y;
      }
    });
    // @ts-ignore
    finalY = doc.lastAutoTable.finalY;

    // Add daily subtotals
    doc.setFontSize(10);
    doc.text(`Subtotal Atenciones: ${formatPrice(dailyItemPriceTotal)}`, 14, finalY + 5);
    doc.text(`Subtotal Comisiones: ${formatPrice(dailyCommissionTotal)}`, 105, finalY + 5);
    finalY += 10;
  }

  // Add grand totals
  doc.setFontSize(12);
  doc.text(`Total Liquidado: ${formatPrice(payslipDetails.payslip.total_amount)}`, 14, finalY + 10);
  finalY += 15;

  // Add signature
  if (payslipDetails.signature?.google_drive_file_id) {
    const signatureUrl = `${import.meta.env.VITE_SUPABASE_FUNCTIONS_URL}/proxy-google-drive-image?fileId=${payslipDetails.signature.google_drive_file_id}`;
    const signatureDataUrl = await fetchImageAsDataURL(signatureUrl, token);
    if (signatureDataUrl) {
      doc.setFontSize(10);
      doc.text('Firma del Profesional:', 14, finalY);
      doc.addImage(signatureDataUrl, 'PNG', 14, finalY + 5, 60, 30);
    }
  } else {
    doc.setFontSize(10);
    doc.text('Estado: Pendiente de Firma', 14, finalY);
  }

  // Save the PDF
  doc.save(`liquidacion-${payslipDetails.payslip.id}.pdf`);
};
