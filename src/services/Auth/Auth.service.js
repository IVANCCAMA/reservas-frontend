import axios from 'axios';
import { storageDelete, storageGet } from '../../redux/Storage/Storage.js';

const authLogin = async (userLoginAttempt) => {
  const baseURL = import.meta.env.VITE_APP_DOMAIN;
  return await axios.post(`${baseURL}/usuarios/validar-usuario`, userLoginAttempt);
};
const authLogout = () => {
  storageDelete('usuarios');
  /* storageDelete('token'); */
};

const authCurrentUser = () => {
  return { ...storageGet('usuarios'), token: storageGet('token') };
};

export { authLogin, authLogout, authCurrentUser };
