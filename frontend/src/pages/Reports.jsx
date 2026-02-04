import { useState, useEffect, useCallback } from 'react';
import { reportsAPI, driversAPI, vehiclesAPI } from '../utils/api';
import { downloadBlob } from '../utils/helpers';
import toast from 'react-hot-toast';
import { FiFileText, FiDownload, FiUsers, FiTruck, FiAlertTriangle, FiClipboard, FiCalendar, FiActivity, FiDollarSign, FiEye, FiEyeOff, FiClock } from 'react-icons/fi';
import LoadingSpinner from '../components/LoadingSpinner';
import ReportFilters from '../components/filters/ReportFilters';
import { REPORT_FILTER_CONFIG } from '../utils/reportFilterConfig';
import FieldSelector from '../components/reports/FieldSelector';
import ReportPreview from '../components/reports/ReportPreview';
import TemplateManager from '../components/reports/TemplateManager';
import ReportHistoryList from '../components/reports/ReportHistoryList';
import { REPORT_FIELD_DEFINITIONS, getDefaultFields } from '../utils/reportFieldConfig';

const Reports = () => {
  const [activeTab, setActiveTab] = useState('generate'); // 'generate' or 'history'
  const [generating, setGenerating] = useState({});
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [activeFilters, setActiveFilters] = useState({});
  const [selectedReportId, setSelectedReportId] = useState('dqf');
  const [selectedFields, setSelectedFields] = useState({});
  const [showPreview, setShowPreview] = useState(false);

  // Initialize fields when report type changes
  useEffect(() => {
    if (!selectedFields[selectedReportId]) {
      setSelectedFields(prev => ({
        ...prev,
        [selectedReportId]: getDefaultFields(selectedReportId)
      }));
    }
  }, [selectedReportId, selectedFields]);

  // Fetch drivers and vehicles for filter dropdowns
  useEffect(() => {
    const fetchFilterData = async () => {
      try {
        const [driversRes, vehiclesRes] = await Promise.all([
          driversAPI.getAll({ status: 'active', limit: 500 }),
          vehiclesAPI.getAll({ status: 'active', limit: 500 })
        ]);
        setDrivers(driversRes.data.drivers || driversRes.data || []);
        setVehicles(vehiclesRes.data.vehicles || vehiclesRes.data || []);
      } catch (error) {
        console.error('Failed to load filter data:', error);
      }
    };
    fetchFilterData();
  }, []);

  const reports = [
    {
      id: 'dqf',
      title: 'Driver Qualification Files',
      description: 'Complete DQ file status report with 49 CFR 391.51 compliance fields including Clearinghouse, MVR, and employment verification status.',
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
      api: reportsAPI.getViolationsReport
    },
    {
      id: 'audit',
      title: 'Comprehensive Audit Report',
      description: 'Full audit readiness report including all modules - perfect for compliance audits.',
      icon: FiClipboard,
      color: 'green',
      api: reportsAPI.getAuditReport
    },
    {
      id: 'document-expiration',
      title: 'Document Expiration Report',
      description: 'Documents expiring within 30, 60, or 90 days grouped by urgency window.',
      icon: FiCalendar,
      color: 'yellow',
      api: reportsAPI.getDocumentExpirationReport
    },
    {
      id: 'drug-alcohol',
      title: 'Drug & Alcohol Summary',
      description: 'Testing compliance status with random pool percentages (50% drug, 10% alcohol).',
      icon: FiActivity,
      color: 'purple',
      api: reportsAPI.getDrugAlcoholReport
    },
    {
      id: 'dataq-history',
      title: 'DataQ Challenge History',
      description: 'Challenge submissions, outcomes, success rate, and estimated CSA points saved.',
      icon: FiFileText,
      color: 'indigo',
      api: reportsAPI.getDataQHistoryReport
    },
    {
      id: 'accident-summary',
      title: 'Accident Summary',
      description: 'Accident history with DOT reportable status, injuries, fatalities, and costs.',
      icon: FiAlertTriangle,
      color: 'red',
      api: reportsAPI.getAccidentSummaryReport
    },
    {
      id: 'maintenance-costs',
      title: 'Maintenance Cost Report',
      description: 'Spending analysis by vehicle, category, and vendor.',
      icon: FiDollarSign,
      color: 'green',
      api: reportsAPI.getMaintenanceCostReport
    }
  ];

  const handleFilterChange = useCallback((filters) => {
    setActiveFilters(filters);
  }, []);

  // Handle loading a template
  const handleLoadTemplate = (template) => {
    setSelectedFields(prev => ({
      ...prev,
      [template.reportType]: template.selectedFields
    }));
    if (template.filters && Object.keys(template.filters).length > 0) {
      setActiveFilters(template.filters);
    }
    toast.success(`Loaded template: ${template.name}`);
  };

  const handleGenerateReport = async (reportId, format = 'pdf') => {
    const report = reports.find(r => r.id === reportId);
    if (!report) return;

    setGenerating({ ...generating, [reportId]: format });

    try {
      // Build params from active filters + format
      const config = REPORT_FILTER_CONFIG[reportId] || {};
      const params = { format };

      if (config.enableDateRange && activeFilters.startDate) {
        params.startDate = activeFilters.startDate;
      }
      if (config.enableDateRange && activeFilters.endDate) {
        params.endDate = activeFilters.endDate;
      }
      if (config.enableDriverFilter && activeFilters.driverIds?.length) {
        params.driverIds = activeFilters.driverIds;
      }
      if (config.enableVehicleFilter && activeFilters.vehicleIds?.length) {
        params.vehicleIds = activeFilters.vehicleIds;
      }
      if (config.enableStatusFilter && activeFilters.status) {
        // For violations, use 'status' param name
        if (reportId === 'violations') {
          params.status = activeFilters.status;
        } else {
          params.complianceStatus = activeFilters.status;
        }
      }

      // Add fields param if not all fields selected
      const allFields = REPORT_FIELD_DEFINITIONS[reportId]?.fields.map(f => f.key) || [];
      const currentFields = selectedFields[reportId] || allFields;
      if (currentFields.length > 0 && currentFields.length < allFields.length) {
        params.fields = currentFields.join(',');
      }

      const response = await report.api(params);

      if (['pdf', 'csv', 'xlsx'].includes(format)) {
        const extension = format;
        downloadBlob(response.data, `${report.id}-report-${Date.now()}.${extension}`);
        toast.success(`${format.toUpperCase()} report downloaded successfully`);
      } else {
        // JSON preview could be shown in a modal
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
    green: { bg: 'bg-green-100', text: 'text-green-600' },
    yellow: { bg: 'bg-yellow-100', text: 'text-yellow-600' },
    purple: { bg: 'bg-purple-100', text: 'text-purple-600' },
    indigo: { bg: 'bg-indigo-100', text: 'text-indigo-600' }
  };

  // Get filter config for selected report
  const selectedConfig = REPORT_FILTER_CONFIG[selectedReportId] || {};

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">Reports & Export</h1>
        <p className="text-zinc-600 dark:text-zinc-300">Generate and export compliance reports in PDF, CSV, or Excel format</p>
      </div>

      {/* Main Tabs */}
      <div className="border-b border-zinc-200 dark:border-zinc-700">
        <div className="flex space-x-4">
          <button
            onClick={() => setActiveTab('generate')}
            className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'generate'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
            }`}
          >
            <FiFileText className="w-4 h-4 inline-block mr-2" />
            Generate Reports
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'history'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
            }`}
          >
            <FiClock className="w-4 h-4 inline-block mr-2" />
            Report History
          </button>
        </div>
      </div>

      {/* History Tab Content */}
      {activeTab === 'history' && (
        <ReportHistoryList />
      )}

      {/* Generate Tab Content */}
      {activeTab === 'generate' && (
        <>
          {/* Report Type Selector */}
          <div className="flex flex-wrap gap-2">
            {reports.map((report) => (
          <button
            key={report.id}
            onClick={() => setSelectedReportId(report.id)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              selectedReportId === report.id
                ? 'bg-primary-600 text-white'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
            }`}
          >
            {report.title}
          </button>
        ))}
      </div>

      {/* Report Builder Section */}
      <div className="space-y-4">
        {/* Template Manager */}
        <TemplateManager
          reportType={selectedReportId}
          currentConfig={{
            selectedFields: selectedFields[selectedReportId] || [],
            filters: activeFilters
          }}
          onLoadTemplate={handleLoadTemplate}
        />

        {/* Field Selector */}
        <FieldSelector
          reportType={selectedReportId}
          fieldDefinitions={REPORT_FIELD_DEFINITIONS}
          selectedFields={selectedFields[selectedReportId] || []}
          onFieldsChange={(fields) => setSelectedFields(prev => ({
            ...prev,
            [selectedReportId]: fields
          }))}
        />

        {/* Preview Toggle */}
        <div className="flex justify-end">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="btn btn-secondary btn-sm flex items-center"
          >
            {showPreview ? (
              <>
                <FiEyeOff className="w-4 h-4 mr-2" />
                Hide Preview
              </>
            ) : (
              <>
                <FiEye className="w-4 h-4 mr-2" />
                Show Preview
              </>
            )}
          </button>
        </div>

        {/* Preview Panel */}
        {showPreview && (
          <ReportPreview
            reportType={selectedReportId}
            selectedFields={selectedFields[selectedReportId] || []}
            filters={activeFilters}
            onClose={() => setShowPreview(false)}
          />
        )}
      </div>

      {/* Report Filters */}
      <ReportFilters
        onFilterChange={handleFilterChange}
        enableDateRange={selectedConfig.enableDateRange}
        enableDriverFilter={selectedConfig.enableDriverFilter}
        enableVehicleFilter={selectedConfig.enableVehicleFilter}
        enableStatusFilter={selectedConfig.enableStatusFilter}
        drivers={drivers}
        vehicles={vehicles}
        statusOptions={selectedConfig.statusOptions || []}
      />

      {/* Report Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
        {reports.map((report) => {
          const Icon = report.icon;
          const colors = colorClasses[report.color];
          const isGenerating = generating[report.id];
          const isSelected = selectedReportId === report.id;

          return (
            <div
              key={report.id}
              onClick={() => setSelectedReportId(report.id)}
              className={`group card hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer ${
                isSelected ? 'ring-2 ring-primary-500' : ''
              }`}
            >
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
                        onClick={(e) => { e.stopPropagation(); handleGenerateReport(report.id, 'pdf'); }}
                        disabled={isGenerating}
                        className="btn btn-primary btn-sm flex items-center"
                      >
                        {isGenerating === 'pdf' ? (
                          <LoadingSpinner size="sm" className="mr-2" />
                        ) : (
                          <FiDownload className="w-4 h-4 mr-2" />
                        )}
                        PDF
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleGenerateReport(report.id, 'csv'); }}
                        disabled={isGenerating}
                        className="btn btn-secondary btn-sm flex items-center"
                      >
                        {isGenerating === 'csv' ? (
                          <LoadingSpinner size="sm" className="mr-2" />
                        ) : (
                          <FiDownload className="w-4 h-4 mr-2" />
                        )}
                        CSV
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleGenerateReport(report.id, 'xlsx'); }}
                        disabled={isGenerating}
                        className="btn btn-secondary btn-sm flex items-center"
                      >
                        {isGenerating === 'xlsx' ? (
                          <LoadingSpinner size="sm" className="mr-2" />
                        ) : (
                          <FiDownload className="w-4 h-4 mr-2" />
                        )}
                        Excel
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleGenerateReport(report.id, 'json'); }}
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
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 text-sm">
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
        </>
      )}
    </div>
  );
};

export default Reports;
