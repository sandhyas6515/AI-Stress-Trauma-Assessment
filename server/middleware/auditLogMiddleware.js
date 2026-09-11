/**
 * Automatic Complaint Audit Log Middleware
 *
 * Automatically records an immutable audit log entry in Firestore subcollection:
 *   complaints/{ticketId}/auditLog/{logId}
 * on every write operation targeting a complaint document.
 *
 * Captures:
 *   - Status changes
 *   - Officer assignments
 *   - Officer investigative notes / directives
 *   - Emergency escalations / rapid dispatches
 *   - Initial complaint docket creation
 *
 * Each entry conforms to:
 *   { officerId, officerName, action, previousValue, newValue, timestamp }
 */

import { complaintsStore } from '../data/complaintsStore.js';

export function auditLogMiddleware(req, res, next) {
  // Only intercept write operations (PATCH, POST, PUT)
  const isWriteMethod = ['PATCH', 'POST', 'PUT'].includes(req.method.toUpperCase());
  if (!isWriteMethod) {
    return next();
  }

  const ticketId = req.params.id || req.params.ticketId;
  let beforeDoc = null;

  if (ticketId) {
    const existing = complaintsStore.getById(ticketId);
    if (existing) {
      // Deep clone snapshot before mutation
      beforeDoc = JSON.parse(JSON.stringify(existing));
    }
  }

  // Intercept res.json to capture updated data after successful write
  const originalJson = res.json.bind(res);

  res.json = function (body) {
    // Call original res.json first to complete the response
    const result = originalJson(body);

    // Process audit logging asynchronously after successful response (2xx)
    if (res.statusCode >= 200 && res.statusCode < 300 && body && body.success) {
      try {
        const afterDoc = body.data || (ticketId ? complaintsStore.getById(ticketId) : null);
        const resolvedTicketId = (ticketId || afterDoc?.ticketId || '').toUpperCase();

        if (resolvedTicketId && afterDoc) {
          processAutomaticAuditLogging({
            ticketId: resolvedTicketId,
            beforeDoc,
            afterDoc,
            reqBody: req.body || {},
            official: req.official || {
              id: req.body?.officerId || 'duty-nodal-officer',
              name: req.body?.officerName || 'Duty Nodal Officer',
              role: 'official'
            },
            method: req.method.toUpperCase()
          }).catch(err => {
            console.error(`[Audit Log Middleware] Failed to record audit log for ${resolvedTicketId}:`, err);
          });
        }
      } catch (err) {
        console.error('[Audit Log Middleware Error]:', err);
      }
    }

    return result;
  };

  next();
}

/**
 * Compare beforeDoc and afterDoc, evaluate request payload, and write
 * corresponding audit entries to complaints/{ticketId}/auditLog/
 */
async function processAutomaticAuditLogging({ ticketId, beforeDoc, afterDoc, reqBody, official, method }) {
  const officerId = official?.id || 'system-triage';
  const officerName = official?.name || 'Duty Nodal Officer';
  const now = new Date().toISOString();

  // 1. Initial Complaint Creation
  if (!beforeDoc && method === 'POST') {
    await complaintsStore.addAuditLog(ticketId, {
      officerId,
      officerName,
      action: 'COMPLAINT_CREATED',
      previousValue: null,
      newValue: `Complaint docket registered. Initial Status: ${afterDoc.status}`,
      timestamp: now
    });
    return;
  }

  if (!beforeDoc) return;

  // 2. Status Transition Check
  const statusChanged = reqBody.status && reqBody.status !== beforeDoc.status;
  if (statusChanged) {
    await complaintsStore.addAuditLog(ticketId, {
      officerId,
      officerName,
      action: 'STATUS_CHANGE',
      previousValue: beforeDoc.status,
      newValue: reqBody.status,
      timestamp: now
    });
  }

  // 3. Officer Assignment Check
  const newOfficer = reqBody.assignedOfficer || reqBody.assignedOfficerName;
  const assignmentChanged = newOfficer && newOfficer !== beforeDoc.assignedOfficer;
  if (assignmentChanged) {
    await complaintsStore.addAuditLog(ticketId, {
      officerId,
      officerName,
      action: 'ASSIGNMENT',
      previousValue: beforeDoc.assignedOfficer || 'Auto-Queued for Nodal Allocation',
      newValue: newOfficer,
      timestamp: now
    });
  }

  // 4. Escalation / Emergency Dispatch Check
  const isEmergencyNote = reqBody.note && /EMERGENCY DISPATCH|PCR PATROL|CRITICAL RED ALERT|URGENT DISPATCH/i.test(reqBody.note);
  const isEscalationFlag = reqBody.escalate === true || reqBody.isEscalated === true || reqBody.isEmergencyDispatch === true;
  const isStatusEscalated = (beforeDoc.status !== 'Action Assigned' && reqBody.status === 'Action Assigned' && afterDoc.riskAssessment?.riskLevel === 'Critical');

  if (isEscalationFlag || isEmergencyNote || isStatusEscalated) {
    await complaintsStore.addAuditLog(ticketId, {
      officerId,
      officerName,
      action: 'ESCALATION',
      previousValue: beforeDoc.status,
      newValue: reqBody.note || reqBody.escalationReason || 'Emergency Rapid PCR & Medical Dispatch Triggered',
      timestamp: now
    });
  }

  // 5. Officer Directive / Note Added Check
  const noteAdded = reqBody.note || reqBody.officerNote;
  // If it wasn't already logged as pure escalation or if it contains a distinct directive
  if (noteAdded && (!isEmergencyNote || !statusChanged)) {
    await complaintsStore.addAuditLog(ticketId, {
      officerId,
      officerName,
      action: 'NOTE_ADDED',
      previousValue: null,
      newValue: noteAdded,
      timestamp: now
    });
  }
}
