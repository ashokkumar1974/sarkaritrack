export default function JobDetailLoading() {
  return (
    <main className="min-h-screen bg-[#F7F8FC]">
      <div className="bg-white border-b border-gray-100 px-4 py-2.5">
        <div className="max-w-7xl mx-auto flex gap-2">
          <div className="h-3 w-10 bg-gray-200 rounded animate-pulse"/>
          <div className="h-3 w-16 bg-gray-200 rounded animate-pulse"/>
          <div className="h-3 w-40 bg-gray-200 rounded animate-pulse"/>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col lg:flex-row gap-6">
        <div className="flex-1 space-y-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-3">
            <div className="h-7 bg-gray-200 rounded-lg w-3/4 animate-pulse"/>
            <div className="h-5 bg-gray-100 rounded w-1/2 animate-pulse"/>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="h-12 bg-gray-800 animate-pulse"/>
            <div className="p-5 space-y-5">
              {[...Array(4)].map((_,i)=>(
                <div key={i} className="space-y-2">
                  <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"/>
                  <div className="grid grid-cols-3 gap-2">
                    {[...Array(3)].map((_,j)=>(<div key={j} className="h-14 bg-gray-100 rounded-lg animate-pulse"/>))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="hidden lg:block w-72 shrink-0">
          <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3">
            <div className="h-12 bg-gray-200 rounded-xl animate-pulse"/>
            <div className="h-10 bg-gray-100 rounded-xl animate-pulse"/>
            <div className="h-10 bg-gray-100 rounded-xl animate-pulse"/>
          </div>
        </div>
      </div>
    </main>
  );
}
