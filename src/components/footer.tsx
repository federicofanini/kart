export function Footer() {
  return (
    <footer className="relative border-t bg-gradient-to-r from-slate-900 to-black mt-12 overflow-hidden">
      {/* Racing stripe effect */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-600 via-white to-red-600"></div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          {/* Main branding */}
          <div className="text-center md:text-left">
            <h3 className="text-2xl font-bold text-white tracking-wider">
              KART <span className="text-red-500">CHAMPIONSHIP</span>
            </h3>
            <p className="text-slate-400 text-sm mt-1 font-medium tracking-wide">
              POWERED BY PLOSO • REAL-TIME STANDINGS
            </p>
          </div>

          {/* Racing elements */}
          <div className="flex items-center space-x-6 text-slate-400">
            <div className="text-center">
              <div className="text-lg font-bold text-white">2025</div>
              <div className="text-xs tracking-wider">SEASON</div>
            </div>
            <div className="w-px h-8 bg-slate-600"></div>
            <div className="text-center">
              <div className="text-lg font-bold text-red-500">LIVE</div>
              <div className="text-xs tracking-wider">TIMING</div>
            </div>
          </div>
        </div>

        {/* Bottom section */}
        <div className="mt-6 pt-4 border-t border-slate-800 text-center">
          <p className="text-slate-500 text-xs tracking-wider">
            PROFESSIONAL KARTING MANAGEMENT SYSTEM
          </p>
        </div>
      </div>

      {/* Subtle pattern overlay */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `repeating-linear-gradient(
          45deg,
          transparent,
          transparent 10px,
          rgba(255,255,255,0.1) 10px,
          rgba(255,255,255,0.1) 20px
        )`,
        }}
      ></div>
    </footer>
  );
}
