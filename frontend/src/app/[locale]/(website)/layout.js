import "../../globals.css"
import Navbar from "@/components/layout/Navbar";


export const metadata = {
  title: "Math Mentor",
  description: "Your Personal Guide to Mastering Math - Interactive Lessons, Practice, and Support for All Levels",
};
export default function RootLayout({ children }) {
  return (
    <>
        <Navbar/>
        {children}
      
   </>
  );
}
