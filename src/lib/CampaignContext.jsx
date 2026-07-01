import React, { createContext, useContext } from 'react';
import { getSystem } from './systems';

const CampaignContext = createContext(null);

export function CampaignProvider({ campaign, children }) {
  const system = getSystem(campaign);
  return (
    <CampaignContext.Provider value={{ campaign, system }}>
      {children}
    </CampaignContext.Provider>
  );
}

export function useCampaign() {
  const ctx = useContext(CampaignContext);
  if (!ctx) return { campaign: null, system: getSystem() };
  return ctx;
}
