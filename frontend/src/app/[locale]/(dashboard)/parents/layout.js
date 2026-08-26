import "../../../globals.css";

import Navbar from "@/components/layout/Navbar";

export default function ParentsLayout({children}) {
    return (
        <>
            <Navbar/>
            {children}
        </>
    );
}
