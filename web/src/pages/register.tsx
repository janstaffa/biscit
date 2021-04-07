import { Form, Formik } from 'formik';
import Head from 'next/head';
import Link from 'next/link';
import React from 'react';
import * as yup from 'yup';
import SubmitButton from '../components/Buttons/SubmitButton';
import HomeNav from '../components/Home/Navbar';
import InputField from '../components/Inputs/InputField';

const RegisterSchema = yup.object().shape({
  username: yup.string().required('username is required'),
  email: yup
    .string()
    .required('email is required')
    .email('this email is invalid'),
  password: yup
    .string()
    .required('password is required')
    .matches(/[0-9]/, { message: 'password must contain a number' }),
  confirmPassword: yup
    .string()
    .test('confirmPassword', "passwords don't match", function (value) {
      return this.parent.password === value;
    }),
});

const Login: React.FC = () => {
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
              onSubmit={(values, { setSubmitting, setErrors }) => {
                alert(JSON.stringify(values, null, 2));
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
