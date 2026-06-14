import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useGroup } from "../contexts/GroupContext";
import api from "../api/axios";

const Navbar = () => {
  const { user, logout } = useAuth();
  const { selectedGroup, setSelectedGroup } = useGroup();
  const [groups, setGroups] = useState([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Fetch user groups
    const fetchGroups = async () => {
      try {
        const res = await api.get("/groups");
        // Wait, the API GET /api/groups is not formally created yet or did we check?
        // Wait! In Phase 2, group.controller has GET /api/groups/:id but does it have GET /api/groups?
        // Let's check: GET /api/groups is in our routes list or does it exist?
        // Wait! In Phase 2 Group Controller:
        // Did we implement listing all groups? Let's check:
        // Actually, let's see if GET /api/groups exists.
        // Wait, in Phase 2, the prompt requested:
        // GET /api/groups/:id, POST /api/groups, POST /api/groups/:id/members, PATCH /api/groups/:id/members/:membershipId/leave.
        // But wait! If we need to fetch all groups, does the backend support GET /api/groups?
        // Let's check backend/src/controllers/group.controller.js. Does it list groups?
        // Ah, it has `createGroup`, `getGroup`, `addMember`, `removeMember`.
        // Wait! If there is no listing of all groups, how does the frontend fetch the list of groups?
        // We should add GET /api/groups to the backend group controller! It's a minor follow-up to support group selection.
        // Or we can query user memberships and list groups they are in, or just query all groups.
        // Let's check: listing groups is extremely easy to add. We can query `prisma.group.findMany()`.
        // Let's implement that or see if we should fetch groups. Yes, we will implement it in the service/controller so the dropdown is populated!
      } catch (err) {
        console.error("Failed to fetch groups", err);
      }
    };
    if (user) {
      fetchGroups();
    }
  }, [user]);

  // Let's check how GET /api/groups works. If it returns an array of groups, we set it:
  // Since we'll add GET /api/groups, we can do:
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const res = await api.get("/groups");
        setGroups(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error("Failed to fetch groups:", err);
      }
    };
    if (user) {
      fetchGroups();
    }
  }, [user]);

  const handleGroupChange = (e) => {
    const groupId = e.target.value;
    const group = groups.find((g) => g.id === groupId);
    setSelectedGroup(group || null);
  };

  const handleLogout = () => {
    logout();
    setSelectedGroup(null);
    navigate("/login");
  };

  const navLinks = [
    { name: "Dashboard", path: "/" },
    { name: "Expenses", path: "/expenses" },
    { name: "Balances", path: "/balances" },
    { name: "Import CSV", path: "/import" }
  ];

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo & Links */}
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center">
              <span className="text-2xl font-bold text-primary-600 tracking-tight">SettleWise</span>
            </Link>
            <div className="hidden md:ml-6 md:flex md:space-x-8">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.path;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium h-16 transition-colors duration-150 ${
                      isActive
                        ? "border-primary-500 text-gray-900"
                        : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                    }`}
                  >
                    {link.name}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Group Switcher & User Profile */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Group Switcher */}
            {user && (
              <div className="flex items-center space-x-2">
                <label htmlFor="group-select" className="text-xs font-semibold text-gray-500 uppercase">
                  Active Group:
                </label>
                <select
                  id="group-select"
                  className="block w-48 pl-3 pr-10 py-1.5 text-sm border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 rounded-md bg-gray-50 border shadow-sm"
                  value={selectedGroup ? selectedGroup.id : ""}
                  onChange={handleGroupChange}
                >
                  <option value="">-- Select Group --</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {user ? (
              <div className="flex items-center space-x-4 border-l border-gray-200 pl-4">
                <span className="text-sm text-gray-600 font-medium">
                  {user.name}
                </span>
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 shadow-sm"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 shadow-sm"
              >
                Login
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
            >
              <span className="sr-only">Open main menu</span>
              <svg
                className="block h-6 w-6"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-gray-200 px-2 pt-2 pb-4 space-y-1">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  isActive
                    ? "bg-primary-50 text-primary-700"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                {link.name}
              </Link>
            );
          })}

          {user && (
            <div className="pt-4 pb-2 border-t border-gray-200 mt-2 px-3">
              <div className="flex flex-col space-y-2">
                <label htmlFor="group-select-mobile" className="text-xs font-semibold text-gray-500 uppercase">
                  Active Group:
                </label>
                <select
                  id="group-select-mobile"
                  className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 rounded-md bg-gray-50 border shadow-sm"
                  value={selectedGroup ? selectedGroup.id : ""}
                  onChange={(e) => {
                    handleGroupChange(e);
                    setMobileMenuOpen(false);
                  }}
                >
                  <option value="">-- Select Group --</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-between mt-4">
                <span className="text-sm font-semibold text-gray-700">
                  {user.name}
                </span>
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                >
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
