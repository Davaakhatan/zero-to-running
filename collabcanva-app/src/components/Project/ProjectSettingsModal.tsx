// ProjectSettingsModal component for editing project details
// Modal for editing existing projects with comprehensive form handling and permission checks

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useProjects } from '../../hooks/useProjects';
import { useThumbnails } from '../../hooks/useThumbnails';
import { projectHelpers } from '../../utils/projectHelpers';
import { Project, ProjectRole } from "../../types"
import { 
  XMarkIcon,
  PhotoIcon,
  EyeIcon,
  EyeSlashIcon,
  UserGroupIcon,
  GlobeAltIcon,
  LockClosedIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  PencilIcon,
  DocumentTextIcon,
  TagIcon,
  CalendarIcon,
  TrashIcon,
  ArchiveBoxIcon,
  ShareIcon,
  StarIcon,
  ClockIcon,
  UserIcon,
  ShieldCheckIcon,
  ShieldExclamationIcon
} from '@heroicons/react/24/outline';

// Modal props
interface ProjectSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project | null;
  onSuccess?: (project: Project) => void;
  onDelete?: (project: Project) => void;
  onArchive?: (project: Project) => void;
  className?: string;
}

// Form data interface
interface ProjectFormData {
  name: string;
  description: string;
  isPublic: boolean;
  allowComments: boolean;
  allowDownloads: boolean;
  tags: string[];
  category: string;
  thumbnail: File | null;
}

// Form validation errors
interface FormErrors {
  name?: string;
  description?: string;
  tags?: string;
  thumbnail?: string;
  general?: string;
}

// Project statistics
interface ProjectStats {
  memberCount: number;
  canvasCount: number;
  totalShapes: number;
  lastActivity: string;
  createdDate: string;
  size: string;
}

// Category options
const CATEGORIES = [
  { value: 'general', label: 'General' },
  { value: 'design', label: 'Design' },
  { value: 'presentation', label: 'Presentation' },
  { value: 'prototype', label: 'Prototype' },
  { value: 'education', label: 'Education' },
  { value: 'business', label: 'Business' },
  { value: 'personal', label: 'Personal' }
];

// Main ProjectSettingsModal component
const ProjectSettingsModal: React.FC<ProjectSettingsModalProps> = ({
  isOpen,
  onClose,
  project,
  onSuccess,
  onDelete,
  onArchive,
  className = ''
}) => {
  const { user } = useAuth();
  const { updateProject } = useProjects();
  const { getProjectThumbnail, generatePlaceholderThumbnail } = useThumbnails();
  
  // Form state
  const [formData, setFormData] = useState<ProjectFormData>({
    name: '',
    description: '',
    isPublic: false,
    allowComments: true,
    allowDownloads: true,
    tags: [],
    category: 'general',
    thumbnail: null
  });
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewThumbnail, setPreviewThumbnail] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showDangerZone, setShowDangerZone] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'permissions' | 'danger'>('general');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Check user permissions
  const isOwner = user?.uid === project?.ownerId;
  const canEdit = isOwner || project?.members?.some(member => 
    member.userId === user?.uid && ['admin', 'editor'].includes(member.role)
  );
  const canDelete = isOwner;
  const canArchive = isOwner;

  // Get project display data
  const displayProject = project ? projectHelpers.projectTransformers.toDisplayFormat(project) : null;

  // Get project statistics
  const projectStats: ProjectStats | null = project ? {
    memberCount: project.members?.length || 0,
    canvasCount: project.canvases?.length || 0,
    totalShapes: project.metadata?.totalShapes || 0,
    lastActivity: displayProject?.displayUpdatedAt || 'Unknown',
    createdDate: displayProject?.displayCreatedAt || 'Unknown',
    size: project.metadata?.size ? formatFileSize(project.metadata.size) : '0 B'
  } : null;

  // Initialize form data when project changes
  useEffect(() => {
    if (project && isOpen) {
      setFormData({
        name: project.name || '',
        description: project.description || '',
        isPublic: project.settings?.isPublic || false,
        allowComments: project.settings?.allowComments || true,
        allowDownloads: project.settings?.allowDownloads || true,
        tags: project.metadata?.tags || [],
        category: project.metadata?.category || 'general',
        thumbnail: null
      });
      setErrors({});
      setTagInput('');
      setShowAdvanced(false);
      setShowDangerZone(false);
      setActiveTab('general');
    }
  }, [project, isOpen]);

  // Load thumbnail
  useEffect(() => {
    if (!project || !isOpen) {
      setPreviewThumbnail(null);
      return;
    }

    const loadThumbnail = async () => {
      try {
        const existingThumbnail = getProjectThumbnail(project.id);
        if (existingThumbnail) {
          setPreviewThumbnail(existingThumbnail.thumbnailUrl || null);
        } else {
          const placeholder = await generatePlaceholderThumbnail('project');
          setPreviewThumbnail(placeholder.thumbnailUrl || null);
        }
      } catch (error) {
        console.error('Failed to load thumbnail:', error);
        setPreviewThumbnail(null);
      }
    };

    loadThumbnail();
  }, [project, isOpen, getProjectThumbnail, generatePlaceholderThumbnail]);

  // Handle form input changes
  const handleInputChange = (field: keyof ProjectFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear field-specific error
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // Handle thumbnail upload
  const handleThumbnailUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({ ...prev, thumbnail: 'Please select an image file' }));
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, thumbnail: 'File size must be less than 5MB' }));
        return;
      }
      
      setFormData(prev => ({ ...prev, thumbnail: file }));
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewThumbnail(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      
      setErrors(prev => ({ ...prev, thumbnail: undefined }));
    }
  };

  // Handle tag input
  const handleTagInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      addTag();
    }
  };

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !formData.tags.includes(tag) && formData.tags.length < 10) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
      setTagInput('');
      setErrors(prev => ({ ...prev, tags: undefined }));
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    // Validate name
    if (!formData.name.trim()) {
      newErrors.name = 'Project name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Project name must be at least 2 characters';
    } else if (formData.name.trim().length > 100) {
      newErrors.name = 'Project name must be less than 100 characters';
    }
    
    // Validate description
    if (formData.description && formData.description.length > 500) {
      newErrors.description = 'Description must be less than 500 characters';
    }
    
    // Validate tags
    if (formData.tags.length > 10) {
      newErrors.tags = 'Maximum 10 tags allowed';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!validateForm() || !project || !canEdit) {
      return;
    }
    
    setIsSubmitting(true);
    setErrors({});
    
    try {
      // Create update data
      const updateData = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        settings: {
          allowComments: formData.allowComments,
          allowDownloads: formData.allowDownloads,
          isPublic: formData.isPublic
        },
        metadata: {
          ...project.metadata,
          tags: formData.tags,
          category: formData.category
        }
      };
      
      // Update project
      const updatedProject = await updateProject(project.id, updateData);
      
      // Handle thumbnail if provided
      if (formData.thumbnail) {
        // TODO: Upload thumbnail to storage and update project
        console.log('Thumbnail upload not implemented yet');
      }
      
      // Success callback
      if (onSuccess) {
        onSuccess(project);
      }
      
      // Close modal
      onClose();
      
    } catch (error) {
      console.error('Failed to update project:', error);
      setErrors({
        general: error instanceof Error ? error.message : 'Failed to update project'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!project || !canDelete || !onDelete) {
      return;
    }
    
    if (window.confirm(`Are you sure you want to delete "${project.name}"? This action cannot be undone.`)) {
      onDelete(project);
      onClose();
    }
  };

  // Handle archive
  const handleArchive = async () => {
    if (!project || !canArchive || !onArchive) {
      return;
    }
    
    const action = project.isArchived ? 'unarchive' : 'archive';
    if (window.confirm(`Are you sure you want to ${action} "${project.name}"?`)) {
      onArchive(project);
      onClose();
    }
  };

  // Handle modal close
  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  // Handle escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        handleClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen]);

  // Handle click outside
  const handleBackdropClick = (event: React.MouseEvent) => {
    if (event.target === modalRef.current) {
      handleClose();
    }
  };

  if (!isOpen || !project) {
    return null;
  }

  return (
    <div 
      ref={modalRef}
      className="fixed inset-0 z-50 overflow-y-auto"
      onClick={handleBackdropClick}
    >
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className={`relative w-full max-w-4xl bg-white dark:bg-slate-800 rounded-xl shadow-xl ${className}`}>
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-700">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Project Settings
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {project.name}
              </p>
            </div>
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
            >
              <XMarkIcon className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 dark:border-slate-700">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('general')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'general'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                General
              </button>
              <button
                onClick={() => setActiveTab('permissions')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'permissions'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                Permissions
              </button>
              {canDelete && (
                <button
                  onClick={() => setActiveTab('danger')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'danger'
                      ? 'border-red-500 text-red-600 dark:text-red-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  Danger Zone
                </button>
              )}
            </nav>
          </div>

          {/* Content */}
          <div className="p-6">
            {activeTab === 'general' && (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Project Statistics */}
                {projectStats && (
                  <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                      Project Statistics
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {projectStats.memberCount}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          Members
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                          {projectStats.canvasCount}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          Canvases
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                          {projectStats.totalShapes}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          Shapes
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                          {projectStats.size}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          Size
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 text-xs text-gray-600 dark:text-gray-400">
                      Created {projectStats.createdDate} • Last updated {projectStats.lastActivity}
                    </div>
                  </div>
                )}

                {/* Form Fields */}
                <div className="space-y-4">
                  {/* Project Name */}
                  <div>
                    <label htmlFor="project-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Project Name *
                    </label>
                    <input
                      id="project-name"
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.name 
                          ? 'border-red-300 dark:border-red-600' 
                          : 'border-gray-300 dark:border-slate-600'
                      } bg-white dark:bg-slate-700 text-gray-900 dark:text-white`}
                      placeholder="Enter project name"
                      disabled={isSubmitting || !canEdit}
                    />
                    {errors.name && (
                      <p className="text-sm text-red-600 dark:text-red-400 mt-1 flex items-center">
                        <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                        {errors.name}
                      </p>
                    )}
                  </div>

                  {/* Description */}
                  <div>
                    <label htmlFor="project-description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Description
                    </label>
                    <textarea
                      id="project-description"
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      rows={3}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.description 
                          ? 'border-red-300 dark:border-red-600' 
                          : 'border-gray-300 dark:border-slate-600'
                      } bg-white dark:bg-slate-700 text-gray-900 dark:text-white`}
                      placeholder="Describe your project (optional)"
                      disabled={isSubmitting || !canEdit}
                    />
                    <div className="flex justify-between items-center mt-1">
                      {errors.description && (
                        <p className="text-sm text-red-600 dark:text-red-400 flex items-center">
                          <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                          {errors.description}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 dark:text-gray-400 ml-auto">
                        {formData.description.length}/500
                      </p>
                    </div>
                  </div>

                  {/* Category */}
                  <div>
                    <label htmlFor="project-category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Category
                    </label>
                    <select
                      id="project-category"
                      value={formData.category}
                      onChange={(e) => handleInputChange('category', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                      disabled={isSubmitting || !canEdit}
                    >
                      {CATEGORIES.map((category) => (
                        <option key={category.value} value={category.value}>
                          {category.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Tags */}
                  <div>
                    <label htmlFor="project-tags" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Tags
                    </label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {formData.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                        >
                          {tag}
                          {canEdit && (
                            <button
                              type="button"
                              onClick={() => removeTag(tag)}
                              className="ml-1 hover:text-blue-600 dark:hover:text-blue-300"
                              disabled={isSubmitting}
                            >
                              <XMarkIcon className="w-3 h-3" />
                            </button>
                          )}
                        </span>
                      ))}
                    </div>
                    {canEdit && (
                      <div className="flex gap-2">
                        <input
                          id="project-tags"
                          type="text"
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          onKeyDown={handleTagInputKeyDown}
                          className="flex-1 px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                          placeholder="Add tags (press Enter or comma)"
                          disabled={isSubmitting}
                        />
                        <button
                          type="button"
                          onClick={addTag}
                          disabled={isSubmitting || !tagInput.trim()}
                          className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Add
                        </button>
                      </div>
                    )}
                    {errors.tags && (
                      <p className="text-sm text-red-600 dark:text-red-400 mt-1 flex items-center">
                        <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                        {errors.tags}
                      </p>
                    )}
                  </div>

                  {/* Thumbnail Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Thumbnail
                    </label>
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className="w-20 h-14 rounded-lg overflow-hidden bg-gray-100 dark:bg-slate-700">
                          {previewThumbnail ? (
                            <img 
                              src={previewThumbnail} 
                              alt="Thumbnail preview"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <PhotoIcon className="w-6 h-6" />
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex-1">
                        {canEdit && (
                          <>
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept="image/*"
                              onChange={handleThumbnailUpload}
                              className="hidden"
                              disabled={isSubmitting}
                            />
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              disabled={isSubmitting}
                              className="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                            >
                              Choose Image
                            </button>
                          </>
                        )}
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          PNG, JPG up to 5MB
                        </p>
                      </div>
                    </div>
                    {errors.thumbnail && (
                      <p className="text-sm text-red-600 dark:text-red-400 mt-1 flex items-center">
                        <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                        {errors.thumbnail}
                      </p>
                    )}
                  </div>
                </div>

                {/* General Error */}
                {errors.general && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-sm text-red-600 dark:text-red-400 flex items-center">
                      <ExclamationTriangleIcon className="w-4 h-4 mr-2" />
                      {errors.general}
                    </p>
                  </div>
                )}

                {/* Footer */}
                {canEdit && (
                  <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-slate-700">
                    <button
                      type="button"
                      onClick={handleClose}
                      disabled={isSubmitting}
                      className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting || !formData.name.trim()}
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <CheckIcon className="w-4 h-4 mr-2" />
                          Save Changes
                        </>
                      )}
                    </button>
                  </div>
                )}
              </form>
            )}

            {activeTab === 'permissions' && (
              <div className="space-y-6">
                {/* Current Settings */}
                <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                    Current Settings
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <GlobeAltIcon className="w-5 h-5 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          Project Visibility
                        </span>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        project.settings?.isPublic 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                      }`}>
                        {project.settings?.isPublic ? 'Public' : 'Private'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <DocumentTextIcon className="w-5 h-5 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          Comments
                        </span>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        project.settings?.allowComments 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}>
                        {project.settings?.allowComments ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <UserGroupIcon className="w-5 h-5 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          Downloads
                        </span>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        project.settings?.allowDownloads 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}>
                        {project.settings?.allowDownloads ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Permission Settings */}
                {canEdit && (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                      Update Settings
                    </h3>
                    
                    <div className="space-y-3">
                      {/* Visibility */}
                      <div>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.isPublic}
                            onChange={(e) => handleInputChange('isPublic', e.target.checked)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            disabled={isSubmitting}
                          />
                          <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                            Make project public
                          </span>
                          <GlobeAltIcon className="w-4 h-4 ml-1 text-gray-400" />
                        </label>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-6">
                          Public projects can be viewed by anyone with the link
                        </p>
                      </div>

                      {/* Comments */}
                      <div>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.allowComments}
                            onChange={(e) => handleInputChange('allowComments', e.target.checked)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            disabled={isSubmitting}
                          />
                          <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                            Allow comments
                          </span>
                          <DocumentTextIcon className="w-4 h-4 ml-1 text-gray-400" />
                        </label>
                      </div>

                      {/* Downloads */}
                      <div>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.allowDownloads}
                            onChange={(e) => handleInputChange('allowDownloads', e.target.checked)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            disabled={isSubmitting}
                          />
                          <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                            Allow downloads
                          </span>
                          <UserGroupIcon className="w-4 h-4 ml-1 text-gray-400" />
                        </label>
                      </div>
                    </div>

                    <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-slate-700">
                      <button
                        type="button"
                        onClick={handleClose}
                        disabled={isSubmitting}
                        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors disabled:opacity-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                      >
                        {isSubmitting ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <CheckIcon className="w-4 h-4 mr-2" />
                            Save Settings
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}

                {/* Read-only message */}
                {!canEdit && (
                  <div className="text-center py-8">
                    <ShieldExclamationIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      You don't have permission to edit this project's settings.
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'danger' && (
              <div className="space-y-6">
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">
                    Danger Zone
                  </h3>
                  <p className="text-sm text-red-600 dark:text-red-400">
                    These actions are irreversible. Please be careful.
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Archive/Unarchive */}
                  {canArchive && onArchive && (
                    <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-slate-700 rounded-lg">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                          {project.isArchived ? 'Unarchive Project' : 'Archive Project'}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {project.isArchived 
                            ? 'Restore this project and make it active again.'
                            : 'Archive this project to hide it from your project list.'
                          }
                        </p>
                      </div>
                      <button
                        onClick={handleArchive}
                        disabled={isSubmitting}
                        className="px-4 py-2 text-sm font-medium text-orange-700 bg-orange-100 border border-orange-300 rounded-lg hover:bg-orange-200 disabled:opacity-50 transition-colors flex items-center"
                      >
                        <ArchiveBoxIcon className="w-4 h-4 mr-2" />
                        {project.isArchived ? 'Unarchive' : 'Archive'}
                      </button>
                    </div>
                  )}

                  {/* Delete */}
                  {canDelete && onDelete && (
                    <div className="flex items-center justify-between p-4 border border-red-200 dark:border-red-800 rounded-lg bg-red-50 dark:bg-red-900/20">
                      <div>
                        <h4 className="text-sm font-medium text-red-800 dark:text-red-200">
                          Delete Project
                        </h4>
                        <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                          Permanently delete this project and all its data. This action cannot be undone.
                        </p>
                      </div>
                      <button
                        onClick={handleDelete}
                        disabled={isSubmitting}
                        className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center"
                      >
                        <TrashIcon className="w-4 h-4 mr-2" />
                        Delete
                      </button>
                    </div>
                  )}
                </div>

                {/* No permissions message */}
                {!canDelete && (
                  <div className="text-center py-8">
                    <ShieldExclamationIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      You don't have permission to perform dangerous actions on this project.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Utility function to format file size
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

export default ProjectSettingsModal;
