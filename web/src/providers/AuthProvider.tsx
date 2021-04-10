import React, { createContext, Dispatch, useContext, useState } from 'react';

interface AuthContext {
  isAuthenticated: boolean;
  setAuthenticated: Dispatch<any>;
}
const AuthContext = createContext<AuthContext>({
  isAuthenticated: false,
  setAuthenticated: () => {},
});

export const AuthProvider = ({ children, authenticated }) => {
  const [isAuthenticated, setAuthenticated] = useState(authenticated);
  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        setAuthenticated,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('AuthProvider context provider is missing');
  }
  return context;
};

export const useIsAuthenticated = () => {
  const context = useAuth();
  return context.isAuthenticated;
};
