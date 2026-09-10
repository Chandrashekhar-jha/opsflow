import jsPDF from 'jspdf';

export const generateChallanPDF = (challan: any) => {
  const doc = new jsPDF();
  const customer = typeof challan.customerSnapshot === 'string' 
    ? JSON.parse(challan.customerSnapshot) 
    : (challan.customer || {});

  // Header
  doc.setFontSize(22);
  doc.setTextColor(99, 102, 241); // Primary color
  doc.text('WHOLESALE DISTRIBUTORS ERP', 14, 20);

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text('Official Sales Order Challan / Invoice', 14, 26);
  doc.text(`Generated Date: ${new Date().toLocaleDateString()}`, 14, 32);

  // Line Divider
  doc.setDrawColor(200);
  doc.line(14, 36, 196, 36);

  // Challan Info Box
  doc.setFontSize(12);
  doc.setTextColor(0);
  doc.setFont('helvetica', 'bold');
  doc.text(`Challan No: ${challan.challanNumber}`, 14, 46);
  doc.setFont('helvetica', 'normal');
  doc.text(`Status: ${challan.status}`, 14, 52);
  doc.text(`Created By: ${challan.user?.name || 'Sales Staff'}`, 14, 58);

  // Customer Info Box
  doc.setFont('helvetica', 'bold');
  doc.text('Billed To Customer:', 120, 46);
  doc.setFont('helvetica', 'normal');
  doc.text(`${customer.name || customer.businessName || 'N/A'}`, 120, 52);
  doc.text(`Mobile: ${customer.mobile || 'N/A'}`, 120, 58);
  doc.text(`GST: ${customer.gstNumber || 'N/A'}`, 120, 64);
  doc.text(`Address: ${customer.address || 'N/A'}`, 120, 70);

  // Items Table Header
  let startY = 82;
  doc.setFillColor(240, 242, 245);
  doc.rect(14, startY, 182, 8, 'F');
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Item Description', 18, startY + 6);
  doc.text('Qty', 110, startY + 6);
  doc.text('Unit Price', 135, startY + 6);
  doc.text('Total (INR)', 165, startY + 6);

  // Table Rows
  startY += 14;
  doc.setFont('helvetica', 'normal');

  challan.items.forEach((item: any) => {
    const prod = typeof item.productSnapshot === 'string'
      ? JSON.parse(item.productSnapshot)
      : (item.product || {});

    const itemTotal = item.quantity * item.unitPrice;

    doc.text(prod.name || 'Product', 18, startY);
    doc.text(item.quantity.toString(), 110, startY);
    doc.text(`₹${item.unitPrice.toFixed(2)}`, 135, startY);
    doc.text(`₹${itemTotal.toFixed(2)}`, 165, startY);

    startY += 8;
  });

  // Divider Line
  doc.setDrawColor(200);
  doc.line(14, startY + 4, 196, startY + 4);

  // Total Summary
  startY += 14;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`Total Quantity: ${challan.totalQuantity}`, 120, startY);
  doc.text(`Grand Total: ₹${challan.totalAmount.toFixed(2)}`, 120, startY + 8);

  // Save File
  doc.save(`${challan.challanNumber}_Invoice.pdf`);
};
