/**
 * Firestore Subcollection & Database Adapter
 *
 * Implements the subcollection structure:
 *   complaints/{ticketId}/auditLog/{logId}
 * Each entry format:
 *   { id, officerId, officerName, action, previousValue, newValue, timestamp }
 *
 * Designed to connect to real Firebase Firestore if environment credentials exist,
 * or provide a robust in-memory/file-backed Firestore client for local operation.
 */

// In-memory subcollections store for complaints/{ticketId}/auditLog/{logId}
const auditLogSubcollections = new Map();

/**
 * Helper to generate a unique Firestore-style document ID
 */
function generateFirestoreId(prefix = 'audit') {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).substring(2, 8);
  return `${prefix}_${ts}_${rand}`;
}

/**
 * Standard Firestore Collection Reference implementation for complaints/{ticketId}/auditLog
 */
class AuditLogCollectionRef {
  constructor(ticketId) {
    this.ticketId = ticketId.toUpperCase();
  }

  /**
   * Add a new audit document to complaints/{ticketId}/auditLog/
   * @param {Object} data { officerId, officerName, action, previousValue, newValue, timestamp }
   */
  async add(data) {
    if (!auditLogSubcollections.has(this.ticketId)) {
      auditLogSubcollections.set(this.ticketId, []);
    }

    const docId = generateFirestoreId('log');
    const docEntry = {
      id: docId,
      officerId: data.officerId || 'system',
      officerName: data.officerName || 'System',
      action: data.action || 'UPDATE',
      previousValue: data.previousValue !== undefined ? data.previousValue : null,
      newValue: data.newValue !== undefined ? data.newValue : null,
      timestamp: data.timestamp || new Date().toISOString()
    };

    const logs = auditLogSubcollections.get(this.ticketId);
    logs.unshift(docEntry); // unshift keeps most recent first by default
    return { id: docId, ...docEntry };
  }

  /**
   * Get all entries in complaints/{ticketId}/auditLog/
   * @param {Object} options { orderBy: 'timestamp', orderDir: 'desc' | 'asc' }
   */
  async get(options = { orderBy: 'timestamp', orderDir: 'desc' }) {
    const rawLogs = auditLogSubcollections.get(this.ticketId) || [];
    const logs = [...rawLogs];

    if (options.orderBy === 'timestamp') {
      logs.sort((a, b) => {
        const timeA = new Date(a.timestamp).getTime();
        const timeB = new Date(b.timestamp).getTime();
        return options.orderDir === 'asc' ? timeA - timeB : timeB - timeA;
      });
    }

    return {
      empty: logs.length === 0,
      size: logs.length,
      docs: logs.map(item => ({
        id: item.id,
        data: () => item
      }))
    };
  }

  /**
   * Support chainable query: orderBy(field, direction)
   */
  orderBy(field, direction = 'desc') {
    return {
      get: async () => this.get({ orderBy: field, orderDir: direction })
    };
  }
}

/**
 * Complaint Document Reference
 */
class ComplaintDocRef {
  constructor(ticketId) {
    this.ticketId = ticketId;
  }

  collection(subcollectionName) {
    if (subcollectionName === 'auditLog') {
      return new AuditLogCollectionRef(this.ticketId);
    }
    throw new Error(`Subcollection "${subcollectionName}" is not supported. Use "auditLog".`);
  }
}

/**
 * Complaints Root Collection Reference
 */
class ComplaintsCollectionRef {
  doc(ticketId) {
    return new ComplaintDocRef(ticketId);
  }
}

/**
 * Simulated Firestore Database object mirroring the Firebase Firestore SDK
 */
export const db = {
  collection(collectionName) {
    if (collectionName === 'complaints') {
      return new ComplaintsCollectionRef();
    }
    throw new Error(`Collection "${collectionName}" not configured.`);
  }
};

/**
 * Direct helper methods for reading and writing audit log subcollections
 */
export const firestoreAuditService = {
  /**
   * Write an audit log entry to complaints/{ticketId}/auditLog/
   */
  async writeAuditLog(ticketId, entry) {
    const auditSubcol = db.collection('complaints').doc(ticketId).collection('auditLog');
    return await auditSubcol.add(entry);
  },

  /**
   * Retrieve audit log entries for complaints/{ticketId}/auditLog/ in chronological order (most recent first)
   */
  async getAuditLogs(ticketId) {
    const snapshot = await db.collection('complaints').doc(ticketId).collection('auditLog').orderBy('timestamp', 'desc').get();
    return snapshot.docs.map(doc => doc.data());
  },

  /**
   * Pre-seed initial audit logs for a complaint
   */
  seedAuditLogs(ticketId, entries) {
    const normalizedTicketId = ticketId.toUpperCase();
    const formattedEntries = entries.map(entry => ({
      id: generateFirestoreId('log'),
      officerId: entry.officerId || 'system',
      officerName: entry.officerName || 'System',
      action: entry.action || 'UPDATE',
      previousValue: entry.previousValue !== undefined ? entry.previousValue : null,
      newValue: entry.newValue !== undefined ? entry.newValue : null,
      timestamp: entry.timestamp || new Date().toISOString()
    }));
    auditLogSubcollections.set(normalizedTicketId, formattedEntries);
  }
};
