"use client";

export default function AccountInfoCard({ titleLabel, rows }) {
    const visibleRows = rows.filter((row) => row.value);

    return (
        <div className="bg-white border border-gray-300 rounded-2xl p-6 space-y-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                {titleLabel}
            </p>

            <div className="space-y-2">
                {visibleRows.map(({ Icon, value }, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-gray-600">
                        <Icon className="w-4 h-4 text-gray-400 shrink-0" />
                        <span>{value}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
