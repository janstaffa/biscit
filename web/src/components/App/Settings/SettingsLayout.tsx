import React, { ReactNode, useEffect, useState } from 'react';
import { currentUrl } from '../../../constants';
import Layout from '../Layout';

export interface SettingsLayoutProps {
  children: ReactNode;
}

const SettingsLayout: React.FC<SettingsLayoutProps> = ({ children }) => {
  const [currentPath, setCurrentPath] = useState<string>();

  useEffect(() => {
    setCurrentPath(currentUrl()?.pathname);
  }, [currentUrl()]);

  return (
    <Layout>
      <div className="w-full h-full overflow-hidden relative">{children} </div>
    </Layout>
  );
};

export default SettingsLayout;
