// import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
// import PropTypes from 'prop-types';
// import { memo } from 'react';
// import toast from 'react-hot-toast';
// import { useUsersStore } from '../../store/useUsersStore';

// const HEADER_BG = '#27ae60';
// const MIN_CONTENT = 20;
// const MAX_CONTENT = 5000;
// const DEFAULT_TARGET = 150;

// const WILDCARDS = [
//   { token: '{{Owner Full Name}}', label: 'Owner Full Name' },
//   { token: '{{Owner First Name}}', label: 'Owner First Name' },
//   { token: '{{Portfolio Links}}', label: 'Portfolio Links' },
//   { token: '{{Job Skills}}', label: 'Job Skills' },
//   { token: '{{Matching Job Skills}}', label: 'Matching Job Skills' },
//   { token: '{{Country}}', label: 'Country' },
// ];

// const countWords = (text = '') => {
//   const s = String(text).trim();
//   if (!s) return 0;
//   return s.split(/\s+/).filter(Boolean).length;
// };

// const SimpleAddTemplateForm = ({ onSuccess = () => {}, onCancel = () => {} }) => {
//   const addTemplate = useUsersStore((s) => s.addTemplate);
//   const aiLoading = useUsersStore((s) => s.aiLoading);
//   const aiError = useUsersStore((s) => s.aiError);
//   const getSelectedUser = useUsersStore((s) => s.getSelectedUser);
//   const currentUser = useUsersStore((s) => s.parentUid || s.currentUser || null);

//   const selectedSubUser = getSelectedUser ? getSelectedUser() : null;
//   const selectedSubUserId = selectedSubUser ? (selectedSubUser.document_id || selectedSubUser.sub_user_id || selectedSubUser.id) : null;

//   const [title, setTitle] = useState('');
//   const [content, setContent] = useState('');
//   const [targetWordCount, setTargetWordCount] = useState(DEFAULT_TARGET);
//   const [portfolioLinks, setPortfolioLinks] = useState('');
//   const [saving, setSaving] = useState(false);

//   const textareaRef = useRef(null);

//   useEffect(() => {
//     const onAddClick = () => { /* focus first field */ textareaRef.current?.focus(); };
//     document.addEventListener('ai:add-template', onAddClick);
//     return () => document.removeEventListener('ai:add-template', onAddClick);
//   }, []);

//   const wordCount = useMemo(() => countWords(content), [content]);

//   const insertAtCursor = useCallback((token) => {
//     const el = textareaRef.current;
//     if (!el) {
//       setContent((prev) => (prev ? prev + ' ' + token : token));
//       return;
//     }
//     const start = el.selectionStart ?? el.value.length;
//     const end = el.selectionEnd ?? el.value.length;
//     const before = content.slice(0, start);
//     const after = content.slice(end);
//     const next = `${before}${token}${after}`;
//     setContent(next);
//     requestAnimationFrame(() => {
//       el.focus();
//       const pos = start + token.length;
//       el.setSelectionRange(pos, pos);
//     });
//   }, [content]);

//   const resetForm = useCallback(() => {
//     setTitle('');
//     setContent('');
//     setTargetWordCount(DEFAULT_TARGET);
//     setPortfolioLinks('');
//   }, []);

//   const handleSave = useCallback(async (e) => {
//     e.preventDefault();
//     if (!currentUser) {
//       toast.error('Please login before saving templates');
//       return;
//     }
//     if (!content || content.trim().length < MIN_CONTENT) {
//       toast.error(`Content must be at least ${MIN_CONTENT} characters`);
//       return;
//     }
//     if (content.length > MAX_CONTENT) {
//       toast.error(`Content must be at most ${MAX_CONTENT} characters`);
//       return;
//     }
//     if (!targetWordCount || Number(targetWordCount) < 10) {
//       toast.error('Target word count must be at least 10');
//       return;
//     }

//     setSaving(true);
//     const payload = {
//       title: (title || 'Untitled').trim(),
//       content: content.trim(),
//       wordCount: wordCount,
//       targetWordCount: Number(targetWordCount),
//       portfolioLinks: (portfolioLinks || '').trim(),
//       skills: [], // optional: extend UI to add skills
//       createdAt: Date.now(),
//       updatedAt: Date.now(),
//       status: 'active',
//     };

//     try {
//      // Call store with explicit signature: addTemplate(userId, subUserId, template)
//       // This matches the useUsersStore API implemented earlier.
//       const saved = await addTemplate(currentUser, selectedSubUserId, payload);
 

//       toast.success('Template saved');
//       resetForm();
//       onSuccess(saved);
//     } catch (err) {
//       console.error('Save template failed', err);
//       toast.error(err?.message || 'Failed to save template');
//     } finally {
//       setSaving(false);
//     }
//   }, [addTemplate, content, currentUser, title, wordCount, targetWordCount, portfolioLinks, selectedSubUserId, selectedSubUser, resetForm, onSuccess]);

//   return (
//     <div className="max-w-4xl mx-auto rounded shadow">
//       <div className="p-4 flex items-center justify-between" style={{ background: HEADER_BG }}>
//         <h3 className="text-white text-lg font-semibold">Add AI Template</h3>
//         <button onClick={onCancel} className="text-white bg-white/10 px-3 py-2 rounded">Back</button>
//       </div>

//       <form onSubmit={handleSave} className="bg-white p-6 space-y-4">
//         <div className="p-4" style={{ background: '#f0f4f7', borderRadius: 6 }}>
//           <div className="flex items-center justify-between">
//             <div className="text-sm text-gray-700">Not sure how to add AI templates?</div>
//             <button type="button" className="bg-gray-700 text-white px-3 py-2 rounded" onClick={() => toast('Open docs or guide')}>Help me to setup templates.</button>
//           </div>
//         </div>

//         <div className="p-4 bg-gray-100 rounded text-sm text-gray-700">
//           New AI templates will be available instantly for AI bidding but our team may reject content or contact you to change it later.
//         </div>

//         <div>
//           <label className="text-sm font-medium text-gray-700">Wildcard Words</label>
//           <div className="mt-2 flex flex-wrap gap-2">
//             {WILDCARDS.map((w) => (
//               <button
//                 key={w.token}
//                 type="button"
//                 onClick={() => insertAtCursor(w.token)}
//                 className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs hover:opacity-90"
//               >
//                 {w.token}
//               </button>
//             ))}
//           </div>
//         </div>

//         <div>
//           <label className="text-sm font-medium text-gray-700">About how many words should this bid be?</label>
//           <input
//             type="number"
//             min={10}
//             max={5000}
//             value={targetWordCount}
//             onChange={(e) => setTargetWordCount(Math.max(10, Number(e.target.value || DEFAULT_TARGET)))}
//             className="mt-2 w-40 border px-3 py-2 rounded"
//           />
//           <div className="text-xs text-gray-500 mt-2">{wordCount} words</div>
//         </div>

//         <div>
//           <div className="flex items-center justify-between">
//             <label className="text-sm font-medium text-gray-700">Content</label>
//             <button type="button" className="bg-gray-700 text-white px-3 py-1 rounded text-xs" onClick={() => toast('Show examples')}>Show examples</button>
//           </div>
//           <textarea
//             ref={textareaRef}
//             value={content}
//             onChange={(e) => setContent(e.target.value)}
//             placeholder="Enter your proposal content..."
//             className="w-full border rounded px-3 py-2 mt-2 min-h-[300px] resize-vertical"
//           />
//           <div className="flex justify-between text-xs text-gray-500 mt-1">
//             <div className="italic">You can enter your name, company name, relevant skills and experience in above input box.</div>
//             <div>{content.length} characters • {wordCount} words</div>
//           </div>
//         </div>

//         <div className="p-3 bg-gray-50 rounded text-sm">
//           <div className="italic text-gray-700">DO NOT INCLUDE YOUR PORTFOLIO LINKS IN CONTENT. Instead use "Portfolio Links" wildcard and input links in the input box below.</div>
//         </div>

//         <div>
//           <label className="text-sm font-medium text-gray-700">Portfolio Links</label>
//           <input
//             value={portfolioLinks}
//             onChange={(e) => setPortfolioLinks(e.target.value)}
//             placeholder="Enter portfolio links separated by comma"
//             className="w-full border px-3 py-2 rounded mt-2"
//           />
//         </div>

//         <div className="flex items-center justify-end gap-3">
//           <button type="button" onClick={() => { resetForm(); onCancel(); }} className="px-4 py-2 border rounded" disabled={saving || aiLoading}>Cancel</button>
//           <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded" disabled={saving || aiLoading}>
//             {saving ? '💾 Saving...' : 'Save Template'}
//           </button>
//         </div>

//         {aiError && <div className="text-sm text-red-600">{aiError}</div>}
//       </form>
//     </div>
//   );
// };

// SimpleAddTemplateForm.propTypes = {
//   onSuccess: PropTypes.func,
//   onCancel: PropTypes.func,
// };

// export default memo(SimpleAddTemplateForm);


// ...existing code...
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { memo } from 'react';
import toast from 'react-hot-toast';
import { useUsersStore } from '../../store/useUsersStore';

const HEADER_BG = '#27ae60';
const MIN_CONTENT = 20;
const MAX_CONTENT = 5000;
const DEFAULT_TARGET = 150;

const WILDCARDS = [
  { token: '{{Owner Full Name}}', label: 'Owner Full Name' },
  { token: '{{Owner First Name}}', label: 'Owner First Name' },
  { token: '{{Portfolio Links}}', label: 'Portfolio Links' },
  { token: '{{Job Skills}}', label: 'Job Skills' },
  { token: '{{Matching Job Skills}}', label: 'Matching Job Skills' },
  { token: '{{Country}}', label: 'Country' },
];

const countWords = (text = '') => {
  const s = String(text).trim();
  if (!s) return 0;
  return s.split(/\s+/).filter(Boolean).length;
};

const SimpleAddTemplateForm = ({ onSuccess = () => {}, onCancel = () => {}, selectedTemplate: propSelectedTemplate = null }) => {
  // prefer ai-specific add; also grab legacy addTemplate as fallback
  const addAiTemplate = useUsersStore((s) => s.addAiTemplate);
  const addTemplate = useUsersStore((s) => s.addTemplate);
  const updateAiTemplate = useUsersStore((s) => s.updateAiTemplate || s.updateTemplate);
  const aiLoading = useUsersStore((s) => s.aiLoading);
  const aiError = useUsersStore((s) => s.aiError);
  const getSelectedUser = useUsersStore((s) => s.getSelectedUser);

    const storeSelectedTemplate = useUsersStore((s) => s.selectedTemplate || s.selectedAiTemplate || null);
   const selectedTemplate = propSelectedTemplate || storeSelectedTemplate;

  const selectedSubUser = getSelectedUser ? getSelectedUser() : null;
  const selectedSubUserId = selectedSubUser ? (selectedSubUser.document_id || selectedSubUser.sub_user_id || selectedSubUser.id) : null;

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [targetWordCount, setTargetWordCount] = useState(DEFAULT_TARGET);
  const [portfolioLinks, setPortfolioLinks] = useState('');
  const [saving, setSaving] = useState(false);

  const textareaRef = useRef(null);
  const handleBack = useCallback(() => {
    // only call onCancel (close modal). DO NOT navigate so sidebar/layout remains.
    try { if (typeof onCancel === 'function') onCancel(); } catch (e) { /* ignore */ }
  }, [onCancel]);

 // Prefill when an existing template is selected for edit
  useEffect(() => {
    if (selectedTemplate && typeof selectedTemplate === 'object') {
      setTitle(selectedTemplate.title || '');
      setContent(selectedTemplate.content || selectedTemplate.body || selectedTemplate.text || '');
      setTargetWordCount(selectedTemplate.targetWordCount || selectedTemplate.targetWords || DEFAULT_TARGET);
      setPortfolioLinks(selectedTemplate.portfolioLinks || selectedTemplate.portfolio_links || '');
    } else {
      // no selected template -> reset form
      resetForm();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTemplate]);


  useEffect(() => {
    const onAddClick = () => { /* focus first field */ textareaRef.current?.focus(); };
    document.addEventListener('ai:add-template', onAddClick);
    return () => document.removeEventListener('ai:add-template', onAddClick);
  }, []);

  const wordCount = useMemo(() => countWords(content), [content]);

  const insertAtCursor = useCallback((token) => {
    const el = textareaRef.current;
    if (!el) {
      setContent((prev) => (prev ? prev + ' ' + token : token));
      return;
    }
    const start = el.selectionStart ?? el.value.length;
    const end = el.selectionEnd ?? el.value.length;
    const before = content.slice(0, start);
    const after = content.slice(end);
    const next = `${before}${token}${after}`;
    setContent(next);
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + token.length;
      el.setSelectionRange(pos, pos);
    });
  }, [content]);

  const resetForm = useCallback(() => {
    setTitle('');
    setContent('');
    setTargetWordCount(DEFAULT_TARGET);
    setPortfolioLinks('');
  }, []);

  const handleSave = useCallback(async (e) => {
    e.preventDefault();

    if (!selectedSubUser && !selectedSubUserId) {
      toast.error('Please select a sub-user before saving templates');
      return;
    }
    if (!content || content.trim().length < MIN_CONTENT) {
      toast.error(`Content must be at least ${MIN_CONTENT} characters`);
      return;
    }
    if (content.length > MAX_CONTENT) {
      toast.error(`Content must be at most ${MAX_CONTENT} characters`);
      return;
    }
    if (!targetWordCount || Number(targetWordCount) < 10) {
      toast.error('Target word count must be at least 10');
      return;
    }

    setSaving(true);
    const payload = {
      // title: (title || 'Untitled').trim(),
      content: content.trim(),
      wordCount: wordCount,
      targetWordCount: Number(targetWordCount),
      portfolioLinks: (portfolioLinks || '').trim(),
      skills: [], // optional: extend UI to add skills
      createdAt: Date.now(),
      updatedAt: Date.now(),
      status: 'active',
    };

 try {
      let saved;
      if (selectedTemplate && selectedTemplate.id) {
        // EDIT flow: prefer explicit update function
        if (typeof updateAiTemplate === 'function') {
          const target = selectedSubUser || selectedSubUserId;
          // try common signatures: (subUser, id, payload), (subUserId, id, payload), (id, payload)
          try {
            saved = await updateAiTemplate(target, selectedTemplate.id, payload);
          } catch (err1) {
            try {
              saved = await updateAiTemplate(selectedSubUserId, selectedTemplate.id, payload);
            } catch (err2) {
              saved = await updateAiTemplate(selectedTemplate.id, payload);
            }
          }
        } else if (typeof addAiTemplate === 'function') {
          // fallback: upsert by preserving id (store may treat id presence as update)
          payload.id = selectedTemplate.id;
          const target = selectedSubUser || selectedSubUserId;
          saved = await addAiTemplate(target, payload);
        } else if (typeof addTemplate === 'function') {
          // legacy fallback: try to call update via addTemplate signatures
          const storeState = useUsersStore.getState();
          const parentUid = storeState.parentUid || storeState.currentUser || null;
          try {
            if (parentUid && selectedSubUserId) {
              // try parent, sub, id-update pattern if supported
              saved = await addTemplate(parentUid, selectedSubUserId, { ...payload, id: selectedTemplate.id });
            } else {
              saved = await addTemplate(selectedSubUserId || selectedSubUser, { ...payload, id: selectedTemplate.id });
            }
          } catch (err) {
            // last resort: include id and call addTemplate
            saved = await addTemplate(selectedSubUserId || selectedSubUser, { ...payload, id: selectedTemplate.id });
          }
        } else {
          throw new Error('No store function available to update template');
        }
      } else {
        // CREATE flow
        if (typeof addAiTemplate === 'function') {
          const target = selectedSubUser || selectedSubUserId;
          saved = await addAiTemplate(target, payload);
        } else if (typeof addTemplate === 'function') {
          const storeState = useUsersStore.getState();
          const parentUid = storeState.parentUid || storeState.currentUser || null;
          if (parentUid && selectedSubUserId) {
            saved = await addTemplate(parentUid, selectedSubUserId, payload);
          } else {
            saved = await addTemplate(selectedSubUserId || selectedSubUser, payload);
          }
        } else {
          throw new Error('No store function available to save template');
        }
      }

      toast.success('Template saved');
      resetForm();
      onSuccess(saved);
    } catch (err) {
      console.error('Save template failed', err);
      toast.error(err?.message || 'Failed to save template');
    } finally {
      setSaving(false);
    }
  }, [
    addAiTemplate, addTemplate, updateAiTemplate,
    content, title, wordCount, targetWordCount, portfolioLinks,
    selectedSubUser, selectedSubUserId, selectedTemplate, resetForm, onSuccess,]);
  return (
  <div className="h-full flex flex-col">
      <div className="p-4 flex items-center justify-between" style={{ background: HEADER_BG }}>
        <h3 className="text-white text-lg font-semibold">{selectedTemplate && selectedTemplate.id ? 'Edit AI Template' : 'Add AI Template'}</h3>
        <button onClick={handleBack} className="text-white bg-white/10 px-3 py-2 rounded">Back</button>
      </div>
      <form onSubmit={handleSave} className="bg-white p-6 space-y-4">
        {/* <div className="p-4" style={{ background: '#f0f4f7', borderRadius: 6 }}>
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">Not sure how to add AI templates?</div>
            <button type="button" className="bg-gray-700 text-white px-3 py-2 rounded" onClick={() => toast('Open docs or guide')}>Help me to setup templates.</button>
          </div>
        </div> */}

        {/* <div className="p-4 bg-gray-100 rounded text-sm text-gray-700">
          New AI templates will be available instantly for AI bidding but our team may reject content or contact you to change it later.
        </div> */}

        <div>
          <label className="text-sm font-medium text-gray-700">Wildcard Words</label>
          <div className="mt-2 flex flex-wrap gap-2">
            {WILDCARDS.map((w) => (
              <button
                key={w.token}
                type="button"
                onClick={() => insertAtCursor(w.token)}
                className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs hover:opacity-90"
              >
                {w.token}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">About how many words should this bid be?</label>
          <input
            type="number"
            min={10}
            max={5000}
            value={targetWordCount}
            onChange={(e) => setTargetWordCount(Math.max(10, Number(e.target.value || DEFAULT_TARGET)))}
            className="mt-2 w-40 border px-3 py-2 rounded"
          />
          <div className="text-xs text-gray-500 mt-2">{wordCount} words</div>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">Content</label>
            {/* <button type="button" className="bg-gray-700 text-white px-3 py-1 rounded text-xs" onClick={() => toast('Show examples')}>Show examples</button> */}
          </div>
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Enter your proposal content..."
            className="w-full border rounded px-3 py-2 mt-2 min-h-[300px] resize-vertical"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <div className="italic">You can enter your name, company name, relevant skills and experience in above input box.</div>
            <div>{content.length} characters • {wordCount} words</div>
          </div>
        </div>

        <div className="p-3 bg-gray-50 rounded text-sm">
          <div className="italic text-gray-700">DO NOT INCLUDE YOUR PORTFOLIO LINKS IN CONTENT. Instead use "Portfolio Links" wildcard and input links in the input box below.</div>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">Portfolio Links</label>
          <input
            value={portfolioLinks}
            onChange={(e) => setPortfolioLinks(e.target.value)}
            placeholder="Enter portfolio links separated by comma"
            className="w-full border px-3 py-2 rounded mt-2"
          />
        </div>

        <div className="flex items-center justify-end gap-3">
          <button type="button" onClick={() => { resetForm(); onCancel(); }} className="px-4 py-2 border rounded" disabled={saving || aiLoading}>Cancel</button>
          <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded" disabled={saving || aiLoading}>
            {saving ? '💾 Saving...' : (selectedTemplate && selectedTemplate.id ? 'Update Template' : 'Save Template')}
          </button>
        </div>

        {aiError && <div className="text-sm text-red-600">{aiError}</div>}
      </form>
    </div>
  );
};

SimpleAddTemplateForm.propTypes = {
  onSuccess: PropTypes.func,
  onCancel: PropTypes.func,
};

export default memo(SimpleAddTemplateForm);