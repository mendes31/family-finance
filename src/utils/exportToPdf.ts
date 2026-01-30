import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
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

export async function exportToPdf({ transactions, year }: ExportData) {
  const doc = new jsPDF('landscape', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 10;
  const contentWidth = pageWidth - (margin * 2);
  
  // Carregar logo
  let logoData: string | null = null;
  try {
    const response = await fetch('/family_finance/logo.png');
    if (response.ok) {
      const blob = await response.blob();
      logoData = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    }
  } catch (e) {
    // Logo não disponível, continuar sem ele
  }

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

  let yPos = margin;

  // Logo (se disponível)
  if (logoData) {
    try {
      const logoWidth = 30;
      const logoHeight = 20; // Altura fixa para manter proporção
      doc.addImage(logoData, 'PNG', pageWidth / 2 - logoWidth / 2, yPos, logoWidth, logoHeight);
      yPos += logoHeight + 5;
    } catch (e) {
      // Erro ao adicionar logo, continuar sem ele
    }
  }

  // Título
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(`Relatório Financeiro - ${year}`, pageWidth / 2, yPos, { align: 'center' });
  yPos += 10;

  // Calcular largura das colunas (ajustar para caber na página)
  // Reduzir categoria e total para dar mais espaço aos meses
  const categoryWidth = 40;
  const totalWidth = 40;
  const monthColWidth = (contentWidth - categoryWidth - totalWidth) / 12;
  const colWidths = [categoryWidth, ...Array(12).fill(monthColWidth), totalWidth];

  // DESPESAS
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('DESPESAS', margin, yPos);
  yPos += 8;

  const expenseCategories = Array.from(allExpenseCategories).sort();
  const expenseRows: any[] = [];

  expenseCategories.forEach(category => {
    const row: any[] = [category];
    let total = 0;
    
    allMonths.forEach(key => {
      const value = expensesByMonth[key]?.[category] || 0;
      row.push(value > 0 ? formatCurrency(value) : '');
      total += value;
    });
    
    row.push(formatCurrency(total));
    expenseRows.push(row);
  });

  // Total de Despesas
  const expenseTotalRow: any[] = ['TOTAL DESPESAS'];
  let expenseGrandTotal = 0;
  allMonths.forEach(key => {
    const monthTotal = Object.values(expensesByMonth[key] || {}).reduce((sum, val) => sum + val, 0);
    expenseTotalRow.push(monthTotal > 0 ? formatCurrency(monthTotal) : '');
    expenseGrandTotal += monthTotal;
  });
  expenseTotalRow.push(formatCurrency(expenseGrandTotal));
  expenseRows.push(expenseTotalRow);

  const expenseHeaders = ['Categoria', ...months, 'Total'];

  autoTable(doc, {
    head: [expenseHeaders],
    body: expenseRows,
    startY: yPos,
    margin: { left: margin, right: margin },
    styles: { 
      fontSize: 6, 
      cellPadding: 1,
      overflow: 'hidden',
      cellWidth: 'auto',
      minCellHeight: 4,
    },
    headStyles: { 
      fillColor: [68, 114, 196], 
      textColor: 255, 
      fontStyle: 'bold', 
      halign: 'left',
      fontSize: 6.5,
    },
    bodyStyles: { 
      halign: 'left',
      valign: 'middle',
      overflow: 'hidden',
    },
    columnStyles: {
      0: { halign: 'left', cellWidth: categoryWidth },
      ...Object.fromEntries(
        Array.from({ length: 12 }, (_, i) => [i + 1, { 
          halign: 'left', 
          cellWidth: monthColWidth,
          overflow: 'hidden',
        }])
      ),
      [expenseHeaders.length - 1]: { halign: 'left', cellWidth: totalWidth, overflow: 'hidden' },
    },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    didParseCell: (data) => {
      if (data.row.index === expenseRows.length - 1) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = [231, 230, 230];
      }
      // Evitar quebra de texto - usar overflow hidden
      if (data.column.index > 0) {
        data.cell.styles.overflow = 'hidden';
        if (typeof data.cell.text === 'string') {
          // Remover espaços e garantir que não quebre
          data.cell.text = data.cell.text.replace(/\s/g, '');
        }
      }
    },
  });

  yPos = (doc as any).lastAutoTable.finalY + 10;

  // RECEITAS
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('RECEITAS', margin, yPos);
  yPos += 8;

  const incomeCategories = Array.from(allIncomeCategories).sort();
  const incomeRows: any[] = [];

  incomeCategories.forEach(category => {
    const row: any[] = [category];
    let total = 0;
    
    allMonths.forEach(key => {
      const value = incomeByMonth[key]?.[category] || 0;
      row.push(value > 0 ? formatCurrency(value) : '');
      total += value;
    });
    
    row.push(formatCurrency(total));
    incomeRows.push(row);
  });

  // Total de Receitas
  const incomeTotalRow: any[] = ['TOTAL RECEITAS'];
  let incomeGrandTotal = 0;
  allMonths.forEach(key => {
    const monthTotal = Object.values(incomeByMonth[key] || {}).reduce((sum, val) => sum + val, 0);
    incomeTotalRow.push(monthTotal > 0 ? formatCurrency(monthTotal) : '');
    incomeGrandTotal += monthTotal;
  });
  incomeTotalRow.push(formatCurrency(incomeGrandTotal));
  incomeRows.push(incomeTotalRow);

  autoTable(doc, {
    head: [expenseHeaders],
    body: incomeRows,
    startY: yPos,
    margin: { left: margin, right: margin },
    styles: { 
      fontSize: 6, 
      cellPadding: 1,
      overflow: 'hidden',
      cellWidth: 'auto',
      minCellHeight: 4,
    },
    headStyles: { 
      fillColor: [68, 114, 196], 
      textColor: 255, 
      fontStyle: 'bold', 
      halign: 'left',
      fontSize: 6.5,
    },
    bodyStyles: { 
      halign: 'left',
      valign: 'middle',
      overflow: 'hidden',
    },
    columnStyles: {
      0: { halign: 'left', cellWidth: categoryWidth },
      ...Object.fromEntries(
        Array.from({ length: 12 }, (_, i) => [i + 1, { 
          halign: 'left', 
          cellWidth: monthColWidth,
          overflow: 'hidden',
        }])
      ),
      [expenseHeaders.length - 1]: { halign: 'left', cellWidth: totalWidth, overflow: 'hidden' },
    },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    didParseCell: (data) => {
      if (data.row.index === incomeRows.length - 1) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = [231, 230, 230];
      }
      // Evitar quebra de texto - usar overflow hidden
      if (data.column.index > 0) {
        data.cell.styles.overflow = 'hidden';
        if (typeof data.cell.text === 'string') {
          data.cell.text = data.cell.text.replace(/\s/g, '');
        }
      }
    },
  });

  yPos = (doc as any).lastAutoTable.finalY + 10;

  // INVESTIMENTOS (se houver)
  if (allInvestmentCategories.size > 0) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('INVESTIMENTOS', margin, yPos);
    yPos += 8;

    const investmentCategories = Array.from(allInvestmentCategories).sort();
    const investmentRows: any[] = [];

    investmentCategories.forEach(category => {
      const row: any[] = [category];
      let total = 0;
      
      allMonths.forEach(key => {
        const value = investmentByMonth[key]?.[category] || 0;
        row.push(value > 0 ? formatCurrency(value) : '');
        total += value;
      });
      
      row.push(formatCurrency(total));
      investmentRows.push(row);
    });

    // Total de Investimentos
    const investmentTotalRow: any[] = ['TOTAL INVESTIMENTOS'];
    let investmentGrandTotal = 0;
    allMonths.forEach(key => {
      const monthTotal = Object.values(investmentByMonth[key] || {}).reduce((sum, val) => sum + val, 0);
      investmentTotalRow.push(monthTotal > 0 ? formatCurrency(monthTotal) : '');
      investmentGrandTotal += monthTotal;
    });
    investmentTotalRow.push(formatCurrency(investmentGrandTotal));
    investmentRows.push(investmentTotalRow);

    autoTable(doc, {
      head: [expenseHeaders],
      body: investmentRows,
      startY: yPos,
      margin: { left: margin, right: margin },
      styles: { 
        fontSize: 6, 
        cellPadding: 1,
        overflow: 'hidden',
        cellWidth: 'auto',
        minCellHeight: 4,
      },
      headStyles: { 
        fillColor: [68, 114, 196], 
        textColor: 255, 
        fontStyle: 'bold', 
        halign: 'left',
        fontSize: 6.5,
      },
      bodyStyles: { 
        halign: 'left',
        valign: 'middle',
        overflow: 'hidden',
      },
      columnStyles: {
        0: { halign: 'left', cellWidth: categoryWidth },
        ...Object.fromEntries(
          Array.from({ length: 12 }, (_, i) => [i + 1, { 
            halign: 'left', 
            cellWidth: monthColWidth,
            overflow: 'hidden',
          }])
        ),
        [expenseHeaders.length - 1]: { halign: 'left', cellWidth: totalWidth, overflow: 'hidden' },
      },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      didParseCell: (data) => {
        if (data.row.index === investmentRows.length - 1) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [231, 230, 230];
        }
        // Evitar quebra de texto - usar overflow hidden
        if (data.column.index > 0) {
          data.cell.styles.overflow = 'hidden';
          if (typeof data.cell.text === 'string') {
            data.cell.text = data.cell.text.replace(/\s/g, '');
          }
        }
      },
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;
  }

  // SALDO MENSAL
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('SALDO MENSAL', margin, yPos);
  yPos += 8;

  const balanceRow: any[] = ['Saldo'];
  allMonths.forEach(key => {
    const expenseTotal = Object.values(expensesByMonth[key] || {}).reduce((sum, val) => sum + val, 0);
    const incomeTotal = Object.values(incomeByMonth[key] || {}).reduce((sum, val) => sum + val, 0);
    const investmentTotal = Object.values(investmentByMonth[key] || {}).reduce((sum, val) => sum + val, 0);
    const balance = incomeTotal - expenseTotal - investmentTotal;
    balanceRow.push(balance !== 0 ? formatCurrency(balance) : '');
  });
  const investmentGrandTotal = allInvestmentCategories.size > 0 
    ? Object.values(investmentByMonth).reduce((sum, month) => sum + Object.values(month).reduce((s, v) => s + v, 0), 0)
    : 0;
  balanceRow.push(formatCurrency(incomeGrandTotal - expenseGrandTotal - investmentGrandTotal));

  autoTable(doc, {
    head: [expenseHeaders],
    body: [balanceRow],
    startY: yPos,
    margin: { left: margin, right: margin },
    styles: { 
      fontSize: 6, 
      cellPadding: 1, 
      fontStyle: 'bold',
      overflow: 'hidden',
      cellWidth: 'auto',
      minCellHeight: 4,
    },
    headStyles: { 
      fillColor: [68, 114, 196], 
      textColor: 255, 
      fontStyle: 'bold', 
      halign: 'left',
      fontSize: 6.5,
    },
    bodyStyles: { 
      halign: 'left', 
      valign: 'middle',
      fillColor: [231, 230, 230],
      overflow: 'hidden',
    },
    columnStyles: {
      0: { halign: 'left', cellWidth: categoryWidth },
      ...Object.fromEntries(
        Array.from({ length: 12 }, (_, i) => [i + 1, { 
          halign: 'left', 
          cellWidth: monthColWidth,
          overflow: 'hidden',
        }])
      ),
      [expenseHeaders.length - 1]: { halign: 'left', cellWidth: totalWidth, overflow: 'hidden' },
    },
    didParseCell: (data) => {
      // Evitar quebra de texto - usar overflow hidden
      if (data.column.index > 0) {
        data.cell.styles.overflow = 'hidden';
        if (typeof data.cell.text === 'string') {
          data.cell.text = data.cell.text.replace(/\s/g, '');
        }
      }
    },
  });

  // Salvar PDF
  const fileName = `Financeiro_${year}.pdf`;
  doc.save(fileName);
}

