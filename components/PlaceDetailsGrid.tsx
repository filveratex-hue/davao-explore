export default function PlaceDetailsGrid({ roadCondition, is24Hours, openTime, closeTime }: { roadCondition?: string; is24Hours?: boolean; openTime?: string; closeTime?: string }) {
  return (
    <div className="grid grid-cols-2 gap-3 mb-10">
      <div className="bg-orange-50 rounded-2xl p-4 md:p-5 border border-orange-100">
        <span className="text-[8px] md:text-[9px] font-black text-orange-400 uppercase tracking-widest block mb-1">Road Condition</span>
        <span className="text-xs md:text-sm font-[1000] text-orange-900 tracking-tight flex items-center gap-2">🚙 {roadCondition || "Any Vehicle"}</span>
      </div>
      <div className="bg-blue-50 rounded-2xl p-4 md:p-5 border border-blue-100">
        <span className="text-[8px] md:text-[9px] font-black text-blue-400 uppercase tracking-widest block mb-1">Operating Hours</span>
        <span className="text-xs md:text-sm font-[1000] text-blue-900 tracking-tight flex items-center gap-2">
          ⏰ {is24Hours ? '24 Hours' : `${openTime?.slice(0,5) || '?'} - ${closeTime?.slice(0,5) || '?'}`}
        </span>
      </div>
    </div>
  );
}
