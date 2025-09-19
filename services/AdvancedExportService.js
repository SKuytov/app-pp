import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import html2canvas from 'html2canvas';

export class AdvancedExportService {

  // Export to PDF with advanced formatting
  static async exportToPDF(data, options = {}) {
    const {
      title = 'PartPulse Report',
      orientation = 'portrait',
      includeCharts = true,
      includeData = true,
      format = 'a4'
    } = options;

    const pdf = new jsPDF({
      orientation,
      unit: 'mm',
      format
    });

    let yPosition = 20;

    // Add header
    pdf.setFontSize(20);
    pdf.text(title, 20, yPosition);
    yPosition += 10;

    pdf.setFontSize(12);
    pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, yPosition);
    yPosition += 15;

    // Add KPIs section
    if (data.kpis) {
      pdf.setFontSize(16);
      pdf.text('Key Performance Indicators', 20, yPosition);
      yPosition += 10;

      Object.entries(data.kpis).forEach(([key, value]) => {
        pdf.setFontSize(12);
        pdf.text(`${key}: ${value}`, 25, yPosition);
        yPosition += 7;
      });
      yPosition += 10;
    }

    // Add machine-part relationships
    if (data.machinePartRelations) {
      pdf.setFontSize(16);
      pdf.text('Machine-Part Relationships', 20, yPosition);
      yPosition += 10;

      Object.values(data.machinePartRelations).forEach(machine => {
        pdf.setFontSize(14);
        pdf.text(`${machine.name} (${machine.parts.length} parts)`, 25, yPosition);
        yPosition += 7;

        machine.parts.slice(0, 5).forEach(part => {
          pdf.setFontSize(10);
          pdf.text(`  • ${part.name || part.part_number} - Used ${part.usage} times`, 30, yPosition);
          yPosition += 5;
        });
        yPosition += 5;
      });
    }

    // Capture charts if requested
    if (includeCharts) {
      const chartElements = document.querySelectorAll('[data-export-chart]');
      for (let chart of chartElements) {
        try {
          const canvas = await html2canvas(chart);
          const imgData = canvas.toDataURL('image/png');

          if (yPosition > 250) {
            pdf.addPage();
            yPosition = 20;
          }

          pdf.addImage(imgData, 'PNG', 20, yPosition, 170, 100);
          yPosition += 110;
        } catch (error) {
          console.error('Chart capture failed:', error);
        }
      }
    }

    // Save PDF
    pdf.save(`${title.replace(/\s+/g, '_').toLowerCase()}_${Date.now()}.pdf`);
  }

  // Export to Excel with multiple sheets
  static exportToExcel(data, options = {}) {
    const {
      filename = 'partpulse_export',
      includeCharts = false
    } = options;

    const workbook = XLSX.utils.book_new();

    // KPIs Sheet
    if (data.kpis) {
      const kpiData = Object.entries(data.kpis).map(([key, value]) => ({
        Metric: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
        Value: value
      }));

      const kpiSheet = XLSX.utils.json_to_sheet(kpiData);
      XLSX.utils.book_append_sheet(workbook, kpiSheet, 'KPIs');
    }

    // Machine-Part Relationships Sheet
    if (data.machinePartRelations) {
      const relationData = [];
      Object.values(data.machinePartRelations).forEach(machine => {
        machine.parts.forEach(part => {
          relationData.push({
            'Machine Name': machine.name,
            'Part Name': part.name || 'N/A',
            'Part Number': part.part_number || 'N/A',
            'Usage Count': part.usage,
            'Current Quantity': part.quantity || 0,
            'Minimum Quantity': part.minimum_quantity || 0
          });
        });
      });

      const relationSheet = XLSX.utils.json_to_sheet(relationData);
      XLSX.utils.book_append_sheet(workbook, relationSheet, 'Machine-Part Relations');
    }

    // Part Sharing Analysis Sheet
    if (data.partSharingMatrix) {
      const sharingData = data.partSharingMatrix.map(part => ({
        'Part Name': part.partName,
        'Part Number': part.partNumber,
        'Machines Count': part.sharedAcross,
        'Total Usage': part.totalUsage,
        'Sharing Score': `${part.sharingScore.toFixed(2)}%`,
        'Machines': part.machines.map(m => m.name).join(', ')
      }));

      const sharingSheet = XLSX.utils.json_to_sheet(sharingData);
      XLSX.utils.book_append_sheet(workbook, sharingSheet, 'Part Sharing Analysis');
    }

    // Save Excel file
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data_blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(data_blob, `${filename}_${Date.now()}.xlsx`);
  }

  // Export charts as images
  static async exportChartsAsImages(selector = '[data-export-chart]') {
    const charts = document.querySelectorAll(selector);
    const images = [];

    for (let i = 0; i < charts.length; i++) {
      try {
        const canvas = await html2canvas(charts[i]);
        const blob = await new Promise(resolve => canvas.toBlob(resolve));
        images.push({
          name: `chart_${i + 1}.png`,
          blob
        });
      } catch (error) {
        console.error(`Failed to export chart ${i + 1}:`, error);
      }
    }

    // Download as zip file
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();

    images.forEach(img => {
      zip.file(img.name, img.blob);
    });

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    saveAs(zipBlob, `charts_export_${Date.now()}.zip`);
  }

  // Export filtered data as CSV
  static exportToCSV(data, filename = 'export') {
    if (!Array.isArray(data) || data.length === 0) return;

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => {
        const value = row[header];
        return typeof value === 'string' && value.includes(',') 
          ? `"${value}"` 
          : value;
      }).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `${filename}_${Date.now()}.csv`);
  }

  // Advanced export with multiple formats
  static async exportMultiFormat(data, formats = ['pdf', 'excel'], options = {}) {
    const promises = [];

    if (formats.includes('pdf')) {
      promises.push(this.exportToPDF(data, options.pdf));
    }

    if (formats.includes('excel')) {
      promises.push(this.exportToExcel(data, options.excel));
    }

    if (formats.includes('csv') && data.raw) {
      promises.push(this.exportToCSV(data.raw, options.csv?.filename));
    }

    if (formats.includes('images')) {
      promises.push(this.exportChartsAsImages(options.images?.selector));
    }

    await Promise.all(promises);
  }
}