export default function HomeLoading() {
  return (
    <main className="min-h-screen bg-[#F7F8FC]">
      <section className="bg-[#0F172A] pt-10 pb-16 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <div className="h-4 w-28 bg-white/10 rounded-full mx-auto animate-pulse"/>
          <div className="h-10 w-3/4 bg-white/10 rounded-xl mx-auto animate-pulse"/>
          <div className="h-14 bg-white/10 rounded-xl animate-pulse max-w-2xl mx-auto"/>
        </div>
      </section>
      <section className="max-w-7xl mx-auto px-4 py-10">
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="h-10 bg-gray-50 border-b border-gray-200"/>
          {[...Array(6)].map((_,i)=>(
            <div key={i} className="flex gap-4 px-4 py-3 border-b border-gray-100">
              <div className="flex-1 space-y-1.5">
                <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"/>
                <div className="h-3 bg-gray-100 rounded animate-pulse w-1/2"/>
              </div>
              <div className="h-6 w-20 bg-gray-100 rounded-full animate-pulse"/>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
