import '../styles/globals.scss';

interface appProps {
  Component: React.ElementType;
  pageProps: any;
}
const MyApp: React.FC<appProps> = ({ Component, pageProps }) => {
  return <Component {...pageProps} />;
};

export default MyApp;
