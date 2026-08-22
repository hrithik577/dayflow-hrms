import { apiClient, localDB } from './apiClient';

export const auditApi = {
  getLogs: async (params = {}) => {
    try {
      const res = await apiClient.get('/audit', { params });
      return res.data;
    } catch {
      const db = localDB.get();
      let list = [...db.auditLogs];

      if (params.role && params.role !== 'ALL') {
        list = list.filter((l) => l.role === params.role);
      }
      if (params.action && params.action !== 'ALL') {
        list = list.filter((l) => l.action.includes(params.action));
      }
      if (params.search) {
        const query = params.search.toLowerCase();
        list = list.filter(
          (l) =>
            l.user.toLowerCase().includes(query) ||
            l.entity.toLowerCase().includes(query) ||
            l.action.toLowerCase().includes(query) ||
            l.ipAddress.toLowerCase().includes(query)
        );
      }
      return list;
    }
  },

  logEvent: async (eventData) => {
    try {
      const res = await apiClient.post('/audit', eventData);
      return res.data;
    } catch {
      const db = localDB.get();
      const newLog = {
        id: `AUD-${Math.floor(1000 + Math.random() * 9000)}`,
        user: eventData.user || 'System',
        role: eventData.role || 'ADMIN',
        action: eventData.action,
        entity: eventData.entity,
        ipAddress: eventData.ipAddress || '192.168.10.45',
        status: eventData.status || 'SUCCESS',
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      };
      db.auditLogs.unshift(newLog);
      localDB.save(db);
      return newLog;
    }
  },
};
