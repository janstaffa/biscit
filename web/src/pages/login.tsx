import { Form, Formik } from 'formik';
import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useHistory } from 'react-router-dom';
import * as yup from 'yup';
import SubmitButton from '../components/Buttons/SubmitButton';
import HomeNav from '../components/Home/Navbar';
import InputField from '../components/Inputs/InputField';
import { genericErrorMessage } from '../constants';
import { useLoginMutation } from '../generated/graphql';
import { useAuth } from '../providers/AuthProvider';
import { errorToast } from '../utils/toasts';
import { toErrorMap } from '../utils/toErrorMap';

const LoginSchema = yup.object().shape({
  usernameOrEmail: yup.string().required('username or email is required'),
  password: yup.string().required('password is required')
});

const Login: React.FC = () => {
  const { setAuthenticated } = useAuth();

  const { mutate: login } = useLoginMutation();
  const history = useHistory();

  const ls = localStorage.getItem('auth');
  if (ls) {
    const isAuth = JSON.parse(ls).value;
    if (isAuth) {
      history.replace('/app/friends/all');
    }
  }
  return (
    <>
      <Helmet>
        <title>Biscit | Login</title>
      </Helmet>
      <div className="w-screen h-screen">
        <HomeNav />
        <div className="w-full flex flex-row justify-center items-center">
          <div className="w-1/4 h-96 bg-dark-200 p-10 rounded-xl" style={{ minWidth: '300px' }}>
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
                          localStorage.setItem('auth', JSON.stringify({ value: true }));
                          history.replace('/app/friends/all');
                        } else {
                          errorToast(genericErrorMessage);
                        }
                      }
                    }
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
                    Don't have an account?
                    <span className="text-accent hover:text-accent-hover hover:underline">
                      <Link to="/register">register</Link>
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

export default Login;
