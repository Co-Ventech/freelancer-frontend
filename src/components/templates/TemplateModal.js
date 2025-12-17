import React, { useState, useEffect, useRef } from 'react';

const TemplateModal = ({ isOpen, categories = [], template, onClose, onSave, isLoading = false }) => {
  const [categoryId, setCategoryId] = useState('');
  const [content, setContent] = useState('');
  const [errors, setErrors] = useState({});
  const textareaRef = useRef(null);

  // Wildcards available for users
  const WILDCARDS = [
    { token: '{{client_name}}', label: 'Client name' },
    { token: '{{bidder_name}}', label: 'Your name' },
    { token: '{{skills}}', label: 'Skills' },
    { token: '{{job_title}}', label: 'Job title' },
    { token: '{{budget}}', label: 'Budget' },
  ];

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

  // Insert wildcard at current caret position in textarea
  const insertWildcard = (token) => {
    const el = textareaRef.current;
    if (!el) {
      setContent((prev) => (prev ? prev + token : token));
      return;
    }
    const start = el.selectionStart ?? content.length;
    const end = el.selectionEnd ?? content.length;
    const before = content.slice(0, start);
    const after = content.slice(end);
    const next = `${before}${token}${after}`;
    setContent(next);
    // restore focus and caret after the inserted token
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + token.length;
      el.setSelectionRange(pos, pos);
    });
  };

  // Copy token to clipboard
  const copyWildcard = async (token) => {
    if (!navigator?.clipboard) {
      // fallback
      try {
        const tmp = document.createElement('textarea');
        tmp.value = token;
        document.body.appendChild(tmp);
        tmp.select();
        document.execCommand('copy');
        document.body.removeChild(tmp);
      } catch {
        // ignore
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(token);
    } catch {
      // ignore
    }
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

          {/* Wildcards helper */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">Available variables</label>
              <p className="text-xs text-gray-400">Click to insert</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {WILDCARDS.map((w) => (
                <div key={w.token} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => insertWildcard(w.token)}
                    className="text-xs bg-gray-100 hover:bg-gray-200 border rounded px-2 py-1 text-gray-800"
                    title={`Insert ${w.token}`}
                    disabled={isLoading}
                  >
                    {w.token}
                  </button>
                  <button
                    type="button"
                    onClick={() => copyWildcard(w.token)}
                    className="text-xs bg-white border rounded px-2 py-1 text-gray-500 hover:text-gray-700"
                    title={`Copy ${w.token}`}
                    disabled={isLoading}
                  >
                    Copy
                  </button>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Use these variables inside your template content. Example: Hi<span className="font-mono bg-gray-50 px-1 rounded">{'{client_name}'}</span>
            </p>
          </div>

          {/* Content Field */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Template Content <span className="text-red-500">*</span>
            </label>
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                setErrors({ ...errors, content: '' });
              }}
              placeholder={
`Enter your proposal template text here...

You can use variables like:
{{client_name}} - Client name
{{bidder_name}} - Your name
{{skills}} - Job skills
{{job_title}} - Job title
{{budget}} - Project budget`
              }
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
