import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { memo } from 'react';
import toast from 'react-hot-toast';
import { useUsersStore } from '../../store/useUsersStore';

const ROW_PREVIEW_LEN = 100;

const TemplatesListTable = ({ onEdit = () => {}, onUse = () => {} }) => {
    const selectedUser = useUsersStore((s) => s.getSelectedUser());
  // core store slices (kept minimal & stable)
  const users = useUsersStore((s) => s.users) || [];
  const selectedKey = useUsersStore((s) => s.selectedKey);
  const parentUid = useUsersStore((s) => s.parentUid || s.currentUser || null);
  const aiTemplatesSnapshot = useUsersStore((s) => s.aiTemplates) || [];
  const aiLoading = useUsersStore((s) => s.aiLoading) || false;
  const skills = selectedUser?.skills || [];
  

  // actions (capture from getState to avoid function identity/dep churn)
  const actionsRef = useRef({});
  useEffect(() => {
    const st = useUsersStore.getState();
    actionsRef.current.fetchUsers = st.fetchUsers || null;
    actionsRef.current.selectUser = st.selectUser || null;
    actionsRef.current.loadAiTemplates = st.loadAiTemplates || null;
    actionsRef.current.deleteAiTemplate = st.deleteAiTemplate || st.deleteTemplate || null;
  }, []);

  // helper to safely extract template content (handles string, array, object)
  const getTemplateContent = useCallback((t) => {
    const c = t?.content ?? t?.body ?? t?.text ?? '';
    if (typeof c === 'string') return c;
    if (Array.isArray(c)) return c.join('\n');
    if (c && typeof c === 'object') {
      if (typeof c.text === 'string') return c.text;
      if (typeof c.content === 'string') return c.content;
      try { return JSON.stringify(c); } catch { return String(c); }
    }
    return String(c || '');
  }, []);

  // derive selected sub-user from users + selectedKey
  const selectedSubUser = useMemo(() => {
    if (!selectedKey || !Array.isArray(users) || users.length === 0) return null;
    const sid = String(selectedKey);
    return users.find((u) => {
      const idCandidates = [
        u.document_id, u.documentId, u.sub_user_id, u.subUserId, u.id, u._id,
        u.sub_username, u.subUsername, u.username, u.email,
      ];
      return idCandidates.some((c) => typeof c !== 'undefined' && c !== null && String(c) === sid);
    }) || null;
  }, [users, selectedKey]);

  const selectedSubUserId = useMemo(() => {
    if (!selectedSubUser) return null;
    return selectedSubUser.document_id || selectedSubUser.sub_user_id || selectedSubUser.id || null;
  }, [selectedSubUser]);

  const [localTemplates, setLocalTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');

  const mountedRef = useRef(true);
  useEffect(() => { return () => { mountedRef.current = false; }; }, []);

  // UI specific state: preview expansion and dropdown menu
  const [expandedId, setExpandedId] = useState(null);
  const [dropdownOpenId, setDropdownOpenId] = useState(null);
  const dropdownRef = useRef(null);

    useEffect(() => {
    const onDocClick = (e) => {
      if (!dropdownRef.current) return;
      if (!dropdownRef.current.contains(e.target)) setDropdownOpenId(null);
    };
    window.addEventListener('click', onDocClick);
    return () => window.removeEventListener('click', onDocClick);
  }, []);

  // Ensure we have sub-users: fetch if none and parentUid present
  useEffect(() => {
    (async () => {
      try {
        if ((Array.isArray(users) && users.length > 0) || !parentUid) return;
        const fetchFn = actionsRef.current.fetchUsers;
        if (typeof fetchFn === 'function') {
          await fetchFn(parentUid);
        }
      } catch (err) {
        console.warn('fetchUsers failed', err);
      }
    })();
  }, [users.length, parentUid]);

  // Load ai_templates when selected sub-user changes.
  useEffect(() => {
    if (!selectedSubUserId) {
      setLocalTemplates([]);
      setLoading(false);
      return;
    }

    // Show sub-user embedded templates immediately (Firebase data)
    if (selectedSubUser && Array.isArray(selectedSubUser.ai_templates) && selectedSubUser.ai_templates.length > 0) {
      setLocalTemplates(selectedSubUser.ai_templates);
    } else if (Array.isArray(aiTemplatesSnapshot) && aiTemplatesSnapshot.length > 0) {
      setLocalTemplates(aiTemplatesSnapshot);
    } else {
      setLocalTemplates([]); // clear while we attempt to load
    }

    const load = async () => {
      const loadFn = actionsRef.current.loadAiTemplates;
      if (typeof loadFn !== 'function') {
        // no loader available — nothing more to do
        if (mountedRef.current) setLoading(false);
        return;
      }

      if (mountedRef.current) setLoading(true);
      try {
        const res = await loadFn(selectedSubUserId);
        if (!mountedRef.current) return;
        // prefer returned array from loader
        if (Array.isArray(res) && res.length > 0) {
          setLocalTemplates(res);
        } else if (Array.isArray(aiTemplatesSnapshot) && aiTemplatesSnapshot.length > 0) {
          setLocalTemplates(aiTemplatesSnapshot);
        } else if (selectedSubUser && Array.isArray(selectedSubUser.ai_templates)) {
          setLocalTemplates(selectedSubUser.ai_templates);
        } else {
          setLocalTemplates([]);
        }
      } catch (err) {
        console.warn('loadAiTemplates error', err);
        toast.error('Failed to load AI templates');
        setLocalTemplates(Array.isArray(aiTemplatesSnapshot) ? aiTemplatesSnapshot : (selectedSubUser?.ai_templates || []));
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    };

    load();
    // only when selectedSubUserId changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSubUserId]);

  // keep local in sync with aiTemplates snapshot if store updates them
  useEffect(() => {
    if (!Array.isArray(aiTemplatesSnapshot)) return;
    const cur = JSON.stringify(localTemplates || []);
    const snap = JSON.stringify(aiTemplatesSnapshot);
    if (cur !== snap && mountedRef.current) setLocalTemplates(aiTemplatesSnapshot);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aiTemplatesSnapshot]);

  // Show loading only when there are no templates to display yet
  const isBusy = (loading || aiLoading) && (Array.isArray(localTemplates) ? localTemplates.length === 0 : true);

  const normalizedQuery = query.trim().toLowerCase();

   const ROW_PREVIEW_LEN = 220;
  // const normalizedQuery = query.trim().toLowerCase();


  const filtered = useMemo(() => {
    const src = Array.isArray(localTemplates) ? localTemplates : [];
    if (!normalizedQuery) return src;
    return src.filter((t) => {
      const hay = ((getTemplateContent(t) || '') + ' ' + (t.title || '')).toLowerCase();
      return hay.includes(normalizedQuery);
    });
  }, [localTemplates, normalizedQuery, getTemplateContent]);

  const handleDelete = useCallback(async (tpl) => {
    if (!tpl || !tpl.id) return;
    if (!window.confirm('Delete this template? This cannot be undone.')) return;
    try {
      const delFn = actionsRef.current.deleteAiTemplate;
      if (typeof delFn === 'function' && selectedSubUserId) {
        await delFn(selectedSubUserId, tpl.id);
      } else if (typeof delFn === 'function') {
        await delFn(tpl.id);
      } else {
        throw new Error('No delete function available');
      }
      setLocalTemplates((prev) => (Array.isArray(prev) ? prev.filter((p) => p.id !== tpl.id) : []));
      toast.success('Template deleted');
    } catch (err) {
      console.error(err);
      toast.error(err?.message || 'Failed to delete template');
    } finally {
      setDropdownOpenId(null);
    }
  }, [selectedSubUserId]);


  const handleEdit = useCallback((tpl) => {
    setDropdownOpenId(null);
    onEdit(tpl);
  }, [onEdit]);

  const handleUse = useCallback((tpl) => {
    setDropdownOpenId(null);
    onUse(tpl);
  }, [onUse]);

    const parseLinks = useCallback((raw) => {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw.map(String).map(s => s.trim()).filter(Boolean);
    return String(raw).split(',').map(s => s.trim()).filter(Boolean);
  }, []);

   return (
    <div className="rounded shadow overflow-hidden bg-white">
      <div className="p-4 border-b" style={{ background: '#f8f4f7' }}>
        <div className="flex items-center justify-between flex-col sm:flex-row gap-3">
          <div>
            <div className="text-sm text-gray-700 font-medium">AI Templates</div>
            <div className="text-xs text-gray-500 mt-1">{selectedSubUser ? `Showing templates for ${selectedSubUser.sub_username || selectedSubUser.username || selectedSubUser.document_id}` : 'No sub-user selected'}</div>
          </div>

        </div>
      </div>

      <div className="p-4">
        {(loading || aiLoading) && (Array.isArray(localTemplates) && localTemplates.length === 0) ? (
          <div className="text-gray-600">You dont add templates yet Add Templates</div>
        ) : (filtered || []).length === 0 ? (
          <div className="text-center text-gray-500 py-12">No templates found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm divide-y">
              <thead>
                <tr className="text-left text-gray-600 border-b">
                  <th className="py-3 px-3 w-2/5">Content</th>
                  <th className="py-3 px-3 w-1/6">Portfolio Links</th>
                  <th className="py-3 px-3 w-1/6">Skills</th>
                  <th className="py-3 px-3 text-right w-1/6">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(filtered || []).map((t) => {
                  const content = getTemplateContent(t);
                  const short = content.length > ROW_PREVIEW_LEN ? content.slice(0, ROW_PREVIEW_LEN) + '…' : content;
                  const expanded = expandedId === t.id;
                  const links = parseLinks(t.portfolioLinks || t.portfolio_links || t.links);
                  return (
                    <tr key={t.id} className="hover:bg-gray-50 border-b align-top">
                      <td className="py-3 px-3 max-w-[60%] align-top">
                        {/* <div className="font-medium text-gray-800">{t.title || 'Untitled'}</div> */}
                        <div className="text-gray-600 mt-1 whitespace-pre-wrap break-words">
                          {expanded ? content : short}
                        </div>
                        {content.length > ROW_PREVIEW_LEN && (
                          <button
                            type="button"
                            className="text-xs text-blue-600 mt-2"
                            onClick={() => setExpandedId(expanded ? null : t.id)}
                          >
                            {expanded ? 'Show less' : 'Show more'}
                          </button>
                        )}
                      </td>

                      <td className="py-3 px-3 align-top">
                        {links.length > 0 ? (
                          <div className="flex flex-col">
                            {links.map((lnk, i) => (
                              <a key={i} href={lnk.startsWith('http') ? lnk : `https://${lnk}`} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline break-words mb-1">
                                {lnk}
                              </a>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-500">—</span>
                        )}
                      </td>

                      <td className="py-3 px-3 align-top">
                        {Array.isArray(t.skills) && t.skills.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {t.skills.slice(0, 5).map((s, i) => (
                              <span key={i} className="text-xs bg-gray-100 px-2 py-1 rounded">{s.name || s}</span>
                            ))}
                            {t.skills.length > 5 && <span className="text-xs text-gray-500">+{t.skills.length - 5}</span>}
                          </div>
                        ) : (
                          <span className="text-gray-500">All skills</span>
                        )}
                      </td>

                      <td className="py-3 px-3 align-top text-right">
                        <div className="relative inline-block" ref={dropdownRef}>
                          <button
                            onClick={(e) => { e.stopPropagation(); setDropdownOpenId(dropdownOpenId === t.id ? null : t.id); }}
                            className="px-3 py-1 bg-white border rounded text-sm hover:bg-gray-50 inline-flex items-center gap-2"
                          >
                            Actions
                            <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor"><path d="M5 8l5 5 5-5H5z" /></svg>
                          </button>

                          {dropdownOpenId === t.id && (
                            <div className="absolute right-0 mt-2 w-40 bg-white border rounded shadow z-20 text-sm">
                              <button onClick={() => handleEdit(t)} className="w-full text-left px-4 py-2 hover:bg-gray-50">Edit</button>
                              <div className="border-t" />
                              <button onClick={() => handleDelete(t)} className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50">Delete</button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
        {/* Skill Stats */}
            {selectedUser && Array.isArray(skills) && skills.length > 0 && (
              <section className="mt-8 bg-white rounded shadow p-6">
                <h2 className="text-lg font-semibold mb-4">Skill Stats</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
                  {skills.map((skill) => (
                    <div
                      key={skill.id ?? skill.name}
                      className="border rounded-lg px-4 py-3 shadow-sm bg-white flex flex-col justify-between"
                    >
                      <div className="text-sm font-semibold text-blue-700">
                        {skill.name}
                      </div>
                    </div>
                  ))}
                </div>  
              </section>
            )}
    </div>
  );
//   return (
//     <div className="rounded shadow overflow-hidden bg-white">
//       {/* <div className="p-4 border-b" style={{ background: '#f0f4f7' }}>
//         <div className="flex items-center justify-between flex-col sm:flex-row gap-3">
//           <div>
//             <div className="text-sm text-gray-700 font-medium">Not sure how to add AI templates?</div>
//             <div className="text-xs text-gray-500 mt-1">{selectedSubUser ? `Showing templates for ${selectedSubUser.sub_username || selectedSubUser.username || selectedSubUser.document_id}` : 'No sub-user selected'}</div>
//           </div>
//           <div>
//             <button className="bg-gray-700 text-white px-3 py-2 rounded" onClick={() => toast('Open docs or guide')}>Help me to setup templates.</button>
//           </div>
//         </div>
//       </div> */}
// {/* 
//       <div className="p-4 flex items-center justify-end border-b">
//         <input
//           type="search"
//           value={query}
//           onChange={(e) => setQuery(e.target.value)}
//           placeholder="Search templates..."
//           className="border px-3 py-2 rounded text-sm w-72"
//           disabled={loading || aiLoading}
//         />
//       </div> */}

//       <div className="p-4">
//         {isBusy ? (
//           <div className="text-gray-600">
//           Your Template not available. Please add a template.  
//           </div>
          
//         ) : (filtered || []).length === 0 ? (
//           <div className="text-center text-gray-500 py-12">No data available in table</div>
//         ) : (
//           <div className="overflow-x-auto">
//             <table className="min-w-full text-sm">
//               <thead>
//                 <tr className="text-left text-gray-600 border-b">
//                   <th className="py-3 px-2">Content</th>
//                   <th className="py-3 px-2">Portfolio</th>
//                   <th className="py-3 px-2">Skills</th>
//                   <th className="py-3 px-2 text-right">Actions</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {(filtered || []).map((t) => (
//                   <tr key={t.id} className="hover:bg-gray-50 border-b align-top">
//                     <td className="py-3 px-2 max-w-[60%]">
//                       {/* <div className="font-medium text-gray-800">{t.title || 'Untitled'}</div> */}
//                       <div className="text-gray-600 mt-1 whitespace-pre-wrap break-words">
//                         {getTemplateContent(t)}
//                       </div>
//                     </td>
//                     <td className="py-3 px-2 align-top">
//                       {t.portfolioLinks ? (
//                         <a href={String(t.portfolioLinks).split(',')[0].trim()} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">View</a>
//                       ) : (
//                         <span className="text-gray-500">—</span>
//                       )}
//                     </td>
//                     <td className="py-3 px-2 align-top">
//                       {Array.isArray(t.skills) && t.skills.length > 0 ? (
//                         <div className="flex flex-wrap gap-1">
//                           {t.skills.slice(0, 5).map((s, i) => (
//                             <span key={i} className="text-xs bg-gray-100 px-2 py-1 rounded">{s.name || s}</span>
//                           ))}
//                           {t.skills.length > 5 && <span className="text-xs text-gray-500">+{t.skills.length - 5}</span>}
//                         </div>
//                       ) : (
//                         <span className="text-gray-500">All skills</span>
//                       )}
//                     </td>
//                     <td className="py-3 px-2 align-top text-right">
//                       <div className="inline-flex gap-2">
//                         <button onClick={() => handleEdit(t)} className="px-3 py-1 bg-white border rounded text-sm hover:bg-gray-50">Edit</button>
//                         <button onClick={() => handleDelete(t)} className="px-3 py-1 bg-white border rounded text-sm text-red-600 hover:bg-red-50">Delete</button>
//                         {/* <button onClick={() => handleUse(t)} className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700">Use</button> */}
//                       </div>
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         )}
//       </div>
//     </div>
//   );
};

TemplatesListTable.propTypes = {
  onEdit: PropTypes.func,
  onUse: PropTypes.func,
};

export default memo(TemplatesListTable);