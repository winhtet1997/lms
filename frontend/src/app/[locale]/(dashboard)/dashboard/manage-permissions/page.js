"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus, Shield, X } from "lucide-react";
import toast from "react-hot-toast";
import { useGroupStore } from "@/store/useGroupStore";

import GroupCard from "./GroupCard";
import GroupDetailPanel from "./GroupDetailPanel";

function AddGroupModal({ onClose, onCreate }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return toast.error("Group name is required.");
    setBusy(true);
    try {
      await onCreate({ name: name.trim(), description: description.trim() });
      toast.success("Group created.");
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.name?.[0] ?? "Failed to create group.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 btn btn-ghost btn-sm btn-circle text-gray-400"
        >
          <X size={16} />
        </button>
        <h2 className="text-lg font-semibold mb-6">New Group</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              className="input input-bordered w-full"
              placeholder="e.g. Content Manager"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              Description
            </label>
            <input
              className="input input-bordered w-full"
              placeholder="Short description of this group"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <button
            type="submit"
            disabled={busy}
            className="btn btn-info w-full shadow-none mt-2"
          >
            {busy ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Create Group"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

// Delete Confirm Modal
function DeleteConfirmModal({ groupName, onConfirm, onClose }) {
  const [busy, setBusy] = useState(false);

  const handleDelete = async () => {
    setBusy(true);
    try {
      await onConfirm();
      toast.success("Group deleted.");
      onClose();
    } catch {
      toast.error("Failed to delete group.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-8 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 btn btn-ghost btn-sm btn-circle text-gray-400"
        >
          <X size={16} />
        </button>
        <h2 className="text-lg font-semibold mb-2">Delete Group</h2>
        <p className="text-sm text-gray-500 mb-6">
          Are you sure you want to delete <strong>{groupName}</strong>? This
          cannot be undone.
        </p>
        <div className="flex gap-3">
          <button onClick={onClose} className="btn btn-ghost flex-1">
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={busy}
            className="btn btn-error flex-1 shadow-none"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Main Page
export default function ManagePermissionsPage() {
  const groups = useGroupStore((state) => state.groups);
  const loading = useGroupStore((state) => state.loading);
  const fetchGroups = useGroupStore((state) => state.fetchGroups);
  const createGroup = useGroupStore((state) => state.createGroup);
  const deleteGroup = useGroupStore((state) => state.deleteGroup);
  const setSelectedGroup = useGroupStore((state) => state.setSelectedGroup);

  const [showAdd, setShowAdd] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const handleSelect = (group) => {
    if (selectedId === group.id) {
      setSelectedId(null);
      setSelectedGroup(null);
    } else {
      setSelectedId(group.id);
      setSelectedGroup(null);
    }
  };

  const handleDelete = async () => {
    await deleteGroup(deleteTarget.id);
    if (selectedId === deleteTarget.id) setSelectedId(null);
  };

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-1">Manage Permissions</h1>
        <p className="text-gray-500 text-sm">
          Configure groups, permissions, and user access control
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left: Groups List */}
        <div className="w-full lg:w-80 shrink-0">
          <div className="rounded-xl border border-gray-200 p-5 bg-white">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-semibold">Groups</h2>
              <button
                onClick={() => setShowAdd(true)}
                className="btn btn-info btn-sm shadow-none"
              >
                <Plus size={14} />
                Add Group
              </button>
            </div>
            <p className="text-xs text-gray-400 mb-4">
              {groups.length} group{groups.length !== 1 ? "s" : ""} defined
            </p>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="animate-spin text-gray-400" size={20} />
              </div>
            ) : groups.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">
                No groups yet. Create one to get started.
              </p>
            ) : (
              <div className="space-y-3">
                {groups.map((g) => (
                  <GroupCard
                    key={g.id}
                    group={g}
                    selected={selectedId === g.id}
                    onSelect={handleSelect}
                    onDelete={setDeleteTarget}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Group Detail */}
        <div className="flex-1 min-w-0">
          {selectedId ? (
            <GroupDetailPanel key={selectedId} groupId={selectedId} />
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400 rounded-xl border border-dashed border-gray-200">
              <Shield size={32} className="mb-3 opacity-40" />
              <p className="text-sm">
                Select a group to view and configure permissions
              </p>
            </div>
          )}
        </div>
      </div>

      {showAdd && (
        <AddGroupModal
          onClose={() => setShowAdd(false)}
          onCreate={createGroup}
        />
      )}
      {deleteTarget && (
        <DeleteConfirmModal
          groupName={deleteTarget.name}
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
