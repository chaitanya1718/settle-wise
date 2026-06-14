import React, { createContext, useState, useEffect, useContext } from "react";

const GroupContext = createContext(null);

export const GroupProvider = ({ children }) => {
  const [selectedGroup, setSelectedGroupState] = useState(null);

  useEffect(() => {
    // Restore selected group from localStorage on initial load
    const savedGroup = localStorage.getItem("selectedGroup");
    if (savedGroup) {
      try {
        setSelectedGroupState(JSON.parse(savedGroup));
      } catch (err) {
        console.error("Failed to parse selected group", err);
        localStorage.removeItem("selectedGroup");
      }
    }
  }, []);

  const setSelectedGroup = (group) => {
    if (group) {
      localStorage.setItem("selectedGroup", JSON.stringify(group));
    } else {
      localStorage.removeItem("selectedGroup");
    }
    setSelectedGroupState(group);
  };

  const value = {
    selectedGroup,
    setSelectedGroup
  };

  return <GroupContext.Provider value={value}>{children}</GroupContext.Provider>;
};

export const useGroup = () => {
  const context = useContext(GroupContext);
  if (!context) {
    throw new Error("useGroup must be used within a GroupProvider");
  }
  return context;
};
