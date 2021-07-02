import React from 'react';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import PageNotFound from './pages/404';
import AllFriends from './pages/AllFriends';
import AllThreads from './pages/AllThreads';
import Chat from './pages/Chat';
import Home from './pages/Home';
import Login from './pages/Login';
import MyThreads from './pages/MyThreads';
import OnlineFriends from './pages/OnlineFriends';
import PendingRequests from './pages/PendingRequests';
import ProtectedWrap from './pages/ProtectedWrap';
import Register from './pages/Register';
import Settings from './pages/Settings';
import { AuthProvider } from './providers/AuthProvider';
import { useAuthStore } from './stores/useAuthStore';
import { PrivateRoute } from './utils/PrivateRoute';

const App: React.FC = () => {
  const { authenticated } = useAuthStore();

  return (
    <>
      <AuthProvider authenticated={authenticated}>
        <HelmetProvider>
          <Helmet>
            <link rel="icon" href="/logo_browser.gif" />
          </Helmet>
          <div className="App">
            <Router>
              <Switch>
                {/* public pages */}
                <Route path="/" exact={true}>
                  <Home />
                </Route>
                <Route path="/login">
                  <Login />
                </Route>
                <Route path="/register">
                  <Register />
                </Route>

                {/* private pages */}
                <PrivateRoute path="/app*">
                  <ProtectedWrap>
                    <PrivateRoute path="/app/friends/all">
                      <AllFriends />
                    </PrivateRoute>
                    <PrivateRoute path="/app/friends/online">
                      <OnlineFriends />
                    </PrivateRoute>
                    <PrivateRoute path="/app/friends/pending">
                      <PendingRequests />
                    </PrivateRoute>

                    <PrivateRoute path="/app/threads/all">
                      <AllThreads />
                    </PrivateRoute>
                    <PrivateRoute path="/app/threads/my">
                      <MyThreads />
                    </PrivateRoute>

                    <PrivateRoute path="/app/chat/:id">
                      <Chat />
                    </PrivateRoute>

                    <PrivateRoute path="/app/settings">
                      <Settings />
                    </PrivateRoute>
                  </ProtectedWrap>
                </PrivateRoute>

                <Route path="*">
                  <PageNotFound />
                </Route>
              </Switch>
            </Router>
          </div>
        </HelmetProvider>
      </AuthProvider>
    </>
  );
};

export default App;
