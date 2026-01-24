import { useState } from 'react';
import { reportsAPI } from '../utils/api';
import { downloadBlob } from '../utils/helpers';
import toast from 'react-hot-toast';
import { FiFileText, FiDownload, FiUsers, FiTruck, FiAlertTriangle, FiClipboard } from 'react-icons/fi';
import LoadingSpinner from '../components/LoadingSpinner';

const Reports = () => {
  const [generating, setGenerating] = useState({});
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });

  const reports = [
    {
      id: 'dqf',
      title: 'Driver Qualification Files',
      description: 'Complete DQ file status report with expiration dates and compliance status for all drivers.',
      icon: FiUsers,
      color: 'blue',
      api: reportsAPI.getDqfReport
    },
    {
      id: 'vehicle',
      title: 'Vehicle Maintenance',
      description: 'Vehicle inspection history, maintenance logs, and compliance status report.',
      icon: FiTruck,
      color: 'orange',
      api: reportsAPI.getVehicleMaintenanceReport
    },
    {
      id: 'violations',
      title: 'Violations Summary',
      description: 'Violation history with BASIC categories, severity weights, and DataQ status.',
      icon: FiAlertTriangle,
      color: 'red',
      api: reportsAPI.getViolationsReport,
      hasDateRange: true
    },
    {
      id: 'audit',
      title: 'Comprehensive Audit Report',
      description: 'Full audit readiness report including all modules - perfect for compliance audits.',
      icon: FiClipboard,
      color: 'green',
      api: reportsAPI.getAuditReport
    }
  ];

  const handleGenerateReport = async (reportId, format = 'pdf') => {
    const report = reports.find(r => r.id === reportId);
    if (!report) return;

    setGenerating({ ...generating, [reportId]: format });

    try {
      const params = {
        format,
        ...(report.hasDateRange && dateRange.startDate && { startDate: dateRange.startDate }),
        ...(report.hasDateRange && dateRange.endDate && { endDate: dateRange.endDate })
      };

      const response = await report.api(params);

      if (format === 'pdf') {
        downloadBlob(response.data, `${report.id}-report-${Date.now()}.pdf`);
        toast.success('Report downloaded successfully');
      } else {
        // JSON preview could be shown in a modal
        console.log(response.data);
        toast.success('Report data retrieved');
      }
    } catch (error) {
      toast.error(`Failed to generate ${report.title}`);
    } finally {
      setGenerating({ ...generating, [reportId]: false });
    }
  };

  const colorClasses = {
    blue: { bg: 'bg-blue-100', text: 'text-blue-600' },
    orange: { bg: 'bg-orange-100', text: 'text-orange-600' },
    red: { bg: 'bg-red-100', text: 'text-red-600' },
    green: { bg: 'bg-green-100', text: 'text-green-600' }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">Reports & Export</h1>
        <p className="text-zinc-600 dark:text-zinc-300">Generate PDF reports for compliance audits and record keeping</p>
      </div>

      {/* Date Range Filter (for applicable reports) */}
      <div className="card p-4">
        <h3 className="font-medium mb-3">Date Range Filter (for Violations Report)</h3>
        <div className="flex flex-col sm:flex-row gap-4">
          <div>
            <label className="form-label">Start Date</label>
            <input
              type="date"
              className="form-input"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
            />
          </div>
          <div>
            <label className="form-label">End Date</label>
            <input
              type="date"
              className="form-input"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
            />
          </div>
        </div>
      </div>

      {/* Report Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reports.map((report) => {
          const Icon = report.icon;
          const colors = colorClasses[report.color];
          const isGenerating = generating[report.id];

          return (
            <div key={report.id} className="group card hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer">
              <div className="card-body">
                <div className="flex items-start space-x-4">
                  <div className={`w-12 h-12 ${colors.bg} rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className={`w-6 h-6 ${colors.text}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-zinc-800 dark:text-zinc-100">{report.title}</h3>
                    <p className="text-sm text-zinc-600 dark:text-zinc-300 mt-1">{report.description}</p>

                    <div className="flex flex-wrap gap-2 mt-4">
                      <button
                        onClick={() => handleGenerateReport(report.id, 'pdf')}
                        disabled={isGenerating}
                        className="btn btn-primary btn-sm flex items-center"
                      >
                        {isGenerating === 'pdf' ? (
                          <LoadingSpinner size="sm" className="mr-2" />
                        ) : (
                          <FiDownload className="w-4 h-4 mr-2" />
                        )}
                        Download PDF
                      </button>
                      <button
                        onClick={() => handleGenerateReport(report.id, 'json')}
                        disabled={isGenerating}
                        className="btn btn-secondary btn-sm flex items-center"
                      >
                        {isGenerating === 'json' ? (
                          <LoadingSpinner size="sm" className="mr-2" />
                        ) : (
                          <FiFileText className="w-4 h-4 mr-2" />
                        )}
                        View Data
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* FMCSA Reference */}
      <div className="card">
        <div className="card-header">
          <h3 className="font-semibold">Regulatory References</h3>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-700 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
              <p className="font-medium text-zinc-700 dark:text-zinc-200">49 CFR 391</p>
              <p className="text-zinc-600 dark:text-zinc-300">Driver Qualifications</p>
            </div>
            <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-700 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
              <p className="font-medium text-zinc-700 dark:text-zinc-200">49 CFR 396</p>
              <p className="text-zinc-600 dark:text-zinc-300">Vehicle Inspection & Maintenance</p>
            </div>
            <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-700 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
              <p className="font-medium text-zinc-700 dark:text-zinc-200">49 CFR 382</p>
              <p className="text-zinc-600 dark:text-zinc-300">Drug & Alcohol Testing</p>
            </div>
            <div className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-700 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
              <p className="font-medium text-zinc-700 dark:text-zinc-200">SMS Methodology</p>
              <p className="text-zinc-600 dark:text-zinc-300">BASICs Scoring System</p>
            </div>
          </div>
        </div>
      </div>

      {/* Audit Checklist */}
      <div className="card">
        <div className="card-header">
          <h3 className="font-semibold">Mock Audit Checklist</h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-300">Entry-level audit items per FMCSA guidelines</p>
        </div>
        <div className="card-body">
          <div className="space-y-3">
            {[
              'Driver qualification files complete for all active drivers',
              'Current CDL and medical cards on file',
              'Annual MVR reviews completed',
              'Clearinghouse queries current (within 12 months)',
              'Employment verification for past 10 years',
              'Road test certificates or equivalents',
              'Annual vehicle inspections current',
              'Maintenance records for all vehicles',
              'Drug & alcohol testing records',
              'Random testing pool compliance (50% drug, 10% alcohol)',
              'Hours of service records (if applicable)',
              'Insurance certificates current'
            ].map((item, index) => (
              <div key={index} className="flex items-center space-x-3 p-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:pl-4 border-l-2 border-transparent hover:border-accent-500 rounded transition-all duration-200 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 text-primary-600" />
                <span className="text-sm text-zinc-700 dark:text-zinc-200">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
