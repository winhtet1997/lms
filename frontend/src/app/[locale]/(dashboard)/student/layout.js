import Navbar from "@/components/layout/Navbar";
import "../../../globals.css";
import StudentSubNavbar from "@/components/layout/StudentSubNavbar";

export default function StudentLayout({ children }) {
  return (
    <>
      <header className="bg-white z-50">
        <Navbar />
        <StudentSubNavbar />
      </header>

      <div className="">
        {children}
      </div>
    </>
  );
}
