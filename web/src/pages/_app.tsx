import { QueryClient, QueryClientProvider } from 'react-query';
import '../styles/fonts.css';
import '../styles/globals.css';
const queryClient = new QueryClient();

interface appProps {
  Component: React.ElementType;
  pageProps: any;
}
const MyApp: React.FC<appProps> = ({ Component, pageProps }) => {
  return (
    <QueryClientProvider client={queryClient}>
      <Component {...pageProps} />
    </QueryClientProvider>
  );
};

export default MyApp;
