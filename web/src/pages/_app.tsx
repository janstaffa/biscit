import { QueryClient, QueryClientProvider } from 'react-query';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../styles/fonts.css';
import '../styles/globals.css';
const queryClient = new QueryClient();
interface appProps {
  Component: React.ElementType;
  pageProps: any;
}
toast.configure();

const App: React.FC<appProps> = ({ Component, pageProps }) => {
  return (
    <QueryClientProvider client={queryClient}>
      <Component {...pageProps} />
      <ToastContainer />
    </QueryClientProvider>
  );
};

export default App;
