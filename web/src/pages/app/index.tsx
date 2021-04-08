import Cookies from 'js-cookie';
import router from 'next/router';
import { useEffect } from 'react';
import { useLogoutMutation } from '../../generated/graphql';
import { errorToast } from '../../utils/toasts';
export interface AppProps {}

const App: React.FC<AppProps> = () => {
  useEffect(() => {
    const uid = Cookies.get('uid');
    if (!uid) router.replace('/login');
  }, []);
  const { mutate: logout } = useLogoutMutation({
    onError: (err) => {
      console.error(err);
      errorToast('Something went wrong, please try again later.');
    },
  });
  return (
    <div>
      {
        <button
          onClick={async () => {
            await logout(
              {},
              {
                onSuccess: (data) => {
                  if (data.UserLogout) {
                    router.replace('/');
                  } else {
                    errorToast('Something went wrong, please try again later.');
                  }
                },
              }
            );
          }}
        >
          Sign out
        </button>
      }
    </div>
  );
};

export default App;
