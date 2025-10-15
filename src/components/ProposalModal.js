import React, { useEffect, useMemo, useState } from 'react';
import { PROPOSAL_STORAGE_PREFIX } from '../utils/apiUtils';
import axios from 'axios';
// const defaultProposal = (title) =>
//  `Hello,\n\nI am excited to submit my proposal for "${title}".\n\nI have 7 years of experience delivering high-quality software solutions, including custom web and mobile applications for international clients. My expertise covers the full development cycle from requirements to deployment and ongoing maintenance.\n\nFor your project "${title}", I will leverage my experience to:\n- Analyze your requirements in detail\n- Communicate proactively and transparently\n- Deliver robust, scalable solutions on time and within budget\n\nI'm passionate about this domain and eager to contribute to your success. Please let me know a convenient time to chat about your specific goals!\n\nBest regards`

// const defaultProposal = (title) => `Hey, how are you?
// Yes, I can help you design and develop a modern, visually stunning, and fully functional platform that delivers an exceptional user experience. Whether it’s UI/UX design, full-stack web development, or CMS-based solutions, I’ll ensure everything is pixel-perfect, mobile responsive, fast-loading, and aligned with your business goals.
// I’m new to Freelancer but bring over 7+ years of professional experience working with modern technologies including PHP, Laravel, Node.js, React, Next.js, Firebase, MySQL, WordPress, Shopify, Figma. I’ve built scalable systems, high-conversion landing pages, and dynamic dashboards for both startups and enterprises.
// You can review a few of my past work:
// https://app.recruitinn.ai
// https://skillbuilder.online
// https://co-ventech.com
// https://app.co-ventech.com
// https://www.starmarketingonline.com/
// https://teamwear.design/
// https://visanetic.com/
// https://drivefds.com/
// https://gfsbuilders.com.pk/
// https://bachatt.com/
// Looking forward to creating something exceptional, user-friendly, and performance-driven for your platform.
// Thank you.\n\nBest regards,\nAhsan`

const ProposalModal = ({
  open,
  onClose,
  onSubmit,
  projectId,
  projectTitle,
  projectDescription,
  budgetDisplay,
  initialAmount = 250,
  initialPeriod = 5,
}) => {
  const storageKey = useMemo(() => `${PROPOSAL_STORAGE_PREFIX}${projectId}`, [projectId]);
  const [amount, setAmount] = useState(initialAmount);
  const [period, setPeriod] = useState(initialPeriod);
  const [proposal, setProposal] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loadingProposal, setLoadingProposal] = useState(false);
  const [error, setError] = useState(null);


  // Fetch dynamic proposal when modal opens
  useEffect(() => {
    if (!open) return;

   const fetchProposal = async () => {
  setLoadingProposal(true);
  setError(null);

  try {
    console.log('Sending API request:', {
      id: projectId,
      title: projectTitle,
      description: projectDescription, // Check if this is null or undefined
    });

    const response = await axios.post(`${process.env.REACT_APP_API_BASE_URL}/generate-proposal`, {
      id: projectId,
      title: projectTitle,
      description: projectDescription,
    });

    setProposal(response.data.proposal || 'Failed to generate proposal.');
  } catch (err) {
    console.error('Error generating proposal:', err);
    setProposal('Failed to generate proposal.');
    setError('Could not generate proposal. Please try again.');
  } finally {
    setLoadingProposal(false);
  }
};

    fetchProposal();
  }, [open, projectId, projectTitle, projectDescription]);

  // Load saved draft on open
  // useEffect(() => {
  //   if (!open) return;
  //   try {
  //     const saved = localStorage.getItem(storageKey);
  //     if (saved) {
  //       const parsed = JSON.parse(saved);
  //       if (parsed?.proposal) setProposal(parsed.proposal);
  //       if (parsed?.amount) setAmount(parsed.amount);
  //       if (parsed?.period) setPeriod(parsed.period);
  //     } else {
  //       setProposal(defaultProposal(projectTitle));
  //       setAmount(initialAmount);
  //       setPeriod(initialPeriod);
  //     }
  //   } catch {
  //     // ignore
  //   }
  // }, [open, storageKey, projectTitle, initialAmount, initialPeriod]);

  // Persist on change (debounced light)
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => {
      try {
        localStorage.setItem(storageKey, JSON.stringify({ proposal, amount, period }));
      } catch {}
    }, 250);
    return () => clearTimeout(t);
  }, [open, storageKey, proposal, amount, period]);

  const calculateBidAmount = (type, budget) => {
  if (!budget || !budget.minimum || !budget.maximum) {
    console.log('Invalid budget data:', budget);
    return { amount: null, error: 'Invalid budget data' };
  }

  const minBudget = budget.minimum;
  const maxBudget = budget.maximum;

  if (type === 'hourly') {
    // Hourly Projects
    if (minBudget > 10) {
      return { amount: minBudget, error: null }; // Bid the minimum amount for rates > $10/hour
    } else {
      return { amount: maxBudget, error: null }; // Bid the maximum amount for rates ≤ $10/hour
    }
  } else if (type === 'fixed') {
    // Fixed-Price Projects
    if (minBudget >= 200 && maxBudget <= 500) {
      return { amount: maxBudget, error: null }; // Bid the maximum amount for budgets between $200 and $500
    } else if (maxBudget > 1000) {
      return { amount: minBudget, error: null }; // Bid the minimum amount for budgets > $1,000
    } else if (maxBudget < 200) {
      return { amount: null, error: 'Budget is too low to place a bid' }; // Skip projects with budgets < $200
    }
  }

  return { amount: null, error: 'Project does not meet bidding criteria' };
};

  const handleSubmit = async () => {
    setError(null);
    setSubmitting(true);
    try {
      await onSubmit({
        amount: Number(amount),
        period: Number(period),
        description: proposal
      });
        // Save bid history
    await axios.post(`${process.env.REACT_APP_API_BASE_URL}/save-bid-history`, {
      project_id: projectId,
      bidder_id: 'MANUAL_BIDDER', // Replace with actual bidder ID if available
      amount: Number(amount),
      period: Number(period),
      description: proposal,
    });


      onClose?.();
    } catch (e) {
      setError(e?.message || 'Failed to place bid');
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40" 
        onClick={submitting ? undefined : onClose}
      ></div>

      {/* Modal */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Place a Bid</h3>
            <button
              onClick={onClose}
              disabled={submitting}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          <div className="px-6 py-5 space-y-4">
            <div>
              <div className="text-sm text-gray-500">Project</div>
              <div className="font-medium text-gray-900">{projectTitle}</div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="text-sm text-gray-500 block mb-1">Proposal</label>
                <textarea
                  className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  rows={6}
                  value={proposal}
                  onChange={(e) => setProposal(e.target.value)}
                />
                <div className="mt-1 text-xs text-gray-400">Saved automatically</div>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-gray-500 block mb-1">Bid Amount</label>
                  <input
                    type="number"
                    min={1}
                    className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-500 block mb-1">Delivery (days)</label>
                  <input
                    type="number"
                    min={1}
                    className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                  />
                </div>
                <div className="bg-gray-50 rounded-lg p-2 text-xs">
                  <div className="text-gray-500">Budget</div>
                  <div className="font-medium text-gray-900">{budgetDisplay}</div>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg p-3 text-sm">
                {error}
              </div>
            )}
          </div>

          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-2">
            <button
              onClick={onClose}
              disabled={submitting}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className={`btn-primary ${submitting ? 'opacity-80 cursor-not-allowed' : ''}`}
            >
              {submitting ? 'Submitting...' : 'Submit Bid'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProposalModal;