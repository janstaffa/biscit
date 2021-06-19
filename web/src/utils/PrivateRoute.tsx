import { Redirect, Route } from 'react-router-dom';

export const PrivateRoute = ({ children, ...rest }) => {
  const ls = localStorage.getItem('auth');
  let isAuth = false;
  if (ls) {
    isAuth = JSON.parse(ls).value;
  }

  return (
    <Route
      {...rest}
      render={({ location }) =>
        isAuth ? (
          children
        ) : (
          <Redirect
            to={{
              pathname: '/login',
              state: { from: location }
            }}
          />
        )
      }
    />
  );
};
