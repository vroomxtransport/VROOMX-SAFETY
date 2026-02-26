const mongoose = require('mongoose');
const Document = require('../models/Document');

/**
 * Document Sync Service - Dual-write bridge between module-embedded docs and central Documents page.
 * All methods are fire-and-forget (never throw, log errors silently).
 */
const documentSyncService = {
  /**
   * Track a document upload by creating a linked Document record.
   * Called after every module upload.
   */
  async trackUpload({ companyId, category, sourceModel, sourceId, sourceDocId, sourceDocKey, name, documentType, fileUrl, filePath, fileSize, fileType, uploadedBy }) {
    try {
      // Determine file extension for fileType enum
      let ext = fileType;
      if (filePath && !ext) {
        ext = filePath.split('.').pop()?.toLowerCase();
      }
      const validExts = ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx', 'xls', 'xlsx'];
      if (!validExts.includes(ext)) ext = 'pdf'; // fallback

      await Document.create({
        companyId,
        category: category || 'other',
        documentType: documentType || 'other',
        name: name || 'Uploaded Document',
        fileName: name || 'document',
        fileType: ext,
        fileSize: fileSize || 0,
        filePath: filePath || fileUrl,
        fileUrl,
        uploadedBy,
        sourceModel,
        sourceId,
        sourceDocId: sourceDocId || undefined,
        sourceDocKey: sourceDocKey || undefined
      });
    } catch (err) {
      console.error('[DocumentSync] trackUpload failed:', err.message);
    }
  },

  /**
   * Remove the linked Document record when a module deletes an embedded doc.
   */
  async trackDelete({ sourceModel, sourceId, sourceDocId, sourceDocKey }) {
    try {
      const query = { sourceModel, sourceId };
      if (sourceDocId) query.sourceDocId = sourceDocId;
      if (sourceDocKey) query.sourceDocKey = sourceDocKey;
      await Document.deleteOne(query);
    } catch (err) {
      console.error('[DocumentSync] trackDelete failed:', err.message);
    }
  },

  /**
   * When Documents page deletes a record that came from a module,
   * cascade the delete back to the source module's embedded doc.
   */
  async deleteFromSource(document) {
    try {
      if (!document.sourceModel || !document.sourceId) return;

      const Model = mongoose.model(document.sourceModel);
      const record = await Model.findById(document.sourceId);
      if (!record) return;

      if (document.sourceDocId) {
        // Array-embedded doc (e.g., drugAlcohol.documents[], accidents.documents[])
        // Try common array field names
        const arrayFields = ['documents'];
        for (const field of arrayFields) {
          if (Array.isArray(record[field])) {
            const idx = record[field].findIndex(d => d._id?.toString() === document.sourceDocId.toString());
            if (idx !== -1) {
              record[field].splice(idx, 1);
              await record.save();
              return;
            }
          }
        }
        // Check dataQChallenge.supportingDocuments for violations
        if (record.dataQChallenge?.supportingDocuments) {
          const idx = record.dataQChallenge.supportingDocuments.findIndex(
            d => d._id?.toString() === document.sourceDocId.toString()
          );
          if (idx !== -1) {
            record.dataQChallenge.supportingDocuments.splice(idx, 1);
            await record.save();
            return;
          }
        }
        // Check documents.other for drivers
        if (record.documents?.other && Array.isArray(record.documents.other)) {
          const idx = record.documents.other.findIndex(d => d._id?.toString() === document.sourceDocId.toString());
          if (idx !== -1) {
            record.documents.other.splice(idx, 1);
            await record.save();
            return;
          }
        }
      } else if (document.sourceDocKey) {
        // Named field doc (e.g., driver.cdl.documentUrl, vehicle.registration.documentUrl)
        if (document.sourceDocKey === 'cdl' && record.cdl) {
          record.cdl.documentUrl = null;
        } else if (document.sourceDocKey === 'medicalCard' && record.medicalCard) {
          record.medicalCard.documentUrl = null;
        } else if (document.sourceDocKey === 'annualInspection' && record.annualInspection) {
          record.annualInspection.documentUrl = null;
        } else if (record.documents?.[document.sourceDocKey]) {
          record.documents[document.sourceDocKey].documentUrl = null;
        } else if (record[document.sourceDocKey]) {
          record[document.sourceDocKey].documentUrl = null;
        }
        await record.save();
      } else if (document.sourceModel === 'ClearinghouseQuery') {
        // Clearinghouse uses resultDocumentUrl / consent.documentUrl
        if (record.resultDocumentUrl === document.fileUrl || record.resultDocumentUrl === document.filePath) {
          record.resultDocumentUrl = null;
        } else if (record.consent?.documentUrl === document.fileUrl || record.consent?.documentUrl === document.filePath) {
          record.consent.documentUrl = null;
        }
        await record.save();
      }
    } catch (err) {
      console.error('[DocumentSync] deleteFromSource failed:', err.message);
    }
  }
};

module.exports = documentSyncService;
