import React, { useEffect, useMemo, useState } from 'react';
import { useUsersStore } from '../../store/useUsersStore';
import AddEditCategoryModal from './AddEditCategoryModal';

const CategoriesTable = () => {
  // stable single-field subscriptions (avoids getSnapshot caching warning)
  const users = useUsersStore((s) => s.users);
  const selectedKey = useUsersStore((s) => s.selectedKey);
  const loadTemplateCategories = useUsersStore((s) => s.loadTemplateCategories);
  const addTemplateCategory = useUsersStore((s) => s.addTemplateCategory);
  const updateTemplateCategory = useUsersStore((s) => s.updateTemplateCategory);
  const deleteTemplateCategory = useUsersStore((s) => s.deleteTemplateCategory);
  const moveCategoryUp = useUsersStore((s) => s.moveCategoryUp);
  const moveCategoryDown = useUsersStore((s) => s.moveCategoryDown);

  // resolve active sub-user id (same pattern as CountriesFilter)
  const subUserId = useMemo(() => {
    if (!selectedKey || !Array.isArray(users)) return null;
    const found = users.find((u) => {
      const id = String(u.sub_user_id || u.document_id || u.id || '');
      if (id === String(selectedKey)) return true;
      if (u.sub_username && String(u.sub_username) === String(selectedKey)) return true;
      return false;
    });
    return found ? String(found.sub_user_id || found.document_id || found.id) : null;
  }, [selectedKey, users]);

  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [showEntries] = useState(30);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState(null);

  // load/seed categories once per sub-user (store action handles seeding)
  useEffect(() => {
    let mounted = true;
    if (!subUserId) {
      setCategories([]);
      return;
    }
    (async () => {
      setLoading(true);
      try {
        const cats = await loadTemplateCategories(subUserId);
        if (mounted) setCategories(Array.isArray(cats) ? [...cats].sort((a, b) => (a.order || 0) - (b.order || 0)) : []);
      } catch (err) {
        console.error('loadTemplateCategories err', err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [subUserId, loadTemplateCategories]);

  // keep local categories in sync when users store updates
  useEffect(() => {
    if (!subUserId) return;
    const found = users.find((u) => {
      const id = String(u.sub_user_id || u.document_id || u.id || '');
      return id === String(subUserId);
    });
    const cats = found && Array.isArray(found.template_categories) ? [...found.template_categories] : [];
    setCategories(cats.sort((a, b) => (a.order || 0) - (b.order || 0)));
  }, [users, subUserId]);

  const filtered = categories.filter((c) => c.name.toLowerCase().includes(search.trim().toLowerCase()));

  const openAdd = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (c) => { setEditing(c); setModalOpen(true); };

  const handleSubmit = async (payload) => {
    if (!subUserId) return;
    setLoading(true);
    try {
      if (payload.id) {
        await updateTemplateCategory(subUserId, payload.id, { name: payload.name, alwaysInclude: !!payload.alwaysInclude });
      } else {
        await addTemplateCategory(subUserId, { name: payload.name, alwaysInclude: !!payload.alwaysInclude });
      }
      setModalOpen(false);
    } catch (err) {
      console.error('save category error', err);
      alert('Save failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!subUserId) return;
    if (!window.confirm('Delete this category?')) return;
    setLoading(true);
    try {
      await deleteTemplateCategory(subUserId, id);
    } catch (err) {
      console.error('delete category error', err);
      alert('Delete failed');
    } finally {
      setLoading(false);
    }
  };

  const handleMoveUp = async (id) => {
    if (!subUserId) return;
    setLoading(true);
    try {
      await moveCategoryUp(subUserId, id);
    } catch (err) {
      console.error('move up error', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMoveDown = async (id) => {
    if (!subUserId) return;
    setLoading(true);
    try {
      await moveCategoryDown(subUserId, id);
    } catch (err) {
      console.error('move down error', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold">Template Categories</h2>
          <p className="text-sm text-gray-600">Order and always-include categories (per sub-user)</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-600 mr-2">Show</div>
          <select className="border rounded px-2 py-1 text-sm" value={showEntries} onChange={() => {}}>
            <option value={30}>30</option>
          </select>
          <input
            type="text"
            placeholder="Search..."
            className="border rounded px-3 py-1 text-sm ml-4"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button onClick={openAdd} className="bg-blue-600 text-white px-4 py-2 rounded ml-4">Add Category</button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Name</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Always include?</th>
              <th className="px-4 py-2 text-right text-sm font-medium text-gray-600">Actions</th>
            </tr>
          </thead>

          <tbody className="bg-white divide-y divide-gray-100">
            {filtered.map((c, idx) => (
              <tr key={c.id}>
                <td className="px-4 py-3 text-sm">{`${(c.order ?? idx) + 1}. ${c.name}`}</td>
                <td className="px-4 py-3 text-sm">{c.alwaysInclude || c.always_include ? 'Yes' : 'No'}</td>
                <td className="px-4 py-3 text-right text-sm">
                  <div className="inline-flex items-center gap-2 relative">
                    <button
                      className="px-3 py-1 bg-white border rounded text-sm"
                      onClick={() => setOpenDropdownId((prev) => (prev === c.id ? null : c.id))}
                    >
                      Actions ▾
                    </button>

                    {openDropdownId === c.id && (
                      <div className="absolute right-0 mt-10 w-44 bg-white border rounded shadow-lg z-20">
                        <button
                          className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
                          onClick={() => handleMoveUp(c.id)}
                          disabled={(c.order ?? idx) === 0}
                        >
                          Move Up
                        </button>
                        <button
                          className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
                          onClick={() => handleMoveDown(c.id)}
                          disabled={(c.order ?? idx) >= (categories.length - 1)}
                        >
                          Move Down
                        </button>
                        <button className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50" onClick={() => openEdit(c)}>Edit</button>
                        <button className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-gray-50" onClick={() => handleDelete(c.id)}>Delete</button>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-sm text-gray-500">
                  {loading ? 'Loading...' : 'No categories found.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <AddEditCategoryModal
          isOpen={modalOpen}
          category={editing}
          onClose={() => { setModalOpen(false); setEditing(null); }}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
};

export default CategoriesTable;