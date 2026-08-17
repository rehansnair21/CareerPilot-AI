import React, { useState } from 'react';
import { Settings, Shield, Bell, Cpu, Save, CheckCircle } from 'lucide-react';

export const AdminSettings = () => {
  const [savedMsg, setSavedMsg] = useState('');
  const [formData, setFormData] = useState({
    siteName: 'CareerPilot AI',
    supportEmail: 'admin@careerpilot.ai',
    autoVerifyRecruiters: true,
    emailNotifications: true,
    aiModel: 'Gemini 1.5 Pro / Flash',
    maxResumeUploadMb: '10 MB',
  });

  const handleSave = (e) => {
    e.preventDefault();
    setSavedMsg('System configuration settings saved successfully!');
    setTimeout(() => setSavedMsg(''), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-[22px] p-6 border border-[#9FB2AC] shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-[#5D0D1A] tracking-tight flex items-center gap-2">
            <Settings size={22} className="text-[#5D0D1A]" />
            System Configuration & Settings
          </h2>
          <p className="text-xs text-[#5A6C66] font-medium mt-1">
            Platform parameters, security rules, AI engine options, and email system configurations.
          </p>
        </div>
      </div>

      {savedMsg && (
        <div className="bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl p-4 text-xs font-bold flex items-center gap-2">
          <CheckCircle size={16} />
          <span>{savedMsg}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* General Platform Settings */}
        <div className="bg-white rounded-[22px] p-6 border border-[#9FB2AC] shadow-2xs space-y-4">
          <h3 className="text-sm font-extrabold text-[#5D0D1A] flex items-center gap-2 border-b border-[#9FB2AC]/60 pb-3">
            <Settings size={16} className="text-[#5D0D1A]" />
            General Platform Settings
          </h3>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-extrabold text-[#5D0D1A] mb-1">Platform Name</label>
              <input
                type="text"
                value={formData.siteName}
                onChange={(e) => setFormData({ ...formData, siteName: e.target.value })}
                className="w-full bg-[#FFF9EB] border border-[#9FB2AC] rounded-xl px-3.5 py-2 text-xs text-[#5D0D1A] font-medium focus:outline-none focus:border-[#5D0D1A]"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-[#5D0D1A] mb-1">Admin Support Email</label>
              <input
                type="email"
                value={formData.supportEmail}
                onChange={(e) => setFormData({ ...formData, supportEmail: e.target.value })}
                className="w-full bg-[#FFF9EB] border border-[#9FB2AC] rounded-xl px-3.5 py-2 text-xs text-[#5D0D1A] font-medium focus:outline-none focus:border-[#5D0D1A]"
              />
            </div>
          </div>
        </div>

        {/* Security & Verification */}
        <div className="bg-white rounded-[22px] p-6 border border-[#9FB2AC] shadow-2xs space-y-4">
          <h3 className="text-sm font-extrabold text-[#5D0D1A] flex items-center gap-2 border-b border-[#9FB2AC]/60 pb-3">
            <Shield size={16} className="text-[#5D0D1A]" />
            Security & Verification Rules
          </h3>

          <div className="space-y-4">
            <label className="flex items-center justify-between p-3 rounded-xl bg-[#FFF9EB]/60 border border-[#9FB2AC]/70 cursor-pointer">
              <span className="text-xs font-extrabold text-[#5D0D1A]">Auto-Verify Recruiter Accounts</span>
              <input
                type="checkbox"
                checked={formData.autoVerifyRecruiters}
                onChange={(e) => setFormData({ ...formData, autoVerifyRecruiters: e.target.checked })}
                className="w-4 h-4 text-[#5D0D1A] rounded focus:ring-[#5D0D1A]"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-[#FFF9EB]/60 border border-[#9FB2AC]/70 cursor-pointer">
              <span className="text-xs font-extrabold text-[#5D0D1A]">Enable Security Email Alerts</span>
              <input
                type="checkbox"
                checked={formData.emailNotifications}
                onChange={(e) => setFormData({ ...formData, emailNotifications: e.target.checked })}
                className="w-4 h-4 text-[#5D0D1A] rounded focus:ring-[#5D0D1A]"
              />
            </label>
          </div>
        </div>

        {/* AI Engine Settings */}
        <div className="bg-white rounded-[22px] p-6 border border-[#9FB2AC] shadow-2xs space-y-4 lg:col-span-2">
          <h3 className="text-sm font-extrabold text-[#5D0D1A] flex items-center gap-2 border-b border-[#9FB2AC]/60 pb-3">
            <Cpu size={16} className="text-[#5D0D1A]" />
            AI Resume & Career Engine Configurations
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-extrabold text-[#5D0D1A] mb-1">Active AI Model</label>
              <input
                type="text"
                value={formData.aiModel}
                disabled
                className="w-full bg-[#FFF9EB] border border-[#9FB2AC] rounded-xl px-3.5 py-2 text-xs text-[#5A6C66] font-mono cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-[#5D0D1A] mb-1">Max Resume Upload Limit</label>
              <input
                type="text"
                value={formData.maxResumeUploadMb}
                onChange={(e) => setFormData({ ...formData, maxResumeUploadMb: e.target.value })}
                className="w-full bg-[#FFF9EB] border border-[#9FB2AC] rounded-xl px-3.5 py-2 text-xs text-[#5D0D1A] font-medium focus:outline-none focus:border-[#5D0D1A]"
              />
            </div>
          </div>

          <div className="pt-3 flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#5D0D1A] hover:bg-[#7A1424] text-[#FFF9EB] text-xs font-extrabold shadow-md transition-all hover:scale-[1.02]"
            >
              <Save size={15} />
              <span>Save System Settings</span>
            </button>
          </div>
        </div>

      </form>
    </div>
  );
};

export default AdminSettings;
