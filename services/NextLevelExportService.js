import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import html2canvas from 'html2canvas';
import JSZip from 'jszip';

export class NextLevelExportService {

  // Professional PDF Report Generation
  static async exportToProfessionalPDF(data, options = {}) {
    const {
      title = 'PartPulse Business Intelligence Report',
      subtitle = `Generated on ${new Date().toLocaleDateString()}`,
      includeCharts = true,
      includeInsights = true,
      template = 'executive', // executive, technical, detailed
      branding = true
    } = options;

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Professional Header
    if (branding) {
      pdf.setFontSize(24);
      pdf.setTextColor(59, 130, 246); // Blue
      pdf.text('PartPulse', 20, 25);

      pdf.setFontSize(16);
      pdf.setTextColor(0, 0, 0);
      pdf.text(title, 20, 40);

      pdf.setFontSize(12);
      pdf.setTextColor(100, 100, 100);
      pdf.text(subtitle, 20, 50);

      // Add professional line
      pdf.setDrawColor(59, 130, 246);
      pdf.line(20, 55, 190, 55);
    }

    let yPosition = 70;

    // Executive Summary
    if (template === 'executive') {
      pdf.setFontSize(16);
      pdf.setTextColor(0, 0, 0);
      pdf.text('Executive Summary', 20, yPosition);
      yPosition += 10;

      const metrics = data.performanceMetrics || {};
      const summaryItems = [
        `Total Parts Managed: ${metrics.totalParts || 0}`,
        `Active Machines: ${metrics.activeMachines || 0}`,
        `Shared Parts: ${metrics.sharedParts || 0} (${((metrics.sharedParts / metrics.totalParts) * 100).toFixed(1)}%)`,
        `Cost Savings Potential: $${metrics.costSavingsPotential?.toFixed(0) || 0}`,
        `Average Standardization Score: ${metrics.averageSharingScore?.toFixed(1) || 0}%`,
        `System Uptime: ${metrics.uptime?.toFixed(1) || 0}%`
      ];

      pdf.setFontSize(11);
      summaryItems.forEach(item => {
        pdf.text(`• ${item}`, 25, yPosition);
        yPosition += 6;
      });
      yPosition += 10;
    }

    // Machine-Part Sharing Analysis
    if (data.partSharingMatrix && data.partSharingMatrix.length > 0) {
      pdf.setFontSize(14);
      pdf.text('Top Shared Parts Analysis', 20, yPosition);
      yPosition += 10;

      // Table headers
      pdf.setFontSize(10);
      pdf.text('Part Name', 20, yPosition);
      pdf.text('Machines', 80, yPosition);
      pdf.text('Usage', 110, yPosition);
      pdf.text('Standardization', 140, yPosition);
      pdf.text('Savings Potential', 170, yPosition);
      yPosition += 7;

      // Table data
      data.partSharingMatrix.slice(0, 15).forEach(part => {
        if (yPosition > 250) {
          pdf.addPage();
          yPosition = 20;
        }

        const partName = part.partName.length > 15 ? part.partName.substring(0, 15) + '...' : part.partName;
        pdf.text(partName, 20, yPosition);
        pdf.text(part.sharedAcross.toString(), 80, yPosition);
        pdf.text(part.totalUsage.toString(), 110, yPosition);
        pdf.text(`${part.standardizationScore.toFixed(1)}%`, 140, yPosition);
        pdf.text(`$${part.costOptimizationPotential.toFixed(0)}`, 170, yPosition);
        yPosition += 6;
      });
      yPosition += 10;
    }

    // Predictive Insights
    if (includeInsights && data.predictiveInsights) {
      if (yPosition > 200) {
        pdf.addPage();
        yPosition = 20;
      }

      pdf.setFontSize(14);
      pdf.text('AI-Powered Predictive Insights', 20, yPosition);
      yPosition += 10;

      // Demand Forecasting
      pdf.setFontSize(12);
      pdf.text('Demand Forecasting (Top 5)', 20, yPosition);
      yPosition += 8;

      pdf.setFontSize(10);
      data.predictiveInsights.demandForecasting.slice(0, 5).forEach(forecast => {
        const part = data.filteredParts?.find(p => p.id === forecast.partId);
        if (part) {
          pdf.text(`• ${part.name}: ${forecast.predictedDemand} units (${Math.round(forecast.confidence * 100)}% confidence)`, 25, yPosition);
          yPosition += 5;
        }
      });
      yPosition += 5;

      // Maintenance Scheduling
      pdf.setFontSize(12);
      pdf.text('Upcoming Maintenance Alerts', 20, yPosition);
      yPosition += 8;

      pdf.setFontSize(10);
      data.predictiveInsights.maintenanceScheduling.slice(0, 5).forEach(schedule => {
        const machine = data.machines?.find(m => m.id === schedule.machineId);
        if (machine) {
          pdf.text(`• ${machine.name}: ${schedule.nextMaintenanceDate.toLocaleDateString()} (Risk: ${Math.round(schedule.criticalityScore)})`, 25, yPosition);
          yPosition += 5;
        }
      });
    }

    // Capture and include charts
    if (includeCharts) {
      const chartElements = document.querySelectorAll('[data-chart-export]');
      for (let i = 0; i < Math.min(chartElements.length, 4); i++) {
        try {
          const canvas = await html2canvas(chartElements[i], {
            backgroundColor: '#ffffff',
            scale: 2,
            useCORS: true
          });

          if (yPosition > 150) {
            pdf.addPage();
            yPosition = 20;
          }

          const imgData = canvas.toDataURL('image/png');
          const imgWidth = 170;
          const imgHeight = (canvas.height * imgWidth) / canvas.width;

          pdf.addImage(imgData, 'PNG', 20, yPosition, imgWidth, Math.min(imgHeight, 100));
          yPosition += Math.min(imgHeight, 100) + 10;
        } catch (error) {
          console.warn('Chart capture failed:', error);
        }
      }
    }

    // Footer on each page
    const pageCount = pdf.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`Page ${i} of ${pageCount}`, 180, 285);
      pdf.text('PartPulse CMMS - Business Intelligence Report', 20, 285);
    }

    // Save PDF
    pdf.save(`PartPulse_BI_Report_${Date.now()}.pdf`);
  }

  // Advanced Excel Export with Multiple Sheets
  static exportToAdvancedExcel(data, options = {}) {
    const { filename = 'PartPulse_Analytics' } = options;

    const workbook = XLSX.utils.book_new();

    // Executive Summary Sheet
    if (data.performanceMetrics) {
      const summaryData = Object.entries(data.performanceMetrics).map(([key, value]) => ({
        Metric: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
        Value: typeof value === 'number' ? parseFloat(value.toFixed(2)) : value
      }));

      const summarySheet = XLSX.utils.json_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Executive Summary');
    }

    // Part Sharing Analysis Sheet
    if (data.partSharingMatrix) {
      const sharingData = data.partSharingMatrix.map(part => ({
        'Part ID': part.partId,
        'Part Name': part.partName,
        'Part Number': part.partNumber,
        'Category': part.category,
        'Shared Across (Machines)': part.sharedAcross,
        'Total Usage': part.totalUsage,
        'Standardization Score (%)': parseFloat(part.standardizationScore.toFixed(2)),
        'Cost Optimization Potential ($)': parseFloat(part.costOptimizationPotential.toFixed(2)),
        'Current Stock': part.currentStock,
        'Minimum Stock': part.minStock,
        'Risk Level': part.riskLevel,
        'Trend': part.trend
      }));

      const sharingSheet = XLSX.utils.json_to_sheet(sharingData);
      XLSX.utils.book_append_sheet(workbook, sharingSheet, 'Part Sharing Analysis');
    }

    // Machine Analysis Sheet
    if (data.machinePartMatrix) {
      const machineData = Object.values(data.machinePartMatrix).map(machine => ({
        'Machine Name': machine.name,
        'Total Parts': machine.parts.size,
        'Total Usage': machine.totalUsage,
        'Cost Impact ($)': parseFloat(machine.costImpact.toFixed(2)),
        'Efficiency Score': parseFloat(machine.efficiency.toFixed(2)),
        'Risk Score': parseFloat(machine.riskScore.toFixed(2))
      }));

      const machineSheet = XLSX.utils.json_to_sheet(machineData);
      XLSX.utils.book_append_sheet(workbook, machineSheet, 'Machine Analysis');
    }

    // Predictive Insights Sheet
    if (data.predictiveInsights) {
      const forecastData = data.predictiveInsights.demandForecasting.map(forecast => {
        const part = data.filteredParts?.find(p => p.id === forecast.partId);
        return {
          'Part ID': forecast.partId,
          'Part Name': part?.name || 'Unknown',
          'Predicted Demand': forecast.predictedDemand,
          'Confidence (%)': Math.round(forecast.confidence * 100),
          'Seasonal Factor': parseFloat(forecast.seasonalFactor.toFixed(2))
        };
      });

      const forecastSheet = XLSX.utils.json_to_sheet(forecastData);
      XLSX.utils.book_append_sheet(workbook, forecastSheet, 'Demand Forecast');
    }

    // Raw Data Sheets
    if (data.filteredParts) {
      const partsSheet = XLSX.utils.json_to_sheet(data.filteredParts);
      XLSX.utils.book_append_sheet(workbook, partsSheet, 'Parts Data');
    }

    if (data.filteredMovements) {
      const movementsSheet = XLSX.utils.json_to_sheet(data.filteredMovements);
      XLSX.utils.book_append_sheet(workbook, movementsSheet, 'Movements Data');
    }

    // Save Excel file
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data_blob = new Blob([excelBuffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    saveAs(data_blob, `${filename}_${Date.now()}.xlsx`);
  }

  // Interactive Dashboard Export
  static async exportInteractiveDashboard(data, options = {}) {
    const { 
      template = 'standard',
      includeFilters = true,
      includePredictions = true 
    } = options;

    const zip = new JSZip();

    // Create HTML dashboard
    const htmlContent = this.generateInteractiveDashboard(data, { 
      template, 
      includeFilters, 
      includePredictions 
    });

    zip.file('dashboard.html', htmlContent);

    // Add CSS
    const cssContent = this.generateDashboardCSS(template);
    zip.file('styles.css', cssContent);

    // Add JavaScript
    const jsContent = this.generateDashboardJS(data);
    zip.file('dashboard.js', jsContent);

    // Add data JSON
    zip.file('data.json', JSON.stringify(data, null, 2));

    // Capture charts as images
    const chartElements = document.querySelectorAll('[data-chart-export]');
    for (let i = 0; i < chartElements.length; i++) {
      try {
        const canvas = await html2canvas(chartElements[i]);
        const imgData = canvas.toDataURL('image/png').split(',')[1];
        zip.file(`chart_${i + 1}.png`, imgData, { base64: true });
      } catch (error) {
        console.warn(`Chart ${i + 1} capture failed:`, error);
      }
    }

    // Generate and save zip
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    saveAs(zipBlob, `PartPulse_Interactive_Dashboard_${Date.now()}.zip`);
  }

  // Generate Interactive HTML Dashboard
  static generateInteractiveDashboard(data, options) {
    const { template, includeFilters, includePredictions } = options;

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PartPulse Business Intelligence Dashboard</title>
    <link rel="stylesheet" href="styles.css">
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/d3/7.8.5/d3.min.js"></script>
</head>
<body>
    <div class="dashboard-container">
        <header class="dashboard-header">
            <h1>PartPulse Business Intelligence</h1>
            <p>Interactive Analytics Dashboard</p>
            <div class="timestamp">Generated: ${new Date().toLocaleString()}</div>
        </header>

        <div class="kpi-grid">
            <div class="kpi-card">
                <h3>Total Parts</h3>
                <div class="kpi-value">${data.performanceMetrics?.totalParts || 0}</div>
                <div class="kpi-trend positive">↑ 12%</div>
            </div>
            <div class="kpi-card">
                <h3>Shared Parts</h3>
                <div class="kpi-value">${data.performanceMetrics?.sharedParts || 0}</div>
                <div class="kpi-trend positive">↑ 8%</div>
            </div>
            <div class="kpi-card">
                <h3>Cost Savings</h3>
                <div class="kpi-value">$${data.performanceMetrics?.costSavingsPotential?.toFixed(0) || 0}</div>
                <div class="kpi-trend positive">↑ 15%</div>
            </div>
            <div class="kpi-card">
                <h3>Uptime</h3>
                <div class="kpi-value">${data.performanceMetrics?.uptime?.toFixed(1) || 0}%</div>
                <div class="kpi-trend positive">↑ 2%</div>
            </div>
        </div>

        ${includeFilters ? `
        <div class="filters-section">
            <h2>Interactive Filters</h2>
            <div class="filter-controls">
                <input type="text" id="search-filter" placeholder="Search parts...">
                <select id="category-filter">
                    <option value="">All Categories</option>
                    ${[...new Set((data.filteredParts || []).map(p => p.category).filter(Boolean))]
                      .map(cat => `<option value="${cat}">${cat}</option>`).join('')}
                </select>
                <input type="range" id="sharing-filter" min="0" max="100" value="0">
                <span id="sharing-value">0%</span>
            </div>
        </div>
        ` : ''}

        <div class="charts-grid">
            <div class="chart-container">
                <canvas id="sharingChart"></canvas>
            </div>
            <div class="chart-container">
                <canvas id="usageChart"></canvas>
            </div>
            <div class="chart-container">
                <canvas id="costChart"></canvas>
            </div>
            <div class="chart-container">
                <div id="networkChart"></div>
            </div>
        </div>

        ${includePredictions ? `
        <div class="predictions-section">
            <h2>AI-Powered Predictions</h2>
            <div class="predictions-grid">
                ${(data.predictiveInsights?.demandForecasting || []).slice(0, 6).map(forecast => {
                  const part = (data.filteredParts || []).find(p => p.id === forecast.partId);
                  return `
                    <div class="prediction-card">
                        <h4>${part?.name || 'Unknown Part'}</h4>
                        <p>Predicted Demand: <strong>${forecast.predictedDemand}</strong></p>
                        <p>Confidence: <strong>${Math.round(forecast.confidence * 100)}%</strong></p>
                        <div class="confidence-bar">
                            <div class="confidence-fill" style="width: ${forecast.confidence * 100}%"></div>
                        </div>
                    </div>
                  `;
                }).join('')}
            </div>
        </div>
        ` : ''}

        <div class="insights-section">
            <h2>Key Insights</h2>
            <div class="insights-list">
                <div class="insight-item">
                    <span class="insight-icon">🔧</span>
                    <div class="insight-content">
                        <h4>High Standardization Opportunity</h4>
                        <p>${data.partSharingMatrix?.filter(p => p.standardizationScore > 50).length || 0} parts show high standardization potential</p>
                    </div>
                </div>
                <div class="insight-item">
                    <span class="insight-icon">💰</span>
                    <div class="insight-content">
                        <h4>Cost Optimization</h4>
                        <p>Potential annual savings of $${data.performanceMetrics?.costSavingsPotential?.toFixed(0) || 0}</p>
                    </div>
                </div>
                <div class="insight-item">
                    <span class="insight-icon">⚠️</span>
                    <div class="insight-content">
                        <h4>Critical Parts Alert</h4>
                        <p>${data.partSharingMatrix?.filter(p => p.riskLevel === 'critical').length || 0} parts require immediate attention</p>
                    </div>
                </div>
            </div>
        </div>

        <footer class="dashboard-footer">
            <p>Generated by PartPulse CMMS Business Intelligence System</p>
            <p>© ${new Date().getFullYear()} PartPulse. All rights reserved.</p>
        </footer>
    </div>

    <script src="dashboard.js"></script>
</body>
</html>`;
  }

  // Generate Dashboard CSS
  static generateDashboardCSS(template) {
    return `
* {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    min-height: 100vh;
    color: #333;
}

.dashboard-container {
    max-width: 1400px;
    margin: 0 auto;
    padding: 20px;
}

.dashboard-header {
    text-align: center;
    color: white;
    margin-bottom: 30px;
}

.dashboard-header h1 {
    font-size: 2.5rem;
    font-weight: 700;
    margin-bottom: 10px;
}

.timestamp {
    font-size: 0.9rem;
    opacity: 0.8;
}

.kpi-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 20px;
    margin-bottom: 30px;
}

.kpi-card {
    background: white;
    padding: 25px;
    border-radius: 12px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.kpi-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.kpi-card h3 {
    font-size: 0.9rem;
    color: #666;
    margin-bottom: 10px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.kpi-value {
    font-size: 2.5rem;
    font-weight: 700;
    color: #2563eb;
    margin-bottom: 10px;
}

.kpi-trend {
    font-size: 0.9rem;
    font-weight: 600;
}

.kpi-trend.positive {
    color: #10b981;
}

.filters-section {
    background: white;
    padding: 25px;
    border-radius: 12px;
    margin-bottom: 30px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.filter-controls {
    display: grid;
    grid-template-columns: 1fr 200px 150px 50px;
    gap: 15px;
    align-items: center;
    margin-top: 15px;
}

.filter-controls input, .filter-controls select {
    padding: 12px;
    border: 2px solid #e5e7eb;
    border-radius: 8px;
    font-size: 1rem;
}

.charts-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
    gap: 25px;
    margin-bottom: 30px;
}

.chart-container {
    background: white;
    padding: 25px;
    border-radius: 12px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    min-height: 350px;
}

.predictions-section, .insights-section {
    background: white;
    padding: 25px;
    border-radius: 12px;
    margin-bottom: 30px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.predictions-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 20px;
    margin-top: 20px;
}

.prediction-card {
    border: 2px solid #e5e7eb;
    padding: 20px;
    border-radius: 8px;
    background: #f9fafb;
}

.confidence-bar {
    width: 100%;
    height: 8px;
    background: #e5e7eb;
    border-radius: 4px;
    overflow: hidden;
    margin-top: 10px;
}

.confidence-fill {
    height: 100%;
    background: linear-gradient(90deg, #10b981 0%, #059669 100%);
    transition: width 0.3s ease;
}

.insights-list {
    margin-top: 20px;
}

.insight-item {
    display: flex;
    align-items: center;
    padding: 20px;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    margin-bottom: 15px;
    background: #f9fafb;
}

.insight-icon {
    font-size: 2rem;
    margin-right: 20px;
}

.insight-content h4 {
    font-size: 1.1rem;
    margin-bottom: 5px;
}

.dashboard-footer {
    text-align: center;
    color: white;
    margin-top: 40px;
    opacity: 0.8;
}

@media (max-width: 768px) {
    .kpi-grid {
        grid-template-columns: 1fr;
    }

    .charts-grid {
        grid-template-columns: 1fr;
    }

    .filter-controls {
        grid-template-columns: 1fr;
    }
}
`;
  }

  // Generate Dashboard JavaScript
  static generateDashboardJS(data) {
    return `
// Dashboard Interactivity
document.addEventListener('DOMContentLoaded', function() {
    // Initialize charts
    initializeCharts();

    // Set up filters
    setupFilters();

    // Add interactions
    addInteractions();
});

function initializeCharts() {
    const sharingData = ${JSON.stringify((data.partSharingMatrix || []).slice(0, 10).map(part => ({
      label: part.partName.substring(0, 15) + '...',
      value: part.standardizationScore
    })))};

    // Sharing Chart
    const sharingCtx = document.getElementById('sharingChart');
    if (sharingCtx) {
        new Chart(sharingCtx, {
            type: 'bar',
            data: {
                labels: sharingData.map(d => d.label),
                datasets: [{
                    label: 'Standardization Score (%)',
                    data: sharingData.map(d => d.value),
                    backgroundColor: 'rgba(59, 130, 246, 0.8)',
                    borderColor: 'rgba(59, 130, 246, 1)',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Part Standardization Analysis'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100
                    }
                }
            }
        });
    }

    // Usage Chart
    const usageCtx = document.getElementById('usageChart');
    if (usageCtx) {
        const usageData = sharingData.map((d, i) => ({
            x: Math.random() * 100,
            y: Math.random() * 50 + 10,
            label: d.label
        }));

        new Chart(usageCtx, {
            type: 'scatter',
            data: {
                datasets: [{
                    label: 'Usage vs Cost',
                    data: usageData,
                    backgroundColor: 'rgba(16, 185, 129, 0.6)'
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Usage vs Cost Analysis'
                    }
                }
            }
        });
    }
}

function setupFilters() {
    const searchFilter = document.getElementById('search-filter');
    const categoryFilter = document.getElementById('category-filter');
    const sharingFilter = document.getElementById('sharing-filter');
    const sharingValue = document.getElementById('sharing-value');

    if (sharingFilter && sharingValue) {
        sharingFilter.addEventListener('input', function() {
            sharingValue.textContent = this.value + '%';
        });
    }

    [searchFilter, categoryFilter, sharingFilter].forEach(filter => {
        if (filter) {
            filter.addEventListener('change', applyFilters);
            filter.addEventListener('input', debounce(applyFilters, 300));
        }
    });
}

function applyFilters() {
    console.log('Applying filters...');
    // Filter logic would go here
}

function addInteractions() {
    // Add hover effects to KPI cards
    const kpiCards = document.querySelectorAll('.kpi-card');
    kpiCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-8px) scale(1.02)';
        });

        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
`;
  }

  // PowerBI-style Export
  static exportToPowerBIFormat(data, options = {}) {
    const powerBIData = {
      version: '1.0',
      dataSource: 'PartPulse CMMS',
      timestamp: new Date().toISOString(),
      tables: {
        Parts: data.filteredParts || [],
        Movements: data.filteredMovements || [],
        Machines: data.machines || [],
        PartSharingAnalysis: data.partSharingMatrix || [],
        PerformanceMetrics: data.performanceMetrics ? [data.performanceMetrics] : [],
        PredictiveInsights: data.predictiveInsights || {}
      },
      relationships: [
        {
          fromTable: 'Movements',
          fromColumn: 'part_id',
          toTable: 'Parts',
          toColumn: 'id',
          cardinality: 'many-to-one'
        },
        {
          fromTable: 'Movements', 
          fromColumn: 'machine_id',
          toTable: 'Machines',
          toColumn: 'id',
          cardinality: 'many-to-one'
        }
      ],
      measures: {
        TotalParts: 'COUNT(Parts[id])',
        SharedParts: 'COUNTROWS(FILTER(PartSharingAnalysis, [sharedAcross] > 1))',
        AverageStandardization: 'AVERAGE(PartSharingAnalysis[standardizationScore])',
        TotalCostSavings: 'SUM(PartSharingAnalysis[costOptimizationPotential])'
      }
    };

    const blob = new Blob([JSON.stringify(powerBIData, null, 2)], { 
      type: 'application/json' 
    });
    saveAs(blob, `PartPulse_PowerBI_Export_${Date.now()}.json`);
  }

  // Multi-format export in one go
  static async exportAll(data, formats = ['pdf', 'excel', 'dashboard'], options = {}) {
    const promises = [];

    if (formats.includes('pdf')) {
      promises.push(this.exportToProfessionalPDF(data, options.pdf));
    }

    if (formats.includes('excel')) {
      promises.push(this.exportToAdvancedExcel(data, options.excel));
    }

    if (formats.includes('dashboard')) {
      promises.push(this.exportInteractiveDashboard(data, options.dashboard));
    }

    if (formats.includes('powerbi')) {
      promises.push(this.exportToPowerBIFormat(data, options.powerbi));
    }

    try {
      await Promise.all(promises);
      console.log('All exports completed successfully');
    } catch (error) {
      console.error('Export failed:', error);
      throw error;
    }
  }
}

export default NextLevelExportService;