'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { 
  Building2, 
  Edit2, 
  Trash2, 
  Search, 
  Plus,
  X,
  Save,
  AlertCircle,
  CheckCircle,
  Upload,
  Image as ImageIcon
} from 'lucide-react';
import { cooperativasAPI } from '@/app/services/api';

interface Cooperativa {
  id: number;
  nombre: string;
  ruc: string;
  logoUrl: string;
  activo: boolean;
}

interface FormData {
  nombre: string;
  ruc: string;
  logoUrl: string;
  activo: boolean;
}

export default function GestionCooperativas() {
  const [cooperativas, setCooperativas] = useState<Cooperativa[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('active');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedCooperativa, setSelectedCooperativa] = useState<Cooperativa | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);

  const [formData, setFormData] = useState<FormData>({
    nombre: '',
    ruc: '',
    logoUrl: '',
    activo: true
  });

  useEffect(() => {
    loadCooperativas();
  }, [currentPage, searchTerm, filterStatus]);

  const loadCooperativas = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token') || '';
      const data = await cooperativasAPI.getAll(token, searchTerm, currentPage, 10);
      
      // Filtrar según el estado seleccionado
      let filtered = data.content;
      if (filterStatus === 'active') {
        filtered = data.content.filter(c => c.activo);
      } else if (filterStatus === 'inactive') {
        filtered = data.content.filter(c => !c.activo);
      }
      
      setCooperativas(filtered);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error('Error al cargar cooperativas:', error);
      showNotification('Error al cargar cooperativas', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      const token = localStorage.getItem('token') || '';
      await cooperativasAPI.create(formData, token);
      showNotification('Cooperativa creada exitosamente', 'success');
      closeModal();
      loadCooperativas();
    } catch (error) {
      console.error('Error al crear cooperativa:', error);
      showNotification('Error al crear cooperativa', 'error');
    }
  };

  const handleUpdate = async () => {
    if (!selectedCooperativa) return;
    
    try {
      const token = localStorage.getItem('token') || '';
      await cooperativasAPI.update(selectedCooperativa.id, formData, token);
      showNotification('Cooperativa actualizada exitosamente', 'success');
      closeModal();
      loadCooperativas();
    } catch (error) {
      console.error('Error al actualizar cooperativa:', error);
      showNotification('Error al actualizar cooperativa', 'error');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de que deseas desactivar esta cooperativa?')) return;
    
    try {
      const token = localStorage.getItem('token') || '';
      await cooperativasAPI.delete(id, token);
      showNotification('Cooperativa desactivada exitosamente', 'success');
      loadCooperativas();
    } catch (error) {
      console.error('Error al eliminar cooperativa:', error);
      showNotification('Error al eliminar cooperativa', 'error');
    }
  };

  const handleToggleStatus = async (coop: Cooperativa) => {
    const action = coop.activo ? 'desactivar' : 'reactivar';
    if (!confirm(`¿Estás seguro de que deseas ${action} esta cooperativa?`)) return;
    
    try {
      const token = localStorage.getItem('token') || '';
      await cooperativasAPI.update(coop.id, { activo: !coop.activo }, token);
      showNotification(`Cooperativa ${action === 'desactivar' ? 'desactivada' : 'reactivada'} exitosamente`, 'success');
      loadCooperativas();
    } catch (error) {
      console.error(`Error al ${action} cooperativa:`, error);
      showNotification(`Error al ${action} cooperativa`, 'error');
    }
  };

  const openCreateModal = () => {
    setModalMode('create');
    setSelectedCooperativa(null);
    setFormData({ nombre: '', ruc: '', logoUrl: '', activo: true });
    setLogoPreview('');
    setShowModal(true);
  };

  const openEditModal = (cooperativa: Cooperativa) => {
    setModalMode('edit');
    setSelectedCooperativa(cooperativa);
    setFormData({
      nombre: cooperativa.nombre,
      ruc: cooperativa.ruc,
      logoUrl: cooperativa.logoUrl,
      activo: cooperativa.activo
    });
    setLogoPreview(cooperativa.logoUrl);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedCooperativa(null);
    setFormData({ nombre: '', ruc: '', logoUrl: '', activo: true });
    setLogoPreview('');
  };

  const handleSubmit = () => {
    if (modalMode === 'create') {
      handleCreate();
    } else {
      handleUpdate();
    }
  };

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      showNotification('Solo se permiten archivos de imagen', 'error');
      return;
    }

    // Validar tamaño (5MB)
    if (file.size > 5 * 1024 * 1024) {
      showNotification('El archivo no puede superar 5MB', 'error');
      return;
    }

    // Preview local
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Subir al servidor
    try {
      setUploadingLogo(true);
      const token = localStorage.getItem('token') || '';
      const logoUrl = await cooperativasAPI.uploadLogo(file, token);
      setFormData({ ...formData, logoUrl });
      showNotification('Logo subido exitosamente', 'success');
    } catch (error) {
      console.error('Error al subir logo:', error);
      showNotification('Error al subir el logo', 'error');
      setLogoPreview('');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  return (
    <div className="space-y-6">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg ${
          notification.type === 'success' 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {notification.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <span className="text-sm font-medium">{notification.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Gestión de Cooperativas</h2>
          <p className="text-sm text-gray-500 mt-1">
            Administra las cooperativas del sistema
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Building2 size={18} />
          <span className="font-semibold">{cooperativas.length}</span> cooperativas
        </div>
      </div>

      {/* Search and Create Button */}
      <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Buscar por nombre o RUC..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
          </div>

          {/* Filter Status */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as 'all' | 'active' | 'inactive')}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
          >
            <option value="all">Todas</option>
            <option value="active">Activas</option>
            <option value="inactive">Inactivas</option>
          </select>

          {/* Create Button */}
          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 justify-center whitespace-nowrap"
          >
            <Plus size={18} />
            Nueva Cooperativa
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-800">{cooperativas.length}</p>
              <p className="text-sm text-gray-500 mt-1">Total</p>
            </div>
            <div className="p-3 rounded-lg bg-blue-100 text-blue-700">
              <Building2 size={20} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-800">
                {cooperativas.filter(c => c.activo).length}
              </p>
              <p className="text-sm text-gray-500 mt-1">Activas</p>
            </div>
            <div className="p-3 rounded-lg bg-green-100 text-green-700">
              <Building2 size={20} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-800">
                {cooperativas.filter(c => !c.activo).length}
              </p>
              <p className="text-sm text-gray-500 mt-1">Inactivas</p>
            </div>
            <div className="p-3 rounded-lg bg-red-100 text-red-700">
              <Building2 size={20} />
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-500 mt-4">Cargando cooperativas...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Logo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nombre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    RUC
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {cooperativas.map((coop) => (
                  <tr key={coop.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {coop.logoUrl ? (
                        <img 
                          src={`http://localhost:8080${coop.logoUrl}`}
                          alt={coop.nombre} 
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <Building2 size={20} className="text-blue-600" />
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{coop.nombre}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{coop.ruc}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        coop.activo 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {coop.activo ? 'Activa' : 'Inactiva'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(coop)}
                          className="text-blue-600 hover:text-blue-900 p-2 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Editar cooperativa"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(coop)}
                          className={`p-2 rounded-lg transition-colors ${
                            coop.activo
                              ? 'text-red-600 hover:text-red-900 hover:bg-red-50'
                              : 'text-green-600 hover:text-green-900 hover:bg-green-50'
                          }`}
                          title={coop.activo ? 'Desactivar cooperativa' : 'Reactivar cooperativa'}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {cooperativas.length === 0 && (
              <div className="text-center py-12">
                <Building2 size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">No se encontraron cooperativas</p>
              </div>
            )}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <button
              onClick={handlePreviousPage}
              disabled={currentPage === 0}
              className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Anterior
            </button>
            <span className="text-sm text-gray-700">
              Página {currentPage + 1} de {totalPages}
            </span>
            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages - 1}
              className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Siguiente
            </button>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-800">
                {modalMode === 'create' ? 'Nueva Cooperativa' : 'Editar Cooperativa'}
              </h3>
              <button 
                onClick={closeModal} 
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ej: TransAndes"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  RUC <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.ruc}
                  onChange={(e) => setFormData({ ...formData, ruc: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ej: 1234567890001"
                  maxLength={13}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Logo de la Cooperativa
                </label>
                
                <div className="flex items-start gap-4">
                  {/* Preview del logo */}
                  <div className="flex-shrink-0">
                    {logoPreview ? (
                      <div className="relative">
                        <img 
                          src={logoPreview.startsWith('data:') ? logoPreview : `http://localhost:8080${logoPreview}`}
                          alt="Preview" 
                          className="w-24 h-24 rounded-lg object-cover border-2 border-gray-200"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setLogoPreview('');
                            setFormData({ ...formData, logoUrl: '' });
                          }}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <div className="w-24 h-24 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50">
                        <ImageIcon size={32} className="text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Upload button */}
                  <div className="flex-1">
                    <label className="cursor-pointer">
                      <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors border border-gray-300">
                        <Upload size={18} />
                        <span className="text-sm font-medium">
                          {uploadingLogo ? 'Subiendo...' : 'Subir Logo'}
                        </span>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        disabled={uploadingLogo}
                        className="hidden"
                      />
                    </label>
                    <p className="text-xs text-gray-500 mt-2">
                      PNG, JPG o WEBP (máx. 5MB)
                    </p>
                  </div>
                </div>

                {/* URL manual (opcional) */}
                <div className="mt-3">
                  <input
                    type="url"
                    value={formData.logoUrl}
                    onChange={(e) => {
                      setFormData({ ...formData, logoUrl: e.target.value });
                      setLogoPreview(e.target.value);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="O pega una URL de imagen"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="activo"
                  checked={formData.activo}
                  onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="activo" className="text-sm font-medium text-gray-700">
                  Cooperativa Activa
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSubmit}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Save size={18} />
                  {modalMode === 'create' ? 'Crear' : 'Actualizar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}