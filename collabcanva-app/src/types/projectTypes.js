// Project-related TypeScript interfaces for multi-project system
// This file exports the types as runtime values to ensure they're available

export const Project = {};
export const ProjectSettings = {};
export const ProjectMember = {};
export const ProjectRole = {};
export const ProjectInvitation = {};
export const ProjectCanvas = {};
export const ProjectActivity = {};
export const ProjectActivityAction = {};
export const ProjectSearchFilters = {};
export const ProjectStats = {};
export const ProjectPermission = {};
export const Permission = {};
export const PresenceData = {};
export const ActivityType = {};
export const ProjectWithMembers = {};
export const ProjectWithCanvases = {};
export const ProjectWithDetails = {};
export const CreateProjectData = {};
export const UpdateProjectData = {};
export const InviteMemberData = {};
export const TransferRequest = {};

// Firebase collection paths
export const PROJECT_COLLECTIONS = {
  PROJECTS: "projects",
  MEMBERS: "members",
  CANVASES: "canvases",
  INVITATIONS: "invitations",
  ACTIVITIES: "activities",
  METADATA: "metadata"
};

// Permission levels for role-based access
export const PROJECT_PERMISSIONS = {
  owner: ["read", "write", "delete", "manage_members", "manage_settings", "transfer_ownership"],
  admin: ["read", "write", "delete", "manage_members", "manage_settings"],
  editor: ["read", "write"],
  viewer: ["read"]
};
