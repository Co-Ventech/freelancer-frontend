import React, { useState } from 'react';
import { formatUnixToPakistanTime, formatCurrency } from '../utils/dateUtils';
import { useBidding } from '../hooks/useBidding';
import bidService from '../services/bidService';
import { isProjectNew } from '../utils/apiUtils';
import ProposalModal from './ProposalModal';
import { useFreelancerAPI } from '../hooks/useFreelancerAPI';
/**
 * ProjectCard component - renders a single project in a card format
 */
const ProjectCard = ({ project, bidderType,usersMap= null }) => {
  const { loading, error, success, placeBid, clearError } = useBidding();
  const { calculateBidAmount } = useFreelancerAPI({bidderType}); 
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showFullDesc, setShowFullDesc] = useState(false);
  // Extract project data with fallbacks based on the actual API response structure
  const {
    id = 'N/A',
    title = 'Untitled Project',
    status = 'N/A',
    seo_url = null,
    currency = {},
    description ,
    preview_description = null,
    submitdate = null,
    type = 'N/A',
    bidperiod = 'N/A',
    budget ,
    bid_stats = {},
    location ,
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



  const ownerCountry = getOwnerCountry(project);
  // --- end country extraction ---
// ...existing code...

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

 const isPaymentVerified = users?.[project.owner_id]?.status?.payment_verified || `N/A`;


    const nowUnix = Math.floor(Date.now() / 1000);
    const isNew = isProjectNew(submitdate, nowUnix);

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



    // Handle opening bid modal
  const handleOpenBid = () => {
    if (hasAlreadyBid) {
      alert('You have already placed a bid on this project.');
      return;
    }
    setIsModalOpen(true);
  };
  
    // Handle bid submission from modal
  const handleSubmitBid = async ({ amount, period, description }) => {
  try {
    const result = await placeBid(id, amount, period, description, seo_url, type, title, projectDescription, budget);

    if (result?.success) {
      console.log('Bid response:', result.data);
      alert('Bid placed successfully!'); // Trigger alert on success
    } else if (result?.message) {
      console.error('Bid error:', result.message);
      alert(`Error: ${result.message}`); // Show error message in alert
    } else {
      throw new Error('Failed to place bid');
    }
  } catch (error) {
    console.error('Error in handleSubmitBid:', error);
    alert(`Error: ${error.message || 'An unexpected error occurred'}`);
  }
};
  // Handle bid placement
  // const handlePlaceBid = async () => {
  //   if (hasAlreadyBid) {
  //     alert('You have already placed a bid on this project.');
  //     return;
  //   }

  //   const result = await placeBid(
  //     id,
  //     750, // Default amount
  //     5,   // Default period (5 days)
  //     `I am interested in working on "${title}". I have the necessary skills and experience to deliver high-quality results within the specified timeframe. Let's discuss the project requirements in detail.`
  //   );

  //   if (result.success) {
  //     console.log('Bid response:', result.data);
  //   }
  // };

  // Handle view project link
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
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
            status === 'active' 
              ? 'bg-green-100 text-green-800' 
              : 'bg-gray-100 text-gray-800'
          }`}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        </div>

        <h3 className="text-lg font-semibold text-gray-900 mb-3 line-clamp-2 leading-tight">
          {title}
        </h3>
        
        {/* Description
        <p className="text-gray-600 text-sm mb-4 leading-relaxed">
          {truncatedDescription}
        </p> */}

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
          <span className="text-gray-500 block text-xs">Client Country</span>
          <span className="font-medium text-gray-900 text-sm">
            {ownerCountry || 'N/A'}
          </span>
        </div>

              {/* Currency Information */}
              <div className={`p-3 rounded-lg mb-4 ${
          currencyCode === 'USD' 
            ? 'bg-green-50 border border-green-200' 
            : 'bg-yellow-50 border border-yellow-200'
        }`}>
          <div className="flex items-center justify-between text-xs">
            <span className={`font-medium ${
              currencyCode === 'USD' ? 'text-green-600' : 'text-yellow-600'
            }`}>Currency</span>
            <span className={`${
              currencyCode === 'USD' ? 'text-green-800' : 'text-yellow-800'
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
            <div className="flex items-center space-x-1">
              <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
              <span className="text-gray-600">{bidCount} bids</span>
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
      />
    </div>
  );
};

export default ProjectCard;



