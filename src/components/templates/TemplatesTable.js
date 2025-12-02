import React, { useEffect, useMemo, useState } from 'react';
import { useUsersStore } from '../../store/useUsersStore';
import TemplateModal from './TemplateModal';

const TemplatesTable = () => {
  const users = useUsersStore((s) => s.users);
  const selectedKey = useUsersStore((s) => s.selectedKey);
  const loadTemplates = useUsersStore((s) => s.loadTemplates);
  const loadTemplateCategories = useUsersStore((s) => s.loadTemplateCategories);
  const addTemplate = useUsersStore((s) => s.addTemplate);
  const updateTemplate = useUsersStore((s) => s.updateTemplate);
  const deleteTemplate = useUsersStore((s) => s.deleteTemplate);

  const [search, setSearch] = useState('');
  const [showEntries, setShowEntries] = useState(30);
  const [currentPage, setCurrentPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [deleteCandidate, setDeleteCandidate] = useState(null);
  const [categories, setCategories] = useState([]);
  const [templates, setTemplates] = useState([]);

  const subUserId = useMemo(() => {
    if (!selectedKey || !Array.isArray(users)) return null;
    const found = users.find((u) => {
      const candidates = [
        u.document_id,
        u.documentId,
        u.sub_user_id,
        u.subUserId,
        u.id,
        u._id,
        u.sub_username,
        u.subUsername,
        u.username,
        u.email,
      ];
      return candidates.some((c) => c && String(c) === String(selectedKey));
    });
    return found ? String(found.document_id || found.sub_user_id || found.id) : null;
  }, [selectedKey, users]);

  // ============ LOAD TEMPLATES & CATEGORIES ============
  useEffect(() => {
    if (!subUserId) {
      setTemplates([]);
      setCategories([]);
      return;
    }

    const load = async () => {
      setLoading(true);
      try {
        console.log('🔄 Loading templates & categories for subUserId:', subUserId);
        
        // Load both in parallel
        const [cats, tpls] = await Promise.all([
          loadTemplateCategories(subUserId),
          loadTemplates(subUserId),
        ]);

        console.log('✓ Loaded', cats.length, 'categories and', tpls.length, 'templates');
        setCategories(Array.isArray(cats) ? cats : []);
        setTemplates(Array.isArray(tpls) ? tpls : []);
      } catch (err) {
        console.error('❌ Error loading templates:', err);
        setCategories([]);
        setTemplates([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [subUserId, loadTemplates, loadTemplateCategories]);

  // ============ SYNC WITH STORE WHEN USER CHANGES ============
  useEffect(() => {
    if (!subUserId) return;

    const selectedUser = users.find((u) => {
      const candidates = [u.document_id, u.sub_user_id, u.id, u.sub_username];
      return candidates.some((c) => c && String(c) === String(subUserId));
    });

    if (selectedUser) {
      const cats = Array.isArray(selectedUser.template_categories) ? selectedUser.template_categories : [];
      const tpls = Array.isArray(selectedUser.templates) ? selectedUser.templates : [];
      setCategories(cats);
      setTemplates(tpls);
    }
  }, [subUserId, users]);

  // ============ RESET PAGE ON FILTER CHANGE ============
  useEffect(() => {
    setCurrentPage(1);
  }, [search, showEntries]);

  // ============ FILTER & SORT ============
  const filteredSorted = useMemo(() => {
    const q = search.trim().toLowerCase();
    return templates
      .filter((t) => {
        if (!q) return true;
        const categoryMatch = String(t.categoryName || '').toLowerCase().includes(q);
        const contentMatch = String(t.content || '').toLowerCase().includes(q);
        return categoryMatch || contentMatch;
      })
      .sort((a, b) => {
        // Sort by order field
        const aOrder = a.order ?? 0;
        const bOrder = b.order ?? 0;
        if (aOrder !== bOrder) return aOrder - bOrder;
        // Then by createdAt (newest first)
        return (b.createdAt || 0) - (a.createdAt || 0);
      });
  }, [templates, search]);

  // ============ PAGINATION ============
  const total = filteredSorted.length;
  const startIndex = total === 0 ? 0 : (currentPage - 1) * showEntries + 1;
  const endIndex = Math.min(currentPage * showEntries, total);
  const totalPages = Math.max(1, Math.ceil(total / showEntries));
  const paged = filteredSorted.slice((currentPage - 1) * showEntries, currentPage * showEntries);

  // ============ HANDLERS ============
  const openAdd = (categoryId = '') => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (tpl) => {
    setEditing(tpl);
    setModalOpen(true);
  };

  const handleSubmit = async (payload) => {
    if (!subUserId) return;
    setLoading(true);
    try {
      if (editing && editing.id) {
        await updateTemplate(subUserId, editing.id, payload);
      } else {
        await addTemplate(subUserId, payload);
      }
      setModalOpen(false);
      setEditing(null);

      // Reload templates
      const updated = await loadTemplates(subUserId);
      setTemplates(Array.isArray(updated) ? updated : []);
    } catch (err) {
      console.error('❌ Save template error:', err);
      alert('Save failed: ' + (err?.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = (tpl) => {
    setDeleteCandidate(tpl);
  };

  const clearDelete = () => setDeleteCandidate(null);

  const doDelete = async () => {
    if (!subUserId || !deleteCandidate) return;
    setLoading(true);
    try {
      await deleteTemplate(subUserId, deleteCandidate.id);
      clearDelete();

      // Reload templates
      const updated = await loadTemplates(subUserId);
      setTemplates(Array.isArray(updated) ? updated : []);
    } catch (err) {
      console.error('❌ Delete template error:', err);
      alert('Delete failed: ' + (err?.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  

  return (
    <div className="bg-white rounded shadow p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold">Templates</h2>
          <p className="text-sm text-gray-600">Manage proposal templates</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-600 mr-2">Show</div>
          <select
            className="border rounded px-2 py-1 text-sm"
            value={showEntries}
            onChange={(e) => setShowEntries(Number(e.target.value))}
          >
            <option value={30}>30</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>

          <input
            type="text"
            placeholder="Search by category or content"
            className="border rounded px-3 py-1 text-sm ml-4"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button
            onClick={() => openAdd()}
            className="bg-blue-600 text-white px-4 py-2 rounded ml-4 hover:bg-blue-700"
            disabled={loading}
          >
            + Add Template
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">
                Category
              </th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">
                Content
              </th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">
                Skills
              </th>
              <th className="px-4 py-2 text-right text-sm font-medium text-gray-600">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {paged.map((t) => (
              <tr key={t.id} className="hover:bg-gray-50" style={{ height: 50 }}>
                <td className="px-4 py-3 text-sm font-semibold text-left">
                  {t.categoryName || 'Uncategorized'}
                </td>
                <td className="px-4 py-3 text-sm max-w-[300px]">
                  <div
                    className="text-sm text-gray-700"
                    style={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      maxWidth: 500,
                    }}
                  >
                    {t.content?.length > 100 ? `${t.content.slice(0, 150)}...` : t.content}
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-center">
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                    {t.skills || 'All skills'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right text-sm">
                  <div className="inline-flex items-center gap-2 relative">
                    <button
                      className="px-3 py-1 bg-white border rounded text-sm hover:bg-gray-50"
                      onClick={() =>
                        setOpenDropdownId((prev) => (prev === t.id ? null : t.id))
                      }
                      disabled={loading}
                    >
                      Actions ▾
                    </button>

                    {openDropdownId === t.id && (
                      <div className="absolute right-0 mt-10 w-40 bg-white border rounded shadow-lg z-20">
                        <button
                          className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                          onClick={() => {
                            setOpenDropdownId(null);
                            openEdit(t);
                          }}
                        >
                          Edit
                        </button>
                  
                        <button
                          className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-gray-50"
                          onClick={() => {
                            setOpenDropdownId(null);
                            confirmDelete(t);
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {paged.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-sm text-gray-500">
                  {loading ? 'Loading...' : 'No templates found.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
        <div>
          Showing {startIndex} to {endIndex} of {total} entries
        </div>
        <div className="flex items-center gap-2">
          <button
            className="px-3 py-1 border rounded disabled:opacity-50"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          >
            Prev
          </button>
          <div>
            Page {currentPage} / {totalPages}
          </div>
          <button
            className="px-3 py-1 border rounded disabled:opacity-50"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
          </button>
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <TemplateModal
          isOpen={modalOpen}
          categories={categories}
          template={editing}
          onClose={() => {
            setModalOpen(false);
            setEditing(null);
          }}
          onSave={handleSubmit}
          isLoading={loading}
        />
      )}

      {/* Delete Confirmation */}
      {deleteCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black opacity-30" onClick={clearDelete} />
          <div className="bg-white p-6 rounded shadow-lg z-60 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-2">Delete template</h3>
            <p className="text-sm text-gray-700 mb-4">
              Are you sure you want to delete the template in category{' '}
              <strong>"{deleteCandidate.categoryName || 'Uncategorized'}"</strong>?
            </p>
            <div className="flex justify-end gap-3">
              <button
                className="px-4 py-2 border rounded hover:bg-gray-50"
                onClick={clearDelete}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                onClick={doDelete}
                disabled={loading}
              >
                {loading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplatesTable;
