// CreateProjectModal component with form validation and thumbnail preview
// Modal for creating new projects with comprehensive form handling

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useProjects } from '../../hooks/useProjects';
import { useThumbnails } from '../../hooks/useThumbnails';
import { projectHelpers } from '../../utils/projectHelpers';
import { Project } from "../../types"
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
  SparklesIcon,
  DocumentTextIcon,
  TagIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';

// Modal props
interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (project: Project) => void;
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

// Project template
interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  category: string;
  tags: string[];
  settings: {
    allowComments: boolean;
    allowDownloads: boolean;
    isPublic: boolean;
  };
}

// Predefined templates
const PROJECT_TEMPLATES: ProjectTemplate[] = [
  {
    id: 'blank',
    name: 'Blank Project',
    description: 'Start with a clean canvas',
    thumbnail: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2Y5ZmFmYiIvPjx0ZXh0IHg9IjE1MCIgeT0iMTAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOWNhM2FmIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCI+QmxhbmsgUHJvamVjdDwvdGV4dD48L3N2Zz4=',
    category: 'general',
    tags: ['blank', 'template'],
    settings: {
      allowComments: true,
      allowDownloads: true,
      isPublic: false
    }
  },
  {
    id: 'design',
    name: 'Design Project',
    description: 'Perfect for UI/UX design work',
    thumbnail: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iIzNiODJmNiIvPjx0ZXh0IHg9IjE1MCIgeT0iMTAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTQiPkRlc2lnbiBQcm9qZWN0PC90ZXh0Pjwvc3ZnPg==',
    category: 'design',
    tags: ['design', 'ui', 'ux'],
    settings: {
      allowComments: true,
      allowDownloads: true,
      isPublic: false
    }
  },
  {
    id: 'presentation',
    name: 'Presentation',
    description: 'Create engaging presentations',
    thumbnail: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iIzEwYjk4MSIvPjx0ZXh0IHg9IjE1MCIgeT0iMTAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTQiPlByZXNlbnRhdGlvbjwvdGV4dD48L3N2Zz4=',
    category: 'presentation',
    tags: ['presentation', 'slides', 'business'],
    settings: {
      allowComments: true,
      allowDownloads: true,
      isPublic: false
    }
  },
  {
    id: 'prototype',
    name: 'Prototype',
    description: 'Build interactive prototypes',
    thumbnail: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2Y1OWUwYiIvPjx0ZXh0IHg9IjE1MCIgeT0iMTAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSJ3aGl0ZSIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTQiPlByb3RvdHlwZTwvdGV4dD48L3N2Zz4=',
    category: 'prototype',
    tags: ['prototype', 'interactive', 'wireframe'],
    settings: {
      allowComments: true,
      allowDownloads: true,
      isPublic: false
    }
  }
];

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

// Main CreateProjectModal component
const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  className = ''
}) => {
  const { user } = useAuth();
  const { createProject } = useProjects();
  const { generatePlaceholderThumbnail } = useThumbnails();
  
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
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [previewThumbnail, setPreviewThumbnail] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: '',
        description: '',
        isPublic: false,
        allowComments: true,
        allowDownloads: true,
        tags: [],
        category: 'general',
        thumbnail: null
      });
      setErrors({});
      setSelectedTemplate(null);
      setPreviewThumbnail(null);
      setTagInput('');
      setShowAdvanced(false);
    }
  }, [isOpen]);

  // Handle template selection
  const handleTemplateSelect = (template: ProjectTemplate) => {
    setSelectedTemplate(template.id);
    setFormData(prev => ({
      ...prev,
      name: template.name,
      description: template.description,
      category: template.category,
      tags: [...template.tags],
      isPublic: template.settings.isPublic,
      allowComments: template.settings.allowComments,
      allowDownloads: template.settings.allowDownloads
    }));
    setPreviewThumbnail(template.thumbnail);
    setErrors({});
  };

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
    
    if (!validateForm() || !user) {
      return;
    }
    
    setIsSubmitting(true);
    setErrors({});
    
    try {
      // Create project data
      const projectData = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        settings: {
          allowComments: formData.allowComments,
          allowDownloads: formData.allowDownloads,
          isPublic: formData.isPublic
        },
        metadata: {
          version: '1.0.0',
          tags: formData.tags,
          category: formData.category
        }
      };
      
      // Create project
      const newProject = await createProject(projectData);
      
      // Handle thumbnail if provided
      if (formData.thumbnail) {
        // TODO: Upload thumbnail to storage and update project
        console.log('Thumbnail upload not implemented yet');
      }
      
      // Success callback
      if (onSuccess) {
        onSuccess(newProject);
      }
      
      // Close modal
      onClose();
      
    } catch (error) {
      console.error('Failed to create project:', error);
      setErrors({
        general: error instanceof Error ? error.message : 'Failed to create project'
      });
    } finally {
      setIsSubmitting(false);
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

  if (!isOpen) {
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
        <div className={`relative w-full max-w-2xl bg-white dark:bg-slate-800 rounded-xl shadow-xl ${className}`}>
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-700">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Create New Project
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Start a new project with a template or from scratch
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

          {/* Content */}
          <form onSubmit={handleSubmit} className="p-6">
            {/* Templates */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                Choose a template
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {PROJECT_TEMPLATES.map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => handleTemplateSelect(template)}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      selectedTemplate === template.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <div className="aspect-video rounded-md overflow-hidden mb-2 bg-gray-100 dark:bg-slate-700">
                      <img 
                        src={template.thumbnail} 
                        alt={template.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white text-left">
                      {template.name}
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400 text-left mt-1">
                      {template.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>

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
                  disabled={isSubmitting}
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
                  disabled={isSubmitting}
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
                  disabled={isSubmitting}
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
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-1 hover:text-blue-600 dark:hover:text-blue-300"
                        disabled={isSubmitting}
                      >
                        <XMarkIcon className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
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

              {/* Advanced Settings */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                >
                  <InformationCircleIcon className="w-4 h-4 mr-1" />
                  Advanced Settings
                </button>
                
                {showAdvanced && (
                  <div className="mt-3 space-y-3 p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
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
                )}
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
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-slate-700 mt-6">
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
                    Creating...
                  </>
                ) : (
                  <>
                    <SparklesIcon className="w-4 h-4 mr-2" />
                    Create Project
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateProjectModal;
