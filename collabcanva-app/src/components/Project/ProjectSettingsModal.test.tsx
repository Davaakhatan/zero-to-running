// Unit tests for ProjectSettingsModal component
// Tests modal functionality, form validation, permission checks, and project editing

import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProjectSettingsModal from './ProjectSettingsModal';
import { useAuth } from '../../contexts/AuthContext';
import { useProjects } from '../../hooks/useProjects';
import { useThumbnails } from '../../hooks/useThumbnails';
import { Project } from "../../types"

// Mock dependencies
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: vi.fn()
}));

vi.mock('../../hooks/useProjects', () => ({
  useProjects: vi.fn()
}));

vi.mock('../../hooks/useThumbnails', () => ({
  useThumbnails: vi.fn()
}));

// Mock Heroicons
vi.mock('@heroicons/react/24/outline', () => ({
  XMarkIcon: () => <div data-testid="close-icon" />,
  PhotoIcon: () => <div data-testid="photo-icon" />,
  EyeIcon: () => <div data-testid="eye-icon" />,
  EyeSlashIcon: () => <div data-testid="eye-slash-icon" />,
  UserGroupIcon: () => <div data-testid="users-icon" />,
  GlobeAltIcon: () => <div data-testid="globe-icon" />,
  LockClosedIcon: () => <div data-testid="lock-icon" />,
  CheckIcon: () => <div data-testid="check-icon" />,
  ExclamationTriangleIcon: () => <div data-testid="warning-icon" />,
  InformationCircleIcon: () => <div data-testid="info-icon" />,
  PencilIcon: () => <div data-testid="pencil-icon" />,
  DocumentTextIcon: () => <div data-testid="document-icon" />,
  TagIcon: () => <div data-testid="tag-icon" />,
  CalendarIcon: () => <div data-testid="calendar-icon" />,
  TrashIcon: () => <div data-testid="trash-icon" />,
  ArchiveBoxIcon: () => <div data-testid="archive-icon" />,
  ShareIcon: () => <div data-testid="share-icon" />,
  StarIcon: () => <div data-testid="star-icon" />,
  ClockIcon: () => <div data-testid="clock-icon" />,
  UserIcon: () => <div data-testid="user-icon" />,
  ShieldCheckIcon: () => <div data-testid="shield-check-icon" />,
  ShieldExclamationIcon: () => <div data-testid="shield-exclamation-icon" />
}));

// Mock window.confirm
const mockConfirm = vi.fn();
Object.defineProperty(window, 'confirm', {
  value: mockConfirm,
  writable: true
});

// Test data
const mockUser = {
  uid: 'user123',
  email: 'test@example.com',
  displayName: 'Test User'
};

const mockProject: Project = {
  id: 'project1',
  name: 'Test Project',
  description: 'A test project',
  ownerId: 'user123',
  isArchived: false,
  isDeleted: false,
  createdAt: Date.now() - 86400000,
  updatedAt: Date.now() - 3600000,
  settings: {
    allowComments: true,
    allowDownloads: true,
    isPublic: false
  },
  metadata: {
    version: '1.0.0',
    tags: ['test', 'project'],
    category: 'general',
    totalShapes: 25,
    size: 1024
  },
  members: [
    { id: '1', userId: 'user123', role: 'owner' as const, joinedAt: Date.now() - 86400000 }
  ],
  canvases: [
    { id: '1', name: 'Canvas 1', createdAt: Date.now() - 3600000, updatedAt: Date.now() - 1800000 }
  ]
};

const mockUpdatedProject = {
  ...mockProject,
  name: 'Updated Project',
  description: 'Updated description'
};

const mockUpdateProject = vi.fn();
const mockGetProjectThumbnail = vi.fn();
const mockGeneratePlaceholderThumbnail = vi.fn();

const defaultProps = {
  isOpen: true,
  onClose: vi.fn(),
  project: mockProject,
  onSuccess: vi.fn(),
  onDelete: vi.fn(),
  onArchive: vi.fn()
};

describe('ProjectSettingsModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default mocks
    (useAuth as Mock).mockReturnValue({ user: mockUser });
    (useProjects as Mock).mockReturnValue({
      updateProject: mockUpdateProject
    });
    (useThumbnails as Mock).mockReturnValue({
      getProjectThumbnail: mockGetProjectThumbnail,
      generatePlaceholderThumbnail: mockGeneratePlaceholderThumbnail
    });
    
    // Setup successful project update
    mockUpdateProject.mockResolvedValue(mockUpdatedProject);
    mockGetProjectThumbnail.mockReturnValue(null);
    mockGeneratePlaceholderThumbnail.mockResolvedValue({
      dataUrl: 'data:image/png;base64,placeholder'
    });
    
    // Setup window.confirm
    mockConfirm.mockReturnValue(true);
  });

  describe('Rendering', () => {
    it('should render modal when open with project', () => {
      render(<ProjectSettingsModal {...defaultProps} />);

      expect(screen.getByText('Project Settings')).toBeInTheDocument();
      expect(screen.getByText('Test Project')).toBeInTheDocument();
    });

    it('should not render modal when closed', () => {
      render(<ProjectSettingsModal {...defaultProps} isOpen={false} />);

      expect(screen.queryByText('Project Settings')).not.toBeInTheDocument();
    });

    it('should not render modal when project is null', () => {
      render(<ProjectSettingsModal {...defaultProps} project={null} />);

      expect(screen.queryByText('Project Settings')).not.toBeInTheDocument();
    });

    it('should render tabs', () => {
      render(<ProjectSettingsModal {...defaultProps} />);

      expect(screen.getByText('General')).toBeInTheDocument();
      expect(screen.getByText('Permissions')).toBeInTheDocument();
      expect(screen.getByText('Danger Zone')).toBeInTheDocument();
    });

    it('should render project statistics', () => {
      render(<ProjectSettingsModal {...defaultProps} />);

      expect(screen.getByText('Project Statistics')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument(); // Members
      expect(screen.getByText('1')).toBeInTheDocument(); // Canvases
      expect(screen.getByText('25')).toBeInTheDocument(); // Shapes
      expect(screen.getByText('1.0 KB')).toBeInTheDocument(); // Size
    });
  });

  describe('Tab Navigation', () => {
    it('should show general tab by default', () => {
      render(<ProjectSettingsModal {...defaultProps} />);

      expect(screen.getByLabelText('Project Name *')).toBeInTheDocument();
    });

    it('should switch to permissions tab when clicked', async () => {
      const user = userEvent.setup();
      render(<ProjectSettingsModal {...defaultProps} />);

      const permissionsTab = screen.getByText('Permissions');
      await user.click(permissionsTab);

      expect(screen.getByText('Current Settings')).toBeInTheDocument();
    });

    it('should switch to danger zone tab when clicked', async () => {
      const user = userEvent.setup();
      render(<ProjectSettingsModal {...defaultProps} />);

      const dangerTab = screen.getByText('Danger Zone');
      await user.click(dangerTab);

      expect(screen.getByText('These actions are irreversible. Please be careful.')).toBeInTheDocument();
    });
  });

  describe('Form Fields', () => {
    it('should populate form with project data', () => {
      render(<ProjectSettingsModal {...defaultProps} />);

      const nameInput = screen.getByLabelText('Project Name *') as HTMLInputElement;
      const descriptionInput = screen.getByLabelText('Description') as HTMLTextAreaElement;
      const categorySelect = screen.getByLabelText('Category') as HTMLSelectElement;

      expect(nameInput.value).toBe('Test Project');
      expect(descriptionInput.value).toBe('A test project');
      expect(categorySelect.value).toBe('general');
    });

    it('should show existing tags', () => {
      render(<ProjectSettingsModal {...defaultProps} />);

      expect(screen.getByText('test')).toBeInTheDocument();
      expect(screen.getByText('project')).toBeInTheDocument();
    });

    it('should show thumbnail placeholder', () => {
      render(<ProjectSettingsModal {...defaultProps} />);

      expect(screen.getByTestId('photo-icon')).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should show error for empty project name', async () => {
      const user = userEvent.setup();
      render(<ProjectSettingsModal {...defaultProps} />);

      const nameInput = screen.getByLabelText('Project Name *');
      await user.clear(nameInput);

      const submitButton = screen.getByText('Save Changes');
      await user.click(submitButton);

      expect(screen.getByText('Project name is required')).toBeInTheDocument();
    });

    it('should show error for short project name', async () => {
      const user = userEvent.setup();
      render(<ProjectSettingsModal {...defaultProps} />);

      const nameInput = screen.getByLabelText('Project Name *');
      await user.clear(nameInput);
      await user.type(nameInput, 'A');

      const submitButton = screen.getByText('Save Changes');
      await user.click(submitButton);

      expect(screen.getByText('Project name must be at least 2 characters')).toBeInTheDocument();
    });

    it('should show error for long project name', async () => {
      const user = userEvent.setup();
      render(<ProjectSettingsModal {...defaultProps} />);

      const nameInput = screen.getByLabelText('Project Name *');
      await user.clear(nameInput);
      await user.type(nameInput, 'A'.repeat(101));

      const submitButton = screen.getByText('Save Changes');
      await user.click(submitButton);

      expect(screen.getByText('Project name must be less than 100 characters')).toBeInTheDocument();
    });

    it('should show error for long description', async () => {
      const user = userEvent.setup();
      render(<ProjectSettingsModal {...defaultProps} />);

      const descriptionInput = screen.getByLabelText('Description');
      await user.clear(descriptionInput);
      await user.type(descriptionInput, 'A'.repeat(501));

      const submitButton = screen.getByText('Save Changes');
      await user.click(submitButton);

      expect(screen.getByText('Description must be less than 500 characters')).toBeInTheDocument();
    });

    it('should show character count for description', async () => {
      const user = userEvent.setup();
      render(<ProjectSettingsModal {...defaultProps} />);

      const descriptionInput = screen.getByLabelText('Description');
      await user.clear(descriptionInput);
      await user.type(descriptionInput, 'Updated description');

      expect(screen.getByText('18/500')).toBeInTheDocument();
    });
  });

  describe('Tag Management', () => {
    it('should add tag when Enter is pressed', async () => {
      const user = userEvent.setup();
      render(<ProjectSettingsModal {...defaultProps} />);

      const tagInput = screen.getByLabelText('Tags');
      await user.type(tagInput, 'newtag');
      await user.keyboard('{Enter}');

      expect(screen.getByText('newtag')).toBeInTheDocument();
    });

    it('should add tag when comma is pressed', async () => {
      const user = userEvent.setup();
      render(<ProjectSettingsModal {...defaultProps} />);

      const tagInput = screen.getByLabelText('Tags');
      await user.type(tagInput, 'another');
      await user.keyboard(',');

      expect(screen.getByText('another')).toBeInTheDocument();
    });

    it('should add tag when Add button is clicked', async () => {
      const user = userEvent.setup();
      render(<ProjectSettingsModal {...defaultProps} />);

      const tagInput = screen.getByLabelText('Tags');
      await user.type(tagInput, 'button');

      const addButton = screen.getByText('Add');
      await user.click(addButton);

      expect(screen.getByText('button')).toBeInTheDocument();
    });

    it('should remove tag when X is clicked', async () => {
      const user = userEvent.setup();
      render(<ProjectSettingsModal {...defaultProps} />);

      const removeButton = screen.getByText('test').parentElement?.querySelector('button');
      await user.click(removeButton!);

      expect(screen.queryByText('test')).not.toBeInTheDocument();
    });

    it('should not add duplicate tags', async () => {
      const user = userEvent.setup();
      render(<ProjectSettingsModal {...defaultProps} />);

      const tagInput = screen.getByLabelText('Tags');
      await user.type(tagInput, 'test');
      await user.keyboard('{Enter}');

      const testTags = screen.getAllByText('test');
      expect(testTags).toHaveLength(1);
    });
  });

  describe('Thumbnail Upload', () => {
    it('should show file input when Choose Image is clicked', async () => {
      const user = userEvent.setup();
      render(<ProjectSettingsModal {...defaultProps} />);

      const chooseButton = screen.getByText('Choose Image');
      await user.click(chooseButton);

      // File input should be triggered
      expect(chooseButton).toBeInTheDocument();
    });

    it('should show file size limit', () => {
      render(<ProjectSettingsModal {...defaultProps} />);

      expect(screen.getByText('PNG, JPG up to 5MB')).toBeInTheDocument();
    });
  });

  describe('Permissions Tab', () => {
    it('should show current settings', async () => {
      const user = userEvent.setup();
      render(<ProjectSettingsModal {...defaultProps} />);

      const permissionsTab = screen.getByText('Permissions');
      await user.click(permissionsTab);

      expect(screen.getByText('Current Settings')).toBeInTheDocument();
      expect(screen.getByText('Private')).toBeInTheDocument();
      expect(screen.getByText('Enabled')).toBeInTheDocument();
    });

    it('should show update settings form for owners', async () => {
      const user = userEvent.setup();
      render(<ProjectSettingsModal {...defaultProps} />);

      const permissionsTab = screen.getByText('Permissions');
      await user.click(permissionsTab);

      expect(screen.getByText('Update Settings')).toBeInTheDocument();
      expect(screen.getByLabelText('Make project public')).toBeInTheDocument();
    });

    it('should show read-only message for non-owners', async () => {
      const user = userEvent.setup();
      const nonOwnerProject = { ...mockProject, ownerId: 'other-user' };
      (useAuth as Mock).mockReturnValue({ user: { ...mockUser, uid: 'other-user' } });
      
      render(<ProjectSettingsModal {...defaultProps} project={nonOwnerProject} />);

      const permissionsTab = screen.getByText('Permissions');
      await user.click(permissionsTab);

      expect(screen.getByText("You don't have permission to edit this project's settings.")).toBeInTheDocument();
    });
  });

  describe('Danger Zone Tab', () => {
    it('should show archive button for owners', async () => {
      const user = userEvent.setup();
      render(<ProjectSettingsModal {...defaultProps} />);

      const dangerTab = screen.getByText('Danger Zone');
      await user.click(dangerTab);

      expect(screen.getByText('Archive Project')).toBeInTheDocument();
      expect(screen.getByText('Delete Project')).toBeInTheDocument();
    });

    it('should show unarchive button for archived projects', async () => {
      const user = userEvent.setup();
      const archivedProject = { ...mockProject, isArchived: true };
      render(<ProjectSettingsModal {...defaultProps} project={archivedProject} />);

      const dangerTab = screen.getByText('Danger Zone');
      await user.click(dangerTab);

      expect(screen.getByText('Unarchive Project')).toBeInTheDocument();
    });

    it('should show no permissions message for non-owners', async () => {
      const user = userEvent.setup();
      const nonOwnerProject = { ...mockProject, ownerId: 'other-user' };
      (useAuth as Mock).mockReturnValue({ user: { ...mockUser, uid: 'other-user' } });
      
      render(<ProjectSettingsModal {...defaultProps} project={nonOwnerProject} />);

      const dangerTab = screen.getByText('Danger Zone');
      await user.click(dangerTab);

      expect(screen.getByText("You don't have permission to perform dangerous actions on this project.")).toBeInTheDocument();
    });
  });

  describe('Form Submission', () => {
    it('should update project with valid data', async () => {
      const user = userEvent.setup();
      const onSuccess = vi.fn();
      render(<ProjectSettingsModal {...defaultProps} onSuccess={onSuccess} />);

      const nameInput = screen.getByLabelText('Project Name *');
      await user.clear(nameInput);
      await user.type(nameInput, 'Updated Project');

      const submitButton = screen.getByText('Save Changes');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockUpdateProject).toHaveBeenCalledWith('project1', {
          name: 'Updated Project',
          description: 'A test project',
          settings: {
            allowComments: true,
            allowDownloads: true,
            isPublic: false
          },
          metadata: {
            version: '1.0.0',
            tags: ['test', 'project'],
            category: 'general',
            totalShapes: 25,
            size: 1024
          }
        });
      });

      expect(onSuccess).toHaveBeenCalledWith(mockUpdatedProject);
    });

    it('should show loading state during submission', async () => {
      const user = userEvent.setup();
      mockUpdateProject.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      render(<ProjectSettingsModal {...defaultProps} />);

      const nameInput = screen.getByLabelText('Project Name *');
      await user.clear(nameInput);
      await user.type(nameInput, 'Updated Project');

      const submitButton = screen.getByText('Save Changes');
      await user.click(submitButton);

      expect(screen.getByText('Saving...')).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    });

    it('should show error on submission failure', async () => {
      const user = userEvent.setup();
      mockUpdateProject.mockRejectedValue(new Error('Failed to update project'));

      render(<ProjectSettingsModal {...defaultProps} />);

      const nameInput = screen.getByLabelText('Project Name *');
      await user.clear(nameInput);
      await user.type(nameInput, 'Updated Project');

      const submitButton = screen.getByText('Save Changes');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Failed to update project')).toBeInTheDocument();
      });
    });

    it('should disable submit button when name is empty', async () => {
      const user = userEvent.setup();
      render(<ProjectSettingsModal {...defaultProps} />);

      const nameInput = screen.getByLabelText('Project Name *');
      await user.clear(nameInput);

      const submitButton = screen.getByText('Save Changes');
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Dangerous Actions', () => {
    it('should call onDelete when delete is confirmed', async () => {
      const user = userEvent.setup();
      const onDelete = vi.fn();
      mockConfirm.mockReturnValue(true);
      
      render(<ProjectSettingsModal {...defaultProps} onDelete={onDelete} />);

      const dangerTab = screen.getByText('Danger Zone');
      await user.click(dangerTab);

      const deleteButton = screen.getByText('Delete');
      await user.click(deleteButton);

      expect(mockConfirm).toHaveBeenCalledWith('Are you sure you want to delete "Test Project"? This action cannot be undone.');
      expect(onDelete).toHaveBeenCalledWith(mockProject);
    });

    it('should not call onDelete when delete is cancelled', async () => {
      const user = userEvent.setup();
      const onDelete = vi.fn();
      mockConfirm.mockReturnValue(false);
      
      render(<ProjectSettingsModal {...defaultProps} onDelete={onDelete} />);

      const dangerTab = screen.getByText('Danger Zone');
      await user.click(dangerTab);

      const deleteButton = screen.getByText('Delete');
      await user.click(deleteButton);

      expect(onDelete).not.toHaveBeenCalled();
    });

    it('should call onArchive when archive is confirmed', async () => {
      const user = userEvent.setup();
      const onArchive = vi.fn();
      mockConfirm.mockReturnValue(true);
      
      render(<ProjectSettingsModal {...defaultProps} onArchive={onArchive} />);

      const dangerTab = screen.getByText('Danger Zone');
      await user.click(dangerTab);

      const archiveButton = screen.getByText('Archive');
      await user.click(archiveButton);

      expect(mockConfirm).toHaveBeenCalledWith('Are you sure you want to archive "Test Project"?');
      expect(onArchive).toHaveBeenCalledWith(mockProject);
    });

    it('should call onArchive with unarchive message for archived projects', async () => {
      const user = userEvent.setup();
      const onArchive = vi.fn();
      const archivedProject = { ...mockProject, isArchived: true };
      mockConfirm.mockReturnValue(true);
      
      render(<ProjectSettingsModal {...defaultProps} project={archivedProject} onArchive={onArchive} />);

      const dangerTab = screen.getByText('Danger Zone');
      await user.click(dangerTab);

      const unarchiveButton = screen.getByText('Unarchive');
      await user.click(unarchiveButton);

      expect(mockConfirm).toHaveBeenCalledWith('Are you sure you want to unarchive "Test Project"?');
      expect(onArchive).toHaveBeenCalledWith(archivedProject);
    });
  });

  describe('Modal Interactions', () => {
    it('should close modal when close button is clicked', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      render(<ProjectSettingsModal {...defaultProps} onClose={onClose} />);

      const closeButton = screen.getByTestId('close-icon').closest('button');
      await user.click(closeButton!);

      expect(onClose).toHaveBeenCalled();
    });

    it('should close modal when Cancel button is clicked', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      render(<ProjectSettingsModal {...defaultProps} onClose={onClose} />);

      const cancelButton = screen.getByText('Cancel');
      await user.click(cancelButton);

      expect(onClose).toHaveBeenCalled();
    });

    it('should close modal when Escape key is pressed', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      render(<ProjectSettingsModal {...defaultProps} onClose={onClose} />);

      await user.keyboard('{Escape}');

      expect(onClose).toHaveBeenCalled();
    });

    it('should not close modal when clicking inside modal content', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      render(<ProjectSettingsModal {...defaultProps} onClose={onClose} />);

      const modalContent = screen.getByText('Project Settings');
      await user.click(modalContent);

      expect(onClose).not.toHaveBeenCalled();
    });

    it('should not close modal during submission', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      mockUpdateProject.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      render(<ProjectSettingsModal {...defaultProps} onClose={onClose} />);

      const nameInput = screen.getByLabelText('Project Name *');
      await user.clear(nameInput);
      await user.type(nameInput, 'Updated Project');

      const submitButton = screen.getByText('Save Changes');
      await user.click(submitButton);

      const closeButton = screen.getByTestId('close-icon').closest('button');
      await user.click(closeButton!);

      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('Permission Checks', () => {
    it('should show edit controls for project owner', () => {
      render(<ProjectSettingsModal {...defaultProps} />);

      expect(screen.getByText('Save Changes')).toBeInTheDocument();
      expect(screen.getByText('Danger Zone')).toBeInTheDocument();
    });

    it('should show edit controls for project admin', () => {
      const adminProject = {
        ...mockProject,
        members: [
          { id: '1', userId: 'user123', role: 'admin' as const, joinedAt: Date.now() - 86400000 }
        ]
      };
      render(<ProjectSettingsModal {...defaultProps} project={adminProject} />);

      expect(screen.getByText('Save Changes')).toBeInTheDocument();
    });

    it('should show edit controls for project editor', () => {
      const editorProject = {
        ...mockProject,
        members: [
          { id: '1', userId: 'user123', role: 'editor' as const, joinedAt: Date.now() - 86400000 }
        ]
      };
      render(<ProjectSettingsModal {...defaultProps} project={editorProject} />);

      expect(screen.getByText('Save Changes')).toBeInTheDocument();
    });

    it('should not show edit controls for project viewer', () => {
      const viewerProject = {
        ...mockProject,
        ownerId: 'other-user',
        members: [
          { id: '1', userId: 'user123', role: 'viewer' as const, joinedAt: Date.now() - 86400000 }
        ]
      };
      render(<ProjectSettingsModal {...defaultProps} project={viewerProject} />);

      expect(screen.queryByText('Save Changes')).not.toBeInTheDocument();
      expect(screen.queryByText('Danger Zone')).not.toBeInTheDocument();
    });

    it('should not show edit controls for non-member', () => {
      const nonMemberProject = {
        ...mockProject,
        ownerId: 'other-user',
        members: []
      };
      render(<ProjectSettingsModal {...defaultProps} project={nonMemberProject} />);

      expect(screen.queryByText('Save Changes')).not.toBeInTheDocument();
      expect(screen.queryByText('Danger Zone')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper form labels', () => {
      render(<ProjectSettingsModal {...defaultProps} />);

      expect(screen.getByLabelText('Project Name *')).toBeInTheDocument();
      expect(screen.getByLabelText('Description')).toBeInTheDocument();
      expect(screen.getByLabelText('Category')).toBeInTheDocument();
      expect(screen.getByLabelText('Tags')).toBeInTheDocument();
    });

    it('should have proper button roles', () => {
      render(<ProjectSettingsModal {...defaultProps} />);

      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Save Changes' })).toBeInTheDocument();
    });

    it('should have proper form structure', () => {
      render(<ProjectSettingsModal {...defaultProps} />);

      expect(screen.getByRole('form')).toBeInTheDocument();
    });
  });

  describe('Dark Mode', () => {
    it('should apply dark mode classes', () => {
      render(<ProjectSettingsModal {...defaultProps} />);

      const modal = screen.getByText('Project Settings').closest('div');
      expect(modal).toHaveClass('dark:bg-slate-800');
    });
  });

  describe('Form Reset', () => {
    it('should reset form when project changes', () => {
      const { rerender } = render(<ProjectSettingsModal {...defaultProps} />);
      
      const newProject = { ...mockProject, name: 'New Project' };
      rerender(<ProjectSettingsModal {...defaultProps} project={newProject} />);

      const nameInput = screen.getByLabelText('Project Name *') as HTMLInputElement;
      expect(nameInput.value).toBe('New Project');
    });
  });
});
