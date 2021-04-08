import { ButtonHTMLAttributes, ReactNode } from 'react';
type TabButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  active?: boolean;
};

const TabButton: React.FC<TabButtonProps> = ({
  children,
  onClick,
  active = false,
}) => {
  return (
    <div className="w-full h-14 flex flex-col justify-center items-center select-none">
      <button
        className={
          'w-full py-3 rounded-sm text-light-200 text-lg font-roboto flex flex-row place-items-center px-4' +
          (active
            ? ' bg-dark-50'
            : ' bg-dark-200 hover:bg-dark-100 hover:text-white')
        }
        onClick={(e) => onClick?.(e)}
      >
        {children}
      </button>
    </div>
  );
};

export default TabButton;
