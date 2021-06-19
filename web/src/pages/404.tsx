import { useState } from 'react';
import { useHistory } from 'react-router-dom';

const PageNotFound: React.FC = () => {
  const history = useHistory();
  const [time, setTime] = useState<number>(5);
  setInterval(() => {
    if (time !== 0) {
      setTime(time - 1);
    }
  }, 1000);
  setTimeout(() => {
    history.goBack();
  }, 5000);

  return (
    <div className="text-center pt-32 select-none">
      <div className="w-full flex flex-row justify-center mb-5">
        <img src="/logo_browser.gif" alt="Biscit logo" className="w-44 h-auto" />
      </div>
      <h1 className="font-opensans text-3xl text-light font-bold mb-5">404</h1>
      <p className="text-light font-roboto text-lg">
        Oops. This page was not found, you wil be redirected back. {time}
      </p>
    </div>
  );
};

export default PageNotFound;
