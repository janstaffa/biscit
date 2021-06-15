// export interface CallingDialogProps {}
import { HiPhoneMissedCall } from 'react-icons/hi';
const CallingDialog: React.FC = () => {
  return (
    <div
      className="w-72 h-52 bg-dark-300 absolute top-20 p-2 text-center rounded-md"
      style={{ left: 0, right: 0, marginLeft: 'auto', marginRight: 'auto' }}
    >
      <div className="w-full h-full flex flex-col">
        <div>
          <h2 className="text-light-200 text-xl">Calling...</h2>
          <h3 className="text-light-300 text-lg my-1">John</h3>
          <p className="text-light-400 mt-2">00:21</p>
        </div>
        <div className="w-full flex flex-row justify-center flex-grow items-end">
          <button className="px-3 py-1 bg-red-500 hover:bg-red-600 rounded-md mb-3 flex flex-row items-center font-roboto">
            <HiPhoneMissedCall size={20} className="mr-2" />
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default CallingDialog;
