// import { useState, useCallback } from 'react';
// import axios from 'axios';
// import { useUsersStore } from '../store/useUsersStore';
// import { API_CONFIG, buildQueryParams, STORAGE_KEYS } from '../utils/apiUtils';
// import { useToast } from '../contexts/ToastContext';
// import { useNotifications } from '../contexts/NotificationContext';
// import { useAuth } from '../contexts/AuthContext';
// import { getUnixTimestamp } from '../utils/dateUtils';
// import { saveBidHistory } from '../utils/saveBidHistory';
// import { getGeneralProposal } from '../constants/general-proposal';

// export const useFreelancerAPI = ({ autoBidType }) => {
//   const { token, currentUser } = useAuth();
//   const { showSuccess, showError, showInfo } = useToast();
//   const { addSuccess: notifySuccess, addError: notifyError, addInfo: notifyInfo } = useNotifications();
//   const [projects, setProjects] = useState([]);
//   const [usersMapState, setUsersMapState] = useState({});
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);
//   // const [cooldown, setCooldown] = useState(false); // Cooldown state
//   const [skillsCache, setSkillsCache] = useState({});

//     // Countries to completely exclude from fetch/display/auto-bid
//   const EXCLUDED_COUNTRIES = [
//     'pakistan',
//     'india',
//     'bangladesh',
//     'indonesia',
//     'algeria',
//     'nigeria',
//     'egypt',
//     'nepal',
//     'israel'
//   ];

//     const normalize = (s) => (s || '').toString().trim().toLowerCase();

//       // treat project.local === true (or "true") as local; local projects must be hidden and not autobid
//   const isLocalProject = (proj) => {
//     if (!proj) return false;
//     const v = proj.local;
//     return v === true || v === 'true' || String(v).toLowerCase() === 'true';
//   };
//   const isExcludedCountry = (countryName) => {
//     if (!countryName) return false;
//     const n = normalize(countryName);
//     return EXCLUDED_COUNTRIES.some((c) => n.includes(c) || c.includes(n));
//   };

//   // robust owner country extraction with fallbacks
//   const getOwnerCountry = (project, usersMap = {}) => {
//     const ownerId = project.owner_id ?? project.owner?.id ?? project.user_id ?? null;
//     let owner = undefined;

//     if (ownerId != null) {
//       // usersMap keys might be numbers or strings; try both
//       owner = usersMap[ownerId] || usersMap[String(ownerId)] || usersMap[Number(ownerId)];
//     }
//     owner = owner || project.owner || project.user || project.users?.[Object.keys(project.users || {})[0]];

//     const country =
//       owner?.location?.country?.name ||
//       owner?.profile?.location?.country?.name ||
//       project.location?.country?.name ||
//       '';

//     return country;
//   };


//   const handleApiError = (error) => {
//     if (error.response) {
//       // Server responded with a status code outside the 2xx range
//       const status = error.response.status;
//       const data = error.response.data;

//       if (status === 400) {
//         return data.message || 'Bad Request. Please check your input.';
//       } else if (status === 401) {
//         return 'Unauthorized. Please log in again.';
//       } else if (status === 403) {
//         return 'Forbidden. You do not have permission to perform this action.';
//       } else if (status === 404) {
//         return 'Resource not found. Please try again.';
//       } else if (status === 429) {
//         return 'Too many requests. Please wait and try again later.';
//       } else if (status >= 500) {
//         return 'Server error. Please try again later.';
//       } else {
//         return data.message || 'An unexpected error occurred. Please try again.';
//       }
//     } else if (error.request) {
//       // No response received from the server
//       return 'Network error. Please check your internet connection.';
//     } else {
//       // Error occurred while setting up the request
//       return error.message || 'An unexpected error occurred.';
//     }
//   };

//   const getUserInfo = useCallback(async () => {
//     try {
//       const response = await axios.get('https://www.freelancer.com/api/users/0.1/self', {
//         headers: {
//           'Authorization': `Bearer ${token}`,
//         },
//       });
//       return response.data?.result?.id || null;
//     } catch (err) {
//       const errorMessage = handleApiError(err);
//       console.error('Error fetching user info:', errorMessage);
//       throw new Error(errorMessage);
//     }
//   }, [token]);

//   const getUserSkills = async (userId) => {
//     if (skillsCache[userId]) {
//       console.log(`Using cached skills for user ${userId}`);
//       return skillsCache[userId];
//     }

//     try {
//       const response = await axios.get(
//         `https://www.freelancer.com/ajax-api/skills/top-skills.php?limit=9999&userId=${userId}&compact=true`
//       );
//       console.log(response);
//       const skills = response.data?.result?.topSkills?.map((skill) => skill.id) || [];
//       console.log(skills)
//       setSkillsCache((prevCache) => ({ ...prevCache, [userId]: skills }));
//       return skills;
//     } catch (err) {
//       console.error('Error fetching user skills:', err);
//       throw new Error('Failed to fetch user skills');
//     }
//   }

//   const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

//   const getProjectsBySkills = useCallback(async (skillIds) => {
//     if (!skillIds || skillIds.length === 0) {
//       console.warn('No skills found for the user. Returning an empty project list.');
//       return { projects: [], users: {} };
//     }

//     const from_time = getUnixTimestamp(300)

//     try {
//       const params = {
//         ...API_CONFIG.DEFAULT_PARAMS,
//         'jobs[]': skillIds,
//         from_time,
//         full_description: true,
//         user_details: true, // Include user details
//         user_responsiveness: true, // Include user responsiveness
//         user_portfolio_details: true, // Include user portfolio details
//         user_reputation: true, // Include user reputation
//         user_employer_reputation: true, // Include user employer reputation
//         status: true,
//         'languages[]': 'en'

//       };
//       const queryString = buildQueryParams(params);
//       const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.ACTIVE_PROJECTS}?${queryString}`;

//       const response = await axios.get(url, {
//         headers: {
//           "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
//           "Accept": "application/json",
//         },
//       });

//       // return both projects and users map (some endpoints include users in result)
//       const resProjects = response.data?.result?.projects || [];
//       const resUsers = response.data?.result?.users || {};
//       return { projects: resProjects, users: resUsers };
//     } catch (err) {
//       console.error('Error fetching projects by skills:', err);
//       throw new Error('Failed to fetch projects by skills');
//     }
//   }, [token]);
//   // Track last fetch time (ms epoch)
//   const [lastFetchTime, setLastFetchTime] = useState(
//     (() => {
//       const saved = localStorage.getItem(STORAGE_KEYS.LAST_FETCH);
//       return saved ? parseInt(saved, 10) : null;
//     })()
//   );

//   const loadProjectsFromStorage = useCallback(() => {
//     try {
//       const storedProjects = localStorage.getItem(STORAGE_KEYS.PROJECTS);
//       if (storedProjects) {
//         const parsedProjects = JSON.parse(storedProjects);
//         const filtered = (Array.isArray(parsedProjects) ? parsedProjects : []).filter((proj) => {
//           const country = getOwnerCountry(proj);

//  // hide projects from excluded countries and local projects
//           if (isExcludedCountry(country)) return false;
//           if (isLocalProject(proj)) return false;
//           return true;


//         });
//         setProjects(filtered);
//         const savedFetch = localStorage.getItem(STORAGE_KEYS.LAST_FETCH);
//         if (savedFetch) setLastFetchTime(parseInt(savedFetch, 10));
//         return filtered;
//       }
//     } catch (error) {
//       console.error('Error loading projects from storage:', error);
//     }
//     return [];
//   }, []);

//   const fetchRecentProjects = useCallback(async () => {
//     setLoading(true);
//     setError(null);

//     try {
//       const userId = await getUserInfo();
//       if (!userId) {
//         throw new Error('User ID not found');
//       }

//       const skillIds = await getUserSkills(userId);
//       const result = await getProjectsBySkills(skillIds);
//       let projects = result.projects || [];
//       const usersMap = result.users || {};

//       // Filter projects based on the conditions
//       projects = projects.filter((project) => {
//         const { currency, budget, NDA, title } = project;
//              // owner country exclusion
//         const ownerCountry = getOwnerCountry(project, usersMap);
//         if (isExcludedCountry(ownerCountry)) {
//           console.log(`Hiding project ${project.id} from UI - owner country: ${ownerCountry}`);
//           return false;
//         }

//           // hide local projects from UI and auto-bid
//         if (isLocalProject(project)) {
//           console.log(`Hiding project ${project.id} from UI - local project`);
//           return false;
//         }
//   const ownerId = project.owner_id || project.owner?.id || project.user_id || null;
    

//         if (/^[^\u0000-\u007F]/.test(title)) {
//           return false
//         }

//         // Exclude projects with currency = "INR"
//         if ((currency?.code || '').toUpperCase() === 'INR') {
//           return false;
//         }


//         // Exclude projects with hourly rate minimum <= 5
//         if (budget?.minimum && Number(budget.minimum) <= 5) {
//           return false;
//         }
//         // Exclude projects with NDA = true
//         if (NDA === true || project.upgrades?.NDA === true) {
//           console.log(`Project ${project.id} is an NDA project. Skipping.`);
//           return false;
//         }

//         // Exclude projects with NDA, nonpublic, or sealed = true
//         const upgrades = project.upgrades || {};
//         if (
//           NDA === true ||
//           upgrades.NDA === true ||
//           upgrades.nonpublic === true ||
//           upgrades.sealed === true
//         ) {
//           console.log(`Project ${project.id} is excluded due to NDA/nonpublic/sealed. Skipping.`);
//           return false;
//         }

//         return true;
//       });

//   setUsersMapState(usersMap);
//   setProjects(projects);
   
//       try { localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects)); } catch (e) { /* ignore */ }

//       console.log(`Fetched ${projects.length} projects for user ${currentUser}`);
//     } catch (err) {
//       const errorMessage = handleApiError(err);
//       setError(errorMessage);
//       console.error('Failed to fetch recent projects:', err);
//     } finally {
//       setLoading(false);
//     }
//   }, [currentUser, getUserInfo, getUserSkills, getProjectsBySkills]);

//   // const autoPlaceBids = useCallback(async () => {

//   //      // Configurable requirements for quick-apply / auto-bid
//   //   const MIN_EMPLOYER_RATING = 4; // default: 4 (4+)
//   //   const REQUIRE_INTEGER_RATING = false; // set true to reject decimals like 4.5

    
//   //   const nowUnix = Math.floor(Date.now() / 1000);
//   //   const recentProjects = projects.filter((project) => {
//   //     if (!project.submitdate) {
//   //       console.log(`Project ${project.id} has no submit date. Skipping.`);
//   //       return false;
//   //     }

//   //     const isRecent = nowUnix - project.submitdate <= 60; // Projects less than 1 minute old
//   //     if (!isRecent) {
//   //       console.log(`Project ${project.id} is not recent. Skipping.`);
//   //       return false;
//   //     }

//   //          // Resolve owner from usersMapState or project.users / project.owner fallbacks
//   //     const ownerId = project.owner_id ?? project.owner?.id ?? project.user_id ?? null;
//   //     let owner = null;
//   //     if (ownerId != null) {
//   //       owner = usersMapState?.[ownerId] || usersMapState?.[String(ownerId)] || usersMapState?.[Number(ownerId)];
//   //     }
//   //     owner = owner || project.users?.[ownerId] || (project.users && project.users[Object.keys(project.users)[0]]) || project.owner || project.user || null;

//   //          // Only allow auto-bid when owner meets verification + rating requirements
//   //     const employerOverall = owner?.employer_reputation?.entire_history?.overall;
//   //     const paymentVerified = owner?.status?.payment_verified === true || owner?.status?.payment_verified === 'true';
//   //     const emailVerified = owner?.status?.email_verified === true || owner?.status?.email_verified === 'true';

//   //     if (typeof employerOverall === 'number' || paymentVerified ) {
//   //       // optionally require integer rating (reject 4.5 etc) or accept decimals
//   //       const passesRating = REQUIRE_INTEGER_RATING
//   //         ? Number.isInteger(employerOverall) && employerOverall >= MIN_EMPLOYER_RATING
//   //         : employerOverall >= MIN_EMPLOYER_RATING;

//   //       if (passesRating) {
//   //         console.log(`Auto-bid allowed for project ${project.id} (owner ${ownerId}) — rep ${employerOverall}, payment_verified=${paymentVerified}, email_verified=${emailVerified}`);
//   //         return true;
//   //       } else {
//   //         console.log(`Owner for project ${project.id} failed rating requirement: ${employerOverall}`);
//   //         return false;
//   //       }
//   //     }
//   //     const bidCount = project.bid_stats?.bid_count || 0;
//   //     if (bidCount >= 50) {
//   //       console.log(`Project ${project.id} has 50 or more bids. Skipping.`);
//   //       return false;
//   //     }

//   //     // Filter by autoBidType
//   //     if (autoBidType !== 'all' && project.type !== autoBidType) {
//   //       console.log(`Project ${project.id} does not match the selected type (${autoBidType}). Skipping.`);
//   //       return false;
//   //     }


//   //     return true; // Passed all checks 
//   //   });


//   //   console.log(`Recent projects for auto-bid:`, recentProjects);

//   //   if (recentProjects.length === 0) {
//   //     console.log('No recent projects to bid on.');
//   //     showInfo?.('AutoBid: No new recent projects to bid on');
//   //     notifyInfo('AutoBid', 'No new recent projects to bid on');
//   //     return;
//   //   }

//   //   console.log(`Found ${recentProjects.length} recent projects. Starting auto-bid...`);

//   //   try {
//   //     const bidderId = await getUserInfo();

//   //     for (const project of recentProjects) {
//   //       try {
//   //         const bidAmount = calculateBidAmount(project);

//   //         // // Skip projects that do not meet the criteria
//   //         // if (bidAmount === null) {
//   //         //   console.log(`Skipping project ${project.id} due to bid criteria.`);
//   //         //   continue;
//   //         // }

//   //         // console.log(`Generating proposal for project ${project.id}...`);
//   //         // const response = await axios.post(`${process.env.REACT_APP_API_BASE_URL}/generate-proposal`, {
//   //         //   id: project.id,
//   //         //   title: project.title,
//   //         //   description: project.description || 'No description available',
//   //         //   name: currentUser === "DEFAULT" ? "Zubair Alam" : currentUser
//   //         // });

//   //         // if (!response.data || !response.data.proposal) {
//   //         //   console.error(`Failed to generate proposal for project ${project.id}. Response:`, response.data);
//   //         //   continue;
//   //         // }

//   //         // const proposal = response.data.proposal;

//   //                  // Decide between AI-generated proposal or general static proposal
//   //         const useAiProposal = localStorage.getItem('AUTO_BID_USE_AI') === 'true';

//   //                 let proposal;
//   //         if (useAiProposal) {
//   //           let response;
//   //           try {
//   //             // allow non-2xx responses through so we can inspect status and body
//   //             response = await axios.post(
//   //               `${process.env.REACT_APP_API_BASE_URL}/generate-proposal`,
//   //               {
//   //                 id: project.id,
//   //                 title: project.title,
//   //                 description: project.description || 'No description available',
//   //                 name: currentUser === "DEFAULT" ? "Zubair Alam" : currentUser
//   //               },
//   //               { validateStatus: () => true }
//   //             );
//   //           } catch (err) {
//   //             console.error(`Network error generating proposal for project ${project.id}:`, err);
//   //             showError(`Proposal generation failed for #${project.id}: network error`);
//   //             notifyError('Proposal generation failed', `#${project.id}: network error`);
//   //             continue;
//   //           }

//   //           // Only proceed when the endpoint returned HTTP 200 and a proposal
//   //           if (response.status !== 200 || !response.data || !response.data.proposal) {
//   //             const msg = response?.data?.message || `Status ${response.status}`;
//   //             console.error(`Proposal generation failed for project ${project.id}. ${msg}`, response?.data);
//   //             showError(`Proposal generation failed for #${project.id}: ${msg}`);
//   //             notifyError('Proposal generation failed', `#${project.id}: ${msg}`);
//   //             continue;
//   //           }

//   //           proposal = response.data.proposal;
//   //         } else {
//   //           // Use general proposal text (no API call)
//   //           proposal = getGeneralProposal(currentUser === "DEFAULT" ? "Zubair Alam" : currentUser);
//   //         }

//   //         console.log(`Using proposal for project ${project.id}:`, useAiProposal ? 'AI' : 'GENERAL');

//   //         // console.log(`Placing bid for project ${project.id} with amount ${bidAmount}...`);

//   //           // Retry configuration
//   //         const MAX_BID_RETRIES = 3;
//   //         const BASE_RETRY_MS = 5000; // 5s base backoff
//   //         let attempt = 0;
//   //         let bidPlaced = false;
//   //         let lastBidError = null;

//   //         while (attempt < MAX_BID_RETRIES && !bidPlaced) {
//   //           attempt += 1;
//   //           try {
//   //             const resp = await axios.post(
//   //               `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PLACE_BID}`,
//   //               {
//   //                 project_id: project.id,
//   //                 bidder_id: bidderId,
//   //                 amount: bidAmount,
//   //                 period: 5,
//   //                 description: proposal,
//   //                 milestone_percentage: 100,
//   //               },
//   //               {
//   //                 headers: {
//   //                   'Authorization': `Bearer ${token}`,
//   //                 },
//   //                 validateStatus: () => true, // inspect non-2xx responses
//   //               }
//   //             );

//   //             const status = resp.status;
//   //             const data = resp.data || {};
//   //             const msg = (data.message || '').toString();
//   //             const code = (data.error_code || '').toString();
//   //             const isTooFast = /bidding too fast/i.test(msg) || code === 'ProjectExceptionCodes.BID_TOO_EARLY';

//   //             if (status === 200 && !(data?.status === 'error')) {
//   //               bidPlaced = true;
//   //               break;
//   //             }

//   //             // Retry on "bidding too fast" or 5xx server error
//   //             if ((isTooFast || status >= 500) && attempt < MAX_BID_RETRIES) {
//   //               lastBidError = msg || code || `Status ${status}`;
//   //               const waitMs = BASE_RETRY_MS * Math.pow(2, attempt - 1);
//   //               console.warn(`Attempt ${attempt} failed for project ${project.id}: ${lastBidError}. Retrying in ${waitMs}ms...`);
//   //               await delay(waitMs);
//   //               continue;
//   //             }

//   //            // Non-retryable or final failure
//   //             lastBidError = msg || code || `Status ${status}`;
//   //             break;
//   //           } catch (err) {
//   //             lastBidError = handleApiError(err);
//   //             if (attempt < MAX_BID_RETRIES) {
//   //               const waitMs = BASE_RETRY_MS * Math.pow(2, attempt - 1);
//   //               console.warn(`Network error placing bid for project ${project.id} (attempt ${attempt}): ${lastBidError}. Retrying in ${waitMs}ms...`);
//   //               await delay(waitMs);
//   //               continue;
//   //             }
//   //             break;
//   //           }
//   //         }

//   //         if (!bidPlaced) {
//   //           console.error(`Failed to place bid for project ${project.id} after ${attempt} attempts: ${lastBidError}`);
//   //           const titleTextErr = (project?.title || '').trim();
//   //           const prettyErr = titleTextErr ? `#${project.id} — ${titleTextErr}` : `#${project.id}`;
//   //           showError(`AutoBid error on ${prettyErr}: ${lastBidError}`);
//   //           notifyError('Bid failed', `${prettyErr}: ${lastBidError}`);
//   //           continue;
//   //         }

//   //         // Success handling
//   //         console.log(`Bid placed successfully for project ${project.id}`);
//   //         showSuccess(`AutoBid: Bid placed for #${project.id}`);
//   //         const titleText = (project?.title || '').trim();
//   //         const pretty = titleText ? `#${project.id} — ${titleText}` : `#${project.id}`;

//   //         const projectData = {
//   //           id: project.id,
//   //           title: titleText,
//   //           description: project.description || 'No description available',
//   //           amount: bidAmount,
//   //           currency: project.currency?.code || 'USD',
//   //           currencySign: project.currency?.sign || '$'
//   //         };

//   //         notifySuccess('Bid placed', `Project ${pretty} bid submitted successfully`, projectData);
//   //         // reuse outer bidderId
//   //         const savedBidderId = bidderId;
//   //         await saveBidHistory({
//   //           bidderType: "auto",
//   //           bidderId: savedBidderId,
//   //           description: proposal,
//   //           projectTitle: project.title,
//   //           url: project.seo_url,
//   //           projectType: project.type,
//   //           projectId: project.id,
//   //           projectDescription: project.description,
//   //           budget: project?.budget,
//   //           amount: bidAmount,
//   //           period: 5,
//   //         });
          
//   //         // const bidResponse = await axios.post(
//   //         //   `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PLACE_BID}`,
//   //         //   {
//   //         //     project_id: project.id,
//   //         //     bidder_id: bidderId,
//   //         //     amount: bidAmount,
//   //         //     period: 5,
//   //         //     description: proposal,
//   //         //     milestone_percentage: 100,
//   //         //   },
//   //         //   {
//   //         //     headers: {
//   //         //       'Authorization': `Bearer ${token}`,
//   //         //     },
//   //         //   }
//   //         // );

//   //         // if (bidResponse.status === 200) {
//   //         //   console.log(`Bid placed successfully for project ${project.id}`);
//   //         //   showSuccess(`AutoBid: Bid placed for #${project.id}`);
//   //         //   const titleText = (project?.title || '').trim();
//   //         //   const pretty = titleText ? `#${project.id} — ${titleText}` : `#${project.id}`;

//   //         //   // Create notification with project data for View button
//   //         //   const projectData = {
//   //         //     id: project.id,
//   //         //     title: titleText,
//   //         //     description: project.description || 'No description available',
//   //         //     amount: bidAmount,
//   //         //     currency: project.currency?.code || 'USD',
//   //         //     currencySign: project.currency?.sign || '$'
//   //         //   };

//   //         //   notifySuccess('Bid placed', `Project ${pretty} bid submitted successfully`, projectData);
//   //         //   const bidderId= await getUserInfo();
//   //         //   // Save bid history
//   //         //   await saveBidHistory({
//   //         //     bidderType: "auto",
//   //         //     bidderId: bidderId,
//   //         //     description: proposal,
//   //         //     projectTitle: project.title,
//   //         //     url: project.seo_url,
//   //         //     projectType: project.type,
//   //         //     projectId: project.id,
//   //         //     projectDescription: project.description,
//   //         //     budget: project?.budget,
//   //         //     amount: bidAmount,
//   //         //     period: 5,
//   //         //   });
//   //         // }



//   //         // Add a 30-second delay before placing the next bid
  
//   //       } catch (err) {
//   //         const errorMessage = handleApiError(err);
//   //         console.error(`Error processing project ${project.id}:`, err);
//   //         showError(`AutoBid error on #${project.id}: ${errorMessage}`);
//   //         const titleTextErr = (project?.title || '').trim();
//   //         const prettyErr = titleTextErr ? `#${project.id} — ${titleTextErr}` : `#${project.id}`;
//   //         notifyError('Bid failed', `${prettyErr}: ${errorMessage}`);
//   //       }
//   //     }

//   //     // setCooldown(true);
//   //     // setTimeout(() => {
//   //     //   setCooldown(false);
//   //     //   console.log('Cooldown ended. Auto-bid is now active.');
//   //     // }, 5 * 60 * 1000); // 2-minute cooldown
//   //     // showSuccess('AutoBid completed successfully');
//   //     // notifySuccess('AutoBid completed', 'Auto-bidding run completed successfully');
//   //   } catch (err) {
//   //     const errorMessage = handleApiError(err);
//   //     console.error('Error fetching bidder_id or placing bids:', err);
//   //     showError(`AutoBid failed: ${errorMessage}`);
//   //     notifyError('AutoBid failed', errorMessage);
//   //   }
//   // }, [projects, token, getUserInfo, autoBidType]);
// const noopAutoPlaceBids = async () => {
//     console.warn('autoPlaceBids disabled in frontend. Auto-bidding moved to backend cron job.');
//     return;
//   };



//   const calculateBidAmount = (project) => {
//     const { type, budget } = project;

//     if (!budget || !budget.minimum || !budget.maximum) {
//       console.log(`Project ${project.id} has an invalid budget.`);
//       return null;
//     }

//     const minBudget = budget.minimum;
//     const maxBudget = budget.maximum;

//     console.log(`Calculating bid amount for project ${project.id}:`, { type, minBudget, maxBudget });

//     if (type === 'hourly') {
//       // Hourly Projects
//       if (minBudget > 10) {
//         console.log(`Project ${project.id} is hourly with rate > $10/hour. Bidding minimum: ${minBudget}`);
//         return minBudget; // Bid the minimum amount for rates > $10/hour
//       } else {
//         console.log(`Project ${project.id} is hourly with rate ≤ $10/hour. Bidding maximum: ${maxBudget}`);
//         return maxBudget; // Bid the maximum amount for rates ≤ $10/hour
//       }
//     }
//     else if (type === 'fixed') {
//       // Fixed-Price Projects

//       if (minBudget >=30){
//         return minBudget;
//       }
//       // if (minBudget >= 30 && maxBudget >= 250) {
//       //   console.log(`Project ${project.id} is fixed-price with budget between $30 and $250. Bidding minimum: ${minBudget}`);
//       //   return minBudget; // Bid the minimum amount for budgets between $30 to >200
//       // } else if (minBudget > 250 && maxBudget <= 900) {
//       //   console.log(`Project ${project.id} is fixed-price with budget between $250 and $900. Bidding minimum: ${minBudget}`);
//       //   return minBudget; // Bid the minimum amount for budgets between $250 and $900
//       // } else if (maxBudget > 1000) {
//       //   console.log(`Proj ect ${project.id} is fixed-price with budget > $1,000. Bidding minimum: ${minBudget}`);
//       //   return minBudget; // Bid the minimum amount for budgets > $1,000
//       // } else {
//       //   console.log(`Project ${project.id} is fixed-price with budget < $200. Skipping.`);
//       //   return null; // Skip projects with budgets < $200
//       // }

//       return null; // Skip projects that do not meet any criteria
//     }
   
//   };

//     // It uses selected sub-user credentials from Zustand store.
//   const placeBidManual = useCallback(async ({ projectId, amount, period = 5, description, userKey = null }) => {
//     const getSelected = useUsersStore.getState().getSelectedUser;
//     const selectedUser = userKey ? useUsersStore.getState().users.find(u => u.sub_username === userKey || String(u.id) === String(userKey)) : getSelected();
//     if (!selectedUser) {
//       throw new Error('No sub-user selected. Please select an account in the User Switcher.');
//     }

//     // Best practice: call backend proxy to place bids to avoid exposing raw access tokens.
//     // If you must call freelancer API from frontend, selectedUser.sub_user_access_token must be present.
//     if (!selectedUser.sub_user_access_token) {
//       // recommended: call your backend proxy endpoint that takes parent auth plus sub-user id
//       throw new Error('Selected sub-user has no token available. Use backend proxy to place bids.');
//     }

//     // place bid using API_CONFIG or bidService
//     const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PLACE_BID}`;
//     const resp = await axios.post(url, {
//       project_id: projectId,
//       bidder_id: Number(selectedUser.bidder_id || selectedUser.bidderId), // ensure bidder id provided by backend
//       amount,
//       period,
//       description,
//       milestone_percentage: 100
//     }, {
//       headers: { Authorization: `Bearer ${selectedUser.sub_user_access_token}` },
//       validateStatus: () => true
//     });

//     if (resp.status >= 200 && resp.status < 300 && resp.data && resp.data.result) {
//       return { success: true, data: resp.data };
//     }

//     const msg = resp.data?.message || resp.statusText || `Status ${resp.status}`;
//     return { success: false, message: msg, data: resp.data };
//   }, []);


//   return {
//     projects,
//     loading,
//     error,
//     fetchRecentProjects,
//     loadProjectsFromStorage,
//     calculateBidAmount,
//     usersMap: usersMapState,
//     autoPlaceBids: noopAutoPlaceBids,
//      placeBidManual,

//   };
// };


import { useState, useCallback, useEffect,useRef } from 'react';
import axios from 'axios';
import { useUsersStore } from '../store/useUsersStore';
import { API_CONFIG, buildQueryParams, STORAGE_KEYS } from '../utils/apiUtils';
import { useToast } from '../contexts/ToastContext';
import { useNotifications } from '../contexts/NotificationContext';
import { useAuth } from '../contexts/AuthContext';
import { getUnixTimestamp } from '../utils/dateUtils';
import { saveBidHistory } from '../utils/saveBidHistory';
import { getGeneralProposal } from '../constants/general-proposal';

export const useFreelancerAPI = ({ autoBidType }) => {
  // NOTE: selectedUser is sourced from Zustand (sub-users fetched from your backend).
  // selectedUser shape expected: { sub_user_access_token, sub_username, user_bid_id, general_proposal, ... }
  // const selectedUser = useUsersStore((s) => s.getSelectedUser && s.getSelectedUser());
  const selectedKey = useUsersStore((s) => s.selectedKey);

  // Keep legacy auth for other app features (not used for sub-user calls)
  const { token: legacyToken, currentUser } = useAuth();

  const { showSuccess, showError, showInfo } = useToast();
  const { addSuccess: notifySuccess, addError: notifyError, addInfo: notifyInfo } = useNotifications();
  const [projects, setProjects] = useState([]);
  const [usersMapState, setUsersMapState] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [skillsCache, setSkillsCache] = useState({});

    const skillsCacheRef = useRef({});
  const isFetchingRef = useRef(false);
  const cooldownUntilRef = useRef(0); // timestamp (ms) until which we should back off on rate-limit
 

  // Countries to completely exclude from fetch/display/auto-bid
  const EXCLUDED_COUNTRIES = [
    'pakistan','india','bangladesh','indonesia','algeria','nigeria','egypt','nepal','israel'
  ];
  const normalize = (s) => (s || '').toString().trim().toLowerCase();

  const isLocalProject = (proj) => {
    if (!proj) return false;
    const v = proj.local;
    return v === true || v === 'true' || String(v).toLowerCase() === 'true';
  };
  const isExcludedCountry = (countryName) => {
    if (!countryName) return false;
    const n = normalize(countryName);
    return EXCLUDED_COUNTRIES.some((c) => n.includes(c) || c.includes(n));
  };

  const getOwnerCountry = (project, usersMap = {}) => {
    const ownerId = project.owner_id ?? project.owner?.id ?? project.user_id ?? null;
    let owner;
    if (ownerId != null) {
      owner = usersMap[ownerId] || usersMap[String(ownerId)] || usersMap[Number(ownerId)];
    }
    owner = owner || project.owner || project.user || project.users?.[Object.keys(project.users || {})[0]];
    const country =
      owner?.location?.country?.name ||
      owner?.profile?.location?.country?.name ||
      project.location?.country?.name ||
      '';
    return country;
  };

  const handleApiError = (error) => {
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;
      if (status === 400) return data.message || 'Bad Request. Please check your input.';
      if (status === 401) return 'Unauthorized. Please log in again.';
      if (status === 403) return 'Forbidden. You do not have permission to perform this action.';
      if (status === 404) return 'Resource not found. Please try again.';
      if (status === 429) return 'Too many requests. Please wait and try again later.';
      if (status >= 500) return 'Server error. Please try again later.';
      return data.message || 'An unexpected error occurred. Please try again.';
    } else if (error.request) {
      return 'Network error. Please check your internet connection.';
    } else {
      return error.message || 'An unexpected error occurred.';
    }
  };

const getUserInfo = useCallback(async () => {
    const selected = useUsersStore.getState().getSelectedUser?.() || null;

    // prefer stored bidder id from backend
    if (selected?.user_bid_id) {
      return Number(selected.user_bid_id);
    }

    const tokenToUse = selected?.sub_user_access_token || legacyToken;
    if (!tokenToUse) {
     throw new Error('No access token available for selected user.');
}

    try {
      const response = await axios.get('https://www.freelancer.com/api/users/0.1/self', {
        headers: { Authorization: `Bearer ${tokenToUse}` },
      });
      return response.data?.result?.id || null;
    } catch (err) {
      const errorMessage = handleApiError(err);
      console.error('Error fetching user info:', errorMessage);
      throw new Error(errorMessage);
    }
  }, [legacyToken]);
  // memoized user-skills fetch (uses ref cache to keep stable identity)
  const getUserSkills = useCallback(async (userId) => {
    if (!userId) {
      throw new Error('userId required to fetch skills');
    }
    if (skillsCacheRef.current[userId]) {
      return skillsCacheRef.current[userId];
    }
    try {
      const response = await axios.get(
        `https://www.freelancer.com/ajax-api/skills/top-skills.php?limit=9999&userId=${userId}&compact=true`
      );
      const skills = response.data?.result?.topSkills?.map((skill) => skill.id) || [];
      skillsCacheRef.current = { ...skillsCacheRef.current, [userId]: skills };
      // keep UI-level cache in sync (optional)
      setSkillsCache((prevCache) => ({ ...prevCache, [userId]: skills }));
      return skills;
    } catch (err) {
      console.error('Error fetching user skills:', err);
      throw new Error('Failed to fetch user skills');
    }
  }, []);

  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const getProjectsBySkills = useCallback(async (skillIds) => {
    if (!skillIds || skillIds.length === 0) {
      return { projects: [], users: {} };
    }
    const from_time = getUnixTimestamp(300);
    try {
      const params = {
        ...API_CONFIG.DEFAULT_PARAMS,
        'jobs[]': skillIds,
        from_time,
        full_description: true,
        user_details: true,
        user_responsiveness: true,
        user_portfolio_details: true,
        user_reputation: true,
        user_employer_reputation: true,
        status: true,
        'languages[]': 'en'
      };
      const queryString = buildQueryParams(params);
      const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.ACTIVE_PROJECTS}?${queryString}`;
      const response = await axios.get(url, {
        headers: { "User-Agent": "Mozilla/5.0", "Accept": "application/json" },
      });
      const resProjects = response.data?.result?.projects || [];
      const resUsers = response.data?.result?.users || {};
      return { projects: resProjects, users: resUsers };
    } catch (err) {
      console.error('Error fetching projects by skills:', err);
      throw new Error('Failed to fetch projects by skills');
    }
  }, []);

  const [lastFetchTime, setLastFetchTime] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.LAST_FETCH);
    return saved ? parseInt(saved, 10) : null;
  });

  const loadProjectsFromStorage = useCallback(() => {
    try {
      const storedProjects = localStorage.getItem(STORAGE_KEYS.PROJECTS);
      if (storedProjects) {
        const parsedProjects = JSON.parse(storedProjects);
        const filtered = (Array.isArray(parsedProjects) ? parsedProjects : []).filter((proj) => {
          const country = getOwnerCountry(proj);
          if (isExcludedCountry(country)) return false;
          if (isLocalProject(proj)) return false;
          return true;
        });
        setProjects(filtered);
        const savedFetch = localStorage.getItem(STORAGE_KEYS.LAST_FETCH);
        if (savedFetch) setLastFetchTime(parseInt(savedFetch, 10));
        return filtered;
      }
    } catch (error) {
      console.error('Error loading projects from storage:', error);
    }
    return [];
  }, []);

  const fetchRecentProjects = useCallback(async () => {
    setLoading(true);
    setError(null);

       // if we are currently in a cooldown period (rate-limited), skip and exit early
    if (cooldownUntilRef.current && Date.now() < cooldownUntilRef.current) {
      const waitSecs = Math.ceil((cooldownUntilRef.current - Date.now()) / 1000);
      console.warn(`In cooldown due to previous rate-limit. Next fetch in ${waitSecs}s`);
      setLoading(false);
      return;
    }

    // guard against concurrent fetches
    if (isFetchingRef.current) {
      console.warn('fetchRecentProjects: fetch already in progress, skipping overlapping call');
      setLoading(false);
      return;
    }
   isFetchingRef.current = true;

    try {
      const userId = await getUserInfo();
      if (!userId) {
        throw new Error('User ID not found');
      }

      const skillIds = await getUserSkills(userId);
      const result = await getProjectsBySkills(skillIds);
      let projects = result.projects || [];
      const usersMap = result.users || {};

      projects = projects.filter((project) => {
        const { currency, budget, NDA, title } = project;
        const ownerCountry = getOwnerCountry(project, usersMap);
        if (isExcludedCountry(ownerCountry)) return false;
        if (isLocalProject(project)) return false;
        if (/^[^\u0000-\u007F]/.test(title)) return false;
        if ((currency?.code || '').toUpperCase() === 'INR') return false;
        if (budget?.minimum && Number(budget.minimum) <= 5) return false;
        if (NDA === true || project.upgrades?.NDA === true) return false;
        const upgrades = project.upgrades || {};
        if (NDA === true || upgrades.NDA === true || upgrades.nonpublic === true || upgrades.sealed === true) return false;
        return true;
      });

      setUsersMapState(usersMap);
      setProjects(projects);
      try { localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects)); } catch (e) { /* ignore */ }

      // console.log(`Fetched ${projects.length} projects for selected user ${selectedUser?.sub_username || currentUser}`);
    } catch (err) {
           const errorMessage = handleApiError(err);
      setError(errorMessage);
      console.error('Failed to fetch recent projects:', err);
      // if rate-limited, back off for 5 minutes
      if ((err?.response?.status === 429) || /(Too many requests|RATE_LIMITED|rate limit)/i.test(errorMessage)) {
        cooldownUntilRef.current = Date.now() + 5 * 60 * 1000; // 5 minutes
        console.warn('Rate-limited by API. Activating 5 minute cooldown.');
      }
    } finally {
       isFetchingRef.current = false;
      setLoading(false);
    }
  }, [getUserInfo, getUserSkills, getProjectsBySkills, currentUser]);

    useEffect(() => {
    let intervalId = null;
    let scheduledTimeout = null;

    if (!selectedKey) {
      // clear projects when no selected user
      setProjects([]);
      setUsersMapState({});
      return;
    }

    const runFetchOrSchedule = () => {
      // if currently in cooldown, schedule a single retry when cooldown ends
      if (cooldownUntilRef.current && Date.now() < cooldownUntilRef.current) {
        const waitMs = cooldownUntilRef.current - Date.now() + 1000;
        console.warn(`Cooldown active. Scheduling next fetch in ${Math.ceil(waitMs/1000)}s`);
        scheduledTimeout = setTimeout(() => {
          fetchRecentProjects().catch((e) => console.warn('Scheduled fetch failed:', e.message));
        }, waitMs);
        return;
      }

      // immediate fetch
      fetchRecentProjects().catch((e) => console.warn('fetchRecentProjects failed:', e.message));

      // periodic fetch every 60 seconds
      intervalId = setInterval(() => {
        // if cooldown became active, clear interval and let scheduledTimeout handle next try
        if (cooldownUntilRef.current && Date.now() < cooldownUntilRef.current) {
          clearInterval(intervalId);
          intervalId = null;
          runFetchOrSchedule();
          return;
        }
        fetchRecentProjects().catch((e) => console.warn('Periodic fetch failed:', e.message));
      }, 60 * 1000);
    };

    runFetchOrSchedule();

    return () => {
      if (intervalId) clearInterval(intervalId);
      if (scheduledTimeout) clearTimeout(scheduledTimeout);
    };
  }, [selectedKey, fetchRecentProjects]);

  // noop auto-bid (moved to backend)
  const noopAutoPlaceBids = async () => {
    console.warn('autoPlaceBids disabled in frontend. Auto-bidding moved to backend cron job.');
    return;
  };

  const calculateBidAmount = (project) => {
    const { type, budget } = project;
    if (!budget || !budget.minimum || !budget.maximum) {
      return null;
    }
    const minBudget = budget.minimum;
    const maxBudget = budget.maximum;
    if (type === 'hourly') {
      return minBudget > 10 ? minBudget : maxBudget;
    } else if (type === 'fixed') {
      if (minBudget >= 30) return minBudget;
      return null;
    }
  };

  // Manual place bid uses selectedUser credentials (already implemented earlier)
  const placeBidManual = useCallback(async ({ projectId, amount, period = 5, description, userKey = null }) => {
    const getSelected = useUsersStore.getState().getSelectedUser;
    const selected = userKey ? useUsersStore.getState().users.find(u => u.sub_username === userKey || String(u.id) === String(userKey)) : getSelected();
    if (!selected) {
      throw new Error('No sub-user selected. Please select an account in the User Switcher.');
    }
    if (!selected.sub_user_access_token) {
      throw new Error('Selected sub-user has no token available. Use backend proxy to place bids.');
    }
    const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PLACE_BID}`;
    const resp = await axios.post(url, {
      project_id: projectId,
      bidder_id: Number(selected.user_bid_id || selected.bidder_id || selected.bidderId),
      amount,
      period,
      description,
      milestone_percentage: 100
    }, {
      headers: { Authorization: `Bearer ${selected.sub_user_access_token}` },
      validateStatus: () => true
    });
    if (resp.status >= 200 && resp.status < 300 && resp.data && resp.data.result) {
      return { success: true, data: resp.data };
    }
    const msg = resp.data?.message || resp.statusText || `Status ${resp.status}`;
    return { success: false, message: msg, data: resp.data };
  }, []);

  return {
    projects,
    loading,
    error,
    fetchRecentProjects,
    loadProjectsFromStorage,
    calculateBidAmount,
    usersMap: usersMapState,
    autoPlaceBids: noopAutoPlaceBids,
    placeBidManual,
  };
};
