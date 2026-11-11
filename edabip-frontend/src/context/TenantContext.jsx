import { createContext, useContext } from 'react';

const TenantContext = createContext(null);

export function TenantProvider({ children }) {
  return <TenantContext.Provider value={{}}>{children}</TenantContext.Provider>;
}

export function useTenantContext() {
  return useContext(TenantContext);
}
