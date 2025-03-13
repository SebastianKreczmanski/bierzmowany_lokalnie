import axios from 'axios';
import { API_URL } from '../config';
import { handleApiError } from './errorHandlers';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
}

// Interfejsy dla danych
export interface Szkola {
  id: number;
  nazwa: string;
  miejscowosc: string;
}

export interface Parafia {
  id: number;
  wezwanie: string;
  miejscowosc: string;
}

export interface Grupa {
  id: number;
  nazwa: string;
  opis?: string;
  animator?: {
    id: number;
    imie: string;
    nazwisko: string;
  };
}

// Kandydat API
const kandydatApi = {
  // Pobieranie danych kandydata
  getKandydatData: async (userId: string): Promise<ApiResponse> => {
    try {
      const response = await axios.get(`${API_URL}/api/kandydat/${userId}`, {
        withCredentials: true
      });
      return { success: true, data: response.data };
    } catch (error) {
      return handleApiError(error, 'Nie udało się pobrać danych kandydata');
    }
  },

  // Pobieranie listy szkół
  getSzkoly: async (): Promise<ApiResponse<Szkola[]>> => {
    try {
      const response = await axios.get(`${API_URL}/api/kandydat/dane/szkoly`, {
        withCredentials: true
      });
      return { success: true, data: response.data };
    } catch (error) {
      return handleApiError(error, 'Nie udało się pobrać listy szkół');
    }
  },

  // Pobieranie listy parafii
  getParafie: async (): Promise<ApiResponse<Parafia[]>> => {
    try {
      const response = await axios.get(`${API_URL}/api/kandydat/dane/parafie`, {
        withCredentials: true
      });
      return { success: true, data: response.data };
    } catch (error) {
      return handleApiError(error, 'Nie udało się pobrać listy parafii');
    }
  },

  // Pobieranie listy grup
  getGrupy: async (): Promise<ApiResponse<Grupa[]>> => {
    try {
      const response = await axios.get(`${API_URL}/api/kandydat/dane/grupy`, {
        withCredentials: true
      });
      return { success: true, data: response.data };
    } catch (error) {
      return handleApiError(error, 'Nie udało się pobrać listy grup');
    }
  },

  // Dodawanie/edycja rodzica
  saveRodzic: async (userId: string, data: any): Promise<ApiResponse> => {
    try {
      const response = await axios.post(`${API_URL}/api/kandydat/${userId}/rodzic`, data, {
        withCredentials: true
      });
      return { success: true, data: response.data };
    } catch (error) {
      return handleApiError(error, 'Nie udało się zapisać danych rodzica');
    }
  },

  // Przypisanie do grupy
  assignToGrupa: async (userId: string, data: { grupa_id: number }): Promise<ApiResponse> => {
    try {
      const response = await axios.post(`${API_URL}/api/kandydat/${userId}/grupa`, data, {
        withCredentials: true
      });
      return { success: true, data: response.data };
    } catch (error) {
      return handleApiError(error, 'Nie udało się przypisać do grupy');
    }
  },

  // Dodawanie/edycja świadka
  saveSwiadek: async (userId: string, data: any): Promise<ApiResponse> => {
    try {
      const response = await axios.post(`${API_URL}/api/kandydat/${userId}/swiadek`, data, {
        withCredentials: true
      });
      return { success: true, data: response.data };
    } catch (error) {
      return handleApiError(error, 'Nie udało się zapisać danych świadka');
    }
  },

  // Dodawanie/edycja imienia bierzmowania
  saveImieBierzmowania: async (userId: string, data: { imie: string, uzasadnienie?: string }): Promise<ApiResponse> => {
    try {
      const response = await axios.post(`${API_URL}/api/kandydat/${userId}/imie-bierzmowania`, data, {
        withCredentials: true
      });
      return { success: true, data: response.data };
    } catch (error) {
      return handleApiError(error, 'Nie udało się zapisać imienia bierzmowania');
    }
  },

  // Dodawanie/edycja informacji o szkole
  saveSzkola: async (userId: string, data: { szkola_id: number, klasa: string }): Promise<ApiResponse> => {
    try {
      const response = await axios.post(`${API_URL}/api/kandydat/${userId}/szkola`, data, {
        withCredentials: true
      });
      return { success: true, data: response.data };
    } catch (error) {
      return handleApiError(error, 'Nie udało się zapisać informacji o szkole');
    }
  },

  // Przypisanie do parafii
  assignToParafia: async (userId: string, data: { parafiaId: number }): Promise<ApiResponse> => {
    try {
      const response = await axios.post(`${API_URL}/api/kandydat/${userId}/parafia`, data, {
        withCredentials: true
      });
      return { success: true, data: response.data };
    } catch (error) {
      return handleApiError(error, 'Nie udało się przypisać do parafii');
    }
  }
};

export default kandydatApi; 