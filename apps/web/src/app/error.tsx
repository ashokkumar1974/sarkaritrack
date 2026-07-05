"use client";
import { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error("Global error:", error); }, [error]);
  return (
    <html lang="en"><body className="bg-[#F7F8FC] min-h-screen flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 max-w-md w-full text-center">
        <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle size={24} className="text-red-500"/>
        </div>
        <h1 className="text-xl font-extrabold text-gray-900 mb-2">Something went wrong</h1>
        <p className="text-gray-500 text-sm mb-6">An unexpected error occurred.{error.digest && <span className="block mt-1 text-xs text-gray-400 font-mono">ID: {error.digest}</span>}</p>
        <div className="flex gap-3 justify-center">
          <button onClick={reset} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-4 py-2.5 rounded-xl transition-colors"><RefreshCw size={14}/>Try Again</button>
          <a href="/" className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm px-4 py-2.5 rounded-xl transition-colors"><Home size={14}/>Go Home</a>
        </div>
      </div>
    </body></html>
  );
}
