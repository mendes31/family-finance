import ExcelJS from 'exceljs';
import { Transaction } from '@/hooks/useTransactions';

interface ExportData {
  transactions: Transaction[];
  year: number;
}

const months = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export async function exportToExcel({ transactions, year }: ExportData) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(`Financeiro ${year}`);

  // Organizar transações por tipo e mês
  const expensesByMonth: Record<number, Record<string, number>> = {};
  const incomeByMonth: Record<number, Record<string, number>> = {};
  const investmentByMonth: Record<number, Record<string, number>> = {};

  // Inicializar todos os 12 meses do ano
  const allMonths: number[] = [];
  for (let month = 0; month < 12; month++) {
    const key = year * 12 + month;
    allMonths.push(key);
    expensesByMonth[key] = {};
    incomeByMonth[key] = {};
    investmentByMonth[key] = {};
  }

  // Processar transações
  transactions.forEach((transaction: any) => {
    const date = new Date(transaction.date);
    const monthKey = date.getMonth();
    const yearKey = date.getFullYear();
    
    if (yearKey !== year) return;
    
    const key = yearKey * 12 + monthKey;
    
    let categoryName = 'Sem categoria';
    if (transaction.categories?.name) {
      categoryName = transaction.categories.name;
    } else if (transaction.category_name) {
      categoryName = transaction.category_name;
    } else if (!transaction.category_id) {
      categoryName = transaction.description || 'Sem categoria';
    }
    
    const amount = Number(transaction.amount);

    if (transaction.type === 'expense') {
      if (!expensesByMonth[key]) expensesByMonth[key] = {};
      expensesByMonth[key][categoryName] = (expensesByMonth[key][categoryName] || 0) + amount;
    } else if (transaction.type === 'income') {
      if (!incomeByMonth[key]) incomeByMonth[key] = {};
      incomeByMonth[key][categoryName] = (incomeByMonth[key][categoryName] || 0) + amount;
    } else if (transaction.type === 'investment') {
      if (!investmentByMonth[key]) investmentByMonth[key] = {};
      investmentByMonth[key][categoryName] = (investmentByMonth[key][categoryName] || 0) + amount;
    }
  });

  // Coletar categorias
  const allExpenseCategories = new Set<string>();
  const allIncomeCategories = new Set<string>();
  const allInvestmentCategories = new Set<string>();

  Object.values(expensesByMonth).forEach(month => {
    Object.keys(month).forEach(cat => allExpenseCategories.add(cat));
  });
  Object.values(incomeByMonth).forEach(month => {
    Object.keys(month).forEach(cat => allIncomeCategories.add(cat));
  });
  Object.values(investmentByMonth).forEach(month => {
    Object.keys(month).forEach(cat => allInvestmentCategories.add(cat));
  });

  let currentRow = 1;

  // Estilos
  const headerStyle = {
    font: { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } },
    alignment: { horizontal: 'left', vertical: 'middle', indent: 1 },
    border: {
      top: { style: 'thin' },
      bottom: { style: 'thin' },
      left: { style: 'thin' },
      right: { style: 'thin' },
    },
  };

  const sectionHeaderStyle = {
    font: { bold: true, size: 12 },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } },
    alignment: { horizontal: 'left', vertical: 'middle', indent: 1 },
    border: {
      top: { style: 'thin' },
      bottom: { style: 'thin' },
      left: { style: 'thin' },
      right: { style: 'thin' },
    },
  };

  const totalRowStyle = {
    font: { bold: true },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE7E6E6' } },
    alignment: { horizontal: 'left', vertical: 'middle', indent: 1 },
    border: {
      top: { style: 'medium' },
      bottom: { style: 'medium' },
      left: { style: 'thin' },
      right: { style: 'thin' },
    },
    numFmt: '#,##0.00',
  };

  const cellStyle = {
    alignment: { horizontal: 'left', vertical: 'middle', indent: 1 },
    border: {
      top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
      bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } },
      left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
      right: { style: 'thin', color: { argb: 'FFCCCCCC' } },
    },
    numFmt: '#,##0.00',
  };

  const categoryCellStyle = {
    ...cellStyle,
    alignment: { horizontal: 'left', vertical: 'middle', indent: 1 },
  };

  // Cabeçalho
  const headerRow = worksheet.getRow(currentRow);
  headerRow.getCell(1).value = 'Categoria';
  headerRow.getCell(1).style = headerStyle;
  allMonths.forEach((key, index) => {
    const month = key % 12;
    const cell = headerRow.getCell(index + 2);
    cell.value = months[month];
    cell.style = headerStyle;
  });
  const totalHeaderCell = headerRow.getCell(allMonths.length + 2);
  totalHeaderCell.value = 'Total';
  totalHeaderCell.style = headerStyle;
  headerRow.height = 20;
  currentRow++;

  // DESPESAS
  currentRow++;
  const expenseSectionRow = worksheet.getRow(currentRow);
  const expenseSectionCell = expenseSectionRow.getCell(1);
  expenseSectionCell.value = 'DESPESAS';
  expenseSectionCell.style = sectionHeaderStyle;
  worksheet.mergeCells(currentRow, 1, currentRow, allMonths.length + 2);
  currentRow++;

  // Cabeçalho novamente para despesas
  const expenseHeaderRow = worksheet.getRow(currentRow);
  expenseHeaderRow.getCell(1).value = 'Categoria';
  expenseHeaderRow.getCell(1).style = headerStyle;
  allMonths.forEach((key, index) => {
    const month = key % 12;
    const cell = expenseHeaderRow.getCell(index + 2);
    cell.value = months[month];
    cell.style = headerStyle;
  });
  expenseHeaderRow.getCell(allMonths.length + 2).value = 'Total';
  expenseHeaderRow.getCell(allMonths.length + 2).style = headerStyle;
  expenseHeaderRow.height = 20;
  currentRow++;

  const expenseCategories = Array.from(allExpenseCategories).sort();
  expenseCategories.forEach(category => {
    const row = worksheet.getRow(currentRow);
    row.getCell(1).value = category;
    row.getCell(1).style = categoryCellStyle;
    
    let total = 0;
    allMonths.forEach((key, index) => {
      const value = expensesByMonth[key]?.[category] || 0;
      const cell = row.getCell(index + 2);
      if (value > 0) {
        cell.value = value;
        cell.style = cellStyle;
      } else {
        cell.value = '';
        cell.style = cellStyle;
      }
      total += value;
    });
    
    const totalCell = row.getCell(allMonths.length + 2);
    totalCell.value = total;
    totalCell.style = cellStyle;
    currentRow++;
  });

  // Total de Despesas
  const expenseTotalRow = worksheet.getRow(currentRow);
  expenseTotalRow.getCell(1).value = 'TOTAL DESPESAS';
  expenseTotalRow.getCell(1).style = totalRowStyle;
  let expenseGrandTotal = 0;
  allMonths.forEach((key, index) => {
    const monthTotal = Object.values(expensesByMonth[key] || {}).reduce((sum, val) => sum + val, 0);
    const cell = expenseTotalRow.getCell(index + 2);
    if (monthTotal > 0) {
      cell.value = monthTotal;
      cell.style = totalRowStyle;
    } else {
      cell.value = '';
      cell.style = totalRowStyle;
    }
    expenseGrandTotal += monthTotal;
  });
  expenseTotalRow.getCell(allMonths.length + 2).value = expenseGrandTotal;
  expenseTotalRow.getCell(allMonths.length + 2).style = totalRowStyle;
  currentRow++;

  // RECEITAS
  currentRow++;
  const incomeSectionRow = worksheet.getRow(currentRow);
  const incomeSectionCell = incomeSectionRow.getCell(1);
  incomeSectionCell.value = 'RECEITAS';
  incomeSectionCell.style = sectionHeaderStyle;
  worksheet.mergeCells(currentRow, 1, currentRow, allMonths.length + 2);
  currentRow++;

  // Cabeçalho para receitas
  const incomeHeaderRow = worksheet.getRow(currentRow);
  incomeHeaderRow.getCell(1).value = 'Categoria';
  incomeHeaderRow.getCell(1).style = headerStyle;
  allMonths.forEach((key, index) => {
    const month = key % 12;
    const cell = incomeHeaderRow.getCell(index + 2);
    cell.value = months[month];
    cell.style = headerStyle;
  });
  incomeHeaderRow.getCell(allMonths.length + 2).value = 'Total';
  incomeHeaderRow.getCell(allMonths.length + 2).style = headerStyle;
  incomeHeaderRow.height = 20;
  currentRow++;

  const incomeCategories = Array.from(allIncomeCategories).sort();
  incomeCategories.forEach(category => {
    const row = worksheet.getRow(currentRow);
    row.getCell(1).value = category;
    row.getCell(1).style = categoryCellStyle;
    
    let total = 0;
    allMonths.forEach((key, index) => {
      const value = incomeByMonth[key]?.[category] || 0;
      const cell = row.getCell(index + 2);
      if (value > 0) {
        cell.value = value;
        cell.style = cellStyle;
      } else {
        cell.value = '';
        cell.style = cellStyle;
      }
      total += value;
    });
    
    const totalCell = row.getCell(allMonths.length + 2);
    totalCell.value = total;
    totalCell.style = cellStyle;
    currentRow++;
  });

  // Total de Receitas
  const incomeTotalRow = worksheet.getRow(currentRow);
  incomeTotalRow.getCell(1).value = 'TOTAL RECEITAS';
  incomeTotalRow.getCell(1).style = totalRowStyle;
  let incomeGrandTotal = 0;
  allMonths.forEach((key, index) => {
    const monthTotal = Object.values(incomeByMonth[key] || {}).reduce((sum, val) => sum + val, 0);
    const cell = incomeTotalRow.getCell(index + 2);
    if (monthTotal > 0) {
      cell.value = monthTotal;
      cell.style = totalRowStyle;
    } else {
      cell.value = '';
      cell.style = totalRowStyle;
    }
    incomeGrandTotal += monthTotal;
  });
  incomeTotalRow.getCell(allMonths.length + 2).value = incomeGrandTotal;
  incomeTotalRow.getCell(allMonths.length + 2).style = totalRowStyle;
  currentRow++;

  // INVESTIMENTOS
  if (allInvestmentCategories.size > 0) {
    currentRow++;
    const investmentSectionRow = worksheet.getRow(currentRow);
    const investmentSectionCell = investmentSectionRow.getCell(1);
    investmentSectionCell.value = 'INVESTIMENTOS';
    investmentSectionCell.style = sectionHeaderStyle;
    worksheet.mergeCells(currentRow, 1, currentRow, allMonths.length + 2);
    currentRow++;

    const investmentHeaderRow = worksheet.getRow(currentRow);
    investmentHeaderRow.getCell(1).value = 'Categoria';
    investmentHeaderRow.getCell(1).style = headerStyle;
    allMonths.forEach((key, index) => {
      const month = key % 12;
      const cell = investmentHeaderRow.getCell(index + 2);
      cell.value = months[month];
      cell.style = headerStyle;
    });
    investmentHeaderRow.getCell(allMonths.length + 2).value = 'Total';
    investmentHeaderRow.getCell(allMonths.length + 2).style = headerStyle;
    investmentHeaderRow.height = 20;
    currentRow++;

    const investmentCategories = Array.from(allInvestmentCategories).sort();
    investmentCategories.forEach(category => {
      const row = worksheet.getRow(currentRow);
      row.getCell(1).value = category;
      row.getCell(1).style = categoryCellStyle;
      
      let total = 0;
      allMonths.forEach((key, index) => {
        const value = investmentByMonth[key]?.[category] || 0;
        const cell = row.getCell(index + 2);
        if (value > 0) {
          cell.value = value;
          cell.style = { ...cellStyle, alignment: { horizontal: 'right', vertical: 'middle' } };
        } else {
          cell.value = '';
          cell.style = cellStyle;
        }
        total += value;
      });
      
      const totalCell = row.getCell(allMonths.length + 2);
      totalCell.value = total;
      totalCell.style = { ...cellStyle, alignment: { horizontal: 'right', vertical: 'middle' } };
      currentRow++;
    });

    // Total de Investimentos
    const investmentTotalRow = worksheet.getRow(currentRow);
    investmentTotalRow.getCell(1).value = 'TOTAL INVESTIMENTOS';
    investmentTotalRow.getCell(1).style = totalRowStyle;
    let investmentGrandTotal = 0;
    allMonths.forEach((key, index) => {
      const monthTotal = Object.values(investmentByMonth[key] || {}).reduce((sum, val) => sum + val, 0);
      const cell = investmentTotalRow.getCell(index + 2);
      if (monthTotal > 0) {
        cell.value = monthTotal;
        cell.style = totalRowStyle;
      } else {
        cell.value = '';
        cell.style = totalRowStyle;
      }
      investmentGrandTotal += monthTotal;
    });
    investmentTotalRow.getCell(allMonths.length + 2).value = investmentGrandTotal;
    investmentTotalRow.getCell(allMonths.length + 2).style = totalRowStyle;
    currentRow++;
  }

  // SALDO MENSAL
  currentRow++;
  const balanceSectionRow = worksheet.getRow(currentRow);
  const balanceSectionCell = balanceSectionRow.getCell(1);
  balanceSectionCell.value = 'SALDO MENSAL';
  balanceSectionCell.style = sectionHeaderStyle;
  worksheet.mergeCells(currentRow, 1, currentRow, allMonths.length + 2);
  currentRow++;

  const balanceRow = worksheet.getRow(currentRow);
  balanceRow.getCell(1).value = 'Saldo';
  balanceRow.getCell(1).style = totalRowStyle;
  
  allMonths.forEach((key, index) => {
    const expenseTotal = Object.values(expensesByMonth[key] || {}).reduce((sum, val) => sum + val, 0);
    const incomeTotal = Object.values(incomeByMonth[key] || {}).reduce((sum, val) => sum + val, 0);
    const investmentTotal = Object.values(investmentByMonth[key] || {}).reduce((sum, val) => sum + val, 0);
    const balance = incomeTotal - expenseTotal - investmentTotal;
    const cell = balanceRow.getCell(index + 2);
    if (balance !== 0) {
      cell.value = balance;
      cell.style = totalRowStyle;
    } else {
      cell.value = '';
      cell.style = totalRowStyle;
    }
  });
  
  const investmentGrandTotal = allInvestmentCategories.size > 0 
    ? Object.values(investmentByMonth).reduce((sum, month) => sum + Object.values(month).reduce((s, v) => s + v, 0), 0)
    : 0;
  balanceRow.getCell(allMonths.length + 2).value = incomeGrandTotal - expenseGrandTotal - investmentGrandTotal;
  balanceRow.getCell(allMonths.length + 2).style = totalRowStyle;

  // Ajustar largura das colunas
  worksheet.getColumn(1).width = 30;
  for (let i = 2; i <= allMonths.length + 2; i++) {
    worksheet.getColumn(i).width = 15;
  }

  // Congelar primeira linha e primeira coluna
  worksheet.views = [{ state: 'frozen', xSplit: 1, ySplit: 1 }];

  // Gerar buffer e download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Financeiro_${year}.xlsx`;
  link.click();
  window.URL.revokeObjectURL(url);
}
