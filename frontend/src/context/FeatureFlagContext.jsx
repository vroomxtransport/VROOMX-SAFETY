import { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const FeatureFlagContext = createContext([]);

export const useFeatureFlag = (key) => {
  const flags = useContext(FeatureFlagContext);
  return flags.includes(key);
};

export const useFeatureFlags = () => useContext(FeatureFlagContext);

export const FeatureFlagProvider = ({ children }) => {
  const [flags, setFlags] = useState([]);

  useEffect(() => {
    api.get('/features/active')
      .then(res => setFlags(res.data.flags || []))
      .catch(() => {});
  }, []);

  return (
    <FeatureFlagContext.Provider value={flags}>
      {children}
    </FeatureFlagContext.Provider>
  );
};
