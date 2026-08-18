import React, { useState } from 'react';
import {
  useGetCollectorsQuery,
  useCreateCollectorMutation,
} from '../api/userApiSlice';
import { formatCurrency } from '../../../utils/formatters';
import { GlassCard } from '../../../components/ui/GlassCard';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import {
  Users2,
  Plus,
  Mail,
  Lock,
  User,
} from 'lucide-react';

export const UserManagementPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('Collector@123');

  const { data: collectors = [], isLoading } = useGetCollectorsQuery();
  const [createCollector, { isLoading: isCreating }] = useCreateCollectorMutation();

  const handleCreateCollector = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !firstName.trim()) return;

    try {
      await createCollector({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        password: password.trim(),
      }).unwrap();

      setIsModalOpen(false);
      setFirstName('');
      setLastName('');
      setEmail('');
    } catch (err: any) {
      alert(err?.data?.detail || 'Failed to create collector account');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-charcoal-900 dark:text-cream-50 font-display">
            Field Collectors & Live Metrics
          </h1>
          <p className="text-xs sm:text-sm text-charcoal-500 dark:text-charcoal-300 mt-1">
            Provision mobile app login credentials for field collectors and monitor live collection performance.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          leftIcon={<Plus size={15} />}
          onClick={() => setIsModalOpen(true)}
        >
          Register Collector
        </Button>
      </div>

      {/* Collectors Grid */}
      {isLoading ? (
        <div className="text-xs text-charcoal-400 py-12 text-center">Loading collectors list…</div>
      ) : collectors.length === 0 ? (
        <GlassCard className="text-center py-12 space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gold-500/15 text-gold-700">
            <Users2 size={24} />
          </div>
          <p className="text-sm font-bold text-charcoal-900 dark:text-cream-50">
            No authorized collectors registered yet.
          </p>
          <p className="text-xs text-charcoal-400">
            Click <strong>Register Collector</strong> to create credentials for field mobile app users.
          </p>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {collectors.map((c) => (
            <div
              key={c.id}
              className="relative overflow-hidden rounded-2xl border border-cream-border dark:border-charcoal-700 bg-white dark:bg-charcoal-800 p-5 shadow-festive dark:shadow-festive-dark transition-all duration-300 hover:-translate-y-1 hover:shadow-xl group"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-maroon-800 to-saffron-600 text-white font-extrabold text-base shadow-gold">
                    {c.firstName[0]}
                    {c.lastName?.[0] || ''}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-charcoal-900 dark:text-cream-50 text-base">
                      {c.fullName || `${c.firstName} ${c.lastName}`}
                    </h3>
                    <p className="text-xs text-charcoal-500 dark:text-charcoal-400 font-mono">{c.email}</p>
                  </div>
                </div>

                <Badge variant={c.isActive ? 'success' : 'danger'} size="sm">
                  {c.isActive ? '● Active' : 'Inactive'}
                </Badge>
              </div>

              {/* Performance Metrics */}
              <div className="grid grid-cols-2 gap-3 mt-5 pt-4 border-t border-cream-100 dark:border-charcoal-700">
                <div className="p-3 rounded-xl bg-cream-50 dark:bg-charcoal-900 border border-cream-border dark:border-charcoal-700">
                  <span className="text-[10px] font-bold text-charcoal-400 uppercase">Total Collected</span>
                  <div className="text-lg font-extrabold text-leaf-700 dark:text-leaf-400 mt-0.5">
                    {formatCurrency(c.totalCollected)}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-cream-50 dark:bg-charcoal-900 border border-cream-border dark:border-charcoal-700">
                  <span className="text-[10px] font-bold text-charcoal-400 uppercase">Entries Logged</span>
                  <div className="text-lg font-extrabold text-saffron-700 dark:text-gold-400 mt-0.5">
                    {c.collectionsCount}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Register Collector Modal */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Register Field Collector"
          subtitle="Generate login credentials for the mobile collection app"
        >
          <form onSubmit={handleCreateCollector} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="First Name *"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Rahul"
                icon={<User size={15} />}
              />
              <Input
                label="Last Name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Sharma"
              />
            </div>

            <Input
              label="Email Address (Login ID) *"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="collector@sgdps.com"
              icon={<Mail size={15} />}
            />

            <Input
              label="Default Password *"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              icon={<Lock size={15} />}
            />

            <div className="flex justify-end gap-2 pt-3 border-t border-cream-100 dark:border-charcoal-700">
              <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" isLoading={isCreating}>
                Create Account
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
