import type React from "react";
import "./ui/Sidebar.css"
import { Sidebar } from "lucide-react";
import ContractHistory from "./ContractHistory";

type Props = {
    open: boolean;
    setOpen: React.Dispatch<React.SetStateAction<boolean>>
}

const SideBar = ({open, setOpen}: Props) => {
  return (
    <div className="sidebar-screen">
      {open&& <div className="overlay" onClick={()=> setOpen(false)}></div>}

      <div className={open ? "sidebar open" : "sidebar"}>
        <header>
            <div>
                <h2>Contact Forge</h2>
                <button className="sidebar-button" onClick={()=> setOpen(false)}>                
                  <Sidebar/>
                </button>
            </div>
            <p>Powered by Deep Seek AI</p>
        </header>

        <section>
            <h2>My Contracts</h2>
            <ContractHistory/>
        </section>

        <footer></footer>
      </div>
    </div>
  )
}

export default SideBar
