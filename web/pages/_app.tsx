import '../styles/fonts.css';
import '../styles/globals.css';
interface appProps {
  Component: React.ElementType;
  pageProps: any;
}
const MyApp: React.FC<appProps> = ({ Component, pageProps }) => {
  return <Component {...pageProps} />;
};

export default MyApp;
