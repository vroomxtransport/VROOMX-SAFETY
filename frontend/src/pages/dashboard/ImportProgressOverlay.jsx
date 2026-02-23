import { FiRefreshCw, FiCheckCircle } from 'react-icons/fi';

const ImportProgressOverlay = ({ importProgress, syncStatus, syncing, onSyncNow }) => {
  const isNewCompany = !syncStatus?.lastSync && !syncing;

  if (!isNewCompany) return null;

  return (
    <div className="card border-2 border-primary-500/30 bg-primary-50/50 dark:bg-primary-500/10 p-6">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-primary-500/20 flex items-center justify-center flex-shrink-0">
          <FiRefreshCw className="w-6 h-6 text-primary-500 animate-spin" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-100 mb-1">Setting up your FMCSA profile...</h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-300 mb-4">We're importing your carrier data from FMCSA. This usually takes 30-60 seconds.</p>

          <div className="space-y-3">
            {[
              { label: 'Fetching CSA scores', done: importProgress?.csaScoresSynced },
              { label: 'Importing inspection history', done: importProgress?.violationsSynced },
              { label: 'Analyzing violations', done: importProgress?.inspectionsSynced },
              { label: 'Calculating compliance score', done: importProgress?.complianceScoreCalculated }
            ].map((step, i) => (
              <div key={i} className="flex items-center gap-3">
                {step.done ? (
                  <FiCheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-zinc-300 dark:border-zinc-600 flex-shrink-0" />
                )}
                <span className={`text-sm ${step.done ? 'text-emerald-700 dark:text-emerald-400 font-medium' : 'text-zinc-500 dark:text-zinc-400'}`}>
                  {step.label}
                </span>
              </div>
            ))}
          </div>

          {!importProgress && (
            <button onClick={onSyncNow} className="btn btn-primary btn-sm mt-4">
              Start Import Now
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImportProgressOverlay;
