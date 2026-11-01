import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  UserPlus,
  Search,
  Users,
  Eye,
  Edit2,
  Archive,
  RotateCcw,
  Phone,
  X,
  Calendar,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useEmployees } from '@/features/employees/useEmployees';
import { PageHeader } from '@/components/shared/PageHeader';
import { TableSkeleton } from '@/components/shared/Loading';
import { EmptyState } from '@/components/shared/EmptyState';
import { ErrorState } from '@/components/shared/ErrorState';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { getRateForMonth } from '@/domain/rates';
import { formatDisplayDate, monthOf, todayKey } from '@/domain/dates';
import { seedDemoData } from '@/services/data';
import { useAuth } from '@/features/auth/useAuth';
import { strings } from '@/strings/en';
import type { Employee } from '@/domain/types';

const AVATAR_COLORS = [
  'from-rose-500/20 to-orange-500/20 text-rose-700 dark:text-rose-300 border-rose-500/30',
  'from-emerald-500/20 to-teal-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
  'from-amber-500/20 to-yellow-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30',
  'from-sky-500/20 to-blue-500/20 text-sky-700 dark:text-sky-300 border-sky-500/30',
  'from-violet-500/20 to-purple-500/20 text-violet-700 dark:text-violet-300 border-violet-500/30',
];

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function Employees() {
  const { employees, activeEmployees, archivedEmployees, loading, error, saveEmployee } =
    useEmployees();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [employeeToArchive, setEmployeeToArchive] = useState<Employee | null>(null);
  const [employeeToUnarchive, setEmployeeToUnarchive] = useState<Employee | null>(null);

  const currentMonth = monthOf(todayKey());
  const currentList = activeTab === 'active' ? activeEmployees : archivedEmployees;

  const filteredEmployees = useMemo(() => {
    if (!searchQuery.trim()) return currentList;
    const q = searchQuery.toLowerCase().trim();
    return currentList.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        (e.phone && e.phone.toLowerCase().includes(q))
    );
  }, [currentList, searchQuery]);

  const handleArchive = async () => {
    if (!employeeToArchive) return;
    try {
      await saveEmployee({
        ...employeeToArchive,
        active: false,
        leftOn: todayKey(),
      });
      toast.success(`${employeeToArchive.name} archived`);
    } catch {
      toast.error('Failed to archive employee');
    } finally {
      setEmployeeToArchive(null);
    }
  };

  const handleUnarchive = async () => {
    if (!employeeToUnarchive) return;
    try {
      await saveEmployee({
        ...employeeToUnarchive,
        active: true,
        leftOn: undefined,
      });
      toast.success(`${employeeToUnarchive.name} restored to active`);
    } catch {
      toast.error('Failed to unarchive employee');
    } finally {
      setEmployeeToUnarchive(null);
    }
  };

  const handleLoadDemo = () => {
    if (user) {
      seedDemoData(user.uid);
      toast.success(strings.demo.demoLoaded);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title={strings.employees.title} />
        <TableSkeleton rows={6} cols={5} />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        message={error.message}
        errorCode={error.firestoreCode || error.code}
        errorPath={error.path}
        operation={error.operation}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title={strings.employees.title} subtitle="Manage your staff, wages, and working status">
        <Link
          to="/app/employees/new"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-[#0D0D0F] bg-gradient-to-r from-[#FF8278] to-[#FFA096] hover:from-[#FF958C] hover:to-[#FFB0A7] rounded-xl transition-all cursor-pointer shadow-md shadow-[#FF8278]/20 min-h-[40px] active:scale-[0.98]"
        >
          <UserPlus className="w-4 h-4 stroke-[2.5]" />
          <span>{strings.employees.addEmployee}</span>
        </Link>
      </PageHeader>

      {/* Tabs and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
        {/* Segmented control */}
        <div className="flex items-center p-1 bg-white dark:bg-[#14161B] border border-[#E5E7EB] dark:border-[#23262D] rounded-xl w-full sm:w-fit shadow-sm">
          <button
            type="button"
            onClick={() => setActiveTab('active')}
            className={`flex-1 sm:flex-none px-4 py-2 text-xs font-mono font-medium rounded-lg transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'active'
                ? 'bg-[#F3F4F6] dark:bg-[#1C1F26] text-[#111827] dark:text-[#F2F0EC] border border-[#E5E7EB] dark:border-[#2B2F38] shadow-sm font-semibold'
                : 'text-[#5B6472] dark:text-[#858A94] hover:text-[#111827] dark:hover:text-[#F2F0EC]'
            }`}
          >
            <span>{strings.employees.activeTab}</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeTab === 'active'
                  ? 'bg-[#FF8278]/20 text-[#B93A2B] dark:text-[#FF8278]'
                  : 'bg-[#F3F4F6] dark:bg-[#1B1E24] text-[#5B6472] dark:text-[#858A94]'
              }`}
            >
              {activeEmployees.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('archived')}
            className={`flex-1 sm:flex-none px-4 py-2 text-xs font-mono font-medium rounded-lg transition-all cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === 'archived'
                ? 'bg-[#F3F4F6] dark:bg-[#1C1F26] text-[#111827] dark:text-[#F2F0EC] border border-[#E5E7EB] dark:border-[#2B2F38] shadow-sm font-semibold'
                : 'text-[#5B6472] dark:text-[#858A94] hover:text-[#111827] dark:hover:text-[#F2F0EC]'
            }`}
          >
            <span>{strings.employees.archivedTab}</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeTab === 'archived'
                  ? 'bg-[#FF8278]/20 text-[#B93A2B] dark:text-[#FF8278]'
                  : 'bg-[#F3F4F6] dark:bg-[#1B1E24] text-[#5B6472] dark:text-[#858A94]'
              }`}
            >
              {archivedEmployees.length}
            </span>
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-[#5B6472] dark:text-[#858A94] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={strings.employees.searchPlaceholder}
            className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-[#E5E7EB] dark:border-[#23262D] bg-white dark:bg-[#14161B] text-xs text-[#111827] dark:text-[#F2F0EC] placeholder-[#6B7280] dark:placeholder-[#60646C] focus:outline-none focus:border-[#FF8278] focus:ring-1 focus:ring-[#FF8278] shadow-sm"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[#5B6472] dark:text-[#858A94] hover:text-[#111827] dark:hover:text-[#F2F0EC] rounded-full"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Empty State */}
      {filteredEmployees.length === 0 ? (
        <EmptyState
          icon={Users}
          title={
            activeTab === 'active'
              ? strings.employees.emptyActive
              : strings.employees.emptyArchived
          }
          description="Create employee profiles with daily full and half wage rates to start calculating pay."
          actionLabel={activeTab === 'active' ? strings.employees.addEmployee : undefined}
          onAction={activeTab === 'active' ? () => navigate('/app/employees/new') : undefined}
          secondaryActionLabel={
            activeTab === 'active' && employees.length === 0
              ? strings.demo.loadDemo
              : undefined
          }
          onSecondaryAction={handleLoadDemo}
        />
      ) : (
        <>
          {/* Desktop Table View (>= 768px) */}
          <div className="hidden md:block overflow-x-auto bg-white dark:bg-[#14161B] rounded-2xl border border-[#E5E7EB] dark:border-[#23262D] shadow-sm">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-[#F3F4F6] dark:bg-[#101215] text-[#5B6472] dark:text-[#858A94] text-xs uppercase font-mono border-b border-[#E5E7EB] dark:border-[#23262D]">
                <tr>
                  <th className="py-3.5 px-6 font-medium">{strings.common.name}</th>
                  <th className="py-3.5 px-4 font-medium">{strings.common.phone}</th>
                  <th className="py-3.5 px-4 font-medium">Daily Rates</th>
                  <th className="py-3.5 px-4 font-medium">Joining Date</th>
                  <th className="py-3.5 px-6 text-right font-medium">{strings.common.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB] dark:divide-[#23262D]">
                {filteredEmployees.map((emp) => {
                  const rate = getRateForMonth(emp.rates, currentMonth);
                  return (
                    <tr
                      key={emp.id}
                      className="hover:bg-[#F3F4F6]/60 dark:hover:bg-[#1A1D23]/60 transition-colors"
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-xl bg-gradient-to-br border flex items-center justify-center font-mono font-bold text-xs shrink-0 shadow-sm ${getAvatarColor(
                              emp.name
                            )}`}
                          >
                            {getInitials(emp.name)}
                          </div>
                          <Link
                            to={`/app/employees/${emp.id}`}
                            className="font-medium text-[#111827] dark:text-[#F2F0EC] hover:text-[#B93A2B] dark:hover:text-[#FF8278] transition-colors block text-sm"
                          >
                            {emp.name}
                          </Link>
                        </div>
                      </td>
                      <td className="py-4 px-4 font-mono text-xs text-[#5B6472] dark:text-[#858A94]">
                        {emp.phone ? (
                          <a
                            href={`tel:${emp.phone}`}
                            className="inline-flex items-center gap-1 hover:text-[#047857] dark:hover:text-[#34D399] transition-colors"
                          >
                            <Phone className="w-3 h-3 text-[#047857] dark:text-[#34D399]" />
                            <span>{emp.phone}</span>
                          </a>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="py-4 px-4 text-xs font-mono tabular-nums">
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded-md bg-[#F3F4F6] dark:bg-[#1B1E24] border border-[#E5E7EB] dark:border-[#292B2F] text-[#111827] dark:text-[#F2F0EC] font-semibold">
                            Full ₹{rate.full}
                          </span>
                          <span className="text-[#5B6472] dark:text-[#60646C]">/</span>
                          <span className="px-2 py-0.5 rounded-md bg-[#F3F4F6] dark:bg-[#1B1E24] border border-[#E5E7EB] dark:border-[#292B2F] text-[#5B6472] dark:text-[#858A94]">
                            Half ₹{rate.half}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-xs font-mono text-[#5B6472] dark:text-[#858A94]">
                        {formatDisplayDate(emp.joinedOn)}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            to={`/app/employees/${emp.id}`}
                            className="p-2 text-[#5B6472] dark:text-[#858A94] hover:text-[#111827] dark:hover:text-[#F2F0EC] hover:bg-[#F3F4F6] dark:hover:bg-[#1C1F26] rounded-lg transition-colors cursor-pointer"
                            title="View Month Attendance"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <Link
                            to={`/app/employees/${emp.id}/edit`}
                            className="p-2 text-[#5B6472] dark:text-[#858A94] hover:text-[#111827] dark:hover:text-[#F2F0EC] hover:bg-[#F3F4F6] dark:hover:bg-[#1C1F26] rounded-lg transition-colors cursor-pointer"
                            title="Edit Employee"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Link>
                          {emp.active ? (
                            <button
                              type="button"
                              onClick={() => setEmployeeToArchive(emp)}
                              className="p-2 text-[#5B6472] dark:text-[#858A94] hover:text-[#B45309] dark:hover:text-[#FBBF24] hover:bg-[#FFFBEB] dark:hover:bg-[#2A200F] rounded-lg transition-colors cursor-pointer"
                              title="Archive Employee"
                            >
                              <Archive className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setEmployeeToUnarchive(emp)}
                              className="p-2 text-[#5B6472] dark:text-[#858A94] hover:text-[#047857] dark:hover:text-[#34D399] hover:bg-[#ECFDF5] dark:hover:bg-[#102A1E] rounded-lg transition-colors cursor-pointer"
                              title="Unarchive Employee"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards View (< 768px) */}
          <div className="md:hidden space-y-3.5">
            {filteredEmployees.map((emp) => {
              const rate = getRateForMonth(emp.rates, currentMonth);
              return (
                <div
                  key={emp.id}
                  className="p-4 bg-white dark:bg-[#14161B] rounded-2xl border border-[#E5E7EB] dark:border-[#23262D] shadow-sm space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-11 h-11 rounded-xl bg-gradient-to-br border flex items-center justify-center font-mono font-bold text-sm shrink-0 shadow-sm ${getAvatarColor(
                          emp.name
                        )}`}
                      >
                        {getInitials(emp.name)}
                      </div>
                      <div>
                        <Link
                          to={`/app/employees/${emp.id}`}
                          className="font-semibold text-base text-[#111827] dark:text-[#F2F0EC] hover:text-[#B93A2B] dark:hover:text-[#FF8278] block leading-tight"
                        >
                          {emp.name}
                        </Link>
                        {emp.phone ? (
                          <a
                            href={`tel:${emp.phone}`}
                            className="inline-flex items-center gap-1 text-xs font-mono text-[#5B6472] dark:text-[#858A94] hover:text-[#047857] dark:hover:text-[#34D399] transition-colors mt-1"
                          >
                            <Phone className="w-3 h-3 text-[#047857] dark:text-[#34D399]" />
                            <span>{emp.phone}</span>
                          </a>
                        ) : (
                          <span className="text-[11px] font-mono text-[#5B6472] dark:text-[#60646C]">No phone</span>
                        )}
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full ${
                        emp.active
                          ? 'bg-[#ECFDF5]/60 dark:bg-[#064E3B]/60 text-[#047857] dark:text-[#6EE7B7] border border-[#10B981]/40'
                          : 'bg-[#F3F4F6] dark:bg-[#1B1E24] text-[#5B6472] dark:text-[#858A94] border border-[#E5E7EB] dark:border-[#292B2F]'
                      }`}
                    >
                      {emp.active ? 'Active' : 'Archived'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs font-mono text-[#5B6472] dark:text-[#858A94] pt-2.5 border-t border-[#E5E7EB] dark:border-[#23262D]">
                    <div className="tabular-nums">
                      Wage: <span className="text-[#111827] dark:text-[#F2F0EC] font-semibold">₹{rate.full}</span> · Half <span>₹{rate.half}</span>
                    </div>
                    <div className="text-[11px] text-[#5B6472] dark:text-[#60646C]">
                      Joined: {formatDisplayDate(emp.joinedOn)}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#E5E7EB] dark:border-[#23262D]">
                    <Link
                      to={`/app/employees/${emp.id}`}
                      className="flex items-center justify-center gap-1.5 py-2.5 px-3 text-xs font-medium rounded-xl bg-[#F3F4F6] dark:bg-[#1C1F26] text-[#111827] dark:text-[#F2F0EC] hover:bg-[#E5E7EB] dark:hover:bg-[#252932] border border-[#E5E7EB] dark:border-[#2B2F38] cursor-pointer min-h-[42px] transition-colors active:scale-[0.98]"
                    >
                      <Eye className="w-3.5 h-3.5 text-[#B93A2B] dark:text-[#FF8278]" />
                      <span>{strings.common.view} Attendance</span>
                    </Link>

                    <Link
                      to={`/app/employees/${emp.id}/edit`}
                      className="flex items-center justify-center gap-1.5 py-2.5 px-3 text-xs font-medium rounded-xl bg-[#F3F4F6] dark:bg-[#1C1F26] text-[#5B6472] dark:text-[#858A94] hover:text-[#111827] dark:hover:text-[#F2F0EC] hover:bg-[#E5E7EB] dark:hover:bg-[#252932] border border-[#E5E7EB] dark:border-[#2B2F38] cursor-pointer min-h-[42px] transition-colors active:scale-[0.98]"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>{strings.common.edit} Details</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {employeeToArchive && (
        <ConfirmDialog
          isOpen={true}
          title={strings.employees.archiveConfirmTitle}
          description={`Archive ${employeeToArchive.name}? They will be hidden from daily attendance.`}
          confirmLabel={strings.common.archive}
          variant="warning"
          onConfirm={handleArchive}
          onCancel={() => setEmployeeToArchive(null)}
        />
      )}

      {employeeToUnarchive && (
        <ConfirmDialog
          isOpen={true}
          title={strings.employees.unarchiveConfirmTitle}
          description={`Restore ${employeeToUnarchive.name} to active status?`}
          confirmLabel={strings.common.unarchive}
          variant="primary"
          onConfirm={handleUnarchive}
          onCancel={() => setEmployeeToUnarchive(null)}
        />
      )}
    </div>
  );
}
