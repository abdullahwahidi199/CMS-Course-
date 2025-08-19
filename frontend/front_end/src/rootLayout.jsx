import { Outlet } from "react-router-dom";
import Navbar from "./components/navbar";

function RootLayout(){
    return(
        <>
        <div className="flex h-screen overflow-hidden">
            
        <div className="w-60 bg-gray-800 text-white p-4 flex-shrink-0">
            
            <Navbar/>
        </div>
        <main className="flex-1 bg-gray-100 p-6 overflow-auto">
            <Outlet/>
        </main>
        </div> 
        
            
        </>
    )
}
export default RootLayout;