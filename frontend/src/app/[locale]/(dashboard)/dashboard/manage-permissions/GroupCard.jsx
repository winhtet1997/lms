import { Trash2 } from "lucide-react";

export default function GroupCard({ group, selected, onSelect, onDelete }) {
  return (
    <div
      onClick={() => onSelect(group)}
      className={`relative rounded-xl border p-4 cursor-pointer transition-all ${
        selected
          ? "border-info bg-info/5"
          : "border-gray-200 hover:border-gray-300 bg-white"
      }`}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete(group);
        }}
        className="absolute top-3 right-3 btn btn-ghost btn-xs btn-circle text-gray-400 hover:text-error"
      >
        <Trash2 size={14} />
      </button>
      <p className="font-semibold text-sm pr-6">{group.name}</p>
      {group.description && (
        <p className="text-xs text-gray-500 mt-0.5 truncate">
          {group.description}
        </p>
      )}
      <div className="flex gap-2 mt-3">
        <span className="badge badge-ghost text-xs">
          {group.user_count} users
        </span>
        <span className="badge badge-ghost text-xs">
          {group.permission_count} permissions
        </span>
      </div>
    </div>
  );
}
