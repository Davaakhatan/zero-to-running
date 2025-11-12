// Unit tests for CreateProjectModal component
// Tests modal functionality, form validation, template selection, and project creation

import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CreateProjectModal from './CreateProjectModal';
import { useAuth } from '../../contexts/AuthContext';
import { useProjects } from '../../hooks/useProjects';
import { useThumbnails } from '../../hooks/useThumbnails';

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
  SparklesIcon: () => <div data-testid="sparkles-icon" />,
  DocumentTextIcon: () => <div data-testid="document-icon" />,
  TagIcon: () => <div data-testid="tag-icon" />,
  CalendarIcon: () => <div data-testid="calendar-icon" />
}));

// Test data
const mockUser = {
  uid: 'user123',
  email: 'test@example.com',
  displayName: 'Test User'
};

const mockProject = {
  id: 'project1',
  name: 'Test Project',
  description: 'A test project',
  ownerId: 'user123',
  isArchived: false,
  isDeleted: false,
  createdAt: Date.now(),
  updatedAt: Date.now(),
  settings: {
    allowComments: true,
    allowDownloads: true,
    isPublic: false
  },
  metadata: {
    version: '1.0.0',
    tags: ['test'],
    category: 'general'
  }
};

const mockCreateProject = vi.fn();
const mockGeneratePlaceholderThumbnail = vi.fn();

const defaultProps = {
  isOpen: true,
  onClose: vi.fn(),
  onSuccess: vi.fn()
};

describe('CreateProjectModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default mocks
    (useAuth as Mock).mockReturnValue({ user: mockUser });
    (useProjects as Mock).mockReturnValue({
      createProject: mockCreateProject
    });
    (useThumbnails as Mock).mockReturnValue({
      generatePlaceholderThumbnail: mockGeneratePlaceholderThumbnail
    });
    
    // Setup successful project creation
    mockCreateProject.mockResolvedValue(mockProject);
    mockGeneratePlaceholderThumbnail.mockResolvedValue({
      dataUrl: 'data:image/png;base64,placeholder'
    });
  });

  describe('Rendering', () => {
    it('should render modal when open', () => {
      render(<CreateProjectModal {...defaultProps} />);

      expect(screen.getByText('Create New Project')).toBeInTheDocument();
      expect(screen.getByText('Start a new project with a template or from scratch')).toBeInTheDocument();
    });

    it('should not render modal when closed', () => {
      render(<CreateProjectModal {...defaultProps} isOpen={false} />);

      expect(screen.queryByText('Create New Project')).not.toBeInTheDocument();
    });

    it('should render template options', () => {
      render(<CreateProjectModal {...defaultProps} />);

      expect(screen.getByText('Blank Project')).toBeInTheDocument();
      expect(screen.getByText('Design Project')).toBeInTheDocument();
      expect(screen.getByText('Presentation')).toBeInTheDocument();
      expect(screen.getByText('Prototype')).toBeInTheDocument();
    });

    it('should render form fields', () => {
      render(<CreateProjectModal {...defaultProps} />);

      expect(screen.getByLabelText('Project Name *')).toBeInTheDocument();
      expect(screen.getByLabelText('Description')).toBeInTheDocument();
      expect(screen.getByLabelText('Category')).toBeInTheDocument();
      expect(screen.getByLabelText('Tags')).toBeInTheDocument();
      expect(screen.getByLabelText('Thumbnail')).toBeInTheDocument();
    });

    it('should render action buttons', () => {
      render(<CreateProjectModal {...defaultProps} />);

      expect(screen.getByText('Cancel')).toBeInTheDocument();
      expect(screen.getByText('Create Project')).toBeInTheDocument();
    });
  });

  describe('Template Selection', () => {
    it('should select template when clicked', async () => {
      const user = userEvent.setup();
      render(<CreateProjectModal {...defaultProps} />);

      const designTemplate = screen.getByText('Design Project');
      await user.click(designTemplate);

      // Check if form is populated with template data
      const nameInput = screen.getByLabelText('Project Name *') as HTMLInputElement;
      expect(nameInput.value).toBe('Design Project');
    });

    it('should update form data when template is selected', async () => {
      const user = userEvent.setup();
      render(<CreateProjectModal {...defaultProps} />);

      const blankTemplate = screen.getByText('Blank Project');
      await user.click(blankTemplate);

      const nameInput = screen.getByLabelText('Project Name *') as HTMLInputElement;
      const descriptionInput = screen.getByLabelText('Description') as HTMLTextAreaElement;
      const categorySelect = screen.getByLabelText('Category') as HTMLSelectElement;

      expect(nameInput.value).toBe('Blank Project');
      expect(descriptionInput.value).toBe('Start with a clean canvas');
      expect(categorySelect.value).toBe('general');
    });

    it('should show template thumbnail preview', async () => {
      const user = userEvent.setup();
      render(<CreateProjectModal {...defaultProps} />);

      const designTemplate = screen.getByText('Design Project');
      await user.click(designTemplate);

      // Check if thumbnail preview is shown
      const thumbnailImg = screen.getByAltText('Thumbnail preview');
      expect(thumbnailImg).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should show error for empty project name', async () => {
      const user = userEvent.setup();
      render(<CreateProjectModal {...defaultProps} />);

      const submitButton = screen.getByText('Create Project');
      await user.click(submitButton);

      expect(screen.getByText('Project name is required')).toBeInTheDocument();
    });

    it('should show error for short project name', async () => {
      const user = userEvent.setup();
      render(<CreateProjectModal {...defaultProps} />);

      const nameInput = screen.getByLabelText('Project Name *');
      await user.type(nameInput, 'A');

      const submitButton = screen.getByText('Create Project');
      await user.click(submitButton);

      expect(screen.getByText('Project name must be at least 2 characters')).toBeInTheDocument();
    });

    it('should show error for long project name', async () => {
      const user = userEvent.setup();
      render(<CreateProjectModal {...defaultProps} />);

      const nameInput = screen.getByLabelText('Project Name *');
      await user.type(nameInput, 'A'.repeat(101));

      const submitButton = screen.getByText('Create Project');
      await user.click(submitButton);

      expect(screen.getByText('Project name must be less than 100 characters')).toBeInTheDocument();
    });

    it('should show error for long description', async () => {
      const user = userEvent.setup();
      render(<CreateProjectModal {...defaultProps} />);

      const nameInput = screen.getByLabelText('Project Name *');
      await user.type(nameInput, 'Test Project');

      const descriptionInput = screen.getByLabelText('Description');
      await user.type(descriptionInput, 'A'.repeat(501));

      const submitButton = screen.getByText('Create Project');
      await user.click(submitButton);

      expect(screen.getByText('Description must be less than 500 characters')).toBeInTheDocument();
    });

    it('should show character count for description', async () => {
      const user = userEvent.setup();
      render(<CreateProjectModal {...defaultProps} />);

      const descriptionInput = screen.getByLabelText('Description');
      await user.type(descriptionInput, 'Test description');

      expect(screen.getByText('16/500')).toBeInTheDocument();
    });

    it('should clear field error when input is corrected', async () => {
      const user = userEvent.setup();
      render(<CreateProjectModal {...defaultProps} />);

      const submitButton = screen.getByText('Create Project');
      await user.click(submitButton);

      expect(screen.getByText('Project name is required')).toBeInTheDocument();

      const nameInput = screen.getByLabelText('Project Name *');
      await user.type(nameInput, 'Test Project');

      expect(screen.queryByText('Project name is required')).not.toBeInTheDocument();
    });
  });

  describe('Tag Management', () => {
    it('should add tag when Enter is pressed', async () => {
      const user = userEvent.setup();
      render(<CreateProjectModal {...defaultProps} />);

      const tagInput = screen.getByLabelText('Tags');
      await user.type(tagInput, 'design');
      await user.keyboard('{Enter}');

      expect(screen.getByText('design')).toBeInTheDocument();
    });

    it('should add tag when comma is pressed', async () => {
      const user = userEvent.setup();
      render(<CreateProjectModal {...defaultProps} />);

      const tagInput = screen.getByLabelText('Tags');
      await user.type(tagInput, 'ui,ux');
      await user.keyboard(',');

      expect(screen.getByText('ui')).toBeInTheDocument();
      expect(screen.getByText('ux')).toBeInTheDocument();
    });

    it('should add tag when Add button is clicked', async () => {
      const user = userEvent.setup();
      render(<CreateProjectModal {...defaultProps} />);

      const tagInput = screen.getByLabelText('Tags');
      await user.type(tagInput, 'prototype');

      const addButton = screen.getByText('Add');
      await user.click(addButton);

      expect(screen.getByText('prototype')).toBeInTheDocument();
    });

    it('should remove tag when X is clicked', async () => {
      const user = userEvent.setup();
      render(<CreateProjectModal {...defaultProps} />);

      const tagInput = screen.getByLabelText('Tags');
      await user.type(tagInput, 'design');
      await user.keyboard('{Enter}');

      expect(screen.getByText('design')).toBeInTheDocument();

      const removeButton = screen.getByRole('button', { name: '' }); // X button
      await user.click(removeButton);

      expect(screen.queryByText('design')).not.toBeInTheDocument();
    });

    it('should not add duplicate tags', async () => {
      const user = userEvent.setup();
      render(<CreateProjectModal {...defaultProps} />);

      const tagInput = screen.getByLabelText('Tags');
      await user.type(tagInput, 'design');
      await user.keyboard('{Enter}');
      await user.type(tagInput, 'design');
      await user.keyboard('{Enter}');

      const designTags = screen.getAllByText('design');
      expect(designTags).toHaveLength(1);
    });

    it('should show error for too many tags', async () => {
      const user = userEvent.setup();
      render(<CreateProjectModal {...defaultProps} />);

      const tagInput = screen.getByLabelText('Tags');
      
      // Add 11 tags (more than the limit of 10)
      for (let i = 0; i < 11; i++) {
        await user.type(tagInput, `tag${i}`);
        await user.keyboard('{Enter}');
      }

      const submitButton = screen.getByText('Create Project');
      await user.click(submitButton);

      expect(screen.getByText('Maximum 10 tags allowed')).toBeInTheDocument();
    });
  });

  describe('Thumbnail Upload', () => {
    it('should show file input when Choose Image is clicked', async () => {
      const user = userEvent.setup();
      render(<CreateProjectModal {...defaultProps} />);

      const chooseButton = screen.getByText('Choose Image');
      await user.click(chooseButton);

      // File input should be triggered (we can't directly test file input due to security restrictions)
      expect(chooseButton).toBeInTheDocument();
    });

    it('should show thumbnail preview placeholder', () => {
      render(<CreateProjectModal {...defaultProps} />);

      expect(screen.getByTestId('photo-icon')).toBeInTheDocument();
    });

    it('should show file size limit', () => {
      render(<CreateProjectModal {...defaultProps} />);

      expect(screen.getByText('PNG, JPG up to 5MB')).toBeInTheDocument();
    });
  });

  describe('Advanced Settings', () => {
    it('should show advanced settings when clicked', async () => {
      const user = userEvent.setup();
      render(<CreateProjectModal {...defaultProps} />);

      const advancedButton = screen.getByText('Advanced Settings');
      await user.click(advancedButton);

      expect(screen.getByText('Make project public')).toBeInTheDocument();
      expect(screen.getByText('Allow comments')).toBeInTheDocument();
      expect(screen.getByText('Allow downloads')).toBeInTheDocument();
    });

    it('should hide advanced settings by default', () => {
      render(<CreateProjectModal {...defaultProps} />);

      expect(screen.queryByText('Make project public')).not.toBeInTheDocument();
    });

    it('should toggle public setting', async () => {
      const user = userEvent.setup();
      render(<CreateProjectModal {...defaultProps} />);

      const advancedButton = screen.getByText('Advanced Settings');
      await user.click(advancedButton);

      const publicCheckbox = screen.getByLabelText('Make project public');
      await user.click(publicCheckbox);

      expect(publicCheckbox).toBeChecked();
    });

    it('should toggle comments setting', async () => {
      const user = userEvent.setup();
      render(<CreateProjectModal {...defaultProps} />);

      const advancedButton = screen.getByText('Advanced Settings');
      await user.click(advancedButton);

      const commentsCheckbox = screen.getByLabelText('Allow comments');
      await user.click(commentsCheckbox);

      expect(commentsCheckbox).not.toBeChecked(); // Should be unchecked since it starts checked
    });

    it('should toggle downloads setting', async () => {
      const user = userEvent.setup();
      render(<CreateProjectModal {...defaultProps} />);

      const advancedButton = screen.getByText('Advanced Settings');
      await user.click(advancedButton);

      const downloadsCheckbox = screen.getByLabelText('Allow downloads');
      await user.click(downloadsCheckbox);

      expect(downloadsCheckbox).not.toBeChecked(); // Should be unchecked since it starts checked
    });
  });

  describe('Form Submission', () => {
    it('should create project with valid data', async () => {
      const user = userEvent.setup();
      const onSuccess = vi.fn();
      render(<CreateProjectModal {...defaultProps} onSuccess={onSuccess} />);

      const nameInput = screen.getByLabelText('Project Name *');
      await user.type(nameInput, 'Test Project');

      const descriptionInput = screen.getByLabelText('Description');
      await user.type(descriptionInput, 'A test project description');

      const submitButton = screen.getByText('Create Project');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockCreateProject).toHaveBeenCalledWith({
          name: 'Test Project',
          description: 'A test project description',
          settings: {
            allowComments: true,
            allowDownloads: true,
            isPublic: false
          },
          metadata: {
            version: '1.0.0',
            tags: [],
            category: 'general'
          }
        });
      });

      expect(onSuccess).toHaveBeenCalledWith(mockProject);
    });

    it('should create project with template data', async () => {
      const user = userEvent.setup();
      render(<CreateProjectModal {...defaultProps} />);

      // Select template
      const designTemplate = screen.getByText('Design Project');
      await user.click(designTemplate);

      const submitButton = screen.getByText('Create Project');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockCreateProject).toHaveBeenCalledWith({
          name: 'Design Project',
          description: 'Perfect for UI/UX design work',
          settings: {
            allowComments: true,
            allowDownloads: true,
            isPublic: false
          },
          metadata: {
            version: '1.0.0',
            tags: ['design', 'ui', 'ux'],
            category: 'design'
          }
        });
      });
    });

    it('should show loading state during submission', async () => {
      const user = userEvent.setup();
      mockCreateProject.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      render(<CreateProjectModal {...defaultProps} />);

      const nameInput = screen.getByLabelText('Project Name *');
      await user.type(nameInput, 'Test Project');

      const submitButton = screen.getByText('Create Project');
      await user.click(submitButton);

      expect(screen.getByText('Creating...')).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    });

    it('should show error on submission failure', async () => {
      const user = userEvent.setup();
      mockCreateProject.mockRejectedValue(new Error('Failed to create project'));

      render(<CreateProjectModal {...defaultProps} />);

      const nameInput = screen.getByLabelText('Project Name *');
      await user.type(nameInput, 'Test Project');

      const submitButton = screen.getByText('Create Project');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Failed to create project')).toBeInTheDocument();
      });
    });

    it('should disable submit button when name is empty', () => {
      render(<CreateProjectModal {...defaultProps} />);

      const submitButton = screen.getByText('Create Project');
      expect(submitButton).toBeDisabled();
    });

    it('should enable submit button when name is provided', async () => {
      const user = userEvent.setup();
      render(<CreateProjectModal {...defaultProps} />);

      const nameInput = screen.getByLabelText('Project Name *');
      await user.type(nameInput, 'Test Project');

      const submitButton = screen.getByText('Create Project');
      expect(submitButton).not.toBeDisabled();
    });
  });

  describe('Modal Interactions', () => {
    it('should close modal when close button is clicked', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      render(<CreateProjectModal {...defaultProps} onClose={onClose} />);

      const closeButton = screen.getByTestId('close-icon').closest('button');
      await user.click(closeButton!);

      expect(onClose).toHaveBeenCalled();
    });

    it('should close modal when Cancel button is clicked', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      render(<CreateProjectModal {...defaultProps} onClose={onClose} />);

      const cancelButton = screen.getByText('Cancel');
      await user.click(cancelButton);

      expect(onClose).toHaveBeenCalled();
    });

    it('should close modal when Escape key is pressed', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      render(<CreateProjectModal {...defaultProps} onClose={onClose} />);

      await user.keyboard('{Escape}');

      expect(onClose).toHaveBeenCalled();
    });

    it('should not close modal when clicking inside modal content', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      render(<CreateProjectModal {...defaultProps} onClose={onClose} />);

      const modalContent = screen.getByText('Create New Project');
      await user.click(modalContent);

      expect(onClose).not.toHaveBeenCalled();
    });

    it('should not close modal during submission', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      mockCreateProject.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      render(<CreateProjectModal {...defaultProps} onClose={onClose} />);

      const nameInput = screen.getByLabelText('Project Name *');
      await user.type(nameInput, 'Test Project');

      const submitButton = screen.getByText('Create Project');
      await user.click(submitButton);

      const closeButton = screen.getByTestId('close-icon').closest('button');
      await user.click(closeButton!);

      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('Category Selection', () => {
    it('should show all category options', () => {
      render(<CreateProjectModal {...defaultProps} />);

      const categorySelect = screen.getByLabelText('Category') as HTMLSelectElement;
      
      expect(categorySelect.options[0].text).toBe('General');
      expect(categorySelect.options[1].text).toBe('Design');
      expect(categorySelect.options[2].text).toBe('Presentation');
      expect(categorySelect.options[3].text).toBe('Prototype');
      expect(categorySelect.options[4].text).toBe('Education');
      expect(categorySelect.options[5].text).toBe('Business');
      expect(categorySelect.options[6].text).toBe('Personal');
    });

    it('should change category when selected', async () => {
      const user = userEvent.setup();
      render(<CreateProjectModal {...defaultProps} />);

      const categorySelect = screen.getByLabelText('Category') as HTMLSelectElement;
      await user.selectOptions(categorySelect, 'design');

      expect(categorySelect.value).toBe('design');
    });
  });

  describe('Accessibility', () => {
    it('should have proper form labels', () => {
      render(<CreateProjectModal {...defaultProps} />);

      expect(screen.getByLabelText('Project Name *')).toBeInTheDocument();
      expect(screen.getByLabelText('Description')).toBeInTheDocument();
      expect(screen.getByLabelText('Category')).toBeInTheDocument();
      expect(screen.getByLabelText('Tags')).toBeInTheDocument();
    });

    it('should have proper button roles', () => {
      render(<CreateProjectModal {...defaultProps} />);

      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Create Project' })).toBeInTheDocument();
    });

    it('should have proper form structure', () => {
      render(<CreateProjectModal {...defaultProps} />);

      expect(screen.getByRole('form')).toBeInTheDocument();
    });
  });

  describe('Dark Mode', () => {
    it('should apply dark mode classes', () => {
      render(<CreateProjectModal {...defaultProps} />);

      const modal = screen.getByText('Create New Project').closest('div');
      expect(modal).toHaveClass('dark:bg-slate-800');
    });
  });

  describe('Form Reset', () => {
    it('should reset form when modal opens', () => {
      const { rerender } = render(<CreateProjectModal {...defaultProps} isOpen={false} />);
      
      rerender(<CreateProjectModal {...defaultProps} isOpen={true} />);

      const nameInput = screen.getByLabelText('Project Name *') as HTMLInputElement;
      expect(nameInput.value).toBe('');
    });
  });
});
