import axios from 'axios';
import { invalidateUser } from '../redux/slices/userSignInSlice';

export const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
}); 

export function setupAxiosInterceptors(navigate, dispatch) {
  apiClient.interceptors.response.use(response => {
    return response;
  }, error => {
    if (error.response && error.response.status === 401) {
      dispatch(invalidateUser());
      navigate('/sign-in');
    }
    return Promise.reject(error);
  });
}



export const createUserTask = ({input, category}) => apiClient.post('/api/react-studio/user-task', { input, category });

export const executeTask = (taskId) => apiClient.post('/api/react-studio/task/execute', { taskId });

export const addToWaitlist = (email) => apiClient.post('/api/react-studio/user/waitlist', { email });

export const signIn = () => apiClient.post('/api/react-studio/user/signIn', {});

export const getUserTasks = () => apiClient.get('/api/react-studio/user-task');

export const validateInvite = (invitationCode) => apiClient.post('/api/react-studio/user/validateInvite', { invitationCode });

