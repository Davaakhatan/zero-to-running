// ProjectTransferModal component for managing project ownership transfers
// Modal interface for creating, accepting, and managing transfer requests

import React, { useState, useEffect } from 'react';
import { useProjectTransfer } from '../../hooks/useProjectTransfer';
import { useProjectMembers } from '../../hooks/useProjectMembers';
import { ProjectMember } from "../../types"
import { TransferRequest } from "../../services/projectTransferService"
import { 
  formatTransferStatus, 
  getTransferStatusColor, 
  formatTransferExpiry,
  isTransferExpired 
} from '../../services/projectTransferService';

// Modal props
interface ProjectTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  mode: 'create' | 'view' | 'manage';
  transferId?: string;
  className?: string;
}

// Transfer request form props
interface TransferRequestFormProps {
  projectId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

// Transfer request form component
const TransferRequestForm: React.FC<TransferRequestFormProps> = ({
  projectId,
  onSuccess,
  onCancel
}) => {
  const { createTransferRequest, validateTransfer, isCreating, createError } = useProjectTransfer({ projectId });
  const { members } = useProjectMembers({ projectId });
  
  const [selectedUserId, setSelectedUserId] = useState('');
  const [message, setMessage] = useState('');
  const [validation, setValidation] = useState<any>(null);
  const [isValidating, setIsValidating] = useState(false);

  // Get eligible members (admins and editors)
  const eligibleMembers = members.filter(member => 
    ['admin', 'editor'].includes(member.role) && member.userId !== member.userId
  );

  // Validate transfer when selection changes
  useEffect(() => {
    if (selectedUserId) {
      setIsValidating(true);
      validateTransfer(selectedUserId, message)
        .then(setValidation)
        .catch(() => setValidation(null))
        .finally(() => setIsValidating(false));
    } else {
      setValidation(null);
    }
  }, [selectedUserId, message, validateTransfer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedUserId || !validation?.isValid) return;

    try {
      await createTransferRequest(selectedUserId, message);
      onSuccess();
    } catch (error) {
      // Error is handled by the hook
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Transfer ownership to
        </label>
        <select
          value={selectedUserId}
          onChange={(e) => setSelectedUserId(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          required
        >
          <option value="">Select a team member</option>
          {eligibleMembers.map((member) => (
            <option key={member.userId} value={member.userId}>
              {member.displayName} ({member.role})
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Message (optional)
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Add a message explaining why you're transferring ownership..."
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          rows={3}
          maxLength={500}
        />
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {message.length}/500 characters
        </div>
      </div>

      {/* Validation messages */}
      {validation && (
        <div className="space-y-2">
          {validation.errors.length > 0 && (
            <div className="text-red-600 dark:text-red-400 text-sm">
              {validation.errors.map((error: string, index: number) => (
                <div key={index}>• {error}</div>
              ))}
            </div>
          )}
          {validation.warnings.length > 0 && (
            <div className="text-yellow-600 dark:text-yellow-400 text-sm">
              {validation.warnings.map((warning: string, index: number) => (
                <div key={index}>• {warning}</div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Error message */}
      {createError && (
        <div className="text-red-600 dark:text-red-400 text-sm">
          {createError}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!selectedUserId || !validation?.isValid || isCreating || isValidating}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isCreating ? 'Creating...' : 'Create Transfer Request'}
        </button>
      </div>
    </form>
  );
};

// Transfer request item component
interface TransferRequestItemProps {
  transfer: TransferRequest;
  onAccept: (transferId: string) => void;
  onDecline: (transferId: string) => void;
  onCancel: (transferId: string) => void;
  canAccept: boolean;
  canCancel: boolean;
  canDecline: boolean;
}

const TransferRequestItem: React.FC<TransferRequestItemProps> = ({
  transfer,
  onAccept,
  onDecline,
  onCancel,
  canAccept,
  canCancel,
  canDecline
}) => {
  const [showDeclineForm, setShowDeclineForm] = useState(false);
  const [declineReason, setDeclineReason] = useState('');

  const statusColor = getTransferStatusColor(transfer.status);
  const statusText = formatTransferStatus(transfer.status);
  const expiryText = formatTransferExpiry(transfer.expiresAt);
  const isExpired = isTransferExpired(transfer.expiresAt);

  const handleDecline = () => {
    if (showDeclineForm) {
      onDecline(transfer.id);
      setShowDeclineForm(false);
      setDeclineReason('');
    } else {
      setShowDeclineForm(true);
    }
  };

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3">
      {/* Transfer info */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-gray-900 dark:text-white">
              {transfer.fromUserName}
            </span>
            <span className="text-gray-500 dark:text-gray-400">→</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {transfer.toUserName}
            </span>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Project: {transfer.metadata.projectName}
          </div>
          {transfer.message && (
            <div className="text-sm text-gray-700 dark:text-gray-300 mt-2 p-2 bg-gray-50 dark:bg-gray-800 rounded">
              {transfer.message}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${statusColor}-100 text-${statusColor}-800 dark:bg-${statusColor}-900 dark:text-${statusColor}-200`}>
            {statusText}
          </span>
        </div>
      </div>

      {/* Transfer details */}
      <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
        <div>Created: {new Date(transfer.createdAt).toLocaleString()}</div>
        {transfer.status === 'pending' && (
          <div className={isExpired ? 'text-red-500' : 'text-yellow-600'}>
            {isExpired ? 'Expired' : `Expires: ${expiryText}`}
          </div>
        )}
        {transfer.acceptedAt && (
          <div>Accepted: {new Date(transfer.acceptedAt).toLocaleString()}</div>
        )}
        {transfer.declinedAt && (
          <div>Declined: {new Date(transfer.declinedAt).toLocaleString()}</div>
        )}
        {transfer.cancelledAt && (
          <div>Cancelled: {new Date(transfer.cancelledAt).toLocaleString()}</div>
        )}
      </div>

      {/* Decline form */}
      {showDeclineForm && (
        <div className="space-y-2">
          <textarea
            value={declineReason}
            onChange={(e) => setDeclineReason(e.target.value)}
            placeholder="Reason for declining (optional)"
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            rows={2}
          />
        </div>
      )}

      {/* Action buttons */}
      {transfer.status === 'pending' && !isExpired && (
        <div className="flex justify-end space-x-2">
          {canCancel && (
            <button
              onClick={() => onCancel(transfer.id)}
              className="px-3 py-1 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              Cancel
            </button>
          )}
          {canDecline && (
            <button
              onClick={handleDecline}
              className="px-3 py-1 text-xs font-medium text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-600 rounded hover:bg-red-200 dark:hover:bg-red-800"
            >
              {showDeclineForm ? 'Confirm Decline' : 'Decline'}
            </button>
          )}
          {canAccept && (
            <button
              onClick={() => onAccept(transfer.id)}
              className="px-3 py-1 text-xs font-medium text-white bg-green-600 border border-transparent rounded hover:bg-green-700"
            >
              Accept
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// Main modal component
export const ProjectTransferModal: React.FC<ProjectTransferModalProps> = ({
  isOpen,
  onClose,
  projectId,
  mode,
  transferId,
  className = ''
}) => {
  const { 
    transfers, 
    pendingTransfers, 
    userTransfers,
    acceptTransferRequest, 
    declineTransferRequest, 
    cancelTransferRequest,
    canAcceptTransfer,
    canCancelTransfer,
    canDeclineTransfer,
    isLoading,
    isAccepting,
    isDeclining,
    isCancelling
  } = useProjectTransfer({ projectId });

  const [activeTab, setActiveTab] = useState<'create' | 'pending' | 'history'>('create');

  // Get current transfer if viewing specific transfer
  const currentTransfer = transferId ? transfers.find(t => t.id === transferId) : null;

  // Handle transfer actions
  const handleAccept = async (id: string) => {
    try {
      await acceptTransferRequest(id);
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const handleDecline = async (id: string) => {
    try {
      await declineTransferRequest(id);
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const handleCancel = async (id: string) => {
    try {
      await cancelTransferRequest(id);
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const handleSuccess = () => {
    setActiveTab('pending');
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${className}`}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {mode === 'create' ? 'Transfer Project Ownership' : 
             mode === 'view' ? 'Transfer Request Details' : 
             'Manage Transfer Requests'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {mode === 'create' && (
            <TransferRequestForm
              projectId={projectId}
              onSuccess={handleSuccess}
              onCancel={onClose}
            />
          )}

          {mode === 'view' && currentTransfer && (
            <TransferRequestItem
              transfer={currentTransfer}
              onAccept={handleAccept}
              onDecline={handleDecline}
              onCancel={handleCancel}
              canAccept={canAcceptTransfer(currentTransfer)}
              canCancel={canCancelTransfer(currentTransfer)}
              canDecline={canDeclineTransfer(currentTransfer)}
            />
          )}

          {mode === 'manage' && (
            <div className="space-y-6">
              {/* Tabs */}
              <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="-mb-px flex space-x-8">
                  <button
                    onClick={() => setActiveTab('create')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'create'
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                  >
                    Create Transfer
                  </button>
                  <button
                    onClick={() => setActiveTab('pending')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'pending'
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                  >
                    Pending ({pendingTransfers.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('history')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'history'
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                  >
                    History ({transfers.length - pendingTransfers.length})
                  </button>
                </nav>
              </div>

              {/* Tab content */}
              {activeTab === 'create' && (
                <TransferRequestForm
                  projectId={projectId}
                  onSuccess={handleSuccess}
                  onCancel={onClose}
                />
              )}

              {activeTab === 'pending' && (
                <div className="space-y-4">
                  {isLoading ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    </div>
                  ) : pendingTransfers.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      No pending transfer requests
                    </div>
                  ) : (
                    pendingTransfers.map((transfer) => (
                      <TransferRequestItem
                        key={transfer.id}
                        transfer={transfer}
                        onAccept={handleAccept}
                        onDecline={handleDecline}
                        onCancel={handleCancel}
                        canAccept={canAcceptTransfer(transfer)}
                        canCancel={canCancelTransfer(transfer)}
                        canDecline={canDeclineTransfer(transfer)}
                      />
                    ))
                  )}
                </div>
              )}

              {activeTab === 'history' && (
                <div className="space-y-4">
                  {isLoading ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    </div>
                  ) : userTransfers.filter(t => t.status !== 'pending').length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      No transfer history
                    </div>
                  ) : (
                    userTransfers
                      .filter(t => t.status !== 'pending')
                      .sort((a, b) => b.createdAt - a.createdAt)
                      .map((transfer) => (
                        <TransferRequestItem
                          key={transfer.id}
                          transfer={transfer}
                          onAccept={handleAccept}
                          onDecline={handleDecline}
                          onCancel={handleCancel}
                          canAccept={canAcceptTransfer(transfer)}
                          canCancel={canCancelTransfer(transfer)}
                          canDecline={canDeclineTransfer(transfer)}
                        />
                      ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectTransferModal;
