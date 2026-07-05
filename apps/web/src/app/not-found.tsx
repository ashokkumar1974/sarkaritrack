import Link from "next/link";
import { Search, Home, FileText, Trophy, CreditCard } from "lucide-react";
export default function NotFoundPage() {
  return (
    <main className="min-h-screen bg-[#F7F8FC] flex items-center justify-center px-4 py-16">
      <div className="max-w-lg w-full text-center">
        <p className="text-[120px] font-extrabold text-gray-100 leading-none select-none">404</p>
        <h1 className="text-2xl font-extrabold text-gray-900 mb-3 -mt-8">Page Not Found</h1>
        <p className="text-gray-500 text-sm mb-8">The job listing or page you are looking for may have been removed or expired.</p>
        <form action="/search" className="flex gap-2 mb-8 max-w-md mx-auto">
          <input name="q" type="search" placeholder="Search for jobs..." className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white" />
          <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-4 py-2.5 rounded-xl">Search</button>
        </form>
        <div className="grid grid-cols-2 gap-2">
          {[{icon:Home,label:"Latest Jobs",href:"/"},{icon:Trophy,label:"Results",href:"/results"},{icon:CreditCard,label:"Admit Cards",href:"/admit-cards"},{icon:FileText,label:"Tools",href:"/tools"}].map(({icon:Icon,label,href})=>(
            <Link key={href} href={href} className="flex items-center gap-2 bg-white border border-gray-200 hover:border-blue-300 hover:bg-blue-50 text-gray-700 hover:text-blue-700 text-sm font-medium px-4 py-3 rounded-xl transition-colors">
              <Icon size={15}/>{label}
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
