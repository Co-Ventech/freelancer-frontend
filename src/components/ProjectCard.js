import React, { useState } from 'react';
import { formatUnixToPakistanTime } from '../utils/dateUtils';
import { useBidding } from '../hooks/useBidding';
import bidService from '../services/bidService';
import ProposalModal from './ProposalModal';
import { useFreelancerAPI } from '../hooks/useFreelancerAPI';
import { useUsersStore } from '../store/useUsersStore';
import axios from 'axios';
import { getAuthHeaders } from '../utils/api';


const ProjectCard = ({ project, usersMap = null }) => {
  const { calculateBidAmount, placeBidManual } = useFreelancerAPI();
  const { loading, error, success, clearError } = useBidding();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showFullDesc, setShowFullDesc] = useState(false);
   const [initialProposal, setInitialProposal] = useState(null);
  const [apiProposalLoading, setApiProposalLoading] = useState(false);

  // get selected sub-user (to send templates/skills/bidder name)
  const selectedSubUser = useUsersStore((s) => s.getSelectedUser && s.getSelectedUser());

  // Extract project data with fallbacks based on the actual API response structure
  const {
    id = 'N/A',
    title = 'Untitled Project',
    status = 'N/A',
    seo_url = null,
    currency = {},
    description,
    preview_description = null,
    submitdate = null,
    type = 'N/A',
    bidperiod = 'N/A',
    budget,
    bid_stats = {},
    users,
  } = project;

  // Use preview_description if description is null, or fallback to default
  const projectDescription = description || preview_description || 'No description available';
  const DESCRIPTION_TRUNCATE_LEN = 100;
  const isLongDescription = projectDescription && projectDescription.length > DESCRIPTION_TRUNCATE_LEN;
  const truncatedDescription = isLongDescription
    ? `${projectDescription.substring(0, DESCRIPTION_TRUNCATE_LEN)}...`
    : projectDescription;

  // --- Owner / client country extraction (uses optional usersMap prop first) ---
  const getOwnerCountry = (proj) => {
    if (!proj) return null;

    const ownerId = proj.owner_id ?? proj.owner?.id ?? proj.user_id ?? null;

    // prefer usersMap prop from parent, otherwise use project.users or common fallback globals
    const mapCandidates = [
      usersMap,
      proj.users,
      proj._users,
      proj.users_map,
      // sometimes you may attach a global users object; try it if present
      typeof window !== 'undefined' ? window.__SF_USERS : undefined,
      {}
    ];

    let resolvedOwner = null;
    for (const map of mapCandidates) {
      if (!map || typeof map !== 'object') continue;
      // direct key match
      resolvedOwner = map[ownerId] || map[String(ownerId)] || map[Number(ownerId)];
      if (resolvedOwner) break;
      // try scanning entries if keys are different
      const keys = Object.keys(map || {});
      if (keys.length > 0 && !resolvedOwner) {
        for (const k of keys) {
          const u = map[k];
          if (u && (u.id === ownerId || String(u.id) === String(ownerId))) {
            resolvedOwner = u;
            break;
          }
        }
      }
    }

    // final fallbacks
    resolvedOwner = resolvedOwner || proj.owner || proj.user || (proj.users && proj.users[Object.keys(proj.users)[0]]) || null;

    const country =
      resolvedOwner?.location?.country?.name ||
      resolvedOwner?.profile?.location?.country?.name ||
      proj.location?.country?.name ||
      null;

    return country ? String(country).trim() : null;
  };

    const getOwnerUserObject = (proj) => {
    if (!proj) return null;
    const ownerId = proj.owner_id ?? proj.owner?.id ?? proj.user_id ?? null;
    const mapCandidates = [
      usersMap,
      proj.users,
      proj._users,
      proj.users_map,
      typeof window !== 'undefined' ? window.__SF_USERS : undefined,
      {}
    ];
    let resolvedOwner = null;
    for (const map of mapCandidates) {
      if (!map || typeof map !== 'object') continue;
      resolvedOwner = map[ownerId] || map[String(ownerId)] || map[Number(ownerId)];
      if (resolvedOwner) break;
      for (const k of Object.keys(map || {})) {
        const u = map[k];
        if (u && (u.id === ownerId || String(u.id) === String(ownerId))) {
          resolvedOwner = u;
          break;
        }
      }
      if (resolvedOwner) break;
    }
    return resolvedOwner || proj.owner || proj.user || (proj.users && proj.users[Object.keys(proj.users)[0]]) || null;
  };
 
   const ownerCountry = getOwnerCountry(project);
  const ownerUser = getOwnerUserObject(project);
  const ownerUsername = ownerUser?.username || ownerUser?.user_name || ownerUser?.displayName || null;
  const ownerProfileUrl = ownerUsername ? `https://www.freelancer.com/u/${ownerUsername}` : null;
  
  const clientPublicName = ownerUser?.public_name ?? ownerUser?.publicName ?? ownerUser?.displayName ?? ownerUsername ?? null;



  // Format currency information
  const currencyCode = currency?.code || 'USD';
  const currencySign = currency?.sign || '$';
  const currencyName = currency?.name || 'N/A';

  // Format budget
  const budgetMin = budget?.minimum || 0;
  const budgetMax = budget?.maximum || 0;

  const budgetDisplay = budgetMin && budgetMax && budgetMax > budgetMin
    ? `${currencySign}${budgetMin} - ${currencySign}${budgetMax}`
    : budgetMin || budgetMax
      ? `${currencySign}${budgetMin || budgetMax}`
      : 'N/A';



  // Format submit date
  const formattedDate = submitdate ? formatUnixToPakistanTime(submitdate) : 'N/A';

  // Get bid count
  const bidCount = bid_stats?.bid_count || 0;
  const bidAvg = bid_stats?.bid_avg || 0;
   const bidAvgRounded = (typeof bidAvg === 'number' && !Number.isNaN(bidAvg)) ? Math.round(bidAvg) : null;
  const bidAvgDisplay = bidAvgRounded !== null ? `${currencySign}${bidAvgRounded}` : null;

  const isPaymentVerified = users?.[project.owner_id]?.status?.payment_verified || `N/A`;

  // Check if user has already bid on this project
  const hasAlreadyBid = bidService.hasBidOnProject(id);


  const getClientReview = (proj) => {
    if (!proj) return null;

    const ownerId = proj.owner_id ?? proj.owner?.id ?? proj.user_id ?? null;

    // Try to resolve owner user object (prefer usersMap prop, then proj.users)
    const candidateMaps = [usersMap, proj.users, proj._users, proj.users_map];

    let owner = null;
    for (const map of candidateMaps) {
      if (!map || typeof map !== 'object') continue;
      owner = map[ownerId] || map[String(ownerId)] || map[Number(ownerId)];
      if (owner) break;
      // scan entries if keys are different
      for (const k of Object.keys(map || {})) {
        const u = map[k];
        if (u && (u.id === ownerId || String(u.id) === String(ownerId))) {
          owner = u;
          break;
        }
      }
      if (owner) break;
    }

    // fallback to other common owner locations
    owner = owner || proj.owner || proj.user || (proj.users && proj.users[Object.keys(proj.users)[0]]) || null;

    const overallPaths = [
      owner?.employer_reputation?.entire_history?.overall,
      owner?.employer_reputation?.last3months?.overall,
      owner?.employer_reputation?.last12months?.overall,
      owner?.profile?.reputation?.entire_history?.overall,
      owner?.profile?.reputation?.last3months?.overall,
      owner?.profile?.reputation?.last12months?.overall,
    ];

    for (const v of overallPaths) {
      if (typeof v === 'number' && !Number.isNaN(v)) {
        // treat zero as "no reviews" — change to v >= 0 if you want to show 0.0
        if (v > 0) return v;
        return null;
      }
    }

    return null;
  };

  const clientReview = getClientReview(project);

  const employerReputation = ownerUser?.employer_reputation || project.employer_reputation || ownerUser?.profile?.employer_reputation || {};
  const repEntire = employerReputation?.entire_history || {};
  const rep3 = employerReputation?.last3months || {};
  const rep12 = employerReputation?.last12months || {};

  const formatCount = (v) => (typeof v === 'number' ? v : 0);
  const formatRating = (v) => (typeof v === 'number' ? v.toFixed(1) : 'N/A');


 const handleOpenBid = async () => {
    if (hasAlreadyBid) {
      alert('You have already placed a bid on this project.');
      return;
    }

     setIsModalOpen(true);
  setApiProposalLoading(true);
  setInitialProposal(null);
    try {
      const payload = {
        proposal: Array.isArray(selectedSubUser?.templates) ? selectedSubUser.templates : [],
        bidder_name: selectedSubUser?.sub_username || selectedSubUser?.name || undefined,
        client_name: clientPublicName || ownerUsername || 'Client',
        job_title: title,
        job_description: projectDescription,
        skills: Array.isArray(selectedSubUser?.skills) ? selectedSubUser.skills : [],
      };
       const url = `${process.env.REACT_APP_API_BASE_URL.replace(/\/$/, '')}/recommend-proposal`;
      const headers = getAuthHeaders() || {}; // reads idToken/accessToken from cookies or provided token


     const resp = await axios.post(url, payload, {
        headers,
        // withCredentials: true, // ensure cookies (access_token) are sent
        timeout: 30000,
      });
      if (resp?.status === 200 && resp.data) {
      const rawProposal = resp.data.proposal ?? (resp.data.data && resp.data.data.proposal) ?? null;
        const proposalString = (typeof rawProposal === 'string' && rawProposal.trim().length > 0) ? rawProposal : null;
        setInitialProposal(proposalString);
      } else {
        // no proposal returned — keep null and modal will fallback to local proposal generation
        console.warn('recommend-proposal returned unexpected response', resp?.status, resp?.data);
        setInitialProposal(null);
      }
    } catch (err) {
      console.error('Error fetching recommended proposal:', err);
      setInitialProposal(null);
    } finally {
      setApiProposalLoading(false);
      // setIsModalOpen(true);
    }
  };


  // Handle bid submission from modal
  const handleSubmitBid = async ({ amount, period, description }) => {
    try {
      const projectMeta = {
        seo_url,
        type,
        title,
        description: projectDescription,
        budget,
      };

      const result = await placeBidManual({
        projectId: id,
        amount,
        period,
        description,
        projectMeta,
      });

      if (result?.success) {
        console.log('Bid response:', result.data);
        alert('Bid placed successfully!');
        // optionally record local state / mark as bid
        bidService.recordBid(id);
      } else {
        const msg = result?.message || 'Failed to place bid';
        console.error('Bid error:', msg);
        alert(`Error: ${msg}`);
      }
    } catch (err) {
      console.error('Error in handleSubmitBid:', err);
      alert(`Error: ${err?.message || 'An unexpected error occurred'}`);
    }
  };
  const handleViewProject = () => {
    if (seo_url) {
      const projectUrl = `https://www.freelancer.com/projects/${seo_url}`;
      window.open(projectUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="card p-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex-1">
        {/* Project ID and Status */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">
            ID: {id}
          </span>
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${status === 'active'
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-800'
            }`}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        </div>

        <h3 className="text-lg font-semibold text-gray-900 mb-3 line-clamp-2 leading-tight">
          {title}
        </h3>
     

        {/* Description */}
        <p className="text-gray-600 text-sm mb-2 leading-relaxed">
          {showFullDesc ? projectDescription : truncatedDescription}
        </p>
        {isLongDescription && (
          <button
            onClick={() => setShowFullDesc((s) => !s)}
            className="text-xs text-blue-600 hover:underline mb-4"
            aria-expanded={showFullDesc}
          >
            {showFullDesc ? 'Show less' : 'Read more...'}
          </button>
        )}




        {/* Project Details Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4 text-xs">
          <div className="bg-gray-50 p-2 rounded-lg">
            <span className="text-gray-500 block">Type</span>
            <span className="font-medium text-gray-900">{type}</span>
          </div>
          <div className="bg-gray-50 p-2 rounded-lg">
            <span className="text-gray-500 block">Bid Period</span>
            <span className="font-medium text-gray-900">
              {bidperiod !== 'N/A' ? `${bidperiod} days` : 'N/A'}
            </span>
          </div>
        </div>
        {/* Client Country */}
               <div className="bg-gray-50 p-2 rounded-lg mb-4">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-gray-500 block text-xs">Client Country</span>
              <span className="font-medium text-gray-900 text-sm">{ownerCountry || 'N/A'}</span>
            </div>

      
      
      
      
      
            {/* Username + public_name on the right */}
            {ownerUsername && (
              <div className="text-right ml-4">
                <span className="text-gray-500 block text-xs">Client</span>
                <a
                  href={ownerProfileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-blue-600 hover:text-blue-800 block"
                >
                  @{ownerUsername}
                </a>
                {/* public_name if provided by API */}
                { (ownerUser?.public_name || ownerUser?.publicName) && (
                  <span className="text-xs text-gray-500 block">
                    {ownerUser.public_name ?? ownerUser.publicName}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Currency Information */}
        <div className={`p-3 rounded-lg mb-4 ${currencyCode === 'USD'
            ? 'bg-green-50 border border-green-200'
            : 'bg-yellow-50 border border-yellow-200'
          }`}>
          <div className="flex items-center justify-between text-xs">
            <span className={`font-medium ${currencyCode === 'USD' ? 'text-green-600' : 'text-yellow-600'
              }`}>Currency</span>
            <span className={`${currencyCode === 'USD' ? 'text-green-800' : 'text-yellow-800'
              }`}>
              {currencyCode} ({currencySign}) - {currencyName}
            </span>
          </div>

          {/* Payment Verified */}
          <span className="text-gray-500 block text-xs mt-2">Payment Verified</span>
          <span className="font-medium text-gray-900 text-sm">
            {isPaymentVerified === true ? 'Yes' : isPaymentVerified === false ? 'No' : 'N/A'}
          </span>
        </div>
        {/* Client Review */}
        <div className="bg-gray-50 p-2 rounded-lg mb-4">
          <span className="text-gray-500 block text-xs">Client Review</span>
          <span className="font-medium text-gray-900 text-sm">
            {typeof clientReview === 'number' ? `${clientReview.toFixed(1)} / 5` : 'No reviews yet'}
          </span>
        </div>
               <div className="bg-white p-3 rounded-lg mb-4 border">
          <div className="flex items-center justify-between mb-3">
            <div className="font-medium">Client History</div>
            <div className="text-xs text-gray-500">Source: employer_reputation</div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            {[
              { key: 'Entire', data: repEntire },
              { key: 'Last 3m', data: rep3 },
              { key: 'Last 12m', data: rep12 },
            ].map(({ key, data }) => (
              <div key={key} className="p-2 bg-gray-50 rounded">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-semibold">{key}</div>
                  <div className="text-sm text-yellow-600 flex items-center gap-1">
                    {/* star icon */}
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.966a1 1 0 00.95.69h4.173c.969 0 1.371 1.24.588 1.81l-3.378 2.455a1 1 0 00-.364 1.118l1.287 3.966c.3.921-.755 1.688-1.54 1.118L10 15.347l-3.351 2.603c-.785.57-1.84-.197-1.54-1.118l1.287-3.966a1 1 0 00-.364-1.118L2.653 9.393c-.783-.57-.38-1.81.588-1.81h4.173a1 1 0 00.95-.69L9.05 2.927z" />
                    </svg>
                    <span className="font-medium">{formatRating(data?.overall)}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                  <div className="flex items-center gap-2">
                    {/* reviews icon */}
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8-1.89 0-3.64-.44-5.06-1.2L3 21l1.2-3.94C3.44 15.64 3 13.89 3 12c0-4.97 3.582-9 8-9s8 4.03 8 9z" />
                    </svg>
                    <div>
                      <div className="text-xs">Reviews</div>
                      <div className="font-medium">{formatCount(data?.reviews ?? data?.all ?? data?.complete)}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* complete icon */}
                    {/* <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M16.707 5.293a1 1 0 010 1.414L8.414 15 5 11.586a1 1 0 10-1.414 1.414l4 4a1 1 0 001.414 0l9-9a1 1 0 00-1.414-1.414z" />
                    </svg> */}
                    <div>
                      <div className="text-xs">Complete</div>
                      <div className="font-medium">{formatCount(data?.complete)}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* incomplete icon */}
                    <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <div>
                      <div className="text-xs">Incomplete</div>
                      <div className="font-medium">{formatCount(data?.incomplete)}</div>
                    </div>
                  </div>

              
                    {/* completion rate icon */}
                    {/* <svg className="w-4 h-4 text-indigo-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11H9v5h2V7z" />
                    </svg>
                    <div>
                      <div className="text-xs">Completion</div>
                      <div className="font-medium">{(typeof data?.completion_rate === 'number') ? `${(data.completion_rate * 100).toFixed(0)}%` : 'N/A'}</div>
                    </div> */}
                  
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-auto space-y-3">
        {/* Budget */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500 uppercase tracking-wide">Budget</span>
          <span className="text-lg font-bold text-green-600">{budgetDisplay}</span>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-4">
           <div className="flex items-center space-x-2">
              <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
              <span className="text-gray-600">{bidCount} bids</span>
              <span className="text-gray-600">{bidAvgDisplay ? `avg ${bidAvgDisplay}` : 'avg N/A'}</span>
            </div>
          </div>

          <div className="text-xs text-gray-500">
            {formattedDate}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="flex items-start space-x-2">
              <svg className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div className="flex-1">
                <p className="text-sm text-red-600">{error}</p>
                <button
                  onClick={clearError}
                  className="text-red-700 hover:text-red-800 text-xs font-medium mt-1 underline"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <p className="text-sm text-green-600 font-medium">Bid placed successfully!</p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100 space-x-2">
          {/* View Project Button */}
          <button
            onClick={handleViewProject}
            disabled={!seo_url}
            className={`
              text-xs py-2 px-3 rounded-lg font-medium transition-all duration-200 flex items-center space-x-1 flex-1
              ${!seo_url
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gray-600 hover:bg-gray-700 text-white shadow-sm hover:shadow-md transform hover:-translate-y-0.5'
              }
            `}
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            <span>{seo_url ? 'View Project' : 'No Link'}</span>
          </button>

          {/* Place Bid Button */}
          <button
            onClick={handleOpenBid}
            disabled={loading || hasAlreadyBid}
            className={`
              text-xs py-2 px-3 rounded-lg font-medium transition-all duration-200 flex items-center space-x-1 flex-1
              ${hasAlreadyBid
                ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                : loading
                  ? 'bg-blue-100 text-blue-600 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md transform hover:-translate-y-0.5'
              }
            `}
          >
            {loading ? (
              <>
                <div className="w-3 h-3 border border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span>Placing...</span>
              </>
            ) : hasAlreadyBid ? (
              <>
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Bid Placed</span>
              </>
            ) : (
              <>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>Place Bid</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Proposal Modal */}
      <ProposalModal
        open={isModalOpen}
        url={seo_url}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmitBid}
        projectId={project.id}
        projectTitle={project.title}
        projectDescription={project.description}
        budget={project.budget}
        type={project.type}
        calculateBidAmount={calculateBidAmount}
        clientPublicName={ownerUser?.public_name ?? ownerUser?.publicName ?? null}
        initialProposal={initialProposal}      
        apiLoading={apiProposalLoading} 
      />
    </div>
  );
};

export default ProjectCard;



