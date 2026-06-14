const prisma = require("../config/prisma");

/**
 * Create a new group.
 * The creating user is automatically added as the first active member.
 * 
 * POST /api/groups
 */
const createGroup = async (req, res) => {
  try {
    const { name } = req.body;
    const creatorId = req.user.id;

    if (!name) {
      return res.status(400).json({
        error: "Group name is required."
      });
    }

    // Create group and add creator as the first member in a transaction
    const group = await prisma.group.create({
      data: {
        name: name.trim(),
        memberships: {
          create: {
            userId: creatorId,
            joinedAt: new Date()
          }
        }
      },
      include: {
        memberships: true
      }
    });

    return res.status(201).json({
      message: "Group created successfully.",
      group
    });
  } catch (error) {
    console.error("Create group error:", error);
    return res.status(500).json({
      error: "Internal server error."
    });
  }
};

/**
 * Get group details including active and historic memberships.
 * 
 * GET /api/groups/:id
 */
const getGroup = async (req, res) => {
  try {
    const { id } = req.params;

    const group = await prisma.group.findUnique({
      where: { id },
      include: {
        memberships: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    });

    if (!group) {
      return res.status(404).json({
        error: "Group not found."
      });
    }

    return res.status(200).json(group);
  } catch (error) {
    console.error("Get group error:", error);
    return res.status(500).json({
      error: "Internal server error."
    });
  }
};

/**
 * Add a member to a group.
 * Creates a new GroupMembership record.
 * 
 * POST /api/groups/:id/members
 */
const addMember = async (req, res) => {
  try {
    const { id } = req.params; // groupId
    const { userId, joinedAt } = req.body;

    if (!userId) {
      return res.status(400).json({
        error: "User ID is required."
      });
    }

    // Check if group exists
    const group = await prisma.group.findUnique({
      where: { id }
    });
    if (!group) {
      return res.status(404).json({
        error: "Group not found."
      });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    if (!user) {
      return res.status(404).json({
        error: "User not found."
      });
    }

    const parsedJoinedAt = joinedAt ? new Date(joinedAt) : new Date();

    // Check if membership already exists
    const existingMembership = await prisma.groupMembership.findUnique({
      where: {
        userId_groupId: {
          userId,
          groupId: id
        }
      }
    });

    if (existingMembership) {
      // If they are currently in the group
      if (existingMembership.leftAt === null) {
        return res.status(400).json({
          error: "User is already an active member of this group."
        });
      }

      // Reactivate membership (soft re-entry)
      const updatedMembership = await prisma.groupMembership.update({
        where: { id: existingMembership.id },
        data: {
          joinedAt: parsedJoinedAt,
          leftAt: null
        }
      });

      return res.status(200).json({
        message: "User membership reactivated.",
        membership: updatedMembership
      });
    }

    // Create new membership record
    const membership = await prisma.groupMembership.create({
      data: {
        groupId: id,
        userId,
        joinedAt: parsedJoinedAt
      }
    });

    return res.status(201).json({
      message: "Member added to group successfully.",
      membership
    });
  } catch (error) {
    console.error("Add member error:", error);
    return res.status(500).json({
      error: "Internal server error."
    });
  }
};

/**
 * Remove/soft-delete a member by setting their leftAt timestamp.
 * 
 * PATCH /api/groups/:id/members/:membershipId/leave
 */
const removeMember = async (req, res) => {
  try {
    const { id, membershipId } = req.params;
    const { leftAt } = req.body;

    if (!leftAt) {
      return res.status(400).json({
        error: "leftAt timestamp is required."
      });
    }

    // Find the membership
    const membership = await prisma.groupMembership.findUnique({
      where: { id: membershipId }
    });

    if (!membership) {
      return res.status(404).json({
        error: "Group membership not found."
      });
    }

    if (membership.groupId !== id) {
      return res.status(400).json({
        error: "Membership does not belong to the specified group."
      });
    }

    // Soft delete/update leftAt timestamp to preserve membership history
    const updatedMembership = await prisma.groupMembership.update({
      where: { id: membershipId },
      data: {
        leftAt: new Date(leftAt)
      }
    });

    return res.status(200).json({
      message: "Member left group successfully.",
      membership: updatedMembership
    });
  } catch (error) {
    console.error("Remove member error:", error);
    return res.status(500).json({
      error: "Internal server error."
    });
  }
};

module.exports = {
  createGroup,
  getGroup,
  addMember,
  removeMember
};
