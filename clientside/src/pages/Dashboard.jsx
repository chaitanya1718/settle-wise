import React, { useState } from "react";
import { useGroup } from "../contexts/GroupContext";
import {
  useGroups,
  useCreateGroup,
  useGroupDetails,
  useAddGroupMember,
  useLeaveGroup,
  useUsers,
  useGroupDashboard
} from "../hooks/useGroups";

const Dashboard = () => {
  const { selectedGroup, setSelectedGroup } = useGroup();
  const { data: groups, isLoading: groupsLoading, error: groupsError } = useGroups();
  const { data: users, isLoading: usersLoading } = useUsers();
  
  const groupId = selectedGroup?.id;
  const { data: dashboard, isLoading: dashLoading, error: dashError } = useGroupDashboard(groupId);
  const { data: details, isLoading: detailsLoading } = useGroupDetails(groupId);

  const createGroupMutation = useCreateGroup();
  const addMemberMutation = useAddGroupMember(groupId);
  const leaveGroupMutation = useLeaveGroup(groupId);

  const [newGroupName, setNewGroupName] = useState("");
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [memberJoinDate, setMemberJoinDate] = useState(new Date().toISOString().split("T")[0]);
  const [showAddMember, setShowAddMember] = useState(false);
  
  const [feedbackMsg, setFeedbackMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    setErrorMsg("");
    setFeedbackMsg("");
    try {
      const res = await createGroupMutation.mutateAsync(newGroupName);
      setSelectedGroup(res.group);
      setNewGroupName("");
      setShowCreateGroup(false);
      setFeedbackMsg("Group created successfully!");
    } catch (err) {
      setErrorMsg(err.response?.data?.error || "Failed to create group.");
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!selectedUserId) return;
    setErrorMsg("");
    setFeedbackMsg("");
    try {
      await addMemberMutation.mutateAsync({
        userId: selectedUserId,
        joinedAt: new Date(memberJoinDate).toISOString()
      });
      setSelectedUserId("");
      setShowAddMember(false);
      setFeedbackMsg("Member added successfully!");
    } catch (err) {
      setErrorMsg(err.response?.data?.error || "Failed to add member.");
    }
  };

  const handleLeaveGroup = async (membershipId) => {
    if (!window.confirm("Are you sure you want to remove this member (soft-delete membership)?")) return;
    setErrorMsg("");
    setFeedbackMsg("");
    try {
      await leaveGroupMutation.mutateAsync({
        membershipId,
        leftAt: new Date().toISOString()
      });
      setFeedbackMsg("Member left the group successfully.");
    } catch (err) {
      setErrorMsg(err.response?.data?.error || "Failed to remove member.");
    }
  };

  if (groupsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-primary-600"></div>
        <span className="ml-3 text-sm text-gray-500 font-semibold">Loading groups...</span>
      </div>
    );
  }

  if (groupsError) {
    return (
      <div className="max-w-7xl mx-auto px-4 mt-8">
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-2xl p-6">
          <h3 className="text-lg font-bold">Error Loading Groups</h3>
          <p className="text-sm mt-1">{groupsError.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Alert Feedbacks */}
      {feedbackMsg && (
        <div className="bg-green-50 border border-green-200 text-green-800 rounded-xl p-4 mb-6 flex justify-between items-center shadow-sm">
          <span className="text-sm font-semibold">{feedbackMsg}</span>
          <button onClick={() => setFeedbackMsg("")} className="text-green-600 hover:text-green-800 font-bold">×</button>
        </div>
      )}
      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-4 mb-6 flex justify-between items-center shadow-sm">
          <span className="text-sm font-semibold">{errorMsg}</span>
          <button onClick={() => setErrorMsg("")} className="text-red-600 hover:text-red-800 font-bold">×</button>
        </div>
      )}

      {/* Main Grid: Info and Switcher */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b border-gray-150 pb-6 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            {selectedGroup ? selectedGroup.name : "Welcome to SettleWise"}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {selectedGroup ? "Manage expenses and settlements for this group" : "Select or create a group to get started"}
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowCreateGroup(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
          >
            Create Group
          </button>
        </div>
      </div>

      {/* Empty State */}
      {!selectedGroup ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-sm max-w-xl mx-auto mt-12">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <h3 className="text-xl font-bold text-gray-900">No Active Group Selected</h3>
          <p className="text-sm text-gray-500 mt-2">
            Please choose a group from the active group dropdown in the navbar, or create a brand new one using the button above.
          </p>
        </div>
      ) : (
        <>
          {/* Dashboard Stat Cards */}
          {dashLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="animate-pulse bg-white border border-gray-150 h-28 rounded-2xl"></div>
              ))}
            </div>
          ) : dashError ? (
            <div className="bg-red-50 border border-red-200 text-red-800 rounded-2xl p-6 mb-8">
              <h4 className="font-bold">Error loading dashboard stats</h4>
              <p className="text-xs">{dashError.message}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Total Expenses */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Total Expenses</span>
                <span className="text-3xl font-extrabold text-primary-600 mt-2 block">
                  {parseFloat(dashboard.totalExpenses).toFixed(2)}
                </span>
                <span className="text-xs text-gray-500 mt-1 block">Accumulated total</span>
              </div>
              {/* Member Count */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Members</span>
                <span className="text-3xl font-extrabold text-gray-900 mt-2 block">
                  {dashboard.memberCount}
                </span>
                <span className="text-xs text-gray-500 mt-1 block">Active participants</span>
              </div>
              {/* Pending Imports */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Pending Imports</span>
                <span className="text-3xl font-extrabold text-amber-600 mt-2 block">
                  {dashboard.pendingImports}
                </span>
                <span className="text-xs text-gray-500 mt-1 block">Jobs requiring review</span>
              </div>
              {/* Outstanding Settlements */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Outstanding Settlements</span>
                <span className="text-3xl font-extrabold text-indigo-600 mt-2 block">
                  {dashboard.outstandingSettlements}
                </span>
                <span className="text-xs text-gray-500 mt-1 block">Suggested transfers</span>
              </div>
            </div>
          )}

          {/* Members Timeline and Admin Options */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm mb-8">
            <div className="flex justify-between items-center border-b border-gray-100 pb-4 mb-4">
              <h3 className="text-lg font-bold text-gray-900">Group Members</h3>
              <button
                onClick={() => setShowAddMember(true)}
                className="text-xs font-bold text-primary-600 hover:text-primary-700 bg-primary-50 px-3 py-1.5 rounded-lg border border-primary-100"
              >
                Add Member
              </button>
            </div>

            {detailsLoading ? (
              <div className="space-y-2">
                {[1, 2].map((i) => (
                  <div key={i} className="animate-pulse h-12 bg-gray-50 rounded-xl"></div>
                ))}
              </div>
            ) : details?.memberships && details.memberships.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-150 text-left text-sm">
                  <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-3">Name</th>
                      <th className="px-6 py-3">Email</th>
                      <th className="px-6 py-3">Joined At</th>
                      <th className="px-6 py-3">Left At</th>
                      <th className="px-6 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white text-gray-700">
                    {details.memberships.map((m) => {
                      const isLeft = m.leftAt !== null;
                      return (
                        <tr key={m.id} className={`hover:bg-gray-50/50 ${isLeft ? "opacity-50" : ""}`}>
                          <td className="px-6 py-4 font-bold text-gray-900">{m.user.name}</td>
                          <td className="px-6 py-4 text-gray-500">{m.user.email}</td>
                          <td className="px-6 py-4 text-gray-500">
                            {new Date(m.joinedAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-gray-500">
                            {isLeft ? new Date(m.leftAt).toLocaleDateString() : "Active Member"}
                          </td>
                          <td className="px-6 py-4 text-right">
                            {!isLeft && (
                              <button
                                onClick={() => handleLeaveGroup(m.id)}
                                className="text-xs font-bold text-red-600 hover:text-red-700"
                              >
                                Remove
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">No membership records found.</p>
            )}
          </div>
        </>
      )}

      {/* Modal: Create Group */}
      {showCreateGroup && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-base font-bold text-gray-900">Create New Group</h3>
              <button onClick={() => setShowCreateGroup(false)} className="text-gray-400 hover:text-gray-600 text-xl font-bold">×</button>
            </div>
            <form onSubmit={handleCreateGroup} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Group Name</label>
                <input
                  type="text"
                  required
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  placeholder="e.g. Roommates 2026, Trip to Bali"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateGroup(false)}
                  className="px-4 py-2 border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createGroupMutation.isPending}
                  className="px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-bold hover:bg-primary-700 disabled:opacity-50"
                >
                  {createGroupMutation.isPending ? "Creating..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Member */}
      {showAddMember && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-base font-bold text-gray-900">Add Member to Group</h3>
              <button onClick={() => setShowAddMember(false)} className="text-gray-400 hover:text-gray-600 text-xl font-bold">×</button>
            </div>
            <form onSubmit={handleAddMember} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Select User</label>
                <select
                  required
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-primary-500 focus:border-primary-500 sm:text-sm bg-white"
                >
                  <option value="">-- Choose User --</option>
                  {users?.map((u) => {
                    // Do not list users who are already active members
                    const alreadyMember = details?.memberships?.some(
                      (m) => m.userId === u.id && m.leftAt === null
                    );
                    if (alreadyMember) return null;
                    return (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.email})
                      </option>
                    );
                  })}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Joined Date</label>
                <input
                  type="date"
                  required
                  value={memberJoinDate}
                  onChange={(e) => setMemberJoinDate(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddMember(false)}
                  className="px-4 py-2 border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addMemberMutation.isPending}
                  className="px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-bold hover:bg-primary-700 disabled:opacity-50"
                >
                  {addMemberMutation.isPending ? "Adding..." : "Add Member"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
