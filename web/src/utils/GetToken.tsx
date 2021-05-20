import { useEffect } from 'react';
import { useTokenQuery } from '../generated/graphql';
import { useTokenStore } from '../stores/useTokenStore';

const GetToken: React.FC = () => {
  const { data: token } = useTokenQuery();
  const { setToken } = useTokenStore();
  useEffect(() => {
    if (token?.token) {
      setToken(token.token);
    }
  }, [token]);
  return null;
};

export default GetToken;
