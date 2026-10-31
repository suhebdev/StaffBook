import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmployeeForm } from '@/features/employees/EmployeeForm';
import { useEmployees } from '@/features/employees/useEmployees';
import { strings } from '@/strings/en';

export function EmployeeNew() {
  const { saveEmployee } = useEmployees();

  return (
    <div>
      <div className="mb-4">
        <Link
          to="/app/employees"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-[#4B5563] dark:text-[#92969D] hover:text-[#B93A2B] dark:hover:text-[#FF8278] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Employees</span>
        </Link>
      </div>

      <PageHeader
        title={strings.employees.newEmployee}
        subtitle="Add a new staff member, configure daily rates and payday reminders"
      />

      <EmployeeForm onSave={saveEmployee} />
    </div>
  );
}
