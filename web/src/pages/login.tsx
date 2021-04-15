import { Form, Formik } from 'formik';
import { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import router from 'next/router';
import React from 'react';
import * as yup from 'yup';
import SubmitButton from '../components/Buttons/SubmitButton';
import HomeNav from '../components/Home/Navbar';
import InputField from '../components/Inputs/InputField';
import { genericErrorMessage } from '../constants';
import { useLoginMutation } from '../generated/graphql';
import { useAuth } from '../providers/AuthProvider';
import { errorToast } from '../utils/toasts';
import { toErrorMap } from '../utils/toErrorMap';
import withNoAuth from '../utils/withNoAuth';

const LoginSchema = yup.object().shape({
  usernameOrEmail: yup.string().required('username or email is required'),
  password: yup.string().required('password is required'),
});

const Login: NextPage = () => {
  const { setAuthenticated } = useAuth();

  const { mutate: login } = useLoginMutation({
    onError: (err) => {
      console.error(err);
      errorToast(genericErrorMessage);
    },
  });

  return (
    <>
      <Head>
        <title>Biscit | Login</title>
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
                await login(
                  { options: values },
                  {
                    onSuccess: (data) => {
                      if (data.UserLogin.errors.length > 0) {
                        const errorMap = toErrorMap(data.UserLogin.errors);
                        if (errorMap) {
                          setErrors(errorMap);
                        }
                      } else {
                        if (data.UserLogin.data) {
                          setAuthenticated(true);
                          router.replace('/app/friends/all');
                        } else {
                          errorToast(genericErrorMessage);
                        }
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
                  <SubmitButton disabled={isSubmitting} id="login_button">
                    Login
                  </SubmitButton>
                </Form>
              )}
            </Formik>
          </div>
        </div>
      </div>
    </>
  );
};

export default withNoAuth(Login);
