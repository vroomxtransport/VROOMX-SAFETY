import { useState, useEffect } from 'react';
import { clearinghouseAPI, drugAlcoholAPI } from '../../utils/api';
import { formatDate } from '../../utils/helpers';
import toast from 'react-hot-toast';
import {
  FiUser, FiClipboard, FiHeart, FiCheckSquare, FiRefreshCw,
  FiCheckCircle, FiArrowRight, FiShield, FiInfo, FiX
} from 'react-icons/fi';
import LoadingSpinner from '../LoadingSpinner';
import Modal from '../Modal';

const STAGES = [
  { key: 'sap_referral', label: 'SAP Referral', icon: FiUser, color: 'border-red-500 bg-red-50 dark:bg-red-500/10' },
  { key: 'evaluation', label: 'Evaluation', icon: FiClipboard, color: 'border-orange-500 bg-orange-50 dark:bg-orange-500/10' },
  { key: 'treatment', label: 'Treatment', icon: FiHeart, color: 'border-amber-500 bg-amber-50 dark:bg-amber-500/10' },
  { key: 'rtd_test', label: 'RTD Test', icon: FiCheckSquare, color: 'border-blue-500 bg-blue-50 dark:bg-blue-500/10' },
  { key: 'follow_up', label: 'Follow-Up', icon: FiRefreshCw, color: 'border-purple-500 bg-purple-50 dark:bg-purple-500/10' },
  { key: 'cleared', label: 'Cleared', icon: FiCheckCircle, color: 'border-green-500 bg-green-50 dark:bg-green-500/10' }
];

const ClearinghouseRTD = () => {
  const [pipeline, setPipeline] = useState(null);
  const [loading, setLoading] = useState(true);
  const [totalActive, setTotalActive] = useState(0);

  // Detail modal
  const [selectedTest, setSelectedTest] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    fetchPipeline();
  }, []);

  const fetchPipeline = async () => {
    setLoading(true);
    try {
      const res = await clearinghouseAPI.getRtdPipeline();
      setPipeline(res.data.pipeline);
      setTotalActive(res.data.totalActive);
    } catch (err) {
      toast.error('Failed to load RTD pipeline');
    } finally {
      setLoading(false);
    }
  };

  const openDetail = (test) => {
    setSelectedTest(test);
    setShowDetailModal(true);
  };

  if (loading) {
    return <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>;
  }

  // Check if all stages are empty
  const allEmpty = pipeline && Object.values(pipeline).every(arr => arr.length === 0);

  if (allEmpty) {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/60 dark:border-zinc-800 p-8 text-center">
        <FiShield className="w-12 h-12 text-green-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">No Active Return-to-Duty Cases</h3>
        <p className="text-zinc-500 dark:text-zinc-400 max-w-md mx-auto">
          The Return-to-Duty process applies when a driver has a positive drug/alcohol test or test refusal.
          Drivers must complete SAP evaluation, treatment, and follow-up testing before returning to safety-sensitive duties.
        </p>
        <div className="mt-6 flex items-center justify-center gap-8 text-xs text-zinc-400">
          {STAGES.slice(0, -1).map((s, i) => (
            <div key={s.key} className="flex items-center gap-2">
              <s.icon className="w-4 h-4" />
              <span>{s.label}</span>
              {i < STAGES.length - 2 && <FiArrowRight className="w-3 h-3" />}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
        <FiInfo className="w-4 h-4" />
        <span>{totalActive} active case{totalActive !== 1 ? 's' : ''} in the Return-to-Duty pipeline</span>
      </div>

      {/* Pipeline Stages */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {STAGES.map(stage => {
          const items = pipeline?.[stage.key] || [];
          if (items.length === 0 && stage.key === 'cleared') return null; // Hide cleared if empty
          const Icon = stage.icon;

          return (
            <div key={stage.key} className={`rounded-xl border-t-4 ${stage.color} border border-zinc-200/60 dark:border-zinc-800 overflow-hidden`}>
              {/* Stage Header */}
              <div className="px-4 py-3 flex items-center justify-between bg-white/50 dark:bg-zinc-900/50">
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
                  <h4 className="text-sm font-semibold text-zinc-900 dark:text-white">{stage.label}</h4>
                </div>
                <span className="text-xs font-bold text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">
                  {items.length}
                </span>
              </div>

              {/* Driver Cards */}
              <div className="p-3 space-y-2 max-h-64 overflow-y-auto">
                {items.length === 0 ? (
                  <p className="text-xs text-zinc-400 text-center py-4">No drivers in this stage</p>
                ) : (
                  items.map(t => {
                    const rtd = t.returnToDuty;
                    return (
                      <button
                        key={t._id}
                        onClick={() => openDetail(t)}
                        className="w-full text-left p-3 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
                      >
                        <p className="text-sm font-medium text-zinc-900 dark:text-white">
                          {t.driverId?.firstName} {t.driverId?.lastName}
                        </p>
                        <p className="text-xs text-zinc-500 mt-1">
                          {stage.key === 'sap_referral' && rtd?.sapReferralDate && `Referred: ${formatDate(rtd.sapReferralDate)}`}
                          {stage.key === 'evaluation' && rtd?.sapName && `SAP: ${rtd.sapName}`}
                          {stage.key === 'treatment' && rtd?.treatmentRequired && 'Treatment in progress'}
                          {stage.key === 'rtd_test' && 'Awaiting RTD test'}
                          {stage.key === 'follow_up' && rtd?.followUpPlan &&
                            `Tests: ${rtd.followUpPlan.testsCompleted || 0} / ${rtd.followUpPlan.minTests || 6}`}
                          {stage.key === 'cleared' && rtd?.clearedDate && `Cleared: ${formatDate(rtd.clearedDate)}`}
                        </p>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* RTD Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => { setShowDetailModal(false); setSelectedTest(null); }}
        title="Return-to-Duty Details"
        size="lg"
      >
        {selectedTest && (
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
            {/* Driver Info */}
            <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-4">
              <h4 className="font-semibold text-zinc-900 dark:text-white">
                {selectedTest.driverId?.firstName} {selectedTest.driverId?.lastName}
              </h4>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                Original violation: {selectedTest.overallResult} — {selectedTest.testType?.replace('_', ' ')} on {formatDate(selectedTest.testDate)}
              </p>
            </div>

            {/* Timeline */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-zinc-900 dark:text-white">Process Timeline</h4>
              <div className="space-y-0 pl-4 border-l-2 border-zinc-200 dark:border-zinc-700">
                {/* SAP Referral */}
                <TimelineItem
                  label="SAP Referral"
                  date={selectedTest.returnToDuty?.sapReferralDate}
                  detail={selectedTest.returnToDuty?.sapName ? `SAP: ${selectedTest.returnToDuty.sapName}` : null}
                />
                {/* Initial Evaluation */}
                <TimelineItem
                  label="Initial Evaluation"
                  date={selectedTest.returnToDuty?.initialEvaluationDate}
                />
                {/* Treatment */}
                {selectedTest.returnToDuty?.treatmentRequired && (
                  <TimelineItem
                    label="Treatment"
                    date={selectedTest.returnToDuty?.treatmentCompletionDate}
                    detail={selectedTest.returnToDuty?.treatmentCompleted ? 'Completed' : 'In progress'}
                    status={selectedTest.returnToDuty?.treatmentCompleted ? 'complete' : 'active'}
                  />
                )}
                {/* Follow-up Evaluation */}
                <TimelineItem
                  label="Follow-Up Evaluation"
                  date={selectedTest.returnToDuty?.followUpEvaluationDate}
                />
                {/* RTD Test */}
                <TimelineItem
                  label="Return-to-Duty Test"
                  date={selectedTest.returnToDuty?.rtdTestDate}
                  detail={selectedTest.returnToDuty?.rtdTestResult ? `Result: ${selectedTest.returnToDuty.rtdTestResult}` : null}
                />
                {/* Follow-Up Tests */}
                {selectedTest.returnToDuty?.followUpPlan && (
                  <TimelineItem
                    label="Follow-Up Testing Plan"
                    detail={`${selectedTest.returnToDuty.followUpPlan.testsCompleted || 0} of ${selectedTest.returnToDuty.followUpPlan.minTests || 6} tests completed`}
                    status={
                      (selectedTest.returnToDuty.followUpPlan.testsCompleted || 0) >= (selectedTest.returnToDuty.followUpPlan.minTests || 6)
                        ? 'complete' : 'active'
                    }
                  />
                )}
                {/* Cleared */}
                <TimelineItem
                  label="Cleared for Duty"
                  date={selectedTest.returnToDuty?.clearedDate}
                  status={selectedTest.returnToDuty?.clearedForDuty ? 'complete' : 'pending'}
                />
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

const TimelineItem = ({ label, date, detail, status }) => {
  const isComplete = date || status === 'complete';
  const isActive = status === 'active';

  return (
    <div className="relative pl-6 pb-4">
      <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 ${
        isComplete
          ? 'bg-green-500 border-green-500'
          : isActive
            ? 'bg-amber-500 border-amber-500'
            : 'bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-600'
      }`}>
        {isComplete && <FiCheckCircle className="w-3 h-3 text-white absolute top-0 left-0" />}
      </div>
      <p className={`text-sm font-medium ${isComplete ? 'text-zinc-900 dark:text-white' : 'text-zinc-500 dark:text-zinc-400'}`}>
        {label}
      </p>
      {date && <p className="text-xs text-zinc-500 mt-0.5">{formatDate(date)}</p>}
      {detail && <p className="text-xs text-zinc-400 mt-0.5">{detail}</p>}
    </div>
  );
};

export default ClearinghouseRTD;
