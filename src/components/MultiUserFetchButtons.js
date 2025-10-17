// import React, { useState } from 'react';
// import axios from 'axios';

// const MultiUserFetchButtons = ({ onProjectsFetched }) => {
//   const [loading, setLoading] = useState({});
//   const [results, setResults] = useState({});

//   // Hardcoded user configurations for testing
//   const USERS = {
//     ZUBAIR: {
//       name: 'Zubair',
//       token: 'O24GYV9TM3b8FYixHDj0xWYYPoz1Bx',
//       color: '#007bff',
//       bgColor: '#007bff'
//     },
//     ZAMEER: {
//       name: 'Zameer',
//       token: 'eAcop16b08CqobJFgC5om046SS4Jl5',
//       color: '#28a745',
//       bgColor: '#28a745'
//     },
//     AHSAN: {
//       name: 'Ahsan',
//       token: 'Ui8H5ulpHRzd1e1kaaQCot48Qt04yw', // Previous token for comparison
//       color: '#dc3545',
//       bgColor: '#dc3545'
//     }
//   };

//   // Fetch projects for specific user with hardcoded token
//   const fetchProjectsFromUser = async (userKey) => {
//     const user = USERS[userKey];
    
//     setLoading(prev => ({ ...prev, [userKey]: true }));

//     try {
//       console.log(`\n🚀 FETCHING PROJECTS FROM ${userKey.toUpperCase()}`);
//       console.log(`👤 User: ${user.name}`);
//       console.log(`🔑 Token: ${user.token.substring(0, 15)}...`);

//       // Direct API call with hardcoded parameters
//       const url = 'https://www.freelancer.com/api/projects/0.1/projects/active/?limit=20&from_time=1759914771';
      
//       console.log(`🌐 API URL: ${url}`);

//       const response = await axios.get(url, {
//         headers: {
//           'Accept': 'application/json',
//           'Content-Type': 'application/json',
//           'freelancer-oauth-v1': user.token,
//         },
//         timeout: 10000,
//       });

//       console.log(`📥 Response Status: ${response.status}`);
//       console.log(`📊 Projects Found: ${response.data?.result?.projects?.length || 0}`);

//       if (response.data && response.data.result && response.data.result.projects) {
//         const projects = response.data.result.projects;
        
//         // Filter USD projects only
//         const usdProjects = projects.filter(project => 
//           project.currency && project.currency.code === 'USD'
//         );

//         console.log(`💰 USD Projects: ${usdProjects.length} out of ${projects.length} total`);

//         // Add user context to projects
//         const projectsWithContext = usdProjects.map(project => ({
//           ...project,
//           fetchedBy: userKey,
//           fetchedByName: user.name,
//           fetchedAt: new Date().toISOString(),
//           userColor: user.color
//         }));

//         // Update results
//         const resultData = {
//           projects: projectsWithContext,
//           total: projects.length,
//           usdCount: usdProjects.length,
//           fetchedAt: new Date().toISOString(),
//           user: userKey,
//           userName: user.name
//         };

//         setResults(prev => ({ ...prev, [userKey]: resultData }));

//         // Save to localStorage
//         localStorage.setItem(`projects_${userKey}`, JSON.stringify(projectsWithContext));

//         // Notify parent if callback exists
//         if (onProjectsFetched) {
//           onProjectsFetched(userKey, projectsWithContext, resultData);
//         }

//         console.log(`✅ Successfully fetched ${projectsWithContext.length} USD projects from ${user.name}`);
        
//         // Show success alert
//         alert(`✅ ${user.name} - SUCCESS!\n\n` +
//               `Total Projects: ${projects.length}\n` +
//               `USD Projects: ${usdProjects.length}\n` +
//               `Token: ${user.token.substring(0, 15)}...`);

//       } else {
//         throw new Error('Invalid response from API');
//       }

//     } catch (err) {
//       console.error(`❌ Error fetching from ${userKey}:`, err);
      
//       const errorMsg = err.response 
//         ? `API Error: ${err.response.status} - ${err.response.statusText}`
//         : `Network Error: ${err.message}`;
        
//       setResults(prev => ({
//         ...prev,
//         [userKey]: {
//           error: errorMsg,
//           fetchedAt: new Date().toISOString(),
//           user: userKey,
//           userName: user.name
//         }
//       }));

//       alert(`❌ ${user.name} - FAILED!\n\nError: ${errorMsg}\nToken: ${user.token.substring(0, 15)}...`);
//     } finally {
//       setLoading(prev => ({ ...prev, [userKey]: false }));
//     }
//   };

//   // Clear all results
//   const clearAllResults = () => {
//     setResults({});
//     Object.keys(USERS).forEach(userKey => {
//       localStorage.removeItem(`projects_${userKey}`);
//     });
//     console.log('🗑️ Cleared all results');
//   };

//   return (
//     <div style={{ 
//       padding: '20px', 
//       backgroundColor: '#f8f9fa', 
//       borderRadius: '8px',
//       border: '2px solid #dee2e6',
//       margin: '20px 0'
//     }}>
      
//       {/* Header */}
//       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
//         <div>
//           <h3 style={{ margin: '0', color: '#495057', fontSize: '20px' }}>
//             🎯 Multi-User Testing (Hardcoded Tokens)
//           </h3>
//           <p style={{ margin: '4px 0 0 0', color: '#6c757d', fontSize: '14px' }}>
//             Test different user accounts with individual access tokens
//           </p>
//         </div>
        
//         {Object.keys(results).length > 0 && (
//           <button
//             onClick={clearAllResults}
//             style={{
//               padding: '8px 16px',
//               backgroundColor: '#dc3545',
//               color: 'white',
//               border: 'none',
//               borderRadius: '4px',
//               fontSize: '13px',
//               cursor: 'pointer'
//             }}
//           >
//             🗑️ Clear All Results
//           </button>
//         )}
//       </div>

//       {/* Fetch Buttons */}
//       <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '20px' }}>
//         {Object.entries(USERS).map(([userKey, user]) => {
//           const isLoading = loading[userKey];
          
//           return (
//             <button
//               key={userKey}
//               onClick={() => fetchProjectsFromUser(userKey)}
//               disabled={isLoading}
//               style={{
//                 display: 'flex',
//                 flexDirection: 'column',
//                 alignItems: 'center',
//                 gap: '8px',
//                 padding: '16px 20px',
//                 backgroundColor: user.bgColor,
//                 color: 'white',
//                 border: 'none',
//                 borderRadius: '8px',
//                 fontSize: '14px',
//                 fontWeight: '500',
//                 cursor: isLoading ? 'wait' : 'pointer',
//                 opacity: isLoading ? 0.7 : 1,
//                 transition: 'all 0.2s ease',
//                 minWidth: '160px',
//                 boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
//               }}
//               onMouseEnter={(e) => {
//                 if (!isLoading) {
//                   e.target.style.opacity = '0.8';
//                 }
//               }}
//               onMouseLeave={(e) => {
//                 if (!isLoading) {
//                   e.target.style.opacity = '1';
//                 }
//               }}
//             >
//               <div style={{ fontSize: '18px' }}>
//                 {isLoading ? '⏳' : '🚀'}
//               </div>
//               <div style={{ textAlign: 'center' }}>
//                 <div style={{ fontSize: '16px', fontWeight: '600' }}>
//                   {isLoading ? 'Fetching...' : `Fetch from ${user.name}`}
//                 </div>
//                 <div style={{ fontSize: '11px', opacity: '0.8', marginTop: '2px' }}>
//                   {user.token.substring(0, 12)}...
//                 </div>
//               </div>
//             </button>
//           );
//         })}
//       </div>

//       {/* Token Info */}
//       <div style={{ 
//         padding: '16px', 
//         backgroundColor: '#ffffff', 
//         borderRadius: '6px',
//         fontSize: '13px',
//         color: '#6c757d',
//         marginBottom: '16px'
//       }}>
//         <div style={{ fontWeight: '600', marginBottom: '12px', color: '#495057' }}>
//           🔑 Hardcoded Tokens for Testing:
//         </div>
//         {Object.entries(USERS).map(([userKey, user]) => (
//           <div key={userKey} style={{ 
//             display: 'flex', 
//             justifyContent: 'space-between', 
//             marginBottom: '8px',
//             padding: '6px',
//             backgroundColor: '#f8f9fa',
//             borderRadius: '4px'
//           }}>
//             <span style={{ fontWeight: '500', color: user.color }}>{user.name}:</span>
//             <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>
//               {user.token}
//             </span>
//           </div>
//         ))}
//       </div>

//       {/* Results Display */}
//       {Object.keys(results).length > 0 && (
//         <div>
//           <h4 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#495057' }}>
//             📊 Comparison Results
//           </h4>
          
//           <div style={{ 
//             display: 'grid', 
//             gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
//             gap: '16px' 
//           }}>
//             {Object.entries(results).map(([userKey, result]) => {
//               const user = USERS[userKey];
              
//               return (
//                 <div
//                   key={userKey}
//                   style={{
//                     padding: '16px',
//                     backgroundColor: 'white',
//                     border: `3px solid ${result.error ? '#dc3545' : user.color}`,
//                     borderRadius: '8px',
//                     fontSize: '14px',
//                     boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
//                   }}
//                 >
//                   <div style={{ 
//                     display: 'flex', 
//                     alignItems: 'center', 
//                     gap: '10px', 
//                     marginBottom: '12px' 
//                   }}>
//                     <span
//                       style={{
//                         width: '16px',
//                         height: '16px',
//                         borderRadius: '50%',
//                         backgroundColor: user.color
//                       }}
//                     />
//                     <strong style={{ color: user.color, fontSize: '16px' }}>
//                       {user.name}
//                     </strong>
//                   </div>
                  
//                   {result.error ? (
//                     <div>
//                       <div style={{ color: '#dc3545', marginBottom: '8px' }}>
//                         ❌ {result.error}
//                       </div>
//                       <div style={{ fontSize: '12px', color: '#6c757d' }}>
//                         Token: {user.token.substring(0, 15)}...
//                       </div>
//                     </div>
//                   ) : (
//                     <div>
//                       <div style={{ marginBottom: '8px' }}>
//                         <div>📦 Total Projects: <strong>{result.total}</strong></div>
//                         <div>💰 USD Projects: <strong>{result.usdCount}</strong></div>
//                       </div>
//                       <div style={{ 
//                         fontSize: '12px', 
//                         color: '#6c757d', 
//                         borderTop: '1px solid #f1f3f5',
//                         paddingTop: '8px'
//                       }}>
//                         <div>🕒 {new Date(result.fetchedAt).toLocaleTimeString()}</div>
//                         <div>🔑 {user.token.substring(0, 15)}...</div>
//                       </div>
//                     </div>
//                   )}
//                 </div>
//               );
//             })}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default MultiUserFetchButtons;
