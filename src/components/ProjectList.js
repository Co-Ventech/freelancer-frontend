import React, { useEffect, useMemo, useState } from 'react';
import ProjectCard from './ProjectCard';
import { isProjectNew } from '../utils/apiUtils';

/**
 * ProjectList component - renders a grid of project cards
 */
const ProjectList = ({ projects, loading, error, lastFetchTime, newCount, oldCount, bidderType }) => {
  // live clock (ms) to update "time since last fetch"
  const [nowMs, setNowMs] = useState(Date.now());

  useEffect(() => {
    const t = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const lastFetchRelative = useMemo(() => {
    if (!lastFetchTime) return 'N/A';
    const diffSec = Math.max(0, Math.floor((nowMs - lastFetchTime) / 1000));
    if (diffSec < 60) return `${diffSec}s ago`;
    const min = Math.floor(diffSec / 60);
    const sec = diffSec % 60;
    return `${min}m ${sec}s ago`;
  }, [nowMs, lastFetchTime]);

  const lastFetchAbsolutePK = useMemo(() => {
    if (!lastFetchTime) return 'N/A';
    try {
      return new Date(lastFetchTime).toLocaleString('en-US', {
        timeZone: 'Asia/Karachi',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return 'N/A';
    }
  }, [lastFetchTime]);

  // Split projects into New (<= 60s) and Older
  const { newProjects, oldProjects } = useMemo(() => {
    const nowUnix = Math.floor(nowMs / 1000);
    const n = [];
    const o = [];
    (projects || []).forEach(p => {
      if (isProjectNew(p.submitdate, nowUnix)) n.push(p);
      else o.push(p);
    });
    // sort each bucket by submitdate desc
    n.sort((a, b) => (b.submitdate || 0) - (a.submitdate || 0));
    o.sort((a, b) => (b.submitdate || 0) - (a.submitdate || 0));
    return { newProjects: n, oldProjects: o };
  }, [projects, nowMs]);

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="loading-spinner mb-4"></div>
        <p className="text-gray-600 text-lg">Fetching recent projects...</p>
        <p className="text-gray-500 text-sm mt-2">This may take a few seconds</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 max-w-md text-center">
          <svg className="w-12 h-12 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 15.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Projects</h3>
          <p className="text-red-600 text-sm mb-4">{error}</p>
        </div>
      </div>
    );
  }

  // Empty state
  if (!projects || projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 max-w-md text-center">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No Projects Found</h3>
          <p className="text-gray-500 text-sm mb-4">
            No recent projects match your criteria. Try fetching again or check back later.
          </p>
        </div>
      </div>
    );
  }

  // List view with sections: New on top, Older below
  return (
    <div className="space-y-6">
      {/* Results header with counts and last fetch */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Recent Projects</h2>
          {/* <p className="text-sm text-gray-500 mt-1">
            Last fetch: <span className="font-medium text-gray-700">{lastFetchAbsolutePK}</span>
            {' '}(<span className="text-gray-600">{lastFetchRelative}</span>)
          </p> */}
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
            New: {newCount ?? newProjects.length}
          </div>
          <div className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm font-medium">
            Older: {oldCount ?? oldProjects.length}
          </div>
          <div className="bg-primary-100 text-primary-800 px-3 py-1 rounded-full text-sm font-medium">
            Total: {projects.length}
          </div>
        </div>
      </div>

      {/* New Projects */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">New (≤ 1 minute)</h3>
          <span className="text-sm text-gray-500">{newProjects.length} item{newProjects.length !== 1 ? 's' : ''}</span>
        </div>
        {newProjects.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-600">
            No new projects in the last minute.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {newProjects.map((project) => (
              <ProjectCard key={project.id || Math.random()} project={project} bidderType={bidderType}/>
            ))}
          </div>
        )}
      </div>

      {/* Older Projects */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Older</h3>
          <span className="text-sm text-gray-500">{oldProjects.length} item{oldProjects.length !== 1 ? 's' : ''}</span>
        </div>
        {oldProjects.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-600">
            No older projects found.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {oldProjects.map((project) => (
              <ProjectCard key={project.id || Math.random()} project={project} />
            ))}
          </div>
        )}
      </div>

      {/* Footer info */}
      <div className="text-center pt-8 border-t border-gray-200">
        <p className="text-gray-500 text-sm">
          Auto-refresh every 5 minutes • New projects appear in the first section
        </p>
      </div>
    </div>
  );
};

export default ProjectList;