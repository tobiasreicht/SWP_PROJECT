import React from 'react';

export const Footer: React.FC = () => (
  <footer className="border-t border-white/[0.06] mt-16">
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-500">
      <div className="flex items-center gap-2">
        <span className="h-8 w-12 rounded-lg grid place-items-center overflow-hidden px-1">
          <img src="/watch-togther-logo.png" alt="Watch Together" className="h-7 w-10 object-contain" />
        </span>
        <span className="font-semibold text-white/75">Watch Together</span>
        <span>·</span>
        <span>© 2026</span>
        <span>·</span>
        <a
          href="https://www.themoviedb.org/about/logos-attribution"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-white transition-colors"
        >
          Powered by TMDb
        </a>
      </div>
      <div className="flex gap-5">
        <a href="#" className="hover:text-white transition-colors">Privacy</a>
        <a href="#" className="hover:text-white transition-colors">Terms</a>
      </div>
    </div>
  </footer>
);
