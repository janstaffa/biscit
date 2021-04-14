import React, { createContext } from 'react';

const AuthContext = createContext({
  isAuthenticated: false,
  setAuthenticated: (bool: boolean) => {},
});

export const AuthProvider = ({ children, authenticated }) => {
  const [isAuthenticated, setAuthenticated] = React.useState(authenticated);
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

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function useIsAuthenticated() {
  const context = useAuth();
  return context.isAuthenticated;
}
