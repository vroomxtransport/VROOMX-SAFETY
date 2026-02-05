const TabButton = ({ active, onClick, children, icon: Icon, badge }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all ${
      active
        ? 'bg-primary-500 text-white shadow-md'
        : 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
    }`}
  >
    {Icon && <Icon className="w-4 h-4" />}
    {children}
    {badge !== undefined && badge > 0 && (
      <span className={`ml-1.5 px-1.5 py-0.5 text-xs rounded-full ${active ? 'bg-white/20' : 'bg-zinc-200 dark:bg-zinc-700'}`}>
        {badge}
      </span>
    )}
  </button>
);

export default TabButton;
