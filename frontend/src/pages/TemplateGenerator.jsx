import { useState, useEffect } from 'react';
import { templatesAPI, driversAPI, vehiclesAPI } from '../utils/api';
import {
  FiFileText, FiDownload, FiEye, FiSave, FiCheck, FiX,
  FiAlertCircle, FiChevronRight, FiUser, FiTruck, FiShield,
  FiDroplet, FiFile, FiRefreshCw
} from 'react-icons/fi';
import LoadingSpinner from '../components/LoadingSpinner';

const TemplateGenerator = () => {
  // Templates state
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Selection state
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [templateDefinition, setTemplateDefinition] = useState(null);

  // Form state
  const [formData, setFormData] = useState({});
  const [validation, setValidation] = useState({ valid: true, errors: [] });

  // Preview state
  const [previewHtml, setPreviewHtml] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Generation state
  const [generating, setGenerating] = useState(false);
  const [saveToDocuments, setSaveToDocuments] = useState(false);
  const [documentName, setDocumentName] = useState('');
  const [selectedDriver, setSelectedDriver] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState('');

  // Dropdown data
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);

  useEffect(() => {
    fetchTemplates();
    fetchDropdownData();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await templatesAPI.getAll();
      setTemplates(response.data.templates || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const fetchDropdownData = async () => {
    try {
      const [driversRes, vehiclesRes] = await Promise.all([
        driversAPI.getAll({ status: 'active', limit: 100 }),
        vehiclesAPI.getAll({ status: 'active', limit: 100 })
      ]);
      setDrivers(driversRes.data.drivers || []);
      setVehicles(vehiclesRes.data.vehicles || []);
    } catch (err) {
      console.error('Failed to fetch dropdown data:', err);
    }
  };

  const handleSelectTemplate = async (template) => {
    setSelectedTemplate(template);
    setFormData({});
    setPreviewHtml(null);
    setValidation({ valid: true, errors: [] });
    setDocumentName(template.name);

    try {
      const response = await templatesAPI.getByKey(template.key);
      setTemplateDefinition(response.data.template);

      // Initialize form with default values
      const defaults = {};
      response.data.template.fields.forEach(field => {
        if (field.default) {
          defaults[field.key] = field.default;
        }
      });
      setFormData(defaults);
    } catch (err) {
      console.error('Failed to load template definition:', err);
    }
  };

  const handleFieldChange = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleValidate = async () => {
    try {
      const response = await templatesAPI.validate(selectedTemplate.key, formData);
      setValidation(response.data);
      return response.data.valid;
    } catch (err) {
      console.error('Validation failed:', err);
      return false;
    }
  };

  const handlePreview = async () => {
    const isValid = await handleValidate();
    if (!isValid) return;

    setPreviewLoading(true);
    try {
      const response = await templatesAPI.preview(selectedTemplate.key, formData);
      setPreviewHtml(response.data.html);
    } catch (err) {
      console.error('Preview failed:', err);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleGenerate = async () => {
    const isValid = await handleValidate();
    if (!isValid) return;

    setGenerating(true);
    try {
      const response = await templatesAPI.generate(selectedTemplate.key, formData, {
        saveToDocuments,
        documentName,
        driverId: selectedDriver || null,
        vehicleId: selectedVehicle || null
      });

      if (saveToDocuments) {
        // Show success message
        alert(`Document "${documentName}" has been saved to your documents.`);
      } else {
        // Download the PDF
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${selectedTemplate.key}_${Date.now()}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (err) {
      console.error('Generation failed:', err);
      setError(err.response?.data?.message || 'Failed to generate document');
    } finally {
      setGenerating(false);
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'driver': return FiUser;
      case 'company': return FiShield;
      case 'drug_alcohol': return FiDroplet;
      default: return FiFileText;
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'driver': return 'bg-info-100 text-info-600';
      case 'company': return 'bg-primary-100 text-primary-600';
      case 'drug_alcohol': return 'bg-warning-100 text-warning-600';
      default: return 'bg-primary-100 text-primary-600';
    }
  };

  const renderField = (field) => {
    const baseInputClass = "w-full px-3 py-2 border border-primary-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500";

    switch (field.type) {
      case 'select':
        return (
          <select
            value={formData[field.key] || ''}
            onChange={(e) => handleFieldChange(field.key, e.target.value)}
            className={baseInputClass}
          >
            <option value="">-- Select --</option>
            {field.options?.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        );

      case 'multiselect':
        return (
          <div className="space-y-2">
            {field.options?.map(opt => (
              <label key={opt} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={(formData[field.key] || []).includes(opt)}
                  onChange={(e) => {
                    const current = formData[field.key] || [];
                    if (e.target.checked) {
                      handleFieldChange(field.key, [...current, opt]);
                    } else {
                      handleFieldChange(field.key, current.filter(v => v !== opt));
                    }
                  }}
                  className="rounded border-primary-300"
                />
                <span className="text-sm text-primary-700">{opt}</span>
              </label>
            ))}
          </div>
        );

      case 'textarea':
        return (
          <textarea
            value={formData[field.key] || ''}
            onChange={(e) => handleFieldChange(field.key, e.target.value)}
            className={baseInputClass}
            rows={4}
            placeholder={field.label}
          />
        );

      case 'date':
        return (
          <input
            type="date"
            value={formData[field.key] || ''}
            onChange={(e) => handleFieldChange(field.key, e.target.value)}
            className={baseInputClass}
          />
        );

      case 'number':
        return (
          <input
            type="number"
            value={formData[field.key] || ''}
            onChange={(e) => handleFieldChange(field.key, e.target.value)}
            className={baseInputClass}
            placeholder={field.label}
          />
        );

      default:
        return (
          <input
            type={field.type === 'email' ? 'email' : 'text'}
            value={formData[field.key] || ''}
            onChange={(e) => handleFieldChange(field.key, e.target.value)}
            className={baseInputClass}
            placeholder={field.label}
          />
        );
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <LoadingSpinner size="lg" variant="truck" />
        <p className="mt-4 text-sm text-primary-500">Loading templates...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary-900">Document Templates</h1>
          <p className="text-primary-500 text-sm mt-1">
            Generate compliant documents with your company information
          </p>
        </div>
        {selectedTemplate && (
          <button
            onClick={() => {
              setSelectedTemplate(null);
              setTemplateDefinition(null);
              setFormData({});
              setPreviewHtml(null);
            }}
            className="btn btn-secondary"
          >
            <FiX className="w-4 h-4" />
            Clear Selection
          </button>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-danger-50 border border-danger-200 rounded-xl flex items-start gap-3">
          <FiAlertCircle className="w-5 h-5 text-danger-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-danger-800">{error}</p>
          </div>
        </div>
      )}

      {/* Template Selection Grid */}
      {!selectedTemplate && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map(template => {
            const Icon = getCategoryIcon(template.category);
            return (
              <button
                key={template.key}
                onClick={() => handleSelectTemplate(template)}
                className="text-left bg-white rounded-xl border border-primary-200/60 p-5 hover:shadow-card hover:border-primary-300 transition-all group"
                style={{ boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.05)' }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getCategoryColor(template.category)}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <FiChevronRight className="w-5 h-5 text-primary-300 group-hover:text-primary-500 transition-colors" />
                </div>
                <h3 className="text-base font-semibold text-primary-900 mb-1">{template.name}</h3>
                <p className="text-xs text-primary-500 mb-3 line-clamp-2">{template.description}</p>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-primary-400">{template.regulation}</span>
                  <span className="text-primary-400">{template.fieldCount} fields</span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Template Form */}
      {selectedTemplate && templateDefinition && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Form Column */}
          <div
            className="bg-white rounded-xl border border-primary-200/60 overflow-hidden"
            style={{ boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.05)' }}
          >
            <div
              className="px-5 py-4 border-b border-primary-100"
              style={{ background: 'linear-gradient(to bottom, #fafbfc, #f8fafc)' }}
            >
              <h2 className="text-base font-semibold text-primary-900">{selectedTemplate.name}</h2>
              <p className="text-xs text-primary-500 mt-1">{selectedTemplate.regulation}</p>
            </div>
            <div className="p-5 space-y-4 max-h-[600px] overflow-y-auto">
              {/* Validation Errors */}
              {!validation.valid && (
                <div className="p-3 bg-danger-50 border border-danger-200 rounded-lg">
                  <p className="text-sm font-medium text-danger-800 mb-1">Please fix the following:</p>
                  <ul className="list-disc list-inside text-xs text-danger-700">
                    {validation.errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Form Fields */}
              {templateDefinition.fields.map(field => (
                <div key={field.key}>
                  <label className="block text-sm font-medium text-primary-700 mb-1">
                    {field.label}
                    {field.required && <span className="text-danger-500 ml-1">*</span>}
                  </label>
                  {renderField(field)}
                </div>
              ))}

              {/* Save Options */}
              <div className="pt-4 border-t border-primary-100">
                <label className="flex items-center gap-2 mb-3">
                  <input
                    type="checkbox"
                    checked={saveToDocuments}
                    onChange={(e) => setSaveToDocuments(e.target.checked)}
                    className="rounded border-primary-300"
                  />
                  <span className="text-sm text-primary-700">Save to Documents</span>
                </label>

                {saveToDocuments && (
                  <div className="space-y-3 pl-6">
                    <div>
                      <label className="block text-xs font-medium text-primary-600 mb-1">Document Name</label>
                      <input
                        type="text"
                        value={documentName}
                        onChange={(e) => setDocumentName(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-primary-200 rounded-lg"
                      />
                    </div>
                    {templateDefinition.category === 'driver' && (
                      <div>
                        <label className="block text-xs font-medium text-primary-600 mb-1">Link to Driver</label>
                        <select
                          value={selectedDriver}
                          onChange={(e) => setSelectedDriver(e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-primary-200 rounded-lg"
                        >
                          <option value="">-- Select Driver (Optional) --</option>
                          {drivers.map(d => (
                            <option key={d._id} value={d._id}>
                              {d.firstName} {d.lastName}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handlePreview}
                  disabled={previewLoading}
                  className="btn btn-secondary flex-1"
                >
                  {previewLoading ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <FiEye className="w-4 h-4" />
                  )}
                  Preview
                </button>
                <button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="btn btn-primary flex-1"
                >
                  {generating ? (
                    <LoadingSpinner size="sm" />
                  ) : saveToDocuments ? (
                    <FiSave className="w-4 h-4" />
                  ) : (
                    <FiDownload className="w-4 h-4" />
                  )}
                  {saveToDocuments ? 'Save' : 'Download PDF'}
                </button>
              </div>
            </div>
          </div>

          {/* Preview Column */}
          <div
            className="bg-white rounded-xl border border-primary-200/60 overflow-hidden"
            style={{ boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.05)' }}
          >
            <div
              className="px-5 py-4 border-b border-primary-100 flex items-center justify-between"
              style={{ background: 'linear-gradient(to bottom, #fafbfc, #f8fafc)' }}
            >
              <h2 className="text-base font-semibold text-primary-900">Preview</h2>
              {previewHtml && (
                <button
                  onClick={handlePreview}
                  className="text-sm text-primary-600 hover:text-primary-800 flex items-center gap-1"
                >
                  <FiRefreshCw className="w-3.5 h-3.5" />
                  Refresh
                </button>
              )}
            </div>
            <div className="p-2 h-[600px] overflow-auto bg-gray-100">
              {previewHtml ? (
                <iframe
                  srcDoc={previewHtml}
                  className="w-full h-full bg-white rounded shadow"
                  title="Document Preview"
                />
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-8">
                  <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center mb-4">
                    <FiFile className="w-8 h-8 text-primary-400" />
                  </div>
                  <p className="text-primary-600 font-medium">No Preview Yet</p>
                  <p className="text-sm text-primary-400 mt-1">
                    Fill in the form and click "Preview" to see your document
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplateGenerator;
