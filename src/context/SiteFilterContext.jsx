// src/context/SiteFilterContext.jsx

import React, { createContext, useContext, useState } from 'react';

// 1. Create Context
const SiteFilterContext = createContext();

// 2. Create Provider
export const SiteFilterProvider = ({ children }) => {
  const [siteFilter, setSiteFilter] = useState('');

  return (
    <SiteFilterContext.Provider value={{ siteFilter, setSiteFilter }}>
      {children}
    </SiteFilterContext.Provider>
  );
};

// 3. Hook for usage
export const useSiteFilter = () => useContext(SiteFilterContext);