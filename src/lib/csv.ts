import type { MonthKey, MonthSalary, Payment } from '@/domain/types';

export interface CsvRowData {
  employeeName: string;
  month: MonthKey;
  salary: MonthSalary;
  payment?: Payment | null;
}

/**
 * Escapes a cell according to RFC 4180:
 * Encloses the field in double quotes and doubles any inner double quotes.
 */
function escapeCell(val: string | number | undefined | null): string {
  if (val === undefined || val === null) {
    return '""';
  }
  const str = String(val);
  const escaped = str.replace(/"/g, '""');
  return `"${escaped}"`;
}

/**
 * Generates CSV content with UTF-8 BOM, compliant with Excel.
 * Amounts are plain integers (no ₹ or commas).
 */
export function generateSummaryCsv(rows: CsvRowData[]): string {
  const headers = [
    'Employee',
    'Month',
    'Full days',
    'Half days',
    'Absent days',
    'Unmarked days',
    'Full rate',
    'Half rate',
    'Amount',
    'Status',
    'Paid on',
  ];

  const headerLine = headers.map(escapeCell).join(',');

  const dataLines = rows.map((row) => {
    const isPaid = !!row.payment;
    const cells = [
      row.employeeName,
      row.month,
      row.salary.full,
      row.salary.half,
      row.salary.absent,
      row.salary.unmarked,
      row.salary.rate.full,
      row.salary.rate.half,
      row.salary.amount,
      isPaid ? 'Paid' : 'Pending',
      row.payment ? row.payment.paidOn : '',
    ];
    return cells.map(escapeCell).join(',');
  });

  // UTF-8 BOM is \uFEFF
  return '\uFEFF' + [headerLine, ...dataLines].join('\r\n');
}

/**
 * Triggers browser download of the CSV string.
 */
export function downloadSummaryCsv(month: MonthKey, rows: CsvRowData[]): void {
  const csvContent = generateSummaryCsv(rows);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `staffbook-summary-${month}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
