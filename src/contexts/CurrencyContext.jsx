import React, { createContext, useState, useContext, useCallback } from 'react';

const CurrencyContext = createContext();

export const useCurrency = () => useContext(CurrencyContext);

export const CurrencyProvider = ({ children }) => {
  const [currency, setCurrency] = useState('BGN');

  const formatCurrency = useCallback((value) => {
    const numberValue = Number(value) || 0;
    if (currency === 'USD') {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(numberValue);
    }
    return new Intl.NumberFormat('bg-BG', { style: 'currency', currency: 'BGN' }).format(numberValue);
  }, [currency]);

  const value = {
    currency,
    setCurrency,
    formatCurrency,
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
};