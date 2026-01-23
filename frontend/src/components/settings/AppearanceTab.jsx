import { FiMoon, FiSun, FiMonitor, FiCheck } from 'react-icons/fi';

const AppearanceTab = ({ theme, setLightTheme, setDarkTheme, setSystemTheme }) => {
  const themeOptions = [
    { value: 'light', label: 'Light', description: 'Light background with dark text', icon: FiSun },
    { value: 'dark', label: 'Dark', description: 'Dark background with light text', icon: FiMoon },
    { value: 'system', label: 'System', description: 'Automatically match your device settings', icon: FiMonitor }
  ];

  return (
    <div className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
          <FiMoon className="w-4 h-4 text-zinc-600 dark:text-zinc-300" />
        </div>
        <div>
          <h3 className="font-semibold text-zinc-900 dark:text-white">Theme</h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-300">Choose how VroomX Safety looks to you</p>
        </div>
      </div>

      <div className="space-y-3 max-w-md">
        {themeOptions.map((option) => {
          const isSelected = option.value === 'system'
            ? !localStorage.getItem('vroomx-theme')
            : theme === option.value && localStorage.getItem('vroomx-theme');
          return (
            <button
              key={option.value}
              onClick={() => {
                if (option.value === 'system') setSystemTheme();
                else if (option.value === 'dark') setDarkTheme();
                else setLightTheme();
              }}
              className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                isSelected
                  ? 'border-accent-500 bg-accent-50 dark:bg-accent-500/10'
                  : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-800'
              }`}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                isSelected
                  ? 'bg-accent-500/20 text-accent-600 dark:text-accent-400'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300'
              }`}>
                <option.icon className="w-5 h-5" />
              </div>
              <div className="text-left flex-1">
                <p className={`font-medium ${isSelected ? 'text-accent-700 dark:text-accent-400' : 'text-zinc-800 dark:text-zinc-200'}`}>
                  {option.label}
                </p>
                <p className="text-sm text-zinc-600 dark:text-zinc-300">{option.description}</p>
              </div>
              {isSelected && (
                <div className="w-6 h-6 rounded-full bg-accent-500 flex items-center justify-center">
                  <FiCheck className="w-4 h-4 text-white" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default AppearanceTab;
