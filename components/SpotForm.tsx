'use client';

import React from 'react';
import { motion } from 'framer-motion';

export interface SpotFormData {
  name: string;
  description: string;
  road_condition: string;
  is_24_hours: boolean;
  open_time: string;
  close_time: string;
  category: string;
  signal_strength: string;
  entrance_fee: string;
  latitude: number;
  longitude: number;
}

interface SpotFormProps {
  form: SpotFormData;
  setForm: React.Dispatch<React.SetStateAction<SpotFormData>>;
  onSubmit: () => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
  LocationPicker: React.ComponentType<{ 
    onLocationSelect: (lat: string, lng: string) => void 
  }>;
  submitLabel?: string;
}

export default function SpotForm({ 
  form, 
  setForm, 
  onSubmit, 
  onCancel, 
  isSubmitting = false, 
  LocationPicker,
  submitLabel = "Save Spot Details"
}: SpotFormProps) {
  
  const categories = ['Cafe', 'Viewpoint', 'Camping', 'Resort', 'Restaurant', 'Trail'];
  const roadTypes = ['Concrete Road', 'Rough Road', '4x4 Only'];
  const signalTypes = ['Good Signal', 'Spotty', 'No Signal'];

  return (
    <div className="space-y-8 md:space-y-10">
      
      {/* Basic Info & Category */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
        <div className="space-y-5 md:space-y-6">
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 md:mb-3">Spot Name</label>
            <input 
              className="w-full p-4 md:p-5 border border-gray-100 rounded-xl md:rounded-2xl font-bold text-base md:text-lg bg-gray-50 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all placeholder:text-gray-300 shadow-sm" 
              placeholder="e.g. Secret Viewdeck" 
              value={form.name} 
              onChange={e => setForm({...form, name: e.target.value})} 
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 md:mb-3">Description</label>
            <textarea 
              className="w-full p-4 md:p-5 border border-gray-100 rounded-xl md:rounded-2xl text-base font-medium bg-gray-50 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all leading-relaxed placeholder:text-gray-300 resize-none shadow-sm" 
              rows={4} 
              placeholder="What makes this spot special?" 
              value={form.description} 
              onChange={e => setForm({...form, description: e.target.value})} 
            />
          </div>
        </div>

        <div className="space-y-5 md:space-y-6">
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 md:mb-3">Category</label>
            <div className="flex flex-wrap gap-2">
              {categories.map(cat => (
                <button 
                  key={cat} type="button" onClick={() => setForm({...form, category: cat})}
                  className={`px-4 py-3 rounded-xl font-bold text-[11px] transition-all shadow-sm min-h-[44px] ${
                    form.category === cat 
                    ? 'bg-blue-600 text-white shadow-md border-transparent scale-105' 
                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 md:mb-3">Entrance Fee</label>
            <input 
              className="w-full p-4 md:p-5 border border-gray-100 rounded-xl md:rounded-2xl text-base font-medium bg-gray-50 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all placeholder:text-gray-300 shadow-sm" 
              placeholder="e.g. Free or 50 PHP" 
              value={form.entrance_fee} 
              onChange={e => setForm({...form, entrance_fee: e.target.value})} 
            />
          </div>
        </div>
      </div>

      <hr className="border-gray-100" />

      {/* Upland Attributes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
        <div>
          <label className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-2 md:mb-3 flex items-center gap-2"><span>🚙</span> Road Condition</label>
          <div className="flex flex-col gap-2 mt-2">
            {roadTypes.map(type => (
              <button 
                key={type} type="button" onClick={() => setForm({...form, road_condition: type})}
                className={`p-3.5 md:p-4 rounded-xl font-bold text-sm transition-all text-left flex justify-between items-center min-h-[48px] ${
                  form.road_condition === type 
                  ? 'bg-orange-50 text-orange-700 border-2 border-orange-400 shadow-sm' 
                  : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                {type}
                {form.road_condition === type && <span className="text-orange-500 text-lg">✓</span>}
              </button>
            ))}
          </div>
        </div>
        
        <div>
          <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2 md:mb-3 flex items-center gap-2"><span>📶</span> Signal Strength</label>
          <div className="flex flex-col gap-2 mt-2">
            {signalTypes.map(type => (
              <button 
                key={type} type="button" onClick={() => setForm({...form, signal_strength: type})}
                className={`p-3.5 md:p-4 rounded-xl font-bold text-sm transition-all text-left flex justify-between items-center min-h-[48px] ${
                  form.signal_strength === type 
                  ? 'bg-blue-50 text-blue-700 border-2 border-blue-400 shadow-sm' 
                  : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                {type}
                {form.signal_strength === type && <span className="text-blue-500 text-lg">✓</span>}
              </button>
            ))}
          </div>
        </div>
      </div>

      <hr className="border-gray-100" />

      {/* Operating Hours & Location */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
        <div className="p-5 md:p-6 bg-white rounded-2xl border border-gray-100 shadow-sm h-fit">
          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 md:mb-4">Operating Hours</label>
          <div className="flex items-center gap-3 mb-5 md:mb-6">
            <input 
              type="checkbox" 
              className="w-6 h-6 rounded hover:cursor-pointer accent-blue-600 focus:ring-blue-500" 
              checked={form.is_24_hours} 
              onChange={e => setForm({...form, is_24_hours: e.target.checked})} 
            />
            <label className="text-sm font-black uppercase tracking-tight text-gray-900">Open 24/7</label>
          </div>
          
          <motion.div 
            initial={{ opacity: 1, height: 'auto' }}
            animate={{ opacity: form.is_24_hours ? 0.3 : 1, pointerEvents: form.is_24_hours ? 'none' : 'auto' }}
            className="flex gap-3 md:gap-4 items-center"
          >
            <input 
              type="time" 
              className="flex-1 p-3.5 md:p-4 border border-gray-200 rounded-xl bg-gray-50 text-base font-bold outline-none focus:border-blue-400 focus:bg-white transition-all shadow-sm" 
              value={form.open_time} 
              onChange={e => setForm({...form, open_time: e.target.value})} 
            />
            <span className="text-gray-300 font-black">—</span>
            <input 
              type="time" 
              className="flex-1 p-3.5 md:p-4 border border-gray-200 rounded-xl bg-gray-50 text-base font-bold outline-none focus:border-blue-400 focus:bg-white transition-all shadow-sm" 
              value={form.close_time} 
              onChange={e => setForm({...form, close_time: e.target.value})} 
            />
          </motion.div>
        </div>

        <div className="space-y-3 md:space-y-4">
          <div>
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Pinpoint Location</label>
            <p className="text-[11px] text-gray-500 font-medium ml-1">Zoom and pan to place the pin directly on the spot.</p>
          </div>
          <div className="rounded-2xl md:rounded-[2rem] overflow-hidden border-4 border-white shadow-[0_8px_30px_rgb(0,0,0,0.12)] h-[280px] md:h-[250px] z-0 relative">
            <LocationPicker 
              onLocationSelect={(lat: string, lng: string) => {
                setForm({ ...form, latitude: parseFloat(lat), longitude: parseFloat(lng) });
              }} 
            />
          </div>
          {form.latitude !== 0 && (
            <p className="text-[10px] text-blue-600 font-black uppercase tracking-widest text-right pr-2">
              GPS Locked: {form.latitude.toFixed(4)}, {form.longitude.toFixed(4)}
            </p>
          )}
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex flex-col md:flex-row gap-3 md:gap-4 pt-6 md:pt-8 mt-4 border-t border-gray-100">
        <button 
          onClick={onSubmit} 
          disabled={isSubmitting}
          className={`flex-1 flex justify-center items-center gap-3 text-white font-[1000] py-5 rounded-2xl shadow-xl hover:shadow-blue-500/20 hover:-translate-y-1 transition-all uppercase tracking-widest text-sm active:scale-95 border-b-4 min-h-[56px] ${
            isSubmitting ? 'bg-gray-400 border-gray-500 cursor-not-allowed' : 'bg-blue-600 border-blue-800 hover:bg-blue-500'
          }`}
        >
          {isSubmitting ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Processing...
            </>
          ) : (
            submitLabel
          )}
        </button>
        {onCancel && (
          <button 
            onClick={onCancel} 
            disabled={isSubmitting}
            className="md:px-12 bg-white border-2 border-gray-200 text-gray-600 font-bold py-4 md:py-5 rounded-2xl text-[11px] hover:bg-gray-50 hover:text-gray-900 transition-colors uppercase tracking-widest min-h-[48px]"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
