import { cache, createCacheKey } from './cache';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface FetchDataOptions extends RequestInit {
  useCache?: boolean;
  cacheTTL?: number; // em milissegundos
}

function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

export async function fetchData<T = unknown>(
  endpoint: string,
  options?: FetchDataOptions
): Promise<T> {
  try {
    // Verificar cache apenas para requisições GET e se useCache não for false
    const useCache = options?.useCache !== false && (!options?.method || options.method === 'GET');
    
    if (useCache && typeof window !== 'undefined') {
      // Criar chave baseada apenas no endpoint (parâmetros já estão na URL)
      const cacheKey = endpoint;
      const cached = cache.get<T>(cacheKey);
      if (cached !== null) {
        return cached;
      }
    }

    const token = getAuthToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options?.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || errorData.message || `Erro: ${response.statusText}`;
      
      // Se for erro de autenticação (401) ou token expirado, redirecionar para login
      if (response.status === 401 || errorMessage.toLowerCase().includes('token expirado') || errorMessage.toLowerCase().includes('token inválido')) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
          // Usar window.location para garantir redirecionamento completo
          window.location.href = '/login';
        }
      }
      
      throw new Error(errorMessage);
    }

    const data: ApiResponse<T> = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || data.message || 'Erro desconhecido');
    }

    const result = data.data as T;

    // Salvar no cache se for GET e useCache não for false
    if (useCache && typeof window !== 'undefined') {
      const cacheKey = endpoint;
      cache.set(cacheKey, result, options?.cacheTTL);
    }

    return result;
  } catch (error) {
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error('Não foi possível conectar ao servidor. Verifique se o backend está rodando na porta 3001.');
    }
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Erro desconhecido ao fazer requisição');
  }
}

export async function postData<T = unknown>(
  endpoint: string,
  body: unknown,
  options?: RequestInit
): Promise<T> {
  const token = getAuthToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options?.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return fetchData<T>(endpoint, {
    method: 'POST',
    body: JSON.stringify(body),
    ...options,
    headers,
  });
}

export async function putData<T = unknown>(
  endpoint: string,
  body: unknown,
  options?: RequestInit
): Promise<T> {
  const token = getAuthToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options?.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return fetchData<T>(endpoint, {
    method: 'PUT',
    body: JSON.stringify(body),
    ...options,
    headers,
  });
}

export async function deleteData<T = unknown>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const token = getAuthToken();
  const headers: HeadersInit = {
    ...options?.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return fetchData<T>(endpoint, {
    method: 'DELETE',
    ...options,
    headers,
  });
}

export async function uploadFile(
  endpoint: string,
  file: File,
  additionalData?: Record<string, string>
): Promise<{ success: boolean; data: { photo_path: string; file_name: string } }> {
  const token = getAuthToken();
  const formData = new FormData();
  formData.append('photo', file);

  if (additionalData) {
    Object.entries(additionalData).forEach(([key, value]) => {
      formData.append(key, value);
    });
  }

  const headers: HeadersInit = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers,
    body: formData,
    credentials: 'include',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.error || errorData.message || 'Erro ao fazer upload do arquivo';
    throw new Error(errorMessage);
  }

  const data: ApiResponse<{ photo_path: string; file_name: string }> = await response.json();
  
  if (!data.success) {
    throw new Error(data.error || data.message || 'Erro ao fazer upload do arquivo');
  }

  return { success: true, data: data.data! };
}

