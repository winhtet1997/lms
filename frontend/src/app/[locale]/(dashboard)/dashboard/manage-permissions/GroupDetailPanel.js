"use client";
import { useGroupStore } from "@/store/useGroupStore";
import { authService } from "@/service/authService";
import { useEffect, useState, useMemo } from "react";
import toast from "react-hot-toast";
import {
  Check,
  Loader2,
  Pencil,
  Search,
  Shield,
  UserMinus,
  UserPlus,
  Users,
  X,
} from "lucide-react";

const APP_LABEL_NAMES = {
  lms_auth: "Users",
  lms_course: "Courses",
  lms_sessions: "Sessions",
  lms_billing: "Enrollment",
  admin: "Admin",
  auth: "Auth",
};

const appLabel = (key) =>
  APP_LABEL_NAMES[key] ?? key.replace(/_/g, " ").toUpperCase();

function PermissionConfigurator({ group }) {
  const availablePermissions = useGroupStore(
    (state) => state.availablePermissions,
  );
  const permissionsLoading = useGroupStore((state) => state.permissionsLoading);
  const fetchAvailablePermissions = useGroupStore(
    (state) => state.fetchAvailablePermissions,
  );
  const updateGroup = useGroupStore((state) => state.updateGroup);

  const [selected, setSelected] = useState(new Set());
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAvailablePermissions();
  }, [fetchAvailablePermissions]);

  useEffect(() => {
    setSelected(new Set((group.permissions ?? []).map((p) => p.id)));
    setDirty(false);
  }, [group.id, group.permissions]);

  const toggle = (permId) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(permId) ? next.delete(permId) : next.add(permId);
      return next;
    });
    setDirty(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateGroup(group.id, { permission_ids: Array.from(selected) });
      toast.success("Permissions saved.");
      setDirty(false);
    } catch {
      toast.error("Failed to save permissions.");
    } finally {
      setSaving(false);
    }
  };

  if (permissionsLoading) {
    return (
      <div className="flex justify-center py-6">
        <Loader2 className="animate-spin text-gray-400" size={20} />
      </div>
    );
  }

  const relevantApps = Object.keys(availablePermissions).filter((app) =>
    app.startsWith("lms_"),
  );

  return (
    <div>
      <p className="text-xs text-gray-500 mb-4">
        Click a permission to toggle it on or off.
      </p>
      <div className="space-y-5">
        {relevantApps.map((app) => (
          <div key={app}>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              {appLabel(app)}
            </p>
            <div className="flex flex-wrap gap-2">
              {availablePermissions[app].map((perm) => {
                const active = selected.has(perm.id);
                return (
                  <button
                    key={perm.id}
                    onClick={() => toggle(perm.id)}
                    className={`btn btn-sm shadow-none transition-all ${
                      active
                        ? "btn-info"
                        : "btn-outline border-gray-300 text-gray-600 hover:border-info hover:text-info"
                    }`}
                  >
                    {active && <span className="mr-1">✓</span>}
                    {perm.name}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      {dirty && (
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn btn-info shadow-none mt-6"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            "Save Permissions"
          )}
        </button>
      )}
    </div>
  );
}

function AssignedUsersPanel({ group }) {
  const { updateGroup } = useGroupStore();
  const [showAddUser, setShowAddUser] = useState(false);
  const [removingId, setRemovingId] = useState(null);

  const handleAddUser = async (newUserIds) => {
    await updateGroup(group.id, { user_ids: newUserIds });
  };

  const handleRemove = async (userId) => {
    setRemovingId(userId);
    try {
      const remaining = (group.users ?? [])
        .map((u) => u.id)
        .filter((id) => id !== userId);
      await updateGroup(group.id, { user_ids: remaining });
      toast.success("User removed from group.");
    } catch {
      toast.error("Failed to remove user.");
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <>
      <div className="rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users size={16} className="text-gray-500" />
            <span className="font-semibold text-sm">Assigned Users</span>
            <span className="badge badge-info badge-sm">
              {group.user_count}
            </span>
          </div>
          <button
            onClick={() => setShowAddUser(true)}
            className="btn btn-outline btn-info btn-xs shadow-none"
          >
            <UserPlus size={13} />
            Add User
          </button>
        </div>

        {group.users?.length > 0 ? (
          <ul className="space-y-2">
            {group.users.map((u) => (
              <li
                key={u.id}
                className="flex items-center justify-between text-sm group/row"
              >
                <div>
                  <span className="font-medium">
                    {u.full_name || u.username}
                  </span>
                  <span className="text-gray-400 ml-2 text-xs">{u.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="badge badge-ghost badge-sm">{u.role}</span>
                  <button
                    onClick={() => handleRemove(u.id)}
                    disabled={removingId === u.id}
                    className="btn btn-ghost btn-xs btn-circle text-gray-300 hover:text-error opacity-0 group-hover/row:opacity-100 transition-opacity"
                    title="Remove from group"
                  >
                    {removingId === u.id ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <UserMinus size={13} />
                    )}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-400">
            No users assigned to this group
          </p>
        )}
      </div>

      {showAddUser && (
        <AddUserModal
          group={group}
          onClose={() => setShowAddUser(false)}
          onAdd={handleAddUser}
        />
      )}
    </>
  );
}

function AddUserModal({ group, onClose, onAdd }) {
  const [allUsers, setAllUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [busy, setBusy] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const existingIds = useMemo(
    () => new Set((group.users ?? []).map((u) => u.id)),
    [group.users],
  );

  useEffect(() => {
    authService.getUsers({ page_size: 9999 }).then((data) => {
      setAllUsers(data.users ?? []);
      setLoadingUsers(false);
    });
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return allUsers.filter(
      (u) =>
        !existingIds.has(u.id) &&
        (u.username?.toLowerCase().includes(q) ||
          u.full_name?.toLowerCase().includes(q) ||
          u.email?.toLowerCase().includes(q)),
    );
  }, [allUsers, search, existingIds]);

  const handleAdd = async () => {
    if (!selectedUser) return;
    setBusy(true);
    try {
      const currentIds = (group.users ?? []).map((u) => u.id);
      await onAdd([...currentIds, selectedUser.id]);
      toast.success(
        `${selectedUser.full_name || selectedUser.username} added to group.`,
      );
      onClose();
    } catch {
      toast.error("Failed to add user.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 relative flex flex-col max-h-[80vh]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 btn btn-ghost btn-sm btn-circle text-gray-400"
        >
          <X size={16} />
        </button>
        <h2 className="text-lg font-semibold mb-1">Add User to Group</h2>
        <p className="text-sm text-gray-500 mb-4">
          Search and select a user to add to <strong>{group.name}</strong>.
        </p>

        {/* Search */}
        <div className="relative mb-3">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            className="input input-bordered w-full pl-9 h-10 text-sm"
            placeholder="Search by name, username or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
        </div>

        {/* User list */}
        <div className="flex-1 overflow-y-auto border border-gray-200 rounded-xl divide-y divide-gray-100 min-h-0">
          {loadingUsers ? (
            <div className="flex justify-center py-8">
              <Loader2 className="animate-spin text-gray-400" size={20} />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">
              {search
                ? "No matching users found."
                : "All users are already in this group."}
            </p>
          ) : (
            filtered.map((u) => (
              <button
                key={u.id}
                onClick={() =>
                  setSelectedUser(selectedUser?.id === u.id ? null : u)
                }
                className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors ${
                  selectedUser?.id === u.id ? "bg-info/10" : "hover:bg-gray-50"
                }`}
              >
                <div>
                  <p className="text-sm font-medium">
                    {u.full_name || u.username}
                  </p>
                  <p className="text-xs text-gray-400">{u.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="badge badge-ghost badge-sm">{u.role}</span>
                  {selectedUser?.id === u.id && (
                    <span className="w-4 h-4 rounded-full bg-info flex items-center justify-center text-white text-xs">
                      ✓
                    </span>
                  )}
                </div>
              </button>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 mt-4">
          <button onClick={onClose} className="btn btn-ghost flex-1">
            Cancel
          </button>
          <button
            onClick={handleAdd}
            disabled={!selectedUser || busy}
            className="btn btn-info flex-1 shadow-none"
          >
            {busy ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <UserPlus size={15} />
                Add User
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Group Detail Panel (right)
export default function GroupDetailPanel({ groupId }) {
  const selectedGroup = useGroupStore((state) => state.selectedGroup);
  const fetchGroup = useGroupStore((state) => state.fetchGroup);
  const updateGroup = useGroupStore((state) => state.updateGroup);
  const detailLoading = useGroupStore((state) => state.detailLoading);

  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (groupId) fetchGroup(groupId);
  }, [groupId, fetchGroup]);

  const startEdit = () => {
    setEditName(selectedGroup.name);
    setEditDesc(selectedGroup.description ?? "");
    setEditing(true);
  };

  const cancelEdit = () => setEditing(false);

  const handleSaveEdit = async () => {
    if (!editName.trim()) return;
    setSaving(true);
    try {
      await updateGroup(selectedGroup.id, {
        name: editName.trim(),
        description: editDesc.trim(),
      });
      toast.success("Group updated.");
      setEditing(false);
    } catch {
      toast.error("Failed to update group.");
    } finally {
      setSaving(false);
    }
  };

  if (detailLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="animate-spin text-gray-400" size={24} />
      </div>
    );
  }

  if (!selectedGroup) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        {editing ? (
          <div className="space-y-2">
            <input
              className="input input-bordered w-full font-bold text-xl"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Group name"
              autoFocus
            />
            <input
              className="input input-bordered w-full text-sm"
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              placeholder="Description (optional)"
            />
            <div className="flex gap-2 pt-1">
              <button
                onClick={handleSaveEdit}
                disabled={saving || !editName.trim()}
                className="btn btn-info btn-sm shadow-none"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <><Check size={14} /> Save</>}
              </button>
              <button onClick={cancelEdit} className="btn btn-ghost btn-sm">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="text-xl font-bold">{selectedGroup.name}</h2>
              {selectedGroup.description && (
                <p className="text-sm text-gray-500 mt-0.5">
                  {selectedGroup.description}
                </p>
              )}
            </div>
            <button
              onClick={startEdit}
              className="btn btn-ghost btn-sm btn-circle text-gray-400 hover:text-info shrink-0"
              title="Edit group"
            >
              <Pencil size={15} />
            </button>
          </div>
        )}
      </div>

      {/* Assigned Users */}
      <AssignedUsersPanel group={selectedGroup} />

      {/* Active Permissions */}
      <div className="rounded-xl border border-gray-200 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Shield size={16} className="text-gray-500" />
          <span className="font-semibold text-sm">Active Permissions</span>
          <span className="badge badge-info badge-sm">
            {selectedGroup.permissions?.length ?? 0}
          </span>
        </div>
        {selectedGroup.permissions?.length > 0 ? (
          <ul className="space-y-1">
            {selectedGroup.permissions.map((p) => (
              <li key={p.id} className="text-sm text-gray-700">
                {p.name}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-400">No permissions assigned</p>
        )}
      </div>

      {/* Configure Permissions */}
      <div className="rounded-xl border border-gray-200 p-5">
        <p className="font-semibold text-sm mb-1">Configure Permissions</p>
        <PermissionConfigurator group={selectedGroup} />
      </div>
    </div>
  );
}
