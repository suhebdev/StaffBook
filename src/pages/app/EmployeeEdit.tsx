import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmployeeForm } from '@/features/employees/EmployeeForm';
import { useEmployees } from '@/features/employees/useEmployees';
import { Loading } from '@/components/shared/Loading';
import { ErrorState } from '@/components/shared/ErrorState';
import { strings } from '@/strings/en';

export function EmployeeEdit() {
  const { id } = useParams<{ id: string }>();
  const { employees, loading, error, saveEmployee, deleteEmployee } = useEmployees();
  const navigate = useNavigate();

  if (loading) {
    return <Loading message="Loading employee details..." />;
  }

  if (error) {
    return (
      <ErrorState
        message={error.message}
        errorCode={error.firestoreCode || error.code}
        errorPath={error.path}
        operation={error.operation}
        onRetry={() => navigate(0)}
      />
    );
  }

  const employee = employees.find((e) => e.id === id);

  if (!employee) {
    return (
      <ErrorState
        message="Employee not found"
        onRetry={() => navigate('/app/employees')}
      />
    );
  }

  return (
    <div>
      <div className="mb-4">
        <Link
          to={`/app/employees/${employee.id}`}
          className="inline-flex items-center gap-1.5 text-xs font-mono text-[#4B5563] dark:text-[#92969D] hover:text-[#B93A2B] dark:hover:text-[#FF8278] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to {employee.name}</span>
        </Link>
      </div>

      <PageHeader
        title={strings.employees.editEmployee}
        subtitle={`Editing profile and salary settings for ${employee.name}`}
      />

      <EmployeeForm
        initialEmployee={employee}
        onSave={saveEmployee}
        onDelete={deleteEmployee}
      />
    </div>
  );
}
