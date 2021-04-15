import { ButtonHTMLAttributes } from 'react';

type SubmitButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

const SubmitButton: React.FC<SubmitButtonProps> = ({
  children,
  className,
  onClick,
  ...props
}) => {
  return (
    <button
      type="submit"
      className="px-6 py-1.5 bg-accent hover:bg-accent-hover rounded-md font-bold mt-2"
      {...props}
      onClick={(e) => onClick?.(e)}
    >
      {children}
    </button>
  );
};

export default SubmitButton;
