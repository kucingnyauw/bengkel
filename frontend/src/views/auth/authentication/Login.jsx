import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";
import { loginWithEmail, loginWithGoogle } from "@store/auth/authThunk.js";
import {
  selectAuthError,
  selectAuthLoading,
  selectMagicLinkSent,
} from "@store/auth/authSelector.js";
import AuthCardWrapper from "@views/auth/authWrapper/AuthCardWrapper.jsx";
import AuthWrapper from "@views/auth/authWrapper/AuthWrapper.jsx";
import LoginForm from "@views/auth/authForm/LoginForm.jsx";

const Login = () => {
  const dispatch = useDispatch();

  const authError = useSelector(selectAuthError);
  const authLoading = useSelector(selectAuthLoading);
  const magicLinkSent = useSelector(selectMagicLinkSent);

  useEffect(() => {
    if (!authError) return;


  }, [authError, dispatch]);

  useEffect(() => {
    if (!magicLinkSent) return;

 
  }, [magicLinkSent, dispatch]);

  const handleEmailSubmit = (email) => {
    dispatch(loginWithEmail(email));
  };

  const handleGoogleSubmit = () => {
    dispatch(loginWithGoogle());
  };

  return (
    <AuthWrapper>
      <AuthCardWrapper>
        <LoginForm
          onEmailSubmit={handleEmailSubmit}
          onGoogleSubmit={handleGoogleSubmit}
          isLoading={authLoading}
        />
      </AuthCardWrapper>
    </AuthWrapper>
  );
};

export default Login;
