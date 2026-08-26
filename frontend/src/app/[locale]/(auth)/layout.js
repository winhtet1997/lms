import "../../globals.css";
import Navbar from "@/components/layout/Navbar";
import GoogleOAuthWrapper from "@/components/auth/GoogleOAuthWrapper";

export const metadata = {
  title: "Math Mentor",
  description: "Your Personal Guide to Mastering Math - Interactive Lessons, Practice, and Support for All Levels",
};

export default function AuthLayout({ children }) {
  return (
    <GoogleOAuthWrapper>
      <Navbar />
      {children}
    </GoogleOAuthWrapper>
  );
}
