import { useEffect } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import LandingPage from './pages/landingPage/LandingPage';
import FrontendStudio from './pages/frontendStudio/FrontendStudio';
import SignInPage from './pages/SignInPage';
import Header, { NavItemEnum } from './components/Header';
import AuthRequired from './components/AuthRequired';

const router = createBrowserRouter([
  {
    path: '/',
    element: (
    <Header navItems={[NavItemEnum.SIGN_IN]}>
      <LandingPage />
    </Header>
    )
  },
  {
    path: '/frontend-studio',
    element: (
      <Header navItems={[NavItemEnum.SIGN_OUT]}>
        <AuthRequired>
          <FrontendStudio />
        </AuthRequired>
      </Header>
    )
  },
  {
    path: '/sign-in',
    element: (
      <Header navItems={[]}>
        <SignInPage />
      </Header>
    )
  }
]);

function App() {
  useEffect(() => {
    const adjustHeight = () => {
      const mainContainer = document.getElementById('app');
      if (mainContainer) {
        mainContainer.style.height = `${window.innerHeight}px`;
      }
    };
  
    window.addEventListener('resize', adjustHeight);
  
    // Initial adjustment
    adjustHeight();
  
    return () => window.removeEventListener('resize', adjustHeight);
  }, []);

  return (
    <div id='app' className='flex w-full h-full'>
      <RouterProvider router={router}/>
    </div>
  );
}

export default App;
