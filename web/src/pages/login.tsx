import { Form, Formik } from 'formik';
import Head from 'next/head';
import Link from 'next/link';
import React, { useState } from 'react';
import * as yup from 'yup';
import SubmitButton from '../components/Buttons/SubmitButton';
import HomeNav from '../components/Home/Navbar';
import InputField from '../components/Inputs/InputField';
import { useLoginMutation } from '../generated/graphql';

const LoginSchema = yup.object().shape({
  usernameOrEmail: yup.string().required('username or email is required'),
  password: yup.string().required('password is required'),
});

const Login: React.FC = () => {
  const [formErrors, setFormErrors] = useState<{
    usernameOrEmail: string;
    password: string;
  }>();
  const { mutate, error } = useLoginMutation({
    onSuccess: (data) => console.log(data),
    onError: (err) => {
      console.log(err);
      // const formatedErr = JSON.parse(err);
      // console.log(formatedErr);
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
          <div className="w-1/4 h-96 bg-dark-200 p-10 rounded-xl">
            <p className="text-light text-xl font-bold">Login</p>
            <Formik
              initialValues={{ usernameOrEmail: '', password: '' }}
              validationSchema={LoginSchema}
              validateOnBlur={false}
              onSubmit={async (values, { setSubmitting, setErrors }) => {
                mutate({ options: values });
                setSubmitting(false);
              }}
            >
              {({ isSubmitting }) => (
                <Form>
                  <InputField
                    name="usernameOrEmail"
                    label="Username or email"
                    type="text"
                    autoComplete="username"
                    placeholder="example@example.com"
                  />
                  <InputField
                    name="password"
                    label="Password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
                  />
                  <div className="text-right text-light">
                    Don't have an account?{' '}
                    <span className="text-accent hover:text-accent-hover hover:underline">
                      <Link href="/register">register</Link>
                    </span>
                  </div>
                  <SubmitButton disabled={isSubmitting}>Login</SubmitButton>
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
