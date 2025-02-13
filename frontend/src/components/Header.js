import React, { useMemo, createContext, useContext } from "react";
import { useDispatch, useSelector } from 'react-redux';
import PropTypes from "prop-types";
import { Link, useNavigate } from "react-router-dom";
import { signOut } from '../redux/slices/userSignInSlice';


export const NavItemEnum = Object.freeze({
  FRONTEND_STUDIO: "frontend-studio",
  SIGN_IN: "sign-in",
  SIGN_OUT: "sign-out",
});

const NavItemsContext = createContext();

const useNavItems = () => useContext(NavItemsContext);

const NavItemsProvider = ({ children, navItems }) => {
  const { userIsSignedIn } = useSelector((state) => state.userSignIn);

  const modifiedNavItems = useMemo(() => {
    if (userIsSignedIn && navItems.includes(NavItemEnum.SIGN_IN)) {
      return navItems.filter(item => item !== NavItemEnum.SIGN_IN)
                     .concat([NavItemEnum.FRONTEND_STUDIO, NavItemEnum.SIGN_OUT]);
    }
    return navItems;
  }, [navItems, userIsSignedIn]);

  return (
    <NavItemsContext.Provider value={modifiedNavItems}>
      {children}
    </NavItemsContext.Provider>
  );
};

const Header = ({ children }) => {
  const dispatch = useDispatch(); // Placeholder for dispatch method
  const navigate = useNavigate();
  const navItems = useNavItems();

  return (
    <div className='flex flex-col overflow-hidden w-full h-full divide-y divide-gray-900'>
      <header className="flex justify-between px-2 lg:px-3 py-[1%] bg-gray-950">
      <h1
        className="text-xl px-1 font-extrabold text-gray-950 bg-green-500 tracking-wide italic"
      >
        <Link to="/" aria-label="Navigate to homepage">qckfx</Link>
      </h1>
        <nav className="flex justify-around text-gray-300 font-semibold"> 
          <ul className="flex space-x-4">
            {Object.entries(NavItemEnum).map(
              ([key, value]) =>
                navItems.includes(value) && (
                  <li key={key}>
                    {value === NavItemEnum.SIGN_OUT ? (
                      <Link
                        to="/"
                        onClick={() => {
                          dispatch(signOut());
                          navigate('/');
                        }}
                        aria-label="Sign out"
                        className="hover:text-green-500 transition-colors duration-300"
                      >
                        Sign Out
                      </Link>
                    ) : (
                      <Link
                        to={`/${value}`}
                        className="hover:text-green-500 transition-colors duration-300"
                        aria-label={`Navigate to ${value} page`}
                      >
                        {/* Convert key to title case */}
                        {key.toLowerCase().replace(/_/g, " ").split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                      </Link>
                    )}
                  </li>
                ),
            )}
          </ul>
        </nav>
      </header>
      <div className="flex flex-grow overflow-y-auto">
        {children}
      </div>
    </div>
  );
};

const WrappedHeader = ({ children, navItems }) => {
  return (
    <NavItemsProvider navItems={navItems}>
     <Header>
        {children}
      </Header>
    </NavItemsProvider>
  )
};

WrappedHeader.proptTypes = {
  children: PropTypes.node.isRequired,
  navItems: PropTypes.arrayOf(PropTypes.oneOf(Object.values(NavItemEnum)))
    .isRequired,
}

export default WrappedHeader;



// export default function Header() {
//   const { navItems } = useNavItems();
//   const { userIsSignedIn } = useSelector((state) => state.userSignIn);
//   const dispatch = useDispatch();
  
//   return (
//     <header className="flex justify-between px-4 py-[1%] bg-gray-950">
//       <h1
//         className="text-xl px-1 font-extrabold text-gray-950 bg-green-500 tracking-wide italic"
//       >
//         <a href="/" aria-label="Navigate to homepage">qckfx</a>
//       </h1>
//       <nav className="flex justify-around text-gray-300 font-semibold px-4">
//         <ul className="flex space-x-4">
//           {navItems.includes('sign-in') && (
//             <li className="hover:text-green-500 transition-colors duration-300">
//               {userIsSignedIn ? (
//                 <a href="/frontend-studio" aria-label="Navigate to frontend studio page">Frontend Studio</a>
//               ) : (
//                 <a href="/sign-in" aria-label="Navigate to sign in page">Sign In</a>
//               )}
//             </li>
//           )}
//           {navItems.includes('sign-up') && (
//             <li className="hover:text-green-500 transition-colors duration-300">
//               <a href="/sign-up" aria-label="Navigate to sign up page">Sign Up</a>
//             </li>
//           )}
//           {navItems.includes('sign-out') && (
//             <li className="hover:text-green-500 transition-colors duration-300">
//               <a
//                 href="/"
//                 onClick={() => {
//                   dispatch(signOut());
//                 }}
//                 aria-label="Sign out"
//               >
//                 Sign Out
//               </a>
//             </li>
//           )}
//         </ul>
//       </nav>
//     </header>
//   )
// }