import React from 'react';

export function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full min-h-screen w-full items-center justify-center bg-[#e7d8bd] p-0 sm:p-6">
      <div
        className="relative flex flex-col overflow-hidden bg-sand shadow-2xl sm:rounded-[2.5rem] sm:border-[10px] sm:border-driftwood-dark"
        style={{ width: 'min(100vw, 390px)', height: 'min(100vh, 844px)' }}
      >
        {children}
      </div>
    </div>
  );
}
