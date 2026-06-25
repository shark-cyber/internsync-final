// API base URL
import { auth, getIdToken } from './firebase';
import { Platform } from 'react-native';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000';

class ApiError extends Error {
  status: number;
  data: any;
  code?: string;

  constructor(status: number, message: string, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
    this.code = data?.code;
  }
}

// Helper function to get auth token
const getAuthToken = async (): Promise<string | null> => {
  const user = auth.currentUser;
  console.log('Current Firebase user:', user); // Add this for debugging
  if (!user) return null;
  try {
    const token = await getIdToken(user);
    console.log('Got ID token:', token.substring(0, 50) + '...'); // Log first 50 chars of token
    return token;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

// Helper to build URLs without double slashes
const buildUrl = (base: string, endpoint: string) => {
  const normalizedBase = base.endsWith('/') ? base.slice(0, -1) : base;
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${normalizedBase}/${normalizedEndpoint}`;
};

const parseResponse = async <T>(response: Response): Promise<T> => {
  const rawText = await response.text();
  const result = rawText
    ? (() => {
        try {
          return JSON.parse(rawText);
        } catch {
          return { message: rawText };
        }
      })()
    : {};

  if (!response.ok) {
    throw new ApiError(
      response.status,
      result?.message || 'Something went wrong',
      result,
    );
  }

  return result as T;
};

// Helper function to make API calls
export const api = {
  async post<T = any>(endpoint: string, data?: any, headers?: Record<string, string>) {
    const url = buildUrl(API_BASE_URL, endpoint);
    const token = await getAuthToken();
    
    const options: RequestInit = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...headers,
      },
      body: data ? JSON.stringify(data) : undefined,
    };
    
    console.log('Making POST request to:', url);
    const response = await fetch(url, options);
    return parseResponse<T>(response);
  },
  
  async get<T = any>(endpoint: string, headers?: Record<string, string>) {
    const url = buildUrl(API_BASE_URL, endpoint);
    const token = await getAuthToken();
    
    const options: RequestInit = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...headers,
      },
    };
    
    console.log('Making GET request to:', url);
    const response = await fetch(url, options);
    return parseResponse<T>(response);
  },
  
  async put<T = any>(endpoint: string, data?: any, headers?: Record<string, string>) {
    const url = buildUrl(API_BASE_URL, endpoint);
    const token = await getAuthToken();
    
    const options: RequestInit = {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...headers,
      },
      body: data ? JSON.stringify(data) : undefined,
    };
    
    console.log('Making PUT request to:', url);
    const response = await fetch(url, options);
    return parseResponse<T>(response);
  },
  
  async delete<T = any>(endpoint: string, headers?: Record<string, string>) {
    const url = buildUrl(API_BASE_URL, endpoint);
    const token = await getAuthToken();
    
    const options: RequestInit = {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...headers,
      },
    };
    
    console.log('Making DELETE request to:', url);
    const response = await fetch(url, options);
    return parseResponse<T>(response);
  },

  async patch<T = any>(endpoint: string, data?: any, headers?: Record<string, string>) {
    const url = buildUrl(API_BASE_URL, endpoint);
    const token = await getAuthToken();
    
    const options: RequestInit = {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...headers,
      },
      body: data ? JSON.stringify(data) : undefined,
    };
    
    console.log('Making PATCH request to:', url);
    const response = await fetch(url, options);
    return parseResponse<T>(response);
  },
  
  // Jobs API
  jobs: {
    async getAll(params?: { pageNo?: number; offset?: number; type?: string; applyInterests?: boolean }) {
      const queryString = new URLSearchParams();
      if (params?.pageNo) queryString.set('pageNo', params.pageNo.toString());
      if (params?.offset) queryString.set('offset', params.offset.toString());
      if (params?.type) queryString.set('type', params.type);
      if (params?.applyInterests) queryString.set('applyInterests', 'true');
      const query = queryString.toString();
      return api.get(`/v1/job${query ? `?${query}` : ''}`);
    },
    
    async getById(id: string) {
      return api.get(`/v1/job/${id}`);
    },
    
    async getInternships(params?: { pageNo?: number; offset?: number }) {
      const queryString = new URLSearchParams();
      if (params?.pageNo) queryString.set('pageNo', params.pageNo.toString());
      if (params?.offset) queryString.set('offset', params.offset.toString());
      const query = queryString.toString();
      return api.get(`/v1/job/internships${query ? `?${query}` : ''}`);
    },
    
    async markAsSeen(jobIds: string[]) {
      return api.post('/v1/job/seen', { jobIds });
    }
  },
  
  // Swipe API
  swipe: {
    async getNext(type?: string, jobTypes?: string[], workModes?: string[], experienceLevels?: string[]) {
      const queryParams = new URLSearchParams();
      if (type) queryParams.set('type', type);
      if (jobTypes && jobTypes.length > 0) queryParams.set('jobTypes', jobTypes.join(','));
      if (workModes && workModes.length > 0) queryParams.set('workModes', workModes.join(','));
      if (experienceLevels && experienceLevels.length > 0) queryParams.set('experienceLevels', experienceLevels.join(','));
      const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
      return api.get(`/v1/swipe/next${query}`);
    },
    
    async action(jobId: string, action: 'like' | 'dislike' | 'superlike' | 'skip') {
      return api.post('/v1/swipe/action', { jobId, action });
    },
    
    async getHistory(params?: { action?: string; page?: number; limit?: number }) {
      const queryString = new URLSearchParams();
      if (params?.action) queryString.set('action', params.action);
      if (params?.page) queryString.set('page', params.page.toString());
      if (params?.limit) queryString.set('limit', params.limit.toString());
      const query = queryString.toString();
      return api.get(`/v1/swipe/history${query ? `?${query}` : ''}`);
    },
    
    async getLiked(params?: { page?: number; limit?: number }) {
      const queryString = new URLSearchParams();
      if (params?.page) queryString.set('page', params.page.toString());
      if (params?.limit) queryString.set('limit', params.limit.toString());
      const query = queryString.toString();
      return api.get(`/v1/swipe/liked${query ? `?${query}` : ''}`);
    },
    
    async getStats() {
      return api.get('/v1/swipe/stats');
    }
  },
  
  // Interests API
  interests: {
    async getAll() {
      return api.get('/v1/interests');
    },
    
    async getCategories() {
      return api.get('/v1/interests/categories');
    },
    
    async getScoped() {
      return api.get('/v1/interests/scoped');
    }
  },
  
  // User API
  user: {
    async sync() {
      return api.post('/v1/user/sync');
    },
    
    async getProfile() {
      return api.get('/v1/user/profile');
    },
    
    async updateProfile(data: any) {
      return api.put('/v1/user/profile', data);
    },
    
    async updateAboutMe(aboutMe: string) {
      return api.put('/v1/user/about', { aboutMe });
    },
    
    async updateHeadline(headline: string) {
      return api.put('/v1/user/headline', { headline });
    },
    
    async updateProfilePicture(url: string) {
      return api.put('/v1/user/profile-picture', { url });
    },
    
    async updateResumeUrl(url: string) {
      return api.put('/v1/user/resume', { url });
    },
    
    async updateSkills(skills: string[]) {
      return api.put('/v1/user/skills', { skills });
    },
    
    async updateEducation(education: any[]) {
      return api.put('/v1/user/education', { education });
    },
    
    async deleteAccount() {
      return api.delete('/v1/user/account');
    },
    
    async uploadProfilePicture(file: any) {
      const formData = new FormData();
      
      if (Platform.OS === 'web' && file instanceof File) {
        formData.append('file', file);
      } else {
        formData.append('file', {
          uri: file.uri,
          type: file.mimeType || 'image/jpeg',
          name: file.name || 'profile.jpg',
        } as any);
      }
      
      const url = buildUrl(API_BASE_URL, '/v1/user/upload/profile-picture');
      const token = await getAuthToken();
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: formData,
      });
      
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Upload failed');
      }
      return result;
    },
    
    async uploadResume(file: any) {
      const formData = new FormData();

      if (Platform.OS === "web" && file instanceof File) {
        formData.append("file", file);
      } else {
        formData.append("file", {
          uri: file.uri,
          type: file.mimeType || (file.name?.endsWith(".pdf") ? "application/pdf" : "application/vnd.openxmlformats-officedocument.wordprocessingml.document"),
          name: file.name || "resume.pdf",
        } as any);
      }

      const url = buildUrl(API_BASE_URL, "/v1/user/upload/resume");
      const token = await getAuthToken();

      const response = await fetch(url, {
        method: "POST",
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: formData,
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "Upload failed");
      }
      return result;
    },
  },

  // Billing API
  billing: {
    async getPrices() {
      return api.get("/v1/billing/prices");
    },

    async getSubscriptionStatus() {
      return api.get("/v1/billing/subscription");
    },

    async createCheckoutSession(options?: {
      priceId?: string;
      successUrl?: string;
      cancelUrl?: string;
    }) {
      return api.post("/v1/billing/checkout/session", options || {});
    },

    async createPortalSession(options?: { returnUrl?: string }) {
      return api.post("/v1/billing/portal/session", options || {});
    },

    async cancelSubscription(options?: {
      atPeriodEnd?: boolean;
      invoiceNow?: boolean;
      prorate?: boolean;
    }) {
      return api.post("/v1/billing/cancel", options || {});
    },
  },

  // Applications API
  applications: {
    async getMyApplications(params?: { pageNo?: number; offset?: number; freeText?: string }) {
      const queryString = new URLSearchParams();
      if (params?.pageNo) queryString.set('pageNo', params.pageNo.toString());
      if (params?.offset) queryString.set('offset', params.offset.toString());
      if (params?.freeText) queryString.set('freeText', params.freeText);
      const query = queryString.toString();
      return api.get(`/v1/application/user/applications${query ? `?${query}` : ''}`);
    },

    async createApplication(jobId: string, data?: {
      applicantName?: string;
      text?: string;
      portfolioUrl?: string;
      resumeUrl?: string;
    }, resumeFile?: any) {
      console.log("createApplication called with data:", data, "resumeFile:", resumeFile);
      
      const url = buildUrl(API_BASE_URL, `/v1/application/job/${jobId}`);
      const token = await getAuthToken();
      
      let response;
      if (resumeFile) {
        const formData = new FormData();
        
        if (Platform.OS === 'web' && resumeFile instanceof File) {
          formData.append('resume', resumeFile);
        } else {
          formData.append('resume', {
            uri: resumeFile.uri,
            type: resumeFile.mimeType || (resumeFile.name?.endsWith('.pdf') ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'),
            name: resumeFile.name || 'resume.pdf',
          } as any);
        }
        
        if (data?.applicantName) {
          console.log("Appending applicantName:", data.applicantName);
          formData.append('applicantName', data.applicantName);
        }
        if (data?.text) {
          console.log("Appending text:", data.text);
          formData.append('text', data.text);
        }
        if (data?.portfolioUrl) formData.append('portfolioUrl', data.portfolioUrl);
        if (data?.resumeUrl) {
          console.log("Appending resumeUrl:", data.resumeUrl);
          formData.append('resumeUrl', data.resumeUrl);
        }

        response = await fetch(url, {
          method: 'POST',
          headers: {
            ...(token && { 'Authorization': `Bearer ${token}` }),
          },
          body: formData,
        });
      } else {
        // If no file to upload, send JSON instead which might be more reliable
        const jsonData = {
          applicantName: data?.applicantName || '',
          text: data?.text || '',
          portfolioUrl: data?.portfolioUrl || '',
          resumeUrl: data?.resumeUrl || '',
        };
        console.log("Sending JSON data:", jsonData);
        
        response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
          },
          body: JSON.stringify(jsonData),
        });
      }

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Failed to create application');
      }
      return result;
    },
  },

  // Notifications API
  notifications: {
    async registerDevice(token: string) {
      return api.post('/v1/notifications/register-device', { token });
    },
    async unregisterDevice(token: string) {
      return api.post('/v1/notifications/unregister-device', { token });
    },
    async list(params?: { pageNo?: number; offset?: number; unreadOnly?: boolean }) {
      const queryString = new URLSearchParams();
      if (params?.pageNo) queryString.set('pageNo', params.pageNo.toString());
      if (params?.offset) queryString.set('offset', params.offset.toString());
      if (params?.unreadOnly) queryString.set('unreadOnly', params.unreadOnly.toString());
      const query = queryString.toString();
      return api.get(`/v1/notifications${query ? `?${query}` : ''}`);
    },
    async markRead(id: string) {
      return api.patch(`/v1/notifications/${id}/read`);
    },
    async markAllRead() {
      return api.patch('/v1/notifications/read-all');
    },
    async sendTest() {
      return api.post('/v1/notifications/test');
    },
  },
};
