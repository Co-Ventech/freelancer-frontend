import React, { useState, useEffect } from 'react';

const TemplateModal = ({ isOpen, categories = [], template, onClose, onSave, isLoading = false }) => {
  const [categoryId, setCategoryId] = useState('');
  const [content, setContent] = useState('');
  const [errors, setErrors] = useState({});

  // ============ Initialize Form on Template Change ============
  useEffect(() => {
    if (template) {
      // Editing mode
      setCategoryId(template.categoryId || '');
      setContent(template.content || '');
      setErrors({});
    } else {
      // Add mode
      setCategoryId('');
      setContent('');
      setErrors({});
    }
  }, [template, isOpen]);

  // ============ Validate Form ============
  const validate = () => {
    const newErrors = {};

    if (!categoryId.trim()) {
      newErrors.categoryId = 'Category is required';
    }

    if (!content.trim()) {
      newErrors.content = 'Content is required';
    } else if (content.trim().length < 5) {
      newErrors.content = 'Content must be at least 5 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ============ Handle Submit ============
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    // Find category name from ID
    const selectedCategory = categories.find((c) => c.id === categoryId);

    const payload = {
      ...(template?.id && { id: template.id }),
      categoryId,
      categoryName: selectedCategory?.name || 'Uncategorized',
      content: content.trim(),
      skills: 'All skills',
    };

    onSave(payload);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black bg-opacity-30"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded shadow-lg max-w-2xl w-full mx-4 p-6 max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            {template ? 'Edit Template' : 'Add New Template'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-light"
            disabled={isLoading}
          >
            ×
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* Category Field */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              value={categoryId}
              onChange={(e) => {
                setCategoryId(e.target.value);
                setErrors({ ...errors, categoryId: '' });
              }}
              className={`w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.categoryId ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={isLoading}
            >
              <option value="">-- Select a Category --</option>
              {Array.isArray(categories) &&
                categories.length > 0 &&
                categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name || 'Unnamed Category'}
                  </option>
                ))}
            </select>
            {errors.categoryId && (
              <p className="text-red-500 text-xs mt-1">{errors.categoryId}</p>
            )}
            {categories.length === 0 && (
              <p className="text-yellow-600 text-xs mt-1">
                ⚠️ No categories available. Please create categories first.
              </p>
            )}
          </div>

          {/* Content Field */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Template Content <span className="text-red-500">*</span>
            </label>
            <textarea
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                setErrors({ ...errors, content: '' });
              }}
              placeholder="Enter your proposal template text here...

You can use variables like:
[Owner Full Name] - Client name
[Job Skills] - Required skills
[Budget] - Project budget"
              className={`w-full border rounded px-3 py-2 text-sm font-sans focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical ${
                errors.content ? 'border-red-500' : 'border-gray-300'
              }`}
              rows={8}
              disabled={isLoading}
            />
            {errors.content && (
              <p className="text-red-500 text-xs mt-1">{errors.content}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              {content.length} characters
            </p>
          </div>

          {/* Skills Info (Read-Only) */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Skills
            </label>
            <div className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-gray-50 text-gray-600">
              All skills
            </div>
            <p className="text-xs text-gray-500 mt-1">
              This template applies to all skills in this category
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 mt-8">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              disabled={isLoading || categories.length === 0}
            >
              {isLoading ? 'Saving...' : template ? 'Update Template' : 'Add Template'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TemplateModal;