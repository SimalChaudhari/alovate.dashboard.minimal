import { deleteCookie } from 'src/utils/cookie';
import axios, { endpoints } from 'src/utils/axios';

import { setSession } from './utils';
import { STORAGE_KEY } from './constant';

const encodeSegment = (obj) => {
  const json = JSON.stringify(obj);
  if (typeof window !== 'undefined' && window.btoa) {
    return window.btoa(json);
  }
  return Buffer.from(json).toString('base64');
};

const createStaticToken = (user) => {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'HS256', typ: 'JWT' };
  const payload = {
    sub: user.email,
    email: user.email,
    name: user.email,
    exp: now + 60 * 60 * 24 * 3, // 3 days
  };
  return `${encodeSegment(header)}.${encodeSegment(payload)}.static-signature`;
};

const STATIC_USERS = [
  {
    email: 'info@alovate.io',
    password: '@demo1',
  },
].map((user) => ({
  ...user,
  accessToken: createStaticToken(user),
}));

/** **************************************
 * Sign in
 *************************************** */
export const signInWithPassword = async ({ email, password }) => {
  try {
    const staticUser = STATIC_USERS.find(
      (user) => user.email === email && user.password === password
    );

    if (staticUser) {
      setSession(staticUser.accessToken);
      return;
    }

    const params = { email, password };

    const res = await axios.post(endpoints.auth.signIn, params);

    const { accessToken } = res.data;

    if (!accessToken) {
      throw new Error('Please check your email and password');
    }

    setSession(accessToken);
  } catch (error) {
    console.error('Error during sign in:', error);
    throw error;
  }
};

/** **************************************
 * Sign up
 *************************************** */
export const signUp = async ({ email, password, firstName, lastName }) => {
  const params = {
    email,
    password,
    firstName,
    lastName,
  };

  try {
    const res = await axios.post(endpoints.auth.signUp, params);

    const { accessToken } = res.data;

    if (!accessToken) {
      throw new Error('Access token not found in response');
    }

    sessionStorage.setItem(STORAGE_KEY, accessToken);
  } catch (error) {
    console.error('Error during sign up:', error);
    throw error;
  }
};

/** **************************************
 * Sign out
 *************************************** */
export const signOut = async () => {
  try {
    await setSession(null);
    deleteCookie('access-token');
  } catch (error) {
    console.error('Error during sign out:', error);
    throw error;
  }
};

/** **************************************
 * Sign in With Google
 *************************************** */
export const signInWithGoogleRedirect = async () => {
  try {
    const res = await axios.get(endpoints.auth.google.redirect);
    return res.data.url;
  } catch (error) {
    console.error('Error during sign in:', error);
    throw error;
  }
};
