import client from './client';

export interface User {
  _id: string;
  username: string;
  role: 'citizen' | 'police' | 'admin';
  full_name?: string;
  email?: string;
  phone?: string;
  station_id?: string;
  police_id?: string;
  aadhar?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export const authService = {
  login: async (credentials: any) => {
    const response = await client.post('/auth/login', credentials);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data));
    }
    return response.data;
  },

  register: async (userData: any) => {
    const response = await client.post('/auth/register', userData);
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await client.get('/auth/me');
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/'; 
  },
  
  getStations: async () => {
      const response = await client.get('/auth/stations');
      return response.data;
  }
};
