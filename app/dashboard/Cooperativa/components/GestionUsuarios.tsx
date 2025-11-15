'use client';

import { useState, useEffect } from 'react';
import { Users, Edit2, Trash2, Shield, ShieldCheck, Search, Filter } from 'lucide-react';
import { usuariosAPI } from '@/app/services/api';

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

const ROLES = ['CLIENTE', 'OFICINISTA', 'COOPERATIVA', 'ADMIN'];

const ROL_COLORS: Record<string, string> = {
  ADMIN: 'bg-red-100 text-red-700',
  COOPERATIVA: 'bg-purple-100 text-purple-700',
  OFICINISTA: 'bg-blue-100 text-blue-700',
  CLIENTE: 'bg-green-100 text-green-700',
};

export default function GestionUsuarios() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRol, setFilterRol] = useState<string>('TODOS');
  const [editingUser, setEditingUser] = useState<Usuario | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [newRol, setNewRol] = useState('');

  useEffect(() => {
    loadUsuarios();
  }, []);

  const loadUsuarios = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token') || '';
      const data = await usuariosAPI.getAll(token);
      setUsuarios(data);
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRol = async () => {
    if (!editingUser) return;
    
    try {
      const token = localStorage.getItem('token') || '';
      await usuariosAPI.updateRol(editingUser.id, { rol: newRol }, token);
      await loadUsuarios();
      setShowEditModal(false);
      setEditingUser(null);
    } catch (error) {
      console.error('Error al actualizar rol:', error);
      alert('Error al actualizar el rol del usuario');
    }
  };

  const handleToggleActivo = async (id: number) => {
    try {
      const token = localStorage.getItem('token') || '';
      await usuariosAPI.toggleActivo(id, token);
      await loadUsuarios();
    } catch (error) {
      console.error('Error al cambiar estado:', error);
      alert('Error al cambiar el estado del usuario');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este usuario?')) return;
    
    try {
      const token = localStorage.getItem('token') || '';
      await usuariosAPI.delete(id, token);
      await loadUsuarios();
    } catch (error) {
      console.error('Error al eliminar usuario:', error);
      alert('Error al eliminar el usuario');
    }
  };

  const openEditModal = (usuario: Usuario) => {
    setEditingUser(usuario);
    setNewRol(usuario.rol);
    setShowEditModal(true);
  };

  const filteredUsuarios = usuarios.filter(usuario => {
    const matchSearch = 
      usuario.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      usuario.apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
      usuario.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      usuario.cedula.includes(searchTerm);
    
    const matchRol = filterRol === 'TODOS' || usuario.rol === filterRol;
    
    return matchSearch && matchRol;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Gestión de Usuarios</h2>
          <p className="text-sm text-gray-500 mt-1">
            Administra los roles y permisos de los usuarios
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Users size={18} />
          <span className="font-semibold">{usuarios.length}</span> usuarios registrados
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Buscar por nombre, email o cédula..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
          </div>

          {/* Filter by Rol */}
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-gray-400" />
            <select
              value={filterRol}
              onChange={(e) => setFilterRol(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="TODOS">Todos los roles</option>
              {ROLES.map(rol => (
                <option key={rol} value={rol}>{rol}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {ROLES.map(rol => {
          const count = usuarios.filter(u => u.rol === rol).length;
          return (
            <div key={rol} className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-gray-800">{count}</p>
                  <p className="text-sm text-gray-500 mt-1">{rol}</p>
                </div>
                <div className={`p-3 rounded-lg ${ROL_COLORS[rol]}`}>
                  <Shield size={20} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-500 mt-4">Cargando usuarios...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usuario
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cédula
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rol
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha Registro
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsuarios.map((usuario) => (
                  <tr key={usuario.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-blue-600 font-semibold text-sm">
                              {usuario.nombre[0]}{usuario.apellido[0]}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {usuario.nombre} {usuario.apellido}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{usuario.cedula}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{usuario.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${ROL_COLORS[usuario.rol]}`}>
                        {usuario.rol}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleActivo(usuario.id)}
                        className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          usuario.activo
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {usuario.activo ? 'Activo' : 'Inactivo'}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(usuario.fechaRegistro).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(usuario)}
                          className="text-blue-600 hover:text-blue-900 p-2 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Editar rol"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(usuario.id)}
                          className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded-lg transition-colors"
                          title="Eliminar usuario"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredUsuarios.length === 0 && (
              <div className="text-center py-12">
                <Users size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">No se encontraron usuarios</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-800">Cambiar Rol de Usuario</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Usuario
                </label>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="font-medium text-gray-900">
                    {editingUser.nombre} {editingUser.apellido}
                  </p>
                  <p className="text-sm text-gray-500">{editingUser.email}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rol Actual
                </label>
                <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${ROL_COLORS[editingUser.rol]}`}>
                  {editingUser.rol}
                </span>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nuevo Rol
                </label>
                <select
                  value={newRol}
                  onChange={(e) => setNewRol(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  {ROLES.map(rol => (
                    <option key={rol} value={rol}>{rol}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleUpdateRol}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <ShieldCheck size={18} />
                Actualizar Rol
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}