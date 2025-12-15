// // import React, { useCallback, useEffect, useState } from 'react';
// // import { memo } from 'react';
// // import { useNavigate } from 'react-router-dom';
// // import toast from 'react-hot-toast';
// // import { useUsersStore } from '../../store/useUsersStore';
// // import SimpleAddTemplateForm from './SimpleAddTemplateForm';
// // import TemplatesListTable from './TemplatesListTable';

// // const HEADER_BG = '#27ae60';

// // const AITemplatesPage = () => {
// //   const navigate = useNavigate();
// //   const [showForm, setShowForm] = useState(false);

// //   const currentUserId = useUsersStore((s) => s.parentUid || s.currentUser || null);
// //   const fetchTemplates = useUsersStore((s) => s.fetchTemplates);
// //   const loadTemplates = useUsersStore((s) => s.loadTemplates);

// //   const handleBack = useCallback(() => navigate(-1), [navigate]);
// //   const openForm = useCallback(() => setShowForm(true), []);
// //   const closeForm = useCallback(() => setShowForm(false), []);

// //   useEffect(() => {
// //     (async () => {
// //       try {
// //         if (typeof fetchTemplates === 'function' && currentUserId) {
// //           await fetchTemplates(currentUserId);
// //         } else if (typeof loadTemplates === 'function') {
// //           // loadTemplates will be called inside TemplatesListTable as fallback
// //         }
// //       } catch (err) {
// //         console.error('Failed to load templates', err);
// //         toast.error('Failed to load templates');
// //       }
// //     })();
// //   }, [currentUserId, fetchTemplates, loadTemplates]);

// //   const handleAddSuccess = useCallback((saved) => {
// //     toast.success('Template saved');
// //     setShowForm(false);
// //     if (typeof fetchTemplates === 'function' && currentUserId) {
// //       fetchTemplates(currentUserId).catch((e) => console.warn(e));
// //     }
// //   }, [fetchTemplates, currentUserId]);

// //   const handleEdit = useCallback((tpl) => {
// //     // open form and prefill via store if desired
// //     const selectTemplate = useUsersStore.getState().selectTemplate;
// //     if (typeof selectTemplate === 'function') selectTemplate(tpl);
// //     setShowForm(true);
// //   }, []);

// //   const handleUse = useCallback((tpl) => {
// //     const selectTemplate = useUsersStore.getState().selectTemplate;
// //     if (typeof selectTemplate === 'function') selectTemplate(tpl);
// //     toast.success('Template selected');
// //   }, []);

// //   return (
// //     <div className="min-h-screen bg-gray-50">
// //       <div style={{ background: HEADER_BG }} className="text-white">
// //         <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
// //           <div className="flex items-center gap-3">
// //             <button onClick={handleBack} className="bg-white/10 hover:bg-white/20 px-3 py-2 rounded">Back</button>
// //             <h1 className="text-lg font-semibold">AI Templates</h1>
// //           </div>
// //           <div>
// //             <button onClick={openForm} className="bg-white text-green-600 px-3 py-2 rounded">Add Template</button>
// //           </div>
// //         </div>
// //       </div>

// //       <div className="max-w-6xl mx-auto p-4">
// //         <div className="mb-6">
// //          <TemplatesListTable onEdit={handleEdit} onUse={handleUse} onAdd={openForm} />
// //         </div>

// //         {showForm && (
// //           <div className="mb-6">
// //             <SimpleAddTemplateForm onSuccess={handleAddSuccess} onCancel={closeForm} />
// //           </div>
// //         )}
// //       </div>
// //     </div>
// //   );
// // };

// // export default memo(AITemplatesPage);


// // ...existing code...
// import React, { useCallback, useEffect, useMemo, useState } from 'react';
// import { memo } from 'react';
// import { useNavigate } from 'react-router-dom';
// import toast from 'react-hot-toast';
// import { useUsersStore } from '../../store/useUsersStore';
// import SimpleAddTemplateForm from './SimpleAddTemplateForm';
// import TemplatesListTable from './TemplatesListTable';

// const HEADER_BG = '#27ae60';

// const AITemplatesPage = () => {
//   const navigate = useNavigate();
//   const [showForm, setShowForm] = useState(false);

//   const getSelectedUser = useUsersStore((s) => s.getSelectedUser);
//   const selectedSubUser = getSelectedUser ? getSelectedUser() : null;
//   const selectedSubUserId = selectedSubUser ? (selectedSubUser.document_id || selectedSubUser.sub_user_id || selectedSubUser.id) : null;

//   // use ai-specific loader
//   const loadAiTemplates = useUsersStore((s) => s.loadAiTemplates);
//   const fetchTemplates = useUsersStore((s) => s.fetchUsers); // keep available if needed

//   const handleBack = useCallback(() => navigate(-1), [navigate]);
//   const openForm = useCallback(() => setShowForm(true), []);
//   const closeForm = useCallback(() => setShowForm(false), []);

//   // load templates for the selected sub-user on mount / change
//   useEffect(() => {
//     (async () => {
//       try {
//         if (typeof loadAiTemplates === 'function' && selectedSubUserId) {
//           await loadAiTemplates(selectedSubUserId);
//         } else if (typeof fetchTemplates === 'function') {
//           // fallback: refresh sub-users which will populate templates via other flows
//           const parentUid = useUsersStore.getState().parentUid;
//           if (parentUid) await fetchTemplates(parentUid);
//         }
//       } catch (err) {
//         console.error('Failed to load AI templates', err);
//         toast.error('Failed to load AI templates');
//       }
//     })();
//   }, [selectedSubUserId, loadAiTemplates, fetchTemplates]);

//   const handleAddSuccess = useCallback((saved) => {
//     toast.success('Template saved');
//     setShowForm(false);
//     // reload templates for selected sub-user
//     if (typeof loadAiTemplates === 'function' && selectedSubUserId) {
//       loadAiTemplates(selectedSubUserId).catch((e) => console.warn('loadAiTemplates after save failed', e));
//     }
//   }, [loadAiTemplates, selectedSubUserId]);

//   const handleEdit = useCallback((tpl) => {
//     const selectTemplate = useUsersStore.getState().selectTemplate;
//     if (typeof selectTemplate === 'function') selectTemplate(tpl);
//     setShowForm(true);
//   }, []);

//   const handleUse = useCallback((tpl) => {
//     const selectTemplate = useUsersStore.getState().selectTemplate;
//     if (typeof selectTemplate === 'function') selectTemplate(tpl);
//     toast.success('Template selected');
//   }, []);

//   const infoText = useMemo(() => {
//     return 'New AI templates will be available instantly for composing proposals. Use variables like {{client_name}} and {{bidder_name}} inside template content.';
//   }, []);

//   return (
//     <div className="min-h-screen bg-gray-50">
//       <div style={{ background: HEADER_BG }} className="text-white">
//         <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
//           <div className="flex items-center gap-3">
//             {/* <button onClick={handleBack} className="bg-white/10 hover:bg-white/20 px-3 py-2 rounded">Back</button> */}
//             <h1 className="text-lg font-semibold">AI Templates</h1>
//           </div>
//           <div>
//             <button onClick={openForm} className="bg-white text-green-600 px-3 py-2 rounded">Add Template</button>
//           </div>
//         </div>
//       </div>

//       <div className="max-w-6xl mx-auto p-4">
//         {/* <div className="bg-white rounded shadow p-4 mb-4">
//           <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
//             <div>
//               <div className="text-sm text-gray-500">Not sure how to add AI templates?</div>
//               <div className="text-sm text-gray-700 font-medium">Help me to setup templates.</div>
//             </div>
//             <div className="text-sm text-gray-500">{infoText}</div>
//           </div>
//         </div> */}

//         <div className="mb-6">
//           <TemplatesListTable onEdit={handleEdit} onUse={handleUse} />
//         </div>

//         {showForm && (
//           <div className="mb-6">
//             <SimpleAddTemplateForm onSuccess={handleAddSuccess} onCancel={closeForm} />
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default memo(AITemplatesPage);



// import React, { useCallback, useEffect, useMemo } from 'react';
// import { memo } from 'react';
// import { useNavigate } from 'react-router-dom';
// import toast from 'react-hot-toast';
// import { useUsersStore } from '../../store/useUsersStore';
// import TemplatesListTable from './TemplatesListTable';

// const HEADER_BG = '#27ae60';

// const AITemplatesPage = () => {
//   const navigate = useNavigate();

//   const getSelectedUser = useUsersStore((s) => s.getSelectedUser);
//   const selectedSubUser = getSelectedUser ? getSelectedUser() : null;
//   const selectedSubUserId = selectedSubUser ? (selectedSubUser.document_id || selectedSubUser.sub_user_id || selectedSubUser.id) : null;

//   // use ai-specific loader (TemplatesListTable also loads on selection)
//   const loadAiTemplates = useUsersStore((s) => s.loadAiTemplates);
//   const fetchTemplates = useUsersStore((s) => s.fetchUsers);

//   const handleBack = useCallback(() => navigate(-1), [navigate]);

//   // Navigate to form page instead of toggling inline form
//   const openFormPage = useCallback(() => {
//     // include selected sub-user id in query/state if you need it on the form page
//     navigate('/ai-templates/add', { state: { selectedSubUserId } });
//   }, [navigate, selectedSubUserId]);

//   useEffect(() => {
//     (async () => {
//       try {
//         if (typeof loadAiTemplates === 'function' && selectedSubUserId) {
//           await loadAiTemplates(selectedSubUserId);
//         } else if (typeof fetchTemplates === 'function') {
//           const parentUid = useUsersStore.getState().parentUid;
//           if (parentUid) await fetchTemplates(parentUid);
//         }
//       } catch (err) {
//         console.error('Failed to load AI templates', err);
//         toast.error('Failed to load AI templates');
//       }
//     })();
//   }, [selectedSubUserId, loadAiTemplates, fetchTemplates]);

//   const handleEdit = useCallback((tpl) => {
//     const selectTemplate = useUsersStore.getState().selectTemplate;
//     if (typeof selectTemplate === 'function') selectTemplate(tpl);
//     // navigate to edit page if you have one, otherwise open form page and store selected template in store
//     navigate('/ai-templates/add', { state: { editing: true } });
//   }, [navigate]);

//   const handleUse = useCallback((tpl) => {
//     const selectTemplate = useUsersStore.getState().selectTemplate;
//     if (typeof selectTemplate === 'function') selectTemplate(tpl);
//     toast.success('Template selected');
//   }, []);

//   const infoText = useMemo(() => {
//     return 'New AI templates will be available instantly for composing proposals. Use variables like {{client_name}} and {{bidder_name}} inside template content.';
//   }, []);

//   return (
//     <div className="min-h-screen bg-gray-50">
//       <div style={{ background: HEADER_BG }} className="text-white">
//         <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
//           <div className="flex items-center gap-3">
//             <h1 className="text-lg font-semibold">AI Templates</h1>
//           </div>
//           <div>
//             <button onClick={openFormPage} className="bg-white text-green-600 px-3 py-2 rounded">Add Template</button>
//           </div>
//         </div>
//       </div>

//       <div className="max-w-6xl mx-auto p-4">
//         <div className="mb-6">
//           <TemplatesListTable onEdit={handleEdit} onUse={handleUse} />
//         </div>
//       </div>
//     </div>
//   );
// };

// export default memo(AITemplatesPage);



import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { memo } from 'react';
import toast from 'react-hot-toast';
import { useUsersStore } from '../../store/useUsersStore';
import SimpleAddTemplateForm from './SimpleAddTemplateForm';
import TemplatesListTable from './TemplatesListTable';

const HEADER_BG = '#27ae60';

const AITemplatesPage = () => {
  const [showForm, setShowForm] = useState(false);
 const [editingTemplate, setEditingTemplate] = useState(null);
  const getSelectedUser = useUsersStore((s) => s.getSelectedUser);
  const selectedSubUser = getSelectedUser ? getSelectedUser() : null;
  const selectedSubUserId = selectedSubUser ? (selectedSubUser.document_id || selectedSubUser.sub_user_id || selectedSubUser.id) : null;

  const loadAiTemplates = useUsersStore((s) => s.loadAiTemplates);
  const fetchTemplates = useUsersStore((s) => s.fetchUsers);
  const selectTemplate = useUsersStore((s) => s.selectTemplate);

  useEffect(() => {
    (async () => {
      try {
        if (typeof loadAiTemplates === 'function' && selectedSubUserId) {
          await loadAiTemplates(selectedSubUserId);
        } else if (typeof fetchTemplates === 'function') {
          const parentUid = useUsersStore.getState().parentUid;
          if (parentUid) await fetchTemplates(parentUid);
        }
      } catch (err) {
        console.error('Failed to load AI templates', err);
        toast.error('Failed to load AI templates');
      }
    })();
  }, [selectedSubUserId, loadAiTemplates, fetchTemplates]);

  const openForm = useCallback(() => {
   setEditingTemplate(null);
    setShowForm(true);
  }, [selectTemplate]);

  const closeForm = useCallback(() => {
    setShowForm(false);
     setEditingTemplate(null);
  }, []);

  const handleAddSuccess = useCallback((saved) => {
    toast.success('Template saved');
    setShowForm(false);
     setEditingTemplate(null);
    if (typeof loadAiTemplates === 'function' && selectedSubUserId) {
      loadAiTemplates(selectedSubUserId).catch(() => {});
    } else {
      const fetchFn = useUsersStore.getState().fetchUsers;
      const parentUid = useUsersStore.getState().parentUid;
      if (typeof fetchFn === 'function' && parentUid) fetchFn(parentUid).catch(() => {});
    }
  }, [loadAiTemplates, selectedSubUserId]);

  const handleEdit = useCallback((tpl) => {
    try { if (typeof selectTemplate === 'function') selectTemplate(tpl); } catch (e) { console.warn(e); }
    setEditingTemplate(tpl);
    setShowForm(true);
  }, [selectTemplate]);

  const handleUse = useCallback((tpl) => {
    const selectTemplateFn = useUsersStore.getState().selectTemplate;
    if (typeof selectTemplateFn === 'function') selectTemplateFn(tpl);
    toast.success('Template selected');
  }, []);

  const infoText = useMemo(() => {
    return 'New AI templates will be available instantly for composing proposals. Use variables like {{client_name}} and {{bidder_name}} inside template content.';
  }, []);

  // close on Escape
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') setShowForm(false); };
    if (showForm) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showForm]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div style={{ background: HEADER_BG }} className="text-white">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold">AI Templates</h1>
          </div>
          <div>
            <button onClick={openForm} className="bg-white text-green-600 px-3 py-2 rounded">Add Template</button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4">
        {/* show list only when modal is not open */}
        {!showForm && (
          <div className="mb-6">
            <TemplatesListTable onEdit={handleEdit} onUse={handleUse} />
          </div>
        )}

        {/* modal overlay */}
         {showForm && (
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="fixed inset-0 bg-black/50" onClick={closeForm} />

            {/* constrained panel: max 90vh, centered, full width up to max-w-4xl */}
            <div className="relative z-10 w-full max-w-4xl h-[90vh] mx-auto">
              <div className="bg-white rounded shadow w-full h-full flex flex-col overflow-hidden">
                {/* make inner area scrollable while header/footer remain visible */}
                <div className="flex-1 overflow-auto">
                  <SimpleAddTemplateForm selectedTemplate={editingTemplate} onSuccess={handleAddSuccess} onCancel={closeForm} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default memo(AITemplatesPage);