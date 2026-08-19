import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency, formatPdfCurrency, formatDateTime } from './formatters';

export const exportToExcel = (data: any[], fileName: string, sheetName: string = 'Sheet1') => {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `${fileName}_${new Date().toISOString().slice(0, 10)}.xlsx`);
};

export const exportToPdf = (
  title: string,
  headers: string[],
  rows: (string | number)[][],
  fileName: string,
  subtitle?: string,
  footRows?: any[][]
) => {
  const doc = new jsPDF();
  
  // Header with maroon brand color
  doc.setFillColor(124, 31, 46); // #7C1F2E
  doc.rect(0, 0, 210, 24, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(255, 255, 255);
  doc.text('SGDPS - Society & Puja Financial Ledger', 14, 14);
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Audit Date: ${new Date().toLocaleString('en-IN')}`, 14, 20);

  // Title & Subtitle
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(43, 26, 20); // #2B1A14
  doc.text(title, 14, 33);

  let startTableY = 37;
  if (subtitle) {
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(124, 31, 46); // #7C1F2E
    doc.text(subtitle, 14, 39);
    startTableY = 43;
  }

  // Find column index for Amount if any
  const amountColIndex = headers.findIndex((h) =>
    h.toLowerCase().includes('amount') || h.toLowerCase().includes('rs') || h.toLowerCase().includes('inflow') || h.toLowerCase().includes('balance')
  );

  const columnStyles: Record<number, any> = {};
  if (amountColIndex !== -1) {
    columnStyles[amountColIndex] = { halign: 'right' };
  }

  // Table
  autoTable(doc, {
    startY: startTableY,
    head: [headers],
    body: rows,
    foot: footRows && footRows.length > 0 ? footRows : undefined,
    theme: 'grid',
    margin: { left: 14, right: 14 },
    headStyles: {
      fillColor: [124, 31, 46],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
      halign: 'left',
    },
    footStyles: {
      fillColor: [245, 235, 220],
      textColor: [124, 31, 46],
      fontStyle: 'bold',
      fontSize: 9,
    },
    styles: {
      fontSize: 8,
      cellPadding: 2.5,
      overflow: 'linebreak',
      textColor: [43, 26, 20],
    },
    alternateRowStyles: {
      fillColor: [253, 248, 240], // #FDF8F0
    },
    columnStyles,
  });

  doc.save(`${fileName}_${new Date().toISOString().slice(0, 10)}.pdf`);
};

export const exportFlatsToExcel = (flats: any[]) => {
  const data = flats.map((f) => ({
    Block: f.block,
    Floor: f.floor,
    'Flat No': f.flatNumber,
    'Resident / Owner': f.ownerName,
    Phone: f.ownerPhone || '',
    'Collected (Rs)': f.totalCollected || 0,
    Status: f.paymentStatus === 'Paid' || (f.totalCollected || 0) > 0 ? 'Paid' : 'Unpaid',
  }));
  exportToExcel(data, 'SGDPS_Flats_Master');
};

export const exportExpensesToExcel = (expenses: any[]) => {
  const data = expenses.map((e) => ({
    Date: formatDateTime(e.expenseDate),
    Category: e.category,
    Description: e.description,
    'Amount (Rs)': e.amount,
    'Payment Mode': e.paymentMode,
    Vendor: e.paidToVendor || '',
    Remarks: e.remarks || '',
  }));
  exportToExcel(data, 'SGDPS_Expenses_Ledger');
};

export const exportCategoryExpensesToExcel = (categories: { category: string; count: number; total: number; percentage: number }[]) => {
  const data = categories.map((c) => ({
    'Expense Category': c.category,
    'Total Amount (Rs)': c.total,
    'Expense Share (%)': `${c.percentage}%`,
  }));
  exportToExcel(data, 'SGDPS_Category_Expenses_Summary');
};

export const exportDefaultersToExcel = (flats: any[]) => {
  const data = flats.map((d) => ({
    Block: d.block,
    Floor: d.floor,
    'Flat No': d.flatNumber,
    'Resident / Owner': d.ownerName,
    Phone: d.ownerPhone || '',
    'Collected (Rs)': d.totalCollected || 0,
    Status: d.paymentStatus === 'Paid' || (d.totalCollected || 0) > 0 ? 'Paid' : 'Unpaid',
  }));
  exportToExcel(data, 'SGDPS_Flats_Paid_Unpaid_Report');
};

export const exportDateWiseReportToExcel = (dailyReports: any[]) => {
  const data = dailyReports.map((d) => ({
    Date: d.date,
    'Collections Count': d.collectionsCount,
    'Total Inflow (Rs)': d.collectionsAmount,
    'Expenses Outflow (Rs)': d.expensesAmount,
    'Net Change (Rs)': d.netChange,
  }));
  exportToExcel(data, 'SGDPS_Daily_Cashflow_Report');
};

export const exportFinancialStatementPDF = (collections: any[], expenses: any[]) => {
  const totalCollections = collections.reduce((s, c) => s + (c.amount || 0), 0);
  const totalExpenses = expenses.reduce((s, e) => s + (e.amount || 0), 0);
  const balance = totalCollections - totalExpenses;

  const rows = [
    ['Total Collections (Inflows)', formatPdfCurrency(totalCollections)],
    ['Total Expenses (Outflows)', formatPdfCurrency(totalExpenses)],
    ['Net Available Treasury Balance', formatPdfCurrency(balance)],
    ['Total Collection Entries Logged', `${collections.length} entries`],
    ['Total Expenses Logged', `${expenses.length} records`],
  ];

  exportToPdf('Total Collection vs. Total Expenses Statement', ['Audit Item', 'Amount / Value'], rows, 'SGDPS_Financial_Audit_Statement');
};
