import React, { useState, useMemo } from 'react';
import {
  useGetCollectorsQuery,
  useCreateCollectorMutation,
} from '../api/userApiSlice';
import { formatCurrency, formatDateTime } from '../../../utils/formatters';
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
  Search,
  Smartphone,
  ShieldCheck,
  IndianRupee,
  Receipt,
  CheckCircle2,
} from 'lucide-react';

export const UserManagementPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('Collector@123');

  const { data: collectors = [], isLoading } = useGetCollectorsQuery();
  const [createCollector, { isLoading: isCreating }] = useCreateCollectorMutation();

  const filteredCollectors = useMemo(() => {
    if (!searchQuery.trim()) return collectors;
    const q = searchQuery.toLowerCase();
    return collectors.filter(
      (c) =>
        c.firstName.toLowerCase().includes(q) ||
        (c.lastName && c.lastName.toLowerCase().includes(q)) ||
        (c.fullName && c.fullName.toLowerCase().includes(q)) ||
        c.email.toLowerCase().includes(q)
    );
  }, [collectors, searchQuery]);

  const totalCollectors = collectors.length;
  const activeCollectors = collectors.filter((c) => c.isActive).length;
  const totalCollectedByAll = collectors.reduce((s, c) => s + (c.totalCollected || 0), 0);
  const totalEntriesLogged = collectors.reduce((s, c) => s + (c.collectionsCount || 0), 0);

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
      setPassword('Collector@123');
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
            Field Collectors & Mobile Access
          </h1>
          <p className="text-xs sm:text-sm text-charcoal-500 dark:text-charcoal-300 mt-1">
            Authorized mobile field collectors directory, credentials provisioning, and live collection performance.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          leftIcon={<Plus size={15} />}
          onClick={() => setIsModalOpen(true)}
          className="shadow-gold"
        >
          Register Collector
        </Button>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <GlassCard className="p-4 bg-white dark:bg-charcoal-800">
          <div className="flex items-center gap-2 text-xs text-charcoal-500 dark:text-charcoal-400 font-bold uppercase tracking-wider">
            <Users2 size={15} className="text-gold-600" />
            Total Collectors
          </div>
          <div className="text-2xl font-bold text-charcoal-900 dark:text-cream-50 mt-1 font-display">
            {totalCollectors}
          </div>
        </GlassCard>

        <GlassCard className="p-4 bg-white dark:bg-charcoal-800">
          <div className="flex items-center gap-2 text-xs text-leaf-600 dark:text-leaf-400 font-bold uppercase tracking-wider">
            <Smartphone size={15} className="text-leaf-600" />
            Active Mobile Users
          </div>
          <div className="text-2xl font-bold text-leaf-700 dark:text-leaf-300 mt-1 font-display">
            {activeCollectors}
          </div>
        </GlassCard>

        <GlassCard className="p-4 bg-white dark:bg-charcoal-800">
          <div className="flex items-center gap-2 text-xs text-saffron-600 dark:text-gold-400 font-bold uppercase tracking-wider">
            <IndianRupee size={15} className="text-saffron-600" />
            Total Field Funds
          </div>
          <div className="text-2xl font-bold text-saffron-700 dark:text-gold-300 mt-1 font-mono">
            {formatCurrency(totalCollectedByAll)}
          </div>
        </GlassCard>

        <GlassCard className="p-4 bg-white dark:bg-charcoal-800">
          <div className="flex items-center gap-2 text-xs text-maroon-600 dark:text-rose-400 font-bold uppercase tracking-wider">
            <Receipt size={15} className="text-maroon-600" />
            Receipts Logged
          </div>
          <div className="text-2xl font-bold text-maroon-700 dark:text-rose-300 mt-1 font-display">
            {totalEntriesLogged}
          </div>
        </GlassCard>
      </div>

      {/* Search & Filter Bar */}
      <GlassCard className="p-4 bg-white dark:bg-charcoal-800">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="w-full sm:w-80">
            <Input
              placeholder="Search by collector name or login email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={<Search size={16} />}
            />
          </div>

          <div className="text-xs font-bold text-charcoal-500 dark:text-charcoal-400">
            Showing <strong className="text-charcoal-900 dark:text-cream-50">{filteredCollectors.length}</strong> of {totalCollectors} Authorized Field Collectors
          </div>
        </div>
      </GlassCard>

      {/* Collector Table */}
      <GlassCard className="overflow-hidden bg-white dark:bg-charcoal-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-cream-100 dark:bg-charcoal-900 border-b border-cream-border dark:border-charcoal-700 text-charcoal-700 dark:text-charcoal-300 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4">Collector Profile</th>
                <th className="py-3.5 px-4">Login ID / Email</th>
                <th className="py-3.5 px-4">Access Role</th>
                <th className="py-3.5 px-4">Account Status</th>
                <th className="py-3.5 px-4">Total Collected (₹)</th>
                <th className="py-3.5 px-4">Receipts Count</th>
                <th className="py-3.5 px-4">Registered Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-border dark:divide-charcoal-700/60">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-charcoal-400">
                    Loading collectors information...
                  </td>
                </tr>
              ) : filteredCollectors.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-charcoal-400">
                    No field collectors found matching criteria. Click <strong>Register Collector</strong> to add one.
                  </td>
                </tr>
              ) : (
                filteredCollectors.map((c) => (
                  <tr
                    key={c.id}
                    className="hover:bg-cream-50/80 dark:hover:bg-charcoal-700/40 transition-colors"
                  >
                    {/* Collector Name & Avatar */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-maroon-800 to-saffron-600 text-white font-extrabold text-xs shadow-sm flex-shrink-0">
                          {c.firstName?.[0] || 'C'}
                          {c.lastName?.[0] || ''}
                        </div>
                        <div>
                          <div className="font-bold text-charcoal-900 dark:text-cream-50 font-display">
                            {c.fullName || `${c.firstName} ${c.lastName || ''}`.trim()}
                          </div>
                          <div className="text-[10px] text-charcoal-400 font-mono">
                            ID #{c.id}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Email / Login ID */}
                    <td className="py-3.5 px-4 text-charcoal-700 dark:text-charcoal-300 font-mono text-xs">
                      {c.email}
                    </td>

                    {/* Access Role */}
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-saffron-700 dark:text-gold-400 bg-saffron-50 dark:bg-saffron-950/40 px-2 py-0.5 rounded-lg border border-saffron-500/20">
                        <Smartphone size={12} />
                        Field Collector
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <Badge variant={c.isActive ? 'success' : 'danger'}>
                        {c.isActive ? '● Active' : 'Inactive'}
                      </Badge>
                    </td>

                    {/* Total Collected */}
                    <td className="py-3.5 px-4 font-extrabold text-leaf-700 dark:text-leaf-400 font-mono text-sm">
                      {formatCurrency(c.totalCollected || 0)}
                    </td>

                    {/* Collections Count */}
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 font-bold text-charcoal-800 dark:text-cream-100 bg-cream-100 dark:bg-charcoal-900 px-2.5 py-1 rounded-lg">
                        <Receipt size={13} className="text-gold-600" />
                        {c.collectionsCount || 0} entries
                      </span>
                    </td>

                    {/* Registered Date */}
                    <td className="py-3.5 px-4 text-charcoal-500 dark:text-charcoal-400 text-xs">
                      {c.createdOn ? formatDateTime(c.createdOn) : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>

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

            <div className="p-2.5 rounded-xl bg-gold-500/10 border border-gold-500/20 text-[11px] text-gold-800 dark:text-gold-300">
              📱 This account will be able to log in to the <strong>SGDPS Mobile App</strong> to record collections and print digital receipts.
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-cream-100 dark:border-charcoal-700">
              <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" isLoading={isCreating} rightIcon={<Plus size={15} />}>
                Create Collector Account
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
