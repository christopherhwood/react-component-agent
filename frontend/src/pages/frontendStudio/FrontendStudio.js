import React, { useEffect } from 'react'; 
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useLDClient } from 'launchdarkly-react-client-sdk';
import GeneratorInput from './components/generatorInput/GeneratorInput';
import ComponentDisplay from './components/ComponentDisplay';
import CodeEditor from './components/CodeEditor';
import NavigationBar from './components/navigationBar/NavigationBar';
import InvitationCodeModal from './components/InvitationCodeModal';
import { signIn } from '../../redux/slices/userSignInSlice';
import { clearInvitationCodeState } from '../../redux/slices/userSignUpSlice';

export default function FrontendStudio() {
  const { invitationCodeRequired, userIsSignedIn, userId } = useSelector(state => state.userSignIn);
  const { success: invitationCodeSuccess } = useSelector(state => state.userSignUp);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const ldClient = useLDClient();

  // useEffect(() => {
  //   ldClient.identify({
  //     kind: 'user',
  //     key: userId
  //   });
  // }, [userId, ldClient]);

  // check if the url carries signIn=true
  const urlParams = new URLSearchParams(window.location.search);
  const signInParam = urlParams.get('signIn');

  // useEffect(() => {
  //   if (!userIsSignedIn && (!signInParam || isNaN(signInParam))) {
  //     navigate('/sign-in');
  //   }
  // }, [userIsSignedIn, navigate, signInParam]);

  // useEffect(() => {
  //   if (!isNaN(signInParam) && Number(signInParam) === 1 && !userIsSignedIn) {
  //     dispatch(signIn());
  //   }
  // }, [dispatch, signInParam, userIsSignedIn]);

  // useEffect(() => {
  //   return () => {
  //     dispatch(clearInvitationCodeState());
  //   }
  // }, [dispatch])

  const showInvitationCodeModal = invitationCodeRequired && !invitationCodeSuccess;

  return (
    <div className="bg-gray-950 flex w-full h-full overflow-hidden">
      <div className="w-1/4 flex h-full"> {/* Adjust bg color as needed */}
        <NavigationBar />
      </div>
      <div className="flex flex-col w-1/2">
        <div className="Header flex-none">
          <GeneratorInput
            featureFlag={true}
            disabled={showInvitationCodeModal}
          />
        </div>
        <div className="ComponentDisplay flex-grow">
          <ComponentDisplay />
        </div>
      </div>
      <div className="w-1/4 flex-1 overflow-y-auto dark-scroll"> {/* Adjust bg color as needed */}
        <CodeEditor />
      </div>
      {showInvitationCodeModal && (
        <InvitationCodeModal />
      )}
    </div>
  ) 
}