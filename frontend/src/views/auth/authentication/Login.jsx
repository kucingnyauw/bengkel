import { useMutation } from "@tanstack/react-query";
import { useDispatch } from "react-redux";
import { signInWithEmailOtp } from "@api/supabaseApi.js";
import { validateUserEmail } from "@api/userApi.js";
import { showNotification } from "@store/notifications/notificationsSlice.js";
import AuthCardWrapper from "@views/auth/authWrapper/AuthCardWrapper.jsx";
import AuthWrapper from "@views/auth/authWrapper/AuthWrapper.jsx";
import LoginForm from "@views/auth/authForm/LoginForm.jsx";

const Login = () => {
  const dispatch = useDispatch();

  const emailMutation = useMutation({
    mutationFn: async (email) => {
      await validateUserEmail(email);
      await signInWithEmailOtp(email);
    },
    onSuccess: () => {
      dispatch(
        showNotification({
          message: "Link login telah dikirim ke email Anda. Silakan cek inbox.",
          type: "success",
          title: "Berhasil",
          variant: "snackbar",
          autoHide: 6000,
        })
      );
    },
    onError: (error) => {
      dispatch(
        showNotification({
          message: error?.message || "Gagal mengirim link login",
          type: "error",
          title: "Error",
          variant: "snackbar",
          autoHide: 5000,
        })
      );
    },
  });

  const handleEmailSubmit = (email) => {
    emailMutation.mutate(email);
  };

  return (
    <AuthWrapper>
      <AuthCardWrapper>
        <LoginForm
          onEmailSubmit={handleEmailSubmit}
          isLoading={emailMutation.isPending}
        />
      </AuthCardWrapper>
    </AuthWrapper>
  );
};

export default Login;