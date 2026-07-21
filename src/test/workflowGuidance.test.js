import { describe, expect, it } from 'vitest'
import { getRoleActionStatuses, getWorkflowGuidance, getWorkflowPhase } from '../utils/workflowGuidance'

describe('workflow guidance', () => {
  it('directs managers to purchase-order generation', () => {
    expect(getWorkflowGuidance('ASSIGNED_TO_MANAGER', 'manager')).toMatchObject({ tab: 'Overview', isMyTurn: true, title: 'Generate the purchase order' })
  })

  it('treats staff and HOD users as requesters', () => {
    expect(getWorkflowGuidance('CLARIFICATION_REQUIRED', 'staff').isMyTurn).toBe(true)
    expect(getWorkflowGuidance('TECHNICIAN_COMPLETED', 'hod').isMyTurn).toBe(true)
  })

  it('sends completed requests to history without an owner', () => {
    expect(getWorkflowGuidance('CLOSED', 'admin')).toMatchObject({ tab: 'History', isMyTurn: false, ownerLabel: null })
  })

  it('groups operational statuses into a stable college process', () => {
    expect(getWorkflowPhase('QUOTATION_SUBMITTED')?.key).toBe('scope')
    expect(getWorkflowPhase('PAYMENT_PENDING')?.key).toBe('settlement')
  })

  it('builds role-specific action queues', () => {
    expect(getRoleActionStatuses('super_admin')).toContain('QUOTATION_SUBMITTED')
    expect(getRoleActionStatuses('technician')).toContain('IN_PROGRESS')
  })
})
