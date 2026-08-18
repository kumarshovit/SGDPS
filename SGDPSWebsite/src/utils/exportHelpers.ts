import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency, formatDateTime } from './formatters';

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
  fileName: string
) => {
  const doc = new jsPDF();
  
  // Header with maroon brand color
  doc.setFillColor(124, 31, 46); // #7C1F2E
  doc.rect(0, 0, 210, 24, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text('SGDPS - Society & Puja Financial Ledger', 14, 15);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Audit Date: ${new Date().toLocaleString('en-IN')}`, 14, 21);

  // Subtitle
  doc.setFontSize(13);
  doc.setTextColor(43, 26, 20); // #2B1A14
  doc.text(title, 14, 34);

  // Table
  autoTable(doc, {
    startY: 38,
    head: [headers],
    body: rows,
    theme: 'grid',
    headStyles: {
      fillColor: [124, 31, 46],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    alternateRowStyles: {
      fillColor: [251, 244, 232], // #FBF4E8
    },
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
    'Vouchers Logged': c.count,
    'Total Amount (Rs)': c.total,
    'Budget Share (%)': `${c.percentage}%`,
  }));
  exportToExcel(data, 'SGDPS_Category_Expenses_Summary');
};

export const exportDefaultersToExcel = (defaulters: any[]) => {
  const data = defaulters.map((d) => ({
    Block: d.block,
    Floor: d.floor,
    'Flat No': d.flatNumber,
    Resident: d.ownerName,
    Phone: d.ownerPhone || '',
    Status: 'Unpaid',
  }));
  exportToExcel(data, 'SGDPS_Unpaid_Flats');
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
    ['Total Collections (Inflows)', formatCurrency(totalCollections)],
    ['Total Expenses (Outflows)', formatCurrency(totalExpenses)],
    ['Net Available Treasury Balance', formatCurrency(balance)],
    ['Total Collection Entries Logged', collections.length.toString()],
    ['Total Expense Vouchers Logged', expenses.length.toString()],
  ];

  exportToPdf('Comprehensive Financial Balance Statement', ['Audit Item', 'Amount / Value'], rows, 'SGDPS_Financial_Audit_Statement');
};
