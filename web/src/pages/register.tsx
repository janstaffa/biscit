import { Form, Formik } from 'formik';
import Head from 'next/head';
import Link from 'next/link';
import React from 'react';
import * as yup from 'yup';
import SubmitButton from '../components/Buttons/SubmitButton';
import HomeNav from '../components/Home/Navbar';
import InputField from '../components/Inputs/InputField';
import { useRegisterMutation } from '../generated/graphql';
import { toErrorMap } from '../utils/toErrorMap';

const RegisterSchema = yup.object().shape({
  username: yup
    .string()
    .required('username is required')
    .test(
      'username',
      "username can't contain a @",
      (value) => !value?.includes('@')
    )
    .min(5, 'username must have at least 5 characters'),
  email: yup
    .string()
    .required('email is required')
    .email('this email is invalid'),
  password: yup
    .string()
    .required('password is required')
    .matches(/[0-9]/, { message: 'password must contain a number' })
    .min(5, 'password must have at least 5 characters'),
  confirmPassword: yup
    .string()
    .test('confirmPassword', "passwords don't match", function (value) {
      return this.parent.password === value;
    }),
});

const Login: React.FC = () => {
  const { mutate: register } = useRegisterMutation({
    onError: (err) => {
      console.error(err);
    },
  });
  return (
    <>
      <Head>
        <title>Biscit | Login</title>
        <link rel="icon" href="/logo_browser.gif" />
      </Head>
      <div className="w-screen h-screen">
        <HomeNav />
        <div className="w-full flex flex-row justify-center items-center">
          <div className="w-1/4 h-auto bg-dark-200 p-10 rounded-xl">
            <p className="text-light text-xl font-bold">Register</p>
            <Formik
              initialValues={{
                username: '',
                email: '',
                password: '',
                confirmPassword: '',
              }}
              validationSchema={RegisterSchema}
              validateOnBlur={false}
              onSubmit={async (values, { setSubmitting, setErrors }) => {
                await register(
                  { options: values },
                  {
                    onSuccess: (data) => {
                      if (data.UserRegister.errors) {
                        const errorMap = toErrorMap(data.UserRegister.errors);
                        if (errorMap) {
                          setErrors(errorMap);
                        }
                      } else {
                        console.log(data);
                      }
                    },
                  }
                );
                setSubmitting(false);
              }}
            >
              {({ isSubmitting }) => (
                <Form>
                  <InputField
                    name="username"
                    label="Username"
                    type="text"
                    autoComplete="username"
                    placeholder="babel"
                  />
                  <InputField
                    name="email"
                    label="Email"
                    type="email"
                    autoComplete="email"
                    placeholder="example@example.com"
                  />
                  <InputField
                    name="password"
                    label="Password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
                  />
                  <InputField
                    name="confirmPassword"
                    label="Password again"
                    type="password"
                    autoComplete="current-password"
                    placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
                  />
                  <div className="text-right text-light">
                    Already have an account?{' '}
                    <span className="text-accent hover:text-accent-hover hover:underline">
                      <Link href="/login">login</Link>
                    </span>
                  </div>
                  <SubmitButton disabled={isSubmitting}>Register</SubmitButton>
                </Form>
              )}
            </Formik>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;
