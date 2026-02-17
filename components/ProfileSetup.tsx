
import React, { useState } from 'react';
import { Candidate } from '../types';
import { User, Mail, Phone, CreditCard, Camera, ShieldCheck, ArrowRight } from 'lucide-react';

interface ProfileSetupProps {
  initialData: Candidate;
  onComplete: (updatedCandidate: Candidate) => void;
}

export const ProfileSetup: React.FC<ProfileSetupProps> = ({ initialData, onComplete }) => {
  const [formData, setFormData] = useState<Candidate>({
    ...initialData,
    email: initialData.email || '',
    phone: initialData.phone || '',
    idNumber: initialData.idNumber || ''
  });

  const [pfpPreview, setPfpPreview] = useState<string | null>(initialData.profilePhoto || null);
  const [idPreview, setIdPreview] = useState<string | null>(initialData.idCardImage || null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Helper to compress images for localStorage
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 500; // Limit resolution
          const scaleSize = MAX_WIDTH / img.width;
          canvas.width = MAX_WIDTH;
          canvas.height = img.height * scaleSize;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL('image/jpeg', 0.7));
          } else {
            reject(new Error("Canvas context failed"));
          }
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: 'PFP' | 'ID') => {
    if (e.target.files && e.target.files[0]) {
      try {
        const compressed = await compressImage(e.target.files[0]);
        if (type === 'PFP') {
          setPfpPreview(compressed);
          setFormData(prev => ({ ...prev, profilePhoto: compressed }));
        } else {
          setIdPreview(compressed);
          setFormData(prev => ({ ...prev, idCardImage: compressed }));
        }
      } catch (err) {
        console.error("Image processing failed", err);
        alert("Could not process image. Please try a simpler file (JPG/PNG).");
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pfpPreview || !idPreview) {
      alert("Please upload both a Profile Photo and a Government ID to proceed.");
      return;
    }
    setIsSubmitting(true);

    // Simulate network delay
    setTimeout(() => {
      onComplete({
        ...formData,
        isVerified: true
      });
      setIsSubmitting(false);
    }, 1500);
  };

  return (
    <div className="h-full w-full flex items-center justify-center p-4 transition-colors duration-300 relative overflow-hidden">
      {/* Background Blobs */}
      <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-brand-500/10 blur-[120px] rounded-full animate-morph"></div>
      <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] bg-emerald-500/10 blur-[120px] rounded-full animate-morph-fast"></div>

      <div className="w-full max-w-5xl h-fit max-h-[90vh] glass-card bg-white/60 dark:bg-slate-900/60 rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/40 dark:border-white/5 flex flex-col md:flex-row animate-fade-in z-10 transition-colors">

        {/* Left Side: Info & Privacy */}
        <div className="hidden md:flex w-1/3 bg-gradient-to-b from-slate-900 to-slate-950 dark:from-slate-950 dark:to-black text-slate-300 p-10 flex-col justify-between overflow-y-auto relative">
          {/* Decorative pattern */}
          <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>

          <div className="relative z-10">
            <div className="w-16 h-16 rounded-2xl bg-brand-500/20 flex items-center justify-center text-brand-400 mb-8 border border-brand-500/30">
              <ShieldCheck size={32} />
            </div>
            <h2 className="text-3xl font-black text-white mb-4 tracking-tight leading-tight">Identity<br />Verification</h2>
            <p className="text-sm text-slate-400 mb-8 leading-relaxed font-medium">
              We take security seriously. Please complete your profile to maintain the integrity of our assessment platform.
            </p>

            <div className="space-y-6">
              <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/10">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                  <ShieldCheck size={18} />
                </div>
                <div className="text-[11px] leading-relaxed">
                  <strong className="text-white block mb-0.5">End-to-End Encryption</strong>
                  Your personal data is encrypted at rest and in transit.
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/10">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                  <Camera size={18} />
                </div>
                <div className="text-[11px] leading-relaxed">
                  <strong className="text-white block mb-0.5">Biometric Match</strong>
                  Photos are used exclusively for automated proctoring verification.
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-slate-800 text-[10px] text-slate-500 font-bold uppercase tracking-widest relative z-10">
            &copy; Reicrew Security Layer
          </div>
        </div>

        {/* Right Side: Form Container */}
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-transparent">
          {/* Header */}
          <div className="p-8 border-b border-slate-100/50 dark:border-slate-800/50 shrink-0">
            <h3 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">Candidate Profile</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">Complete the form below to proceed.</p>
          </div>

          {/* Scrollable Form Body */}
          <div className="flex-1 overflow-y-auto p-8 lg:p-10">
            <form id="profile-form" onSubmit={handleSubmit} className="space-y-10">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">

                {/* Column 1: Personal Info */}
                <div className="space-y-6">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-1.5 h-6 bg-brand-500 rounded-full"></div>
                    <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Personal Details</h4>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Full Name</label>
                    <div className="relative group">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-500 transition-colors" size={16} />
                      <input
                        className="w-full pl-12 pr-4 py-3 bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm text-slate-700 dark:text-slate-300 font-bold outline-none"
                        value={formData.name}
                        readOnly
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Access ID</label>
                    <div className="relative">
                      <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input
                        className="w-full pl-12 pr-4 py-3 bg-brand-50/50 dark:bg-brand-900/10 border border-brand-100/50 dark:border-brand-800/20 rounded-2xl text-sm text-brand-700 dark:text-brand-400 font-mono tracking-tight"
                        value={formData.accessId || 'GUEST-USER'}
                        readOnly
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Email <span className="text-red-500">*</span></label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-500 transition-colors" size={16} />
                      <input
                        type="email"
                        required
                        className="w-full pl-12 pr-4 py-3 bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:border-brand-500 dark:focus:border-brand-400 focus:ring-4 focus:ring-brand-500/5 outline-none transition-all dark:text-white"
                        placeholder="you@example.com"
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Phone Number</label>
                    <div className="relative group">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-500 transition-colors" size={16} />
                      <input
                        type="tel"
                        className="w-full pl-12 pr-4 py-3 bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:border-brand-500 dark:focus:border-brand-400 focus:ring-4 focus:ring-brand-500/5 outline-none transition-all dark:text-white"
                        placeholder="+1 234 567 890"
                        value={formData.phone}
                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* Column 2: Documents */}
                <div className="space-y-6">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-1.5 h-6 bg-emerald-500 rounded-full"></div>
                    <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Verification</h4>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Government ID <span className="text-red-500">*</span></label>
                    <div className="relative group">
                      <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-500 transition-colors" size={16} />
                      <input
                        required
                        className="w-full pl-12 pr-4 py-3 bg-white/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:border-brand-500 dark:focus:border-brand-400 focus:ring-4 focus:ring-brand-500/5 outline-none transition-all dark:text-white font-mono tracking-wider"
                        placeholder="National ID / Passport #"
                        value={formData.idNumber}
                        onChange={e => setFormData({ ...formData, idNumber: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2">
                    {/* Profile Photo Upload */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Live Selfie</label>
                      <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-3xl p-2 text-center hover:bg-brand-50/50 dark:hover:bg-brand-900/10 transition-all relative group h-36 flex flex-col justify-center items-center overflow-hidden">
                        <input
                          type="file"
                          accept="image/*"
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                          onChange={(e) => handleFileChange(e, 'PFP')}
                        />
                        {pfpPreview ? (
                          <div className="relative w-full h-full rounded-2xl overflow-hidden animate-fade-in">
                            <img src={pfpPreview} alt="Profile" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Camera className="text-white" size={24} />
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-1 group-hover:scale-110 transition-transform">
                            <div className="w-12 h-12 rounded-2xl bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-brand-600 dark:text-brand-400">
                              <User size={24} />
                            </div>
                            <p className="text-[10px] font-black text-brand-700 dark:text-brand-400 uppercase tracking-widest mt-1">Upload</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* ID Card Upload */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">ID Card View</label>
                      <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-3xl p-2 text-center hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10 transition-all relative group h-36 flex flex-col justify-center items-center overflow-hidden">
                        <input
                          type="file"
                          accept="image/*"
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                          onChange={(e) => handleFileChange(e, 'ID')}
                        />
                        {idPreview ? (
                          <div className="relative w-full h-full rounded-2xl overflow-hidden animate-fade-in">
                            <img src={idPreview} alt="ID" className="w-full h-full object-contain bg-slate-100 dark:bg-slate-800" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <CreditCard className="text-white" size={24} />
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-1 group-hover:scale-110 transition-transform">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                              <CreditCard size={24} />
                            </div>
                            <p className="text-[10px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-widest mt-1">Upload</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </form>
          </div>

          {/* Fixed Footer */}
          <div className="p-8 border-t border-slate-100 dark:border-slate-800 bg-white/30 dark:bg-slate-900/30 backdrop-blur-sm shrink-0">
            <button
              type="submit"
              form="profile-form"
              disabled={isSubmitting}
              className={`w-full py-4 rounded-2xl font-black text-white flex items-center justify-center gap-3 transition-all shadow-xl tracking-tight
                    ${isSubmitting
                  ? 'bg-slate-400 dark:bg-slate-700 cursor-wait'
                  : 'bg-brand-600 hover:bg-brand-700 dark:bg-brand-500 dark:hover:bg-brand-600 shadow-brand-500/20 active:scale-95'}`}
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Verifying Information...</span>
                </>
              ) : (
                <>
                  <span>Save and Proceed</span>
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
