import { useState } from "react";
import { useDispatch, useSelector } from 'react-redux';
import { validateInvitationCode } from '../../../redux/slices/userSignUpSlice';

export default function InvitationCodeModal() {
  const [invitationCode, setInvitationCode] = useState('');
  const { error, success, isLoading } = useSelector((state) => state.userSignUp);
  const dispatch = useDispatch();

  return (
    <div 
      className="fixed inset-0 bg-gray-900 bg-opacity-70 flex items-center justify-center"
      style={{zIndex: 1000}}
      hidden={success}
    >
      <div className="bg-gray-950 p-12 border-2 border-gray-300 rounded-lg shadow-lg" tabIndex='-1' role='dialog' aria-modal='true' aria-labelledby='dialogTitle'>
        <h2 id='dialogTitle' className="text-2xl mt-2 mb-4 font-bold text-gray-100">Invitation Code</h2>
        <input
          type="text"
          disabled={isLoading}
          className="w-full mt-4 p-2 rounded-md bg-gray-800 text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
          value={invitationCode}
          onChange={(e) => setInvitationCode(e.target.value)}
          placeholder="Enter your invitation code"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !isLoading) {
              dispatch(validateInvitationCode({invitationCode}));
            }
          }}
        />
        <button
          className="w-full mt-4 p-2 rounded-md bg-green-500 text-gray-100"
          onClick={() => {
            // dispatch action to validate the invitation code
            dispatch(validateInvitationCode({invitationCode}));
          }}
          disabled={isLoading}
        >
          Submit
        </button>
        <div 
          className='h-6 text-red-500 text-sm mb-2 mt-2 mx-auto'
          role='alert'
          aria-live='assertive'
        >
            {error ? <p>{error}</p> : <p>&nbsp;</p>}
        </div>
      </div>
    </div>
  )
}