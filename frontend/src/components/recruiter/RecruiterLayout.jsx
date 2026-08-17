import React, { useState } from 'react';
import { RecruiterSidebar } from './RecruiterSidebar';
import { RecruiterNavbar } from './RecruiterNavbar';

export const RecruiterLayout = ({ children, searchVal, setSearchVal }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  return (
    <div className="relative min-h-screen bg-[#FFF9EB] flex flex-col font-sans text-[#2D060D] antialiased selection:bg-[#5D0D1A] selection:text-[#FFF9EB] overflow-x-hidden">
      {/* Ambient Radial Lighting Glows (Bloodstone & Misty Sage) */}
      <div className="fixed -top-40 right-1/4 w-[600px] h-[600px] bg-[#5D0D1A]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 left-1/3 w-[500px] h-[500px] bg-[#9FB2AC]/15 rounded-full blur-3xl pointer-events-none" />

      {/* Sidebar Component */}
      <RecruiterSidebar
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        onOpenNotifications={() => setShowNotificationsModal(true)}
        onOpenSettings={() => setShowSettingsModal(true)}
      />

      {/* Main Layout Area */}
      <div className="lg:pl-[265px] flex-1 flex flex-col min-w-0 transition-all duration-300">
        {/* Navbar Component */}
        <RecruiterNavbar
          onOpenMobileMenu={() => setMobileOpen(true)}
          onOpenNotifications={() => setShowNotificationsModal(true)}
          onOpenSettings={() => setShowSettingsModal(true)}
          searchVal={searchVal}
          setSearchVal={setSearchVal}
        />

        {/* Page Main Content Container */}
        <main className="flex-1 px-4 sm:px-6 md:px-8 py-8 md:py-10 max-w-[1400px] w-full mx-auto space-y-8 animate-in fade-in duration-300">
          {children}
        </main>
      </div>

      {/* Notifications Modal */}
      {showNotificationsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-[24px] p-6 max-w-md w-full border border-[#9FB2AC] shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#9FB2AC]/60 pb-3">
              <h3 className="text-sm font-extrabold text-[#5D0D1A]">Recruiter Notifications</h3>
              <button
                onClick={() => setShowNotificationsModal(false)}
                className="text-xs font-bold text-[#5A6C66] hover:text-[#5D0D1A]"
              >
                Close
              </button>
            </div>
            <div className="space-y-3 py-2">
              <div className="p-3.5 rounded-xl bg-[#FFF9EB] border border-[#9FB2AC] space-y-1">
                <span className="text-xs font-extrabold text-[#5D0D1A]">Welcome to Recruiter Co-pilot</span>
                <p className="text-[11px] font-semibold text-[#5A6C66]">Your new recruiter dashboard is ready. Post job positions to receive applications from verified candidates.</p>
              </div>
              <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 space-y-1">
                <span className="text-xs font-extrabold text-[#2D060D]">Candidate Search Ready</span>
                <p className="text-[11px] font-semibold text-[#5A6C66]">Search candidates by skills, degree, and ATS match score directly in the Candidates tab.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-[24px] p-6 max-w-md w-full border border-[#9FB2AC] shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#9FB2AC]/60 pb-3">
              <h3 className="text-sm font-extrabold text-[#5D0D1A]">Recruiter Account Settings</h3>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="text-xs font-bold text-[#5A6C66] hover:text-[#5D0D1A]"
              >
                Close
              </button>
            </div>
            <div className="space-y-3 py-2 text-xs font-semibold text-[#5A6C66]">
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#FFF9EB] border border-[#9FB2AC]">
                <span>Email Notifications for Applications</span>
                <span className="text-xs font-extrabold text-[#5D0D1A]">Enabled</span>
              </div>
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#FFF9EB] border border-[#9FB2AC]">
                <span>Candidate Match Threshold</span>
                <span className="text-xs font-extrabold text-[#5D0D1A]">75% ATS Match</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
