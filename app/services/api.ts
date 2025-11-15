// app/services/api.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

interface LoginRequest {
  email: string;
  password: string;
}

interface RegisterRequest {
  nombre: string;
  apellido: string;
  cedula: string;
  email: string;
  password: string;
}

interface AuthResponse {
  token: string;
  userId: number;
  email: string;
  rol: string;
  nombre: string;
  apellido: string;
  cedula: string;
}

export const authAPI = {
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Error en el login');
    }

    return response.json();
  },

  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Error en el registro');
    }

    return response.json();
  },

  getMe: async (token: string): Promise<AuthResponse> => {
    const response = await fetch(`${API_URL}/users/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Error al obtener usuario');
    }

    return response.json();
  },
};
interface Usuario {
  id: number;
  nombre: string;
  apellido: string;
  cedula: string;
  email: string;
  rol: string;
  activo: boolean;
  fechaRegistro: string;
}

interface UpdateRolRequest {
  rol: string;
}

export const usuariosAPI = {
  getAll: async (token: string): Promise<Usuario[]> => {
    const response = await fetch(`${API_URL}/api/usuarios`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    if (!response.ok) throw new Error('Error al obtener usuarios');
    return response.json();
  },

  getByRol: async (rol: string, token: string): Promise<Usuario[]> => {
    const response = await fetch(`${API_URL}/api/usuarios/rol/${rol}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    if (!response.ok) throw new Error('Error al obtener usuarios por rol');
    return response.json();
  },

  updateRol: async (id: number, data: UpdateRolRequest, token: string): Promise<Usuario> => {
    const response = await fetch(`${API_URL}/api/usuarios/${id}/rol`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Error al actualizar rol');
    return response.json();
  },

  toggleActivo: async (id: number, token: string): Promise<Usuario> => {
    const response = await fetch(`${API_URL}/api/usuarios/${id}/toggle-activo`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    if (!response.ok) throw new Error('Error al cambiar estado');
    return response.json();
  },

  delete: async (id: number, token: string): Promise<void> => {
    const response = await fetch(`${API_URL}/api/usuarios/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    if (!response.ok) throw new Error('Error al eliminar usuario');
  },
};
interface CooperativaCreateRequest {
  nombre: string;
  ruc: string;
  logoUrl?: string;
  activo?: boolean;
}

interface CooperativaUpdateRequest {
  nombre?: string;
  ruc?: string;
  logoUrl?: string;
  activo?: boolean;
}

interface CooperativaResponse {
  id: number;
  nombre: string;
  ruc: string;
  logoUrl: string;
  activo: boolean;
}

interface PageResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
}

export const cooperativasAPI = {
    uploadLogo: async (file: File, token: string): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(
      `${API_URL}/upload/logo`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error('Error al subir el logo');
    }

    const data = await response.json();
    return data.url;
  },
  // Listar cooperativas con búsqueda y paginación
  getAll: async (
    token: string,
    search: string = '',
    page: number = 0,
    size: number = 10
  ): Promise<PageResponse<CooperativaResponse>> => {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
    });
    
    if (search) {
      params.append('search', search);
    }

    const response = await fetch(
      `${API_URL}/cooperativas?${params.toString()}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Error al obtener cooperativas');
    }

    return response.json();
  },

  // Obtener una cooperativa por ID
  getById: async (id: number, token: string): Promise<CooperativaResponse> => {
    const response = await fetch(
      `${API_URL}/cooperativas/${id}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Error al obtener cooperativa');
    }

    return response.json();
  },

  // Crear nueva cooperativa
  create: async (
    data: CooperativaCreateRequest,
    token: string
  ): Promise<CooperativaResponse> => {
    const response = await fetch(
      `${API_URL}/cooperativas`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      throw new Error('Error al crear cooperativa');
    }

    return response.json();
  },

  // Actualizar cooperativa
  update: async (
    id: number,
    data: CooperativaUpdateRequest,
    token: string
  ): Promise<CooperativaResponse> => {
    const response = await fetch(
      `${API_URL}/cooperativas/${id}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      throw new Error('Error al actualizar cooperativa');
    }

    return response.json();
  },

  // Eliminación lógica (desactivar)
  delete: async (id: number, token: string): Promise<void> => {
    const response = await fetch(
      `${API_URL}/cooperativas/${id}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Error al eliminar cooperativa');
    }
  },
};