import { useState, useCallback } from 'react';
import {
  FiChevronLeft, FiChevronRight, FiCheck, FiUpload,
  FiAlertTriangle, FiCamera, FiVideo, FiUsers, FiFile,
  FiCheckCircle, FiShield
} from 'react-icons/fi';

const CRASH_TYPES = [
  { id: 1, label: 'Wrong direction / wrong side', description: 'The CMV was struck by a motorist driving the wrong direction or on the wrong side of the road.' },
  { id: 2, label: 'Rear-ended while stopped', description: 'The CMV was rear-ended while it was stopped or moving slowly in traffic.' },
  { id: 3, label: 'Under the influence (other driver)', description: 'The other driver was under the influence of alcohol or drugs at the time of the crash.' },
  { id: 4, label: 'Medical emergency (other driver)', description: 'The other driver experienced a medical emergency (heart attack, seizure, etc.) causing the crash.' },
  { id: 5, label: 'Infrastructure failure', description: 'The crash resulted from a failure of road infrastructure (signal malfunction, road collapse, etc.).' },
  { id: 6, label: 'Cargo loss from other vehicle', description: 'Cargo or debris from another vehicle caused the crash.' },
  { id: 7, label: 'Animal strike', description: 'The CMV struck an animal or swerved to avoid one, causing the crash.' },
  { id: 8, label: 'Struck by falling object', description: 'The CMV was struck by a falling object (tree limb, overhead structure, etc.).' },
  { id: 9, label: 'Illegal U-turn by other vehicle', description: 'The other vehicle made an illegal U-turn that caused the crash.' },
  { id: 10, label: 'Suicide / attempted suicide', description: 'The crash resulted from a suicide or attempted suicide by another individual.' },
  { id: 11, label: 'Other preventability type', description: 'The crash fits another FMCSA-recognized preventability category not listed above.' }
];

const CPDPWorkflow = ({ violation, onComplete }) => {
  const [step, setStep] = useState(0);
  const [crashTypeId, setCrashTypeId] = useState(null);
  const [parFile, setParFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [additionalEvidence, setAdditionalEvidence] = useState({
    scenePhotos: false,
    dashcamFootage: false,
    witnessStatements: false,
    drugAlcoholResults: false
  });

  const isCrashType = violation?.basic === 'crash_indicator' || violation?.crashRelated;
  if (!isCrashType) return null;

  const isFatalCrash = violation?.fatal || violation?.crashSeverity === 'fatal';

  const handleFileDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) setParFile(file);
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) setParFile(file);
  };

  const handleNext = () => {
    if (step < 2) {
      setStep(step + 1);
    } else {
      onComplete({
        crashTypeId,
        parUploaded: true,
        additionalEvidence
      });
    }
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const canProceed = () => {
    if (step === 0) return crashTypeId !== null;
    if (step === 1) return parFile !== null;
    return true;
  };

  const stepLabels = ['Select Crash Type', 'Upload PAR', 'Additional Evidence'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 rounded-lg bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/20">
        <FiShield className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0" />
        <div>
          <p className="font-semibold text-orange-800 dark:text-orange-300">
            Crash Preventability Determination Program (CPDP)
          </p>
          <p className="text-sm text-orange-600 dark:text-orange-400">
            Submit evidence that this crash was not preventable to have it removed from your CSA score.
          </p>
        </div>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center justify-between">
        {stepLabels.map((label, idx) => (
          <div key={idx} className="flex items-center">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors ${
              idx === step
                ? 'bg-orange-500 text-white'
                : idx < step
                ? 'bg-emerald-500 text-white'
                : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400'
            }`}>
              {idx < step ? <FiCheck className="w-4 h-4" /> : idx + 1}
            </div>
            {idx < stepLabels.length - 1 && (
              <div className={`w-16 lg:w-24 h-0.5 mx-2 ${
                idx < step ? 'bg-emerald-500' : 'bg-zinc-200 dark:bg-zinc-700'
              }`} />
            )}
          </div>
        ))}
      </div>
      <div className="flex justify-between">
        {stepLabels.map((label, idx) => (
          <span key={idx} className={`text-xs ${
            idx === step
              ? 'text-orange-600 dark:text-orange-400 font-medium'
              : 'text-zinc-400'
          }`}>
            {label}
          </span>
        ))}
      </div>

      {/* Step Content */}
      <div className="min-h-[300px]">
        {/* Step 1: Crash Type Selector */}
        {step === 0 && (
          <div className="space-y-3">
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
              Select the crash type that best describes the incident. This determines the CPDP category for your submission.
            </p>
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
              {CRASH_TYPES.map((type) => (
                <label
                  key={type.id}
                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                    crashTypeId === type.id
                      ? 'border-orange-500 bg-orange-50 dark:bg-orange-500/10'
                      : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600'
                  }`}
                >
                  <input
                    type="radio"
                    name="crashType"
                    value={type.id}
                    checked={crashTypeId === type.id}
                    onChange={() => setCrashTypeId(type.id)}
                    className="w-4 h-4 text-orange-600 mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-medium ${
                        crashTypeId === type.id
                          ? 'text-orange-700 dark:text-orange-300'
                          : 'text-zinc-700 dark:text-zinc-300'
                      }`}>
                        {type.label}
                      </span>
                      <span className="text-xs px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400">
                        Type {type.id}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                      {type.description}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: PAR Upload */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Upload the Police Accident Report (PAR) for this crash.
              </p>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400">
                Required
              </span>
            </div>

            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleFileDrop}
              className={`relative flex flex-col items-center justify-center p-8 rounded-lg border-2 border-dashed transition-all cursor-pointer ${
                dragOver
                  ? 'border-orange-500 bg-orange-50 dark:bg-orange-500/10'
                  : parFile
                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10'
                  : 'border-zinc-300 dark:border-zinc-600 hover:border-zinc-400 dark:hover:border-zinc-500'
              }`}
            >
              <input
                type="file"
                onChange={handleFileChange}
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              {parFile ? (
                <>
                  <FiCheckCircle className="w-10 h-10 text-emerald-500 mb-3" />
                  <p className="font-medium text-emerald-700 dark:text-emerald-400">{parFile.name}</p>
                  <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-1">
                    {(parFile.size / 1024).toFixed(1)} KB - Ready to submit
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">
                    Click or drag to replace
                  </p>
                </>
              ) : (
                <>
                  <FiUpload className="w-10 h-10 text-zinc-400 dark:text-zinc-500 mb-3" />
                  <p className="font-medium text-zinc-700 dark:text-zinc-300">
                    Drag & drop your PAR here
                  </p>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                    or click to browse files
                  </p>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-2">
                    PDF, JPG, PNG, DOC up to 10MB
                  </p>
                </>
              )}
            </div>

            {!parFile && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20">
                <FiAlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-700 dark:text-amber-400">
                  A Police Accident Report is required for all CPDP submissions. Without it, FMCSA will not process your request.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Additional Evidence */}
        {step === 2 && (
          <div className="space-y-4">
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
              Select any additional evidence you can provide. More evidence strengthens your case.
            </p>

            {isFatalCrash && (
              <label className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-all ${
                additionalEvidence.drugAlcoholResults
                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10'
                  : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300'
              }`}>
                <input
                  type="checkbox"
                  checked={additionalEvidence.drugAlcoholResults}
                  onChange={(e) => setAdditionalEvidence(prev => ({ ...prev, drugAlcoholResults: e.target.checked }))}
                  className="w-4 h-4 text-emerald-600 rounded"
                />
                <FiFile className="w-5 h-5 text-purple-500 flex-shrink-0" />
                <div className="flex-grow">
                  <span className="text-zinc-700 dark:text-zinc-300 font-medium">Drug/Alcohol Test Results</span>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    Required for fatal crash CPDP submissions
                  </p>
                </div>
                {additionalEvidence.drugAlcoholResults && <FiCheck className="w-5 h-5 text-emerald-500 flex-shrink-0" />}
              </label>
            )}

            <label className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-all ${
              additionalEvidence.scenePhotos
                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10'
                : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300'
            }`}>
              <input
                type="checkbox"
                checked={additionalEvidence.scenePhotos}
                onChange={(e) => setAdditionalEvidence(prev => ({ ...prev, scenePhotos: e.target.checked }))}
                className="w-4 h-4 text-emerald-600 rounded"
              />
              <FiCamera className="w-5 h-5 text-blue-500 flex-shrink-0" />
              <div className="flex-grow">
                <span className="text-zinc-700 dark:text-zinc-300 font-medium">Scene Photos</span>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Photos of the crash scene, vehicle damage, road conditions
                </p>
              </div>
              {additionalEvidence.scenePhotos && <FiCheck className="w-5 h-5 text-emerald-500 flex-shrink-0" />}
            </label>

            <label className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-all ${
              additionalEvidence.dashcamFootage
                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10'
                : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300'
            }`}>
              <input
                type="checkbox"
                checked={additionalEvidence.dashcamFootage}
                onChange={(e) => setAdditionalEvidence(prev => ({ ...prev, dashcamFootage: e.target.checked }))}
                className="w-4 h-4 text-emerald-600 rounded"
              />
              <FiVideo className="w-5 h-5 text-indigo-500 flex-shrink-0" />
              <div className="flex-grow">
                <span className="text-zinc-700 dark:text-zinc-300 font-medium">Dashcam Footage</span>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Forward or cabin-facing dashcam video of the incident
                </p>
              </div>
              {additionalEvidence.dashcamFootage && <FiCheck className="w-5 h-5 text-emerald-500 flex-shrink-0" />}
            </label>

            <label className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-all ${
              additionalEvidence.witnessStatements
                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10'
                : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300'
            }`}>
              <input
                type="checkbox"
                checked={additionalEvidence.witnessStatements}
                onChange={(e) => setAdditionalEvidence(prev => ({ ...prev, witnessStatements: e.target.checked }))}
                className="w-4 h-4 text-emerald-600 rounded"
              />
              <FiUsers className="w-5 h-5 text-amber-500 flex-shrink-0" />
              <div className="flex-grow">
                <span className="text-zinc-700 dark:text-zinc-300 font-medium">Witness Statements</span>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Written or recorded statements from witnesses to the crash
                </p>
              </div>
              {additionalEvidence.witnessStatements && <FiCheck className="w-5 h-5 text-emerald-500 flex-shrink-0" />}
            </label>

            {/* Summary */}
            <div className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-800 mt-4">
              <h4 className="font-medium text-zinc-900 dark:text-white mb-2">Submission Summary</h4>
              <div className="text-sm text-zinc-600 dark:text-zinc-400 space-y-1">
                <p>Crash Type: <span className="font-medium text-zinc-700 dark:text-zinc-300">
                  {CRASH_TYPES.find(t => t.id === crashTypeId)?.label || 'Not selected'}
                </span></p>
                <p>PAR: <span className="font-medium text-emerald-600 dark:text-emerald-400">
                  {parFile?.name || 'Not uploaded'}
                </span></p>
                <p>Additional Evidence: <span className="font-medium text-zinc-700 dark:text-zinc-300">
                  {Object.values(additionalEvidence).filter(Boolean).length} item(s)
                </span></p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-4 border-t border-zinc-200 dark:border-zinc-700">
        <button
          onClick={handleBack}
          disabled={step === 0}
          className="btn btn-secondary"
        >
          <FiChevronLeft className="w-4 h-4" />
          Back
        </button>
        <button
          onClick={handleNext}
          disabled={!canProceed()}
          className="btn btn-primary"
        >
          {step === 2 ? (
            <>
              <FiCheck className="w-4 h-4" />
              Complete
            </>
          ) : (
            <>
              Next
              <FiChevronRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default CPDPWorkflow;
