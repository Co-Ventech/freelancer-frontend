import React, { useEffect, useMemo, useState } from 'react';
import { PROPOSAL_STORAGE_PREFIX } from '../utils/apiUtils';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useUsersStore } from '../store/useUsersStore';
import { getGeneralProposal } from '../constants/general-proposal';
import { saveBidHistory } from '../utils/saveBidHistory';

const ProposalModal = ({
  open,
  onClose,
  onSubmit,
  projectId,
  projectTitle,
  projectDescription,
  type,
  budget,
  url,
  calculateBidAmount,
  initialPeriod = 5,
  clientPublicName = null,
  initialProposal = null,   // NEW: api-provided proposal string
  apiLoading = false,  
}) => {
  const storageKey = useMemo(() => `${PROPOSAL_STORAGE_PREFIX}${projectId}`, [projectId]);
  const [amount, setAmount] = useState(0);
  const [period, setPeriod] = useState(initialPeriod);
  const [proposal, setProposal] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loadingProposal, setLoadingProposal] = useState(false);
  const [error, setError] = useState(null);
  const { currentUser, bidderId } = useAuth();
  const selectedSubUser = useUsersStore((s) => s.getSelectedUser && s.getSelectedUser());
  const subUserTemplate = selectedSubUser?.general_proposal || selectedSubUser?.generalProposal || selectedSubUser?.generalProposalText || null;
  const selectedBidderId = selectedSubUser?.user_bid_id || selectedSubUser?.bidder_id || bidderId;
  const displayName = selectedSubUser?.sub_username || selectedSubUser?.name || currentUser || 'DEFAULT';
  const publicName = selectedSubUser?.public_name || selectedSubUser?.publicName || selectedSubUser?.name || null;
  const username = selectedSubUser?.sub_username || selectedSubUser?.username || null;

  const [isAmountEdited, setIsAmountEdited] = useState(false);
  const [isAiProposalEnabled, setIsAiPropoalEnabled] = useState(false);
  const calculatedAmount = useMemo(() => {
    return calculateBidAmount({ type, budget });
  }, [type, budget, calculateBidAmount]);

  // Calculate bid amount when modal opens
  useEffect(() => {
    if (!open) return;

    if (calculatedAmount === null) {
      if (!isAmountEdited) {
        if (budget && (budget.maximum || budget.minimum)) {
          // prefer maximum if present, otherwise use minimum
          const prefill = budget.maximum ?? budget.minimum;
          setAmount(String(prefill));
        } else {
          setAmount(''); // leave empty so user types a value
        }
      }
    } else {
      setError(null);
      if (!isAmountEdited) {
        setAmount(String(calculatedAmount));
      }
    }
  }, [open, budget, error, calculatedAmount, isAmountEdited, amount]);

const personalizeProposal = (template, clientName) => {
    if (!template) return null;
    if (!clientName) return template;
    // Prefer explicit placeholder replacement if sub-user used it
    if (/\{\{\s*client(Name)?\s*\}\}/i.test(template)) {
      return template.replace(/\{\{\s*client(Name)?\s*\}\}/gi, clientName);
    }
    // Otherwise, if template already begins with a greeting like "Hey" insert name after Hey
    if (/^\s*hey[,!\s]/i.test(template)) {
      return template.replace(/^\s*hey([,!\s]*)/i, `Hey ${clientName}$1`);
    }
    // Fallback: prepend a greeting line
    return `Hey ${clientName},\n\n${template}`;
  };

  // generate proposal when AI toggle enabled — define fetch inline so effect deps are explicit
   useEffect(() => {
    if (!open) return;  

    if (isAiProposalEnabled) {
      const ctrl = new AbortController();
      const doFetch = async () => {
        setLoadingProposal(true);
        setError(null);
        try {
          const response = await axios.post(
            `${process.env.REACT_APP_API_BASE_URL}/generate-proposal`,
            {
              id: projectId,
              title: projectTitle,
              description: projectDescription,
              name: displayName,
              public_name: publicName,
              username: username,
              client_public_name: clientPublicName
            },
            { signal: ctrl.signal }
          );

          if (response?.status === 200) {
            setProposal(response.data.proposal);
          } else {
            setProposal('Failed to generate proposal.');
          }
        } catch (err) {
          if (err?.name === 'CanceledError' || err?.message === 'canceled') return;
          console.error('Error generating proposal:', err);
          setProposal('Failed to generate proposal.');
          setError('Could not generate proposal. Please try again.');
        } finally {
          setLoadingProposal(false);
        }
      };
      doFetch();
      return () => ctrl.abort();
    } else {
      // if server-side generation still in progress, show generating state
      if (apiLoading) {
        setLoadingProposal(true);
        return;
      }
      setLoadingProposal(false);

      // Use API-provided proposal only when it's a non-empty string.
      // If API returned null/undefined or an empty string, fall back to personalized/general proposal.
      const hasApiProposal = typeof initialProposal === 'string' && initialProposal.trim().length > 0;
      if (hasApiProposal) {
        setProposal(initialProposal);
        return;
      }

      // fallback: personalized user template or general proposal
      const personalized = subUserTemplate ? personalizeProposal(subUserTemplate, clientPublicName) : null;
      const generalProposal = personalized || getGeneralProposal(displayName, clientPublicName);
      setProposal(generalProposal);
    }
  }, [isAiProposalEnabled, displayName, projectId, projectTitle, projectDescription, open, initialProposal, apiLoading]);
  // Persist on change (debounced light)
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => {
      try {
        localStorage.setItem(storageKey, JSON.stringify({ proposal, amount, period }));
      } catch { }
    }, 250);
    return () => clearTimeout(t);
  }, [open, storageKey, proposal, amount, period]);


  const handleSubmit = async () => {
    setError(null);
    setSubmitting(true);
    try {
      await onSubmit({
        amount: Number(amount),
        period: Number(period),
        description: proposal
      });
      await saveBidHistory({
        projectId,
        bidderId: selectedBidderId,
        amount: Number(amount),
        projectType: type,
        period: Number(period),
        description: proposal,
        projectDescription: projectDescription,
        projectTitle: projectTitle,
        budget,
        url,
        bidderType: "manual"
      })


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
                   disabled={loadingProposal || apiLoading}
                />
              <div className="mt-1 text-xs text-gray-400">
                  {apiLoading ? 'Generating proposal from API…' : loadingProposal ? 'Generating…' : 'Saved automatically'}
                </div>
              </div>
              <div className="space-y-3">
                {/*  */}
                <label class="switch">
                  <input type="checkbox" checked={isAiProposalEnabled}
                    onChange={() => setIsAiPropoalEnabled((prev) => !prev)}
                  />
                  <span class="slider round" className='text-sm'> AI Proposal</span>
                </label>
                <div>
                  <label className="text-sm text-gray-500 block mb-1">Bid Amount</label>
                  <input
                    type="number"
                    min={1}
                    className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    value={amount}
                    onChange={(e) => {
                      if (!isAmountEdited)
                        setIsAmountEdited(true);
                      setAmount(e.target.value);
                    }}
                  />
                  {calculatedAmount === null && budget && (budget.maximum || budget.minimum) && (
                    <div className="text-xs text-gray-500 mt-1">
                      Prefilled with project max: ${budget.maximum ?? budget.minimum}. You can edit this value.
                    </div>
                  )}
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
                  {budget && budget.minimum && budget.maximum ? (
                    <div className="font-medium text-gray-900">
                      Min: ${budget.minimum}, Max: ${budget.maximum}
                    </div>
                  ) : (
                    <div className="text-gray-500">Budget information not available</div>
                  )}
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
              disabled={submitting || amount <= 0 || loadingProposal}
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