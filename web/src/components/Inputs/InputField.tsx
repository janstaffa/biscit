import { ErrorMessage, Field } from 'formik';
import React, { InputHTMLAttributes } from 'react';

type InputFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  name: string;
  label: string;
};

const InputField: React.FC<InputFieldProps> = ({ label, ...props }) => {
  //   const [field, { error }] = useField(props);

  return (
    <div className="w-full my-2">
      <label htmlFor={props.name} className="text-light font-opensans">
        {label}
      </label>
      <Field
        {...props}
        // {...field}
        id={props.name}
        name={props.name}
        placeholder={props.placeholder}
        className="block w-full outline-none h-10 text-base px-3 rounded-md focus:ring-inset focus:ring-2 bg-dark-50 text-light"
      />
      <ErrorMessage
        name={props.name}
        component="div"
        className="text-red-700"
      />
    </div>
  );
};

export default InputField;
