import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { setupAxiosInterceptors } from '../api';

const useAuthRequired = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  useEffect(() => {
    setupAxiosInterceptors(navigate, dispatch);
  }, [navigate, dispatch]);
};

const AuthRequired = ({ children }) => {
  useAuthRequired();
  return children;
}

export default AuthRequired;