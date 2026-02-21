import client from './client';

export const firService = {
  createFIR: async (firData: any) => {
    const response = await client.post('/fir/', firData);
    return response.data;
  },

  getUserFIRs: async () => {
    const response = await client.get('/fir/');
    return response.data;
  },

  getFIRDetails: async (firId: string) => {
    const response = await client.get(`/fir/${firId}`);
    return response.data;
  },
  
  // Police Only
  getPendingFIRs: async () => {
      const response = await client.get('/fir/pending');
      return response.data;
  },
  
  updateFIRStatus: async (firId: string, updateData: any) => {
      const response = await client.put(`/fir/${firId}/update`, updateData);
      return response.data;
  },
  
  getArchivedFIRs: async () => {
      const response = await client.get('/fir/archives');
      return response.data;
  },

  getNotifications: async () => {
    const response = await client.get('/fir/notifications');
    return response.data;
  },

  markNotificationRead: async (id: string) => {
    const response = await client.put(`/fir/notifications/${id}/read`);
    return response.data;
  },

  getCommunityAlerts: async () => {
    const response = await client.get('/fir/community-alerts');
    return response.data;
  },

  dismissCommunityAlert: async (id: string) => {
    const response = await client.put(`/fir/community-alerts/${id}/dismiss`);
    return response.data;
  }
};
