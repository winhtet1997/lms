"use client";
import { GoogleLogin } from "@react-oauth/google";
import { useAuthStore } from "@/store/useAuthStore";
import { useRouter } from "next/navigation";
import { ROLE_REDIRECTS } from "@/constants/auth";


export default function GoogleSignInButton({ role, pricingRedirect, onNeedsSetup, onAlreadyExists }) {
  const googleLogin = useAuthStore((state) => state.googleLogin);
  const router = useRouter();

  const handleSuccess = async (credentialResponse) => {
    const result = await googleLogin(
      credentialResponse.credential,
      role,
      { registrationMode: !!onAlreadyExists }
    );
    if (result.needs_setup && onNeedsSetup) {
      onNeedsSetup(result.setupData);
    } else if (result.alreadyExists) {
      onAlreadyExists();
    } else if (result.success) {
      router.push(pricingRedirect ? "/pricing" : ROLE_REDIRECTS[role]);
    }
  };

  return (
    <div className="w-full flex justify-center">
      <GoogleLogin
        onSuccess={handleSuccess}
        onError={() => console.error("Google sign-in failed")}
        useOneTap={false}
        text="continue_with"
        shape="rectangular"
        theme="outline"
      />
    </div>
  );
}
