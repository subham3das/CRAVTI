import { jsPDF } from 'jspdf';

/**
 * Receipt Template Registry for Craviti
 * Future-proof architecture supporting Thermal 80mm, A4 Invoice, Tax Invoice, etc.
 */
export const RECEIPT_TEMPLATES = {
  THERMAL_80MM: 'thermal_80mm',
  A4_INVOICE: 'a4_invoice',
  TAX_INVOICE: 'tax_invoice',
  GST_INVOICE: 'gst_invoice',
  CAFE_STYLE: 'cafe_style',
};

/**
 * Defensive number formatting for thermal receipt currency (clean monochrome)
 */
export const formatReceiptCurrency = (amount) => {
  const num = Number(amount || 0);
  return `Rs. ${num.toFixed(2)}`;
};

/**
 * Clean string for safe file names
 */
export const sanitizeFilenamePart = (str, allowHyphen = false) => {
  if (!str) return '';
  const regex = allowHyphen ? /[^a-zA-Z0-9-]/g : /[^a-zA-Z0-9]/g;
  return String(str).trim().replace(regex, '');
};

/**
 * Format date in DD/MM/YYYY
 */
const formatDateSafe = (dateVal) => {
  if (!dateVal) return '--/--/----';
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return '--/--/----';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

/**
 * Format time in HH:MM AM/PM
 */
const formatTimeSafe = (dateVal) => {
  if (!dateVal) return '--:--';
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return '--:--';
  return d.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

/**
 * -------------------------------------------------------------
 * 1. THERMAL 80MM RECEIPT RENDERER (Default Production Standard)
 * -------------------------------------------------------------
 * Clean monochrome 80mm continuous roll receipt.
 * Compatible with standard thermal receipt printers & A4 centered print.
 */
const renderThermal80mm = (receipt) => {
  const items = Array.isArray(receipt?.itemsSnapshot) ? receipt.itemsSnapshot : [];
  const restSnap = receipt?.restaurantSnapshot || {};
  const tableSnap = receipt?.tableSnapshot || {};
  const guestSnap = receipt?.guestSnapshot || {};

  // Calculate dynamic roll height based on content length
  const baseHeight = 160;
  const itemHeightEstimate = items.length * 10;
  const totalHeight = Math.max(170, baseHeight + itemHeightEstimate);

  const doc = new jsPDF({
    unit: 'mm',
    format: [80, totalHeight],
  });

  const pageWidth = 80;
  const leftX = 5;
  const rightX = 75;
  const centerX = pageWidth / 2;
  const separator = '------------------------------------------';

  let y = 8;

  // Header: CRAVITI Branding
  doc.setFont('courier', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(0, 0, 0);
  doc.text('CRAVITI', centerX, y, { align: 'center' });
  y += 5.5;

  // Restaurant Name
  const rName = restSnap.restaurantName || 'Restaurant';
  doc.setFontSize(10.5);
  const rNameLines = doc.splitTextToSize(rName, 68);
  rNameLines.forEach((line) => {
    doc.text(line, centerX, y, { align: 'center' });
    y += 4.5;
  });

  // Restaurant Address
  doc.setFont('courier', 'normal');
  doc.setFontSize(7.5);
  const addr = restSnap.address;
  if (addr) {
    let addrStr = '';
    if (typeof addr === 'string') {
      addrStr = addr;
    } else {
      addrStr = [addr.street, addr.city, addr.state, addr.pincode].filter(Boolean).join(', ');
    }
    if (addrStr) {
      const addrLines = doc.splitTextToSize(addrStr, 68);
      addrLines.forEach((l) => {
        doc.text(l, centerX, y, { align: 'center' });
        y += 3.5;
      });
    }
  }

  // Restaurant Phone
  if (restSnap.phone) {
    doc.text(`Phone: ${restSnap.phone}`, centerX, y, { align: 'center' });
    y += 3.5;
  }

  // GSTIN & FSSAI
  if (restSnap.gstNumber) {
    doc.text(`GSTIN: ${restSnap.gstNumber}`, centerX, y, { align: 'center' });
    y += 3.5;
  }
  if (restSnap.fssaiNumber) {
    doc.text(`FSSAI: ${restSnap.fssaiNumber}`, centerX, y, { align: 'center' });
    y += 3.5;
  }

  // Separator
  y += 1;
  doc.text(separator, centerX, y, { align: 'center' });
  y += 4.5;

  // Receipt Meta Section
  const receiptNo = receipt.receiptNumber || receipt.orderNumber || 'CRV-REC-001';
  const completionDate = receipt.completionTime || receipt.paidAt || receipt.createdAt || new Date();

  doc.setFont('courier', 'bold');
  doc.text('Receipt No:', leftX, y);
  doc.setFont('courier', 'normal');
  doc.text(receiptNo, leftX + 24, y);
  y += 4;

  doc.text(`Date: ${formatDateSafe(completionDate)}`, leftX, y);
  y += 3.8;

  doc.text(`Time: ${formatTimeSafe(completionDate)}`, leftX, y);
  y += 3.8;

  const tableNum = tableSnap.tableNumber != null ? tableSnap.tableNumber : '-';
  doc.text(`Table No: Table ${tableNum}`, leftX, y);
  y += 3.8;

  const custId = guestSnap.customerId || guestSnap.guestId;
  if (custId) {
    doc.text(`Customer ID: ${custId}`, leftX, y);
    y += 3.8;
  }

  doc.text(`Order ID: #${receipt.orderNumber || receipt.orderId || '-'}`, leftX, y);
  y += 4.5;

  // Separator
  doc.text(separator, centerX, y, { align: 'center' });
  y += 4.5;

  // Table Column Header
  doc.setFont('courier', 'bold');
  doc.text('Qty', leftX, y);
  doc.text('Item', leftX + 8, y);
  doc.text('Price', rightX, y, { align: 'right' });
  y += 3.5;

  doc.setFont('courier', 'normal');
  doc.text(separator, centerX, y, { align: 'center' });
  y += 4.5;

  // Items List
  items.forEach((item) => {
    const qty = String(item.quantity || 1);
    const name = item.itemName || 'Item';
    const totalItemPrice = (item.sellingPrice || item.originalPrice || 0) * (item.quantity || 1);
    const priceText = formatReceiptCurrency(totalItemPrice);

    doc.setFont('courier', 'bold');
    doc.text(qty, leftX, y);
    doc.setFont('courier', 'normal');

    const lines = doc.splitTextToSize(name, 43);
    doc.text(lines[0], leftX + 8, y);
    doc.text(priceText, rightX, y, { align: 'right' });
    y += 3.8;

    for (let i = 1; i < lines.length; i++) {
      doc.text(lines[i], leftX + 8, y);
      y += 3.8;
    }

    if (item.specialInstructions) {
      doc.setFontSize(6.5);
      doc.text(`  Note: ${item.specialInstructions}`, leftX + 8, y);
      doc.setFontSize(7.5);
      y += 3.5;
    }
  });

  // Separator
  doc.text(separator, centerX, y, { align: 'center' });
  y += 4.5;

  // Totals Section
  const printRow = (label, val, isBold = false) => {
    if (isBold) {
      doc.setFont('courier', 'bold');
    } else {
      doc.setFont('courier', 'normal');
    }
    doc.text(label, leftX, y);
    doc.text(val, rightX, y, { align: 'right' });
    y += 4.2;
  };

  printRow('Subtotal', formatReceiptCurrency(receipt.subtotal));

  if (Number(receipt.discount || 0) > 0) {
    printRow('Discount', `- ${formatReceiptCurrency(receipt.discount)}`);
  }

  if (Number(receipt.gst || 0) > 0) {
    printRow('GST (5%)', formatReceiptCurrency(receipt.gst));
  }

  if (Number(receipt.serviceCharge || 0) > 0) {
    printRow('Service Charge', formatReceiptCurrency(receipt.serviceCharge));
  }

  y += 0.5;
  printRow('Grand Total', formatReceiptCurrency(receipt.grandTotal), true);

  // Separator
  doc.setFont('courier', 'normal');
  doc.text(separator, centerX, y, { align: 'center' });
  y += 4.5;

  // Payment Details
  const method = (receipt.paymentMethod || 'Cash').toUpperCase();
  const status = (receipt.paymentStatus || 'Paid').replace(/_/g, ' ').toUpperCase();
  printRow('Payment Method', method);
  printRow('Payment Status', status);

  // Separator
  doc.text(separator, centerX, y, { align: 'center' });
  y += 5.5;

  // Thank You Section
  doc.setFont('courier', 'bold');
  doc.setFontSize(8.5);
  doc.text('Thank You!', centerX, y, { align: 'center' });
  y += 4;
  doc.text('Visit Again', centerX, y, { align: 'center' });
  y += 4;

  doc.setFont('courier', 'normal');
  doc.setFontSize(7);
  doc.text('Powered by Craviti', centerX, y, { align: 'center' });
  y += 4.5;

  // Optional Footer Note
  if (receipt.receiptFooter) {
    const footerLines = doc.splitTextToSize(receipt.receiptFooter, 68);
    footerLines.forEach((fl) => {
      doc.text(fl, centerX, y, { align: 'center' });
      y += 3.5;
    });
    y += 1;
  }

  // Restaurant Contact & Website
  const contactParts = [restSnap.phone, restSnap.email, restSnap.website].filter(Boolean);
  if (contactParts.length > 0) {
    doc.text(contactParts.join(' | '), centerX, y, { align: 'center' });
    y += 4;
  }

  return doc;
};

/**
 * -------------------------------------------------------------
 * 2. A4 INVOICE TEMPLATE (Future Template Architecture)
 * -------------------------------------------------------------
 */
const renderA4Invoice = (receipt) => {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const items = Array.isArray(receipt?.itemsSnapshot) ? receipt.itemsSnapshot : [];
  const restSnap = receipt?.restaurantSnapshot || {};

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text(restSnap.restaurantName || 'Restaurant Invoice', 14, 20);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Receipt No: ${receipt.receiptNumber || receipt.orderNumber}`, 14, 28);
  doc.text(`Date: ${formatDateSafe(receipt.completionTime || receipt.createdAt)}`, 14, 34);
  doc.text(`Table: ${receipt?.tableSnapshot?.tableNumber || '-'}`, 14, 40);

  let y = 52;
  doc.setFont('helvetica', 'bold');
  doc.text('Item', 14, y);
  doc.text('Qty', 120, y);
  doc.text('Price', 170, y, { align: 'right' });
  y += 6;

  doc.setDrawColor(200, 200, 200);
  doc.line(14, y, 196, y);
  y += 6;

  doc.setFont('helvetica', 'normal');
  items.forEach((item) => {
    doc.text(item.itemName || 'Item', 14, y);
    doc.text(String(item.quantity || 1), 120, y);
    doc.text(formatReceiptCurrency((item.sellingPrice || 0) * (item.quantity || 1)), 170, y, { align: 'right' });
    y += 6;
  });

  doc.line(14, y, 196, y);
  y += 8;
  doc.setFont('helvetica', 'bold');
  doc.text('Grand Total:', 120, y);
  doc.text(formatReceiptCurrency(receipt.grandTotal), 170, y, { align: 'right' });

  return doc;
};

/**
 * -------------------------------------------------------------
 * 3. TAX INVOICE TEMPLATE (Future Template Architecture)
 * -------------------------------------------------------------
 */
const renderTaxInvoice = (receipt) => {
  // Reuses A4 structure with specialized TAX / HSN columns
  return renderA4Invoice(receipt);
};

/**
 * -------------------------------------------------------------
 * 4. GST INVOICE TEMPLATE (Future Template Architecture)
 * -------------------------------------------------------------
 */
const renderGstInvoice = (receipt) => {
  // Reuses A4 structure with CGST/SGST breakdowns
  return renderA4Invoice(receipt);
};

/**
 * -------------------------------------------------------------
 * 5. CAFE STYLE TEMPLATE (Future Template Architecture)
 * -------------------------------------------------------------
 */
const renderCafeStyle = (receipt) => {
  // Specialized condensed thermal template
  return renderThermal80mm(receipt);
};

/**
 * Template Registry
 */
const TEMPLATE_REGISTRY = {
  [RECEIPT_TEMPLATES.THERMAL_80MM]: renderThermal80mm,
  [RECEIPT_TEMPLATES.A4_INVOICE]: renderA4Invoice,
  [RECEIPT_TEMPLATES.TAX_INVOICE]: renderTaxInvoice,
  [RECEIPT_TEMPLATES.GST_INVOICE]: renderGstInvoice,
  [RECEIPT_TEMPLATES.CAFE_STYLE]: renderCafeStyle,
};

/**
 * Main Deterministic Receipt PDF Generator
 * Reusable across Customer Portal & Restaurant Admin Panel
 *
 * @param {Object} receipt - The immutable Receipt Snapshot from MongoDB Receipt collection
 * @param {Object} options - Generator options: { template, autoDownload, filename }
 * @returns {Object} { doc, filename }
 */
export const generateReceiptPdf = (receipt, options = {}) => {
  if (!receipt) {
    throw new Error('Cannot generate receipt: Receipt data is missing');
  }

  const templateKey = options.template || RECEIPT_TEMPLATES.THERMAL_80MM;
  const renderer = TEMPLATE_REGISTRY[templateKey] || TEMPLATE_REGISTRY[RECEIPT_TEMPLATES.THERMAL_80MM];

  const doc = renderer(receipt);

  // Filename formatting strictly following requirements:
  // e.g. SpiceGarden_Order_CRV-2027-000013.pdf
  const restName = sanitizeFilenamePart(receipt?.restaurantSnapshot?.restaurantName, false) || 'Restaurant';
  const orderNum = sanitizeFilenamePart(receipt?.orderNumber || receipt?.receiptNumber, true) || 'Order';
  const defaultFilename = `${restName}_Order_${orderNum}.pdf`;

  const filename = options.filename || defaultFilename;

  if (options.autoDownload !== false) {
    doc.save(filename);
  }

  return { doc, filename };
};
