export default function KpiCard({ label, value, sub, icon: Icon, iconBg, iconColor, centered = false, className = '' }) {
  return (
    <div className={`premium-kpi p-5 ${centered ? 'text-center' : ''} ${className}`}>
      {centered ? (
        <>
          {Icon && (
            <div className={`p-2 rounded-lg ${iconBg} inline-flex mb-2`}>
              <Icon size={16} className={iconColor} />
            </div>
          )}
          <div className="text-2xl font-black text-slate-800 count-up">{value}</div>
          <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-1">{label}</div>
          {sub && <span className="text-[9px] text-slate-500 mt-0.5 block">{sub}</span>}
        </>
      ) : (
        <>
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">{label}</span>
            {Icon && (
              <div className={`p-2 rounded-lg ${iconBg}`}>
                <Icon size={14} className={iconColor} />
              </div>
            )}
          </div>
          <div className="text-2xl font-black text-slate-800 mt-2 count-up">{value}</div>
          {sub && <span className="text-[9px] text-slate-500 mt-1 block">{sub}</span>}
        </>
      )}
    </div>
  )
}
