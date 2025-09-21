"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Send, Copy, Code, Sparkles, Bot, User, CheckCircle, AlertCircle, Info, AlertTriangle, Lightbulb, FileJson, Download } from "lucide-react"
import { generateSmartContract, generateJSONFromSolidity } from "./deepseekService"
import { ContractValidator } from "./contractValidator"
import type { ValidationResult } from "./contractValidator"
import JSONModal from "../components/JSONModal"
import Modal from "react-modal"
import "../components/ui/chatbot.css"

// Initialize react-modal
Modal.setAppElement('#root');

interface Contract {
  title: string;
  id: string;
  timestamp: Date;
  messages: Message[];
}

interface Message {
  id: string
  type: "user" | "ai"
  content: string
  timestamp: Date
  isCode?: boolean
  compilationStatus?: "success" | "error" | "pending"
  validation?: ValidationResult
}

const Chatbot: React.FC = () => {
 
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      type: "ai",
      content:
        "Hello! I'm your Smart Contract Assistant for ResilientDB. I can generate Solidity smart contracts from natural language descriptions.<br><br><strong>💡 Try these examples:</strong><br>• \"Create a simple token contract with transfer and balance functions\"<br>• \"Build a voting system where users can create and vote on proposals\"<br>• \"Make a multi-signature wallet that requires 2 out of 3 signatures\"<br>• \"Create a crowdfunding contract where people can contribute and claim rewards\"<br><br>What type of smart contract would you like to create?",
      timestamp: new Date(),
    },
  ])

  const[contract,setContract] = useState<Contract>({
    title: "Chat",
    id: Date.now().toString(),
    timestamp: new Date(),
    messages: messages
  })

  const saveChat = (res: any)=> {
    if(res) {
      const stored =  localStorage.getItem("contract-history")
      if(stored) {
      const chats =JSON.parse(stored)
      chats.push(contract)
      localStorage.setItem("contract-history", chats)
    }
    }
  }


  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isJSONModalOpen, setIsJSONModalOpen] = useState(false)
  const [jsonConfig, setJsonConfig] = useState("")
  const [contractName, setContractName] = useState("")
  const [exampleConfig, setExampleConfig] = useState("")
  const [isGeneratingJSON, setIsGeneratingJSON] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = () => {
    const container = document.querySelector('.messages-container') as HTMLElement;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }

  useEffect(() => {
    // Always scroll chat to bottom when new message is added (like normal chatbots)
    if (messages.length > 1) {
      scrollToBottom()
    }
  }, [messages])

  const validateSolidityCode = (code: string): boolean => {
    // Basic validation - check for essential Solidity elements
    const hasPragma = code.includes("pragma solidity");
    const hasContract = code.includes("contract ");
    const hasFunction = code.includes("function ");
    
    return hasPragma && hasContract && hasFunction;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: input.trim(),
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      const response = await generateSmartContract(input.trim())

      if (response) {
        const botMessage: Message = {
          id: Date.now().toString(),
          type: "ai",
          content: response,
          timestamp: new Date()
        }

        setMessages(prev=> [...prev, botMessage])
        setContract({
          ...contract,
          messages: messages
        })
        saveChat(contract)
      }

      const isSolidityCode = response.includes("pragma solidity") && response.includes("contract ") && response.includes("function ");
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "ai",
        content: response,
        timestamp: new Date(),
        isCode: isSolidityCode,
        compilationStatus: isSolidityCode ? (validateSolidityCode(response) ? "success" : "error") : undefined,
        validation: isSolidityCode ? ContractValidator.validateContract(response) : undefined,
      }
      setMessages((prev) => [...prev, aiMessage])
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "ai",
        content: "Sorry, I encountered an error while generating your smart contract. Please try again.",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content)
  }

  const downloadSolidityFile = (content: string, contractName: string = "contract") => {
    // Extract contract name from the code if possible
    const contractMatch = content.match(/contract\s+(\w+)/);
    const fileName = contractMatch ? `${contractMatch[1]}.sol` : `${contractName}.sol`;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  const generateJSONConfig = async (contractCode: string) => {
    try {
      setIsGeneratingJSON(true);
      const result = await generateJSONFromSolidity(contractCode);
      
      setJsonConfig(JSON.stringify(result.syntaxJSON, null, 2));
      setContractName(result.syntaxJSON.contract_name);
      setExampleConfig(JSON.stringify(result.exampleJSON, null, 2));
      setIsJSONModalOpen(true);
    } catch (error) {
      console.error('Error generating JSON:', error);
      alert(`Error generating JSON configuration: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsGeneratingJSON(false);
    }
  }

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = "auto"
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + "px"
    }
  }

  useEffect(() => {
    adjustTextareaHeight()
  }, [input])

  const getCompilationStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle size={16} className="text-green-500" />
      case "error":
        return <AlertCircle size={16} className="text-red-500" />
      default:
        return null
    }
  }

  const getCompilationStatusText = (status: string) => {
    switch (status) {
      case "success":
        return "Valid Solidity"
      case "error":
        return "Invalid Structure"
      default:
        return ""
    }
  }

  return (
    <div className="chatbot-container">
      <div className="chatbot-header">
        <div className="header-content">
          <div className="header-icon">
            <Sparkles className="sparkles-icon" />
          </div>
          <div className="header-text">
            <h2>Smart Contract Assistant</h2>
            <p>Powered by DeepSeek AI</p>
          </div>
        </div>
      </div>

      <div className="messages-container">
        {messages.map((message) => (
          <div key={message.id} className={`message ${message.type}`}>
            <div className="message-avatar">{message.type === "user" ? <User size={20} /> : <Bot size={20} />}</div>
            <div className="message-content">
              {message.isCode ? (
                <div className="code-block">
                  <div className="code-header">
                    <Code size={16} />
                    <span>Smart Contract</span>
                    {message.compilationStatus && (
                      <div className="compilation-status">
                        {getCompilationStatusIcon(message.compilationStatus)}
                        <span className="status-text">{getCompilationStatusText(message.compilationStatus)}</span>
                      </div>
                    )}
                  </div>
                  <pre className="code-content">
                    <code>{message.content}</code>
                  </pre>
                  {message.validation && (
                    <div className="validation-panel">
                      <div className="validation-header">
                        <Info size={16} />
                        <span>Contract Analysis</span>
                      </div>
                      <div className="validation-content">
                        <div className="contract-info">
                          <h4>Contract: {message.validation.contractInfo.name}</h4>
                          <div className="info-grid">
                            <div>
                              <strong>Functions:</strong> {message.validation.contractInfo.functions.length}
                            </div>
                            <div>
                              <strong>Events:</strong> {message.validation.contractInfo.events.length}
                            </div>
                            <div>
                              <strong>State Variables:</strong> {message.validation.contractInfo.stateVariables.length}
                            </div>
                          </div>
                        </div>
                        
                        {message.validation.errors.length > 0 && (
                          <div className="validation-section errors">
                            <div className="section-header">
                              <AlertCircle size={14} />
                              <span>Errors ({message.validation.errors.length})</span>
                            </div>
                            <ul>
                              {message.validation.errors.map((error, index) => (
                                <li key={index}>{error}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {message.validation.warnings.length > 0 && (
                          <div className="validation-section warnings">
                            <div className="section-header">
                              <AlertTriangle size={14} />
                              <span>Warnings ({message.validation.warnings.length})</span>
                            </div>
                            <ul>
                              {message.validation.warnings.map((warning, index) => (
                                <li key={index}>{warning}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {message.validation.suggestions.length > 0 && (
                          <div className="validation-section suggestions">
                            <div className="section-header">
                              <Lightbulb size={14} />
                              <span>Suggestions ({message.validation.suggestions.length})</span>
                            </div>
                            <ul>
                              {message.validation.suggestions.map((suggestion, index) => (
                                <li key={index}>{suggestion}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <div className="code-actions">
                    <button 
                      onClick={() => generateJSONConfig(message.content)} 
                      className="json-button" 
                      title="Generate ResVault JSON"
                      disabled={isGeneratingJSON}
                    >
                      <FileJson size={16} />
                      <span>{isGeneratingJSON ? 'Generating...' : 'Generate JSON'}</span>
                    </button>
                    <button 
                      onClick={() => downloadSolidityFile(message.content)} 
                      className="download-button"
                      title="Download .sol file"
                    >
                      <Download size={16} />
                      <span>Download (.sol)</span>
                    </button>
                    <button 
                      onClick={() => copyToClipboard(message.content)} 
                      className="copy-button"
                      title="Copy to clipboard"
                    >
                      <Copy size={16} />
                      <span>Copy</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-content" dangerouslySetInnerHTML={{ 
                  __html: message.content
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    .replace(/\*(.*?)\*/g, '<em>$1</em>')
                    .replace(/•/g, '•')
                    .replace(/\n/g, '<br>')
                }} />
              )}
              <div className="message-timestamp">
                {message.timestamp.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="message ai">
            <div className="message-avatar">
              <Bot size={20} />
            </div>
            <div className="message-content">
              <div className="loading-indicator">
                <div className="loading-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <span className="loading-text">Thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <JSONModal
        isOpen={isJSONModalOpen}
        onClose={() => setIsJSONModalOpen(false)}
        jsonConfig={jsonConfig}
        contractName={contractName}
        exampleConfig={exampleConfig}
      />

      <form onSubmit={handleSubmit} className="input-form">
        <div className="input-container">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe the smart contract you want to create..."
            className="message-input"
            rows={1}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                handleSubmit(e)
              }
            }}
          />
          <button type="submit" disabled={!input.trim() || isLoading} className="send-button">
            <Send size={20} />
          </button>
        </div>
      </form>
    </div>
  )
}

export default Chatbot
