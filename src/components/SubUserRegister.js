import { useState } from "react"
import axios from "axios"
import { getAuthHeaders } from "../utils/api"

const SubUserRegister = ({ parentUid, onSuccess }) => {
  const API_BASE = process.env.REACT_APP_API_BASE_URL

  const [subUserAccessToken, setSubUserAccessToken] = useState("")
  const [username, setUsername] = useState("")
  const [autobidEnabled, setAutobidEnabled] = useState(false)
  const [autobidForJobType, setAutobidForJobType] = useState("all")
  const [proposalType, setProposalType] = useState("general")
  const [generalProposal, setGeneralProposal] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)
  const [error, setError] = useState(null)

  const validate = () => {
    if (!subUserAccessToken || !subUserAccessToken.trim()) {
      setError("Sub-user access token is required.")
      return false
    }
    if (!username || !username.trim()) {
      setError("Sub-username is required.")
      return false
    }
    if (!parentUid) {
      setError("Parent UID missing. Please ensure you are logged in.")
      return false
    }
    if (!generalProposal || !generalProposal.trim()) {
      setError("General proposal text is required.")
      return false
    }
    return true
  }

  const handleSubmit = async (e) => {
    e?.preventDefault?.()
    setError(null)
    setMessage(null)
    if (!validate()) return

    setLoading(true)
    try {
      const payload = {
        sub_user_access_token: subUserAccessToken.trim(),
        sub_username: username.trim(),
        autobid_enabled: !!autobidEnabled,
        parent_uid: parentUid,
        autobid_enabled_for_job_type: autobidForJobType || "all",
        autobid_proposal_type: proposalType || "general",
        general_proposal: generalProposal.trim(),
      }

      const url = `${API_BASE}/sub-users`
      const authHeaders = getAuthHeaders()
      const headers = { "Content-Type": "application/json", ...authHeaders }
      const resp = await axios.post(url, payload, {
        headers,
        validateStatus: () => true,
      })

      if (resp.status === 200 || resp.status === 201) {
        setMessage("Sub-user created successfully.")
        setUsername("")
        setAutobidEnabled(false)
        setAutobidForJobType("all")
        setProposalType("general")
        setGeneralProposal("")
        if (onSuccess) onSuccess(resp.data)
      } else {
        const errMsg = resp.data?.message || `Server responded ${resp.status}`
        setError(errMsg)
      }
    } catch (err) {
      setError(err.message || "Network error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="mb-8 pb-6 border-b border-gray-200">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Register Sub-User</h2>
            <p className="text-base text-gray-600">
              Set up a new sub-account with auto-bidding capabilities and proposal templates
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-red-800">{error}</p>
          </div>
        </div>
      )}

      {message && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-green-800">{message}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Account Credentials Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-5">Account Credentials</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sub-user Access Token *</label>
              <input
                value={subUserAccessToken}
                onChange={(e) => setSubUserAccessToken(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="Enter access token"
              />
              <p className="mt-1 text-xs text-gray-500">Unique token for authentication</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sub Username *</label>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="Enter username"
              />
              <p className="mt-1 text-xs text-gray-500">Display name for this sub-account</p>
            </div>
          </div>
        </div>

        {/* Auto-bid Configuration */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-5">Auto-bid Configuration</h3>

          <div className="space-y-6">
            {/* Enable Auto-bid */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center gap-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">Enable Auto-bidding</p>
                  <p className="text-xs text-gray-500 mt-0.5">Automatically bid on matching jobs</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={autobidEnabled}
                  onChange={(e) => setAutobidEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Job Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Auto-bid Job Type</label>
              <select
                value={autobidForJobType}
                onChange={(e) => setAutobidForJobType(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white"
              >
                <option value="all">All Job Types</option>
                <option value="fixed">Fixed Price Only</option>
                <option value="hourly">Hourly Only</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">Choose which job types to bid on</p>
            </div>

            {/* Proposal Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Proposal Type</label>
              <select
                value={proposalType}
                onChange={(e) => setProposalType(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white"
              >
                <option value="general">General Proposal</option>
                <option value="ai-generated">AI-Generated Proposal</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">Select the proposal generation method</p>
            </div>
          </div>
        </div>

        {/* Proposal Template */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-5">Proposal Template</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">General Proposal Text *</label>
            <textarea
              value={generalProposal}
              onChange={(e) => setGeneralProposal(e.target.value)}
              rows={5}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
              placeholder="Enter your default proposal text. This will be used as the template when proposalType is 'general'..."
              required
            />
            <p className="mt-2 text-xs text-gray-500">
              This proposal text will be used for all auto-bid submissions when proposal type is set to general
            </p>
            <div className="mt-2 flex items-center text-xs text-gray-500">
              <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
              Character count: {generalProposal.length}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg text-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Creating...
              </span>
            ) : (
              "Create Sub-user"
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setSubUserAccessToken("")
              setUsername("")
              setAutobidEnabled(false)
              setAutobidForJobType("all")
              setProposalType("general")
              setGeneralProposal("")
              setError(null)
              setMessage(null)
            }}
            className="px-6 py-2.5 bg-gray-200 text-gray-700 font-medium rounded-lg text-sm hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition"
          >
            Reset
          </button>
        </div>
      </form>
    </div>
  )
}

export default SubUserRegister