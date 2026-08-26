import Sidebar from "@/components/layout/AdminSidebar";
import "../../../globals.css";
import LanguageTab from "@/components/layout/LanguageTab";
import AdminLayoutClient from "./AdminLayoutClient";

export default function AdminLayout({ children }) {
  return (
    <AdminLayoutClient
      sidebar={<Sidebar />}
      languageTab={<LanguageTab />}
    >
      {children}
    </AdminLayoutClient>
  );
}
