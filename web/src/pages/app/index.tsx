import { toast } from 'react-toastify';
export interface AppProps {}
const notify = () =>
  toast.error('Wow so easy !', { position: toast.POSITION.BOTTOM_RIGHT });

const App: React.FC<AppProps> = () => {
  return (
    <div className="text-white text-xl">
      App page
      <button onClick={notify}>show</button>
    </div>
  );
};

export default App;
