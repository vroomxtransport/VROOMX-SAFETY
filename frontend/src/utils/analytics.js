import posthog from 'posthog-js';

/**
 * Track a custom event with PostHog
 * @param {string} event - Event name
 * @param {object} properties - Event properties
 */
export const track = (event, properties = {}) => {
  if (typeof posthog?.capture === 'function') {
    posthog.capture(event, properties);
  }
};

// Pre-defined events for consistent tracking

// Driver events
export const trackDriverCreated = (companyId) => track('driver_created', { company_id: companyId });
export const trackDriverUpdated = (companyId) => track('driver_updated', { company_id: companyId });
export const trackDriverDeleted = (companyId) => track('driver_deleted', { company_id: companyId });

// Vehicle events
export const trackVehicleCreated = (companyId) => track('vehicle_created', { company_id: companyId });
export const trackVehicleUpdated = (companyId) => track('vehicle_updated', { company_id: companyId });
export const trackVehicleDeleted = (companyId) => track('vehicle_deleted', { company_id: companyId });

// Document events
export const trackDocumentUploaded = (docType, fileType) => track('document_uploaded', {
  document_type: docType,
  file_type: fileType
});

// Compliance events
export const trackCSAReportGenerated = () => track('csa_report_generated');
export const trackDataQLetterGenerated = () => track('dataq_letter_generated');
export const trackInspectionUploaded = (extractionMethod) => track('inspection_uploaded', {
  extraction_method: extractionMethod
});

// Alert events
export const trackAlertViewed = (alertType) => track('alert_viewed', { alert_type: alertType });
export const trackAlertResolved = (alertType) => track('alert_resolved', { alert_type: alertType });

// Violation events
export const trackViolationLinked = () => track('violation_linked');

// AI events
export const trackAIChatMessage = () => track('ai_chat_message_sent');
export const trackAIDocumentExtraction = (docType) => track('ai_document_extraction_started', {
  document_type: docType
});

// Billing events
export const trackPricingViewed = () => track('pricing_page_viewed');
export const trackCheckoutStarted = (plan) => track('checkout_started', { plan });
export const trackBillingPortalOpened = () => track('billing_portal_opened');
