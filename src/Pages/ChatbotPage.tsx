import type React from "react"
import Navbar from "../components/Navbar"
import Chatbot from "../services/Chatbot"
import { useState } from "react"
import SideBar from "@/components/SideBar.tsx"

const ChatbotPage: React.FC = () => {
  const[open,setOpen] = useState<boolean>(false)
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex flex-col">
      <SideBar setOpen={setOpen} open={open}/>
      <Navbar setOpen={setOpen}/>
      <main className="flex-1 flex flex-col">
        <Chatbot />
      </main>
      {/* <Footer /> */}
    </div>
  )
}

export default ChatbotPage
