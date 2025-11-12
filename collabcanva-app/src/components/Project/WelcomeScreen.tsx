// WelcomeScreen - First-time user experience
// Helps new users get started with their first project

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useProjects } from '../../hooks/useProjects';
import { 
  SparklesIcon, 
  RocketLaunchIcon, 
  PaintBrushIcon,
  UserGroupIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';

interface WelcomeScreenProps {
  onCreateProject: () => void;
}

export default function WelcomeScreen({ onCreateProject }: WelcomeScreenProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { createProject } = useProjects();
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateFirstProject = async () => {
    setIsCreating(true);
    try {
      const project = await createProject({
        name: 'My First Canvas',
        description: 'Welcome to CollabCanvas! Start creating amazing designs.',
        color: '#3b82f6'
      });

      if (project) {
        navigate(`/projects/${project.id}/canvas/main`);
      }
    } catch (error) {
      console.error('Failed to create first project:', error);
      // Fallback to opening the create modal
      onCreateProject();
    } finally {
      setIsCreating(false);
    }
  };

  const features = [
    {
      icon: PaintBrushIcon,
      title: 'Create & Design',
      description: 'Draw, sketch, and design with powerful tools'
    },
    {
      icon: UserGroupIcon,
      title: 'Collaborate',
      description: 'Work together in real-time with your team'
    },
    {
      icon: RocketLaunchIcon,
      title: 'Share & Export',
      description: 'Share your creations and export in multiple formats'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-600 rounded-full mb-6">
            <SparklesIcon className="w-10 h-10 text-white" />
          </div>
          
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to CollabCanvas!
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Create amazing designs, collaborate with your team, and bring your ideas to life. 
            Let's get you started with your first project.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {features.map((feature, index) => (
            <div key={index} className="text-center p-6 bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mb-4">
                <feature.icon className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <button
            onClick={handleCreateFirstProject}
            disabled={isCreating}
            className="inline-flex items-center px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCreating ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3" />
                Creating Your First Project...
              </>
            ) : (
              <>
                <RocketLaunchIcon className="w-6 h-6 mr-3" />
                Create My First Project
                <ArrowRightIcon className="w-5 h-5 ml-3" />
              </>
            )}
          </button>
          
          <p className="text-sm text-gray-500 mt-4">
            Or{' '}
            <button
              onClick={onCreateProject}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              customize your project settings
            </button>
          </p>
        </div>

        {/* User Info */}
        {user && (
          <div className="text-center mt-8">
            <p className="text-sm text-gray-500">
              Signed in as <span className="font-medium text-gray-700">{user.displayName || user.email}</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
