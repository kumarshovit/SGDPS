import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Input } from './Input';
import { AlertTriangle, Lock, Trash2 } from 'lucide-react';

export interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  title?: string;
  itemName?: string;
  description?: string;
  isLoading?: boolean;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Deletion',
  itemName,
  description,
  isLoading = false,
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setPin('');
      setError('');
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const storedPin = localStorage.getItem('sgdps_delete_pin') || '2026';
    if (pin.trim() !== storedPin) {
      setError('Incorrect Security PIN. Please check and try again.');
      return;
    }

    try {
      await onConfirm();
      onClose();
    } catch {
      setError('Failed to delete item. Please try again.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      maxWidth="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-900 dark:text-rose-200">
          <AlertTriangle size={22} className="text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <p className="font-bold">
              {itemName ? `Are you sure you want to delete ${itemName}?` : 'Are you sure you want to delete this record?'}
            </p>
            <p className="text-charcoal-600 dark:text-charcoal-300">
              {description || 'This action is irreversible and will remove the record permanently.'}
            </p>
          </div>
        </div>

        <div>
          <Input
            label="Security PIN *"
            type="password"
            autoFocus
            required
            placeholder="Enter 4-digit PIN (default: 2026)"
            value={pin}
            onChange={(e) => {
              setPin(e.target.value);
              if (error) setError('');
            }}
            icon={<Lock size={16} />}
          />
          {error && (
            <p className="text-xs font-semibold text-rose-600 dark:text-rose-400 mt-1.5 animate-in fade-in">
              ⚠️ {error}
            </p>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-cream-100 dark:border-charcoal-700">
          <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="danger"
            size="sm"
            isLoading={isLoading}
            leftIcon={<Trash2 size={14} />}
          >
            Confirm & Delete
          </Button>
        </div>
      </form>
    </Modal>
  );
};
