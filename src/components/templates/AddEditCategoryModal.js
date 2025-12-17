import React, { useEffect, useState } from 'react';

const AddEditCategoryModal = ({ isOpen = true, category = null, onClose, onSubmit }) => {
  const [name, setName] = useState(category?.name || '');
  const [alwaysInclude, setAlwaysInclude] = useState(!!(category?.alwaysInclude || category?.always_include));

  useEffect(() => {
    setName(category?.name || '');
    setAlwaysInclude(!!(category?.alwaysInclude || category?.always_include));
  }, [category]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    const payload = {
      id: category?.id,
      name: (name || '').trim() || 'Untitled',
      alwaysInclude: !!alwaysInclude,
    };
    onSubmit && onSubmit(payload);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16">
      <div className="absolute inset-0 bg-black opacity-40" onClick={onClose} />
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl z-10 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">{category ? 'Edit Category' : 'Add Category'}</h3>
          <button onClick={onClose} className="text-gray-500">&times;</button>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="text-sm text-gray-600 block mb-1">Name</label>
            <input value={name} onChange={(e)=>setName(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2 text-sm" />
          </div>

          <div>
            <label className="text-sm text-gray-600 block mb-1">Include in every bid?</label>
            <select value={alwaysInclude ? 'yes' : 'no'} onChange={(e)=>setAlwaysInclude(e.target.value === 'yes')} className="w-full border border-gray-300 rounded px-3 py-2 text-sm">
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 border rounded">Back</button>
          <button onClick={handleSubmit} className="px-4 py-2 bg-green-600 text-white rounded">Submit</button>
        </div>
      </div>
    </div>
  );
};

export default AddEditCategoryModal;