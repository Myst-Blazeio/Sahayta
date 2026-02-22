import client from './client';

export const policeService = {
  getOfficerStats: async () => {
    const response = await client.get('/api/police/stats');
    return response.data;
  },
  
  dashboardAnalytics: async () => {
      // In the future this should be a dedicated endpoint returning JSON
      // integrating with the existing logic in police_routes.py if refactored
      const response = await client.get('/api/police/analytics'); 
      return response.data;
  },

  getDashboardData: async () => {
    const response = await client.get('/api/police/dashboard');
    return response.data;
  },

  getInbox: async () => {
    const response = await client.get('/api/police/inbox');
    return response.data;
  },

  getArchives: async () => {
    const response = await client.get('/api/police/archives');
    return response.data;
  },

  getAnalytics: async () => {
    const response = await client.get('/api/police/analytics');
    return response.data;
  },

  getProfile: async () => {
    const response = await client.get('/api/police/profile');
    return response.data;
  },

  updateProfile: async (data: any) => {
    const response = await client.post('/api/police/profile', data);
    return response.data;
  },

  getAlerts: async () => {
    const response = await client.get('/api/police/alerts');
    return response.data;
  },

  createAlert: async (data: any) => {
    const response = await client.post('/api/police/alerts', data);
    return response.data;
  },

  deleteAlert: async (id: string) => {
    const response = await client.delete(`/api/police/alerts/${id}`);
    return response.data;
  }
};
