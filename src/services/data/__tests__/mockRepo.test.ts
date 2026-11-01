import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mockRepo, clearDemoData } from '../mockRepo';
import type { Employee, Payment } from '@/domain/types';

describe('M3 Services: mockRepo Contract Tests', () => {
  const uid = 'test-contract-user';

  beforeEach(() => {
    clearDemoData(uid);
  });

  it('saveEmployee creates a new employee and fires subscription', async () => {
    const received: Employee[][] = [];
    const unsub = mockRepo.subscribeEmployees(
      uid,
      (employees) => received.push(employees),
      () => {}
    );

    // Initial load
    await new Promise((r) => setTimeout(r, 200));
    expect(received.length).toBeGreaterThanOrEqual(1);
    expect(received[received.length - 1]).toHaveLength(0);

    // Create employee
    const newId = await mockRepo.saveEmployee(uid, {
      name: 'Ashok Sharma',
      phone: '9999988888',
      joinedOn: '2026-01-01',
      active: true,
      rates: [{ effectiveFrom: '2026-01', full: 600, half: 300 }],
      reminder: { enabled: true, dayOfMonth: 5, hour: 10, minute: 0, forMonth: 'previous' },
    });

    expect(newId).toBeDefined();

    // After write, listener should have received updated array
    const latest = received[received.length - 1];
    expect(latest).toHaveLength(1);
    expect(latest[0].name).toBe('Ashok Sharma');

    // Update existing employee
    await mockRepo.saveEmployee(uid, {
      id: newId,
      name: 'Ashok Kumar Sharma',
      phone: '9999988888',
      joinedOn: '2026-01-01',
      active: true,
      rates: [{ effectiveFrom: '2026-01', full: 650, half: 325 }],
      reminder: { enabled: true, dayOfMonth: 5, hour: 10, minute: 0, forMonth: 'previous' },
    });

    const updatedLatest = received[received.length - 1];
    expect(updatedLatest).toHaveLength(1);
    expect(updatedLatest[0].name).toBe('Ashok Kumar Sharma');
    expect(updatedLatest[0].rates[0].full).toBe(650);

    unsub();
  });

  it('setDayStatus sets and clears attendance status and updates subscription', async () => {
    const receivedDocs: any[] = [];
    const unsub = mockRepo.subscribeAttendance(
      uid,
      '2026-03',
      (docs) => receivedDocs.push(docs),
      () => {}
    );

    await new Promise((r) => setTimeout(r, 200));

    // Set day 15 to 'F'
    await mockRepo.setDayStatus(uid, 'emp-101', '2026-03', 15, 'F');
    let latest = receivedDocs[receivedDocs.length - 1];
    let doc = latest.find((d: any) => d.employeeId === 'emp-101');
    expect(doc).toBeDefined();
    expect(doc.days['15']).toBe('F');

    // Change day 15 to 'H'
    await mockRepo.setDayStatus(uid, 'emp-101', '2026-03', 15, 'H');
    latest = receivedDocs[receivedDocs.length - 1];
    doc = latest.find((d: any) => d.employeeId === 'emp-101');
    expect(doc.days['15']).toBe('H');

    // Clear day 15
    await mockRepo.setDayStatus(uid, 'emp-101', '2026-03', 15, null);
    latest = receivedDocs[receivedDocs.length - 1];
    doc = latest.find((d: any) => d.employeeId === 'emp-101');
    expect(doc.days['15']).toBeUndefined();

    unsub();
  });

  it('markPaid saves payment and undoPaid removes payment doc', async () => {
    const receivedPayments: Payment[][] = [];
    const unsub = mockRepo.subscribePayments(
      uid,
      '2026-03',
      (p) => receivedPayments.push(p),
      () => {}
    );

    await new Promise((r) => setTimeout(r, 200));

    const payment: Payment = {
      employeeId: 'emp-202',
      month: '2026-03',
      amount: 14500,
      paidOn: '2026-04-03',
      note: 'Paid via Google Pay',
    };

    // Mark paid
    await mockRepo.markPaid(uid, payment);
    let latest = receivedPayments[receivedPayments.length - 1];
    expect(latest).toHaveLength(1);
    expect(latest[0].amount).toBe(14500);
    expect(latest[0].paidOn).toBe('2026-04-03');

    // Undo paid
    await mockRepo.undoPaid(uid, 'emp-202', '2026-03');
    latest = receivedPayments[receivedPayments.length - 1];
    expect(latest).toHaveLength(0);

    unsub();
  });

  it('deleteEmployee permanently removes employee, attendance, and payment records', async () => {
    // 1. Create employee
    const empId = await mockRepo.saveEmployee(uid, {
      name: 'Rohan Verma',
      phone: '9876500000',
      joinedOn: '2026-02-01',
      active: true,
      rates: [{ effectiveFrom: '2026-02', full: 500, half: 250 }],
      reminder: { enabled: true, dayOfMonth: 5, hour: 10, minute: 0, forMonth: 'previous' },
    });

    // 2. Add attendance and payment
    await mockRepo.setDayStatus(uid, empId, '2026-02', 10, 'F');
    await mockRepo.markPaid(uid, {
      employeeId: empId,
      month: '2026-02',
      amount: 500,
      paidOn: '2026-03-01',
    });

    // 3. Delete employee
    await mockRepo.deleteEmployee(uid, empId);

    // 4. Verify employee is gone
    const employeesPromise = new Promise<Employee[]>((resolve) => {
      const unsub = mockRepo.subscribeEmployees(uid, (list) => {
        unsub();
        resolve(list);
      }, () => {});
    });
    const employees = await employeesPromise;
    expect(employees.find((e) => e.id === empId)).toBeUndefined();

    // 5. Verify attendance is cleaned up
    const attPromise = new Promise<any[]>((resolve) => {
      const unsub = mockRepo.subscribeAttendance(uid, '2026-02', (docs) => {
        unsub();
        resolve(docs);
      }, () => {});
    });
    const attDocs = await attPromise;
    expect(attDocs.find((d) => d.employeeId === empId)).toBeUndefined();

    // 6. Verify payment is cleaned up
    const payPromise = new Promise<Payment[]>((resolve) => {
      const unsub = mockRepo.subscribePayments(uid, '2026-02', (docs) => {
        unsub();
        resolve(docs);
      }, () => {});
    });
    const payDocs = await payPromise;
    expect(payDocs.find((p) => p.employeeId === empId)).toBeUndefined();
  });
});
