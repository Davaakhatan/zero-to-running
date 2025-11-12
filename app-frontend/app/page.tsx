"use client"

import { useState, useEffect } from "react"

const quotes = [
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "Innovation distinguishes between a leader and a follower.", author: "Steve Jobs" },
  { text: "Life is what happens to you while you're busy making other plans.", author: "John Lennon" },
  { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
  { text: "It is during our darkest moments that we must focus to see the light.", author: "Aristotle" },
  { text: "The way to get started is to quit talking and begin doing.", author: "Walt Disney" },
  { text: "Don't let yesterday take up too much of today.", author: "Will Rogers" },
  { text: "You learn more from failure than from success.", author: "Unknown" },
  { text: "If you are working on something exciting that you really care about, you don't have to be pushed. The vision pulls you.", author: "Steve Jobs" },
  { text: "People who are crazy enough to think they can change the world, are the ones who do.", author: "Rob Siltanen" },
]

export default function Home() {
  const [currentQuote, setCurrentQuote] = useState(quotes[0])
  const [apiStatus, setApiStatus] = useState<"checking" | "online" | "offline">("checking")

  // API URL - supports multiple environments
  const getApiUrl = (): string => {
    if (typeof window !== 'undefined') {
      // Always use localhost for port-forwarding
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return 'http://localhost:3003';
      }
      
      // If accessing via AWS LoadBalancer, use backend LoadBalancer URL
      if (window.location.hostname.includes('.elb.amazonaws.com')) {
        // Backend LoadBalancer URL should be set via NEXT_PUBLIC_API_URL at build time
        const envApiUrl = process.env.NEXT_PUBLIC_API_URL;
        if (envApiUrl && envApiUrl.includes('.elb.amazonaws.com')) {
          return envApiUrl;
        }
        // Fallback: try runtime injection
        const runtimeBackendUrl = (window as any).__BACKEND_URL__;
        if (runtimeBackendUrl) {
          return runtimeBackendUrl;
        }
        console.warn('Backend LoadBalancer URL not configured. API calls will fail.');
        return 'http://localhost:3003'; // Will fail, but won't break
      }
      
      // Default: use environment variable or localhost
      return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003';
    }
    
    // Server-side
    return process.env.NEXT_PUBLIC_API_URL || 'http://backend-service:3003';
  };
  
  const API_URL = getApiUrl();

  // Check backend API status
  useEffect(() => {
    const checkApi = async () => {
      try {
        const response = await fetch(`${API_URL}/health`)
        if (response.ok) {
          setApiStatus("online")
        } else {
          setApiStatus("offline")
        }
      } catch {
        setApiStatus("offline")
      }
    }
    checkApi()
    const interval = setInterval(checkApi, 10000)
    return () => clearInterval(interval)
  }, [API_URL])

  const getRandomQuote = () => {
    const randomIndex = Math.floor(Math.random() * quotes.length)
    setCurrentQuote(quotes[randomIndex])
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-100 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-3">
            Random Quote Generator
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Get inspired with random quotes
          </p>
          <div className="mt-4 flex items-center justify-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              apiStatus === "online" ? "bg-green-500" : 
              apiStatus === "offline" ? "bg-red-500" : 
              "bg-yellow-500 animate-pulse"
            }`} />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Backend API: {apiStatus === "online" ? "Connected" : apiStatus === "offline" ? "Disconnected" : "Checking..."}
            </span>
          </div>
        </div>

        {/* Quote Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 md:p-12 mb-6 transform transition-all hover:scale-105">
          <div className="text-center">
            <div className="text-6xl mb-6">💭</div>
            <blockquote className="text-2xl md:text-3xl font-medium text-gray-800 dark:text-gray-200 mb-6 leading-relaxed">
              "{currentQuote.text}"
            </blockquote>
            <p className="text-lg text-gray-600 dark:text-gray-400 italic">
              — {currentQuote.author}
            </p>
          </div>
        </div>

        {/* Button */}
        <div className="text-center">
          <button
            onClick={getRandomQuote}
            className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl text-lg font-semibold hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-4 focus:ring-purple-300 dark:focus:ring-purple-800 transition-all transform hover:scale-105 active:scale-95 shadow-lg"
          >
            Get New Quote ✨
          </button>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>This is a different app running on port 3000</p>
          <p className="mt-1">Monitor it from the dashboard on port 3001</p>
        </div>
      </div>
    </div>
  )
}
