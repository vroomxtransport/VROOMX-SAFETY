import React from 'react';

const TabNav = ({ tabs, activeTab, onChange }) => (
  <div className="flex overflow-x-auto flex-nowrap border-b border-primary-200 mb-4 lg:mb-6">
    {tabs.map(tab => (
      <button
        key={tab.key}
        onClick={() => onChange(tab.key)}
        className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap
          ${activeTab === tab.key
            ? 'border-accent-500 text-primary-800'
            : 'border-transparent text-primary-500 hover:text-primary-700 hover:border-primary-300'}`}
      >
        {tab.icon && <tab.icon className="w-4 h-4" />}
        <span>{tab.label}</span>
        {tab.badge && (
          <span className="ml-1 px-1.5 py-0.5 text-[10px] font-semibold bg-info-100 text-info-700 rounded">
            {tab.badge}
          </span>
        )}
      </button>
    ))}
  </div>
);

export default TabNav;
