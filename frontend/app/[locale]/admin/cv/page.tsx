'use client';

import { useEffect, useState, useRef } from 'react';
import { fetchApi, uploadFileWithAuth } from '@/app/lib/api';
import type { CvMetadata, CvUploadResponse } from '@/app/types/dashboard';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

export default function AdminCVPage() {
  const [metadata, setMetadata] = useState<CvMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetchApi<CvMetadata>('/cv');
        setMetadata(res.data);
      } catch {
        setMetadata(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const result = await uploadFileWithAuth<CvUploadResponse>('/admin/cv', formData);
      setMetadata({
        file_name: result.data.file_name,
        size_bytes: result.data.size_bytes,
        updated_at: result.data.updated_at,
      });
      setSuccess('CV uploaded successfully.');
      setTimeout(() => setSuccess(null), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to upload CV');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 border-4 border-accent/30 border-t-accent rounded-full motion-safe:animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-text font-display">CV Management</h1>
      <p className="mt-2 text-text-muted">
        Upload, replace, or download your CV. Only one active CV file is stored at a time.
      </p>

      {error && (
        <div className="mt-4 glass-card--light border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {success && (
        <div className="mt-4 glass-card--light border border-secondary/30 px-4 py-3 text-sm text-secondary">
          {success}
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current CV info */}
        <div className="glass-card--light p-6">
          <h2 className="text-lg font-semibold text-text font-display mb-4">
            Current CV
          </h2>
          {metadata ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-[var(--glass-border)]">
                <span className="text-sm text-text-muted">File Name</span>
                <span className="text-sm font-medium text-text">
                  {metadata.file_name}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-[var(--glass-border)]">
                <span className="text-sm text-text-muted">Size</span>
                <span className="text-sm font-medium text-text">
                  {formatSize(metadata.size_bytes)}
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-text-muted">Last Updated</span>
                <span className="text-sm font-medium text-text">
                  {new Date(metadata.updated_at).toLocaleDateString()}
                </span>
              </div>
              <a
                href={`${API_BASE}/cv/download`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary/90 motion-safe:transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download CV
              </a>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-sm text-text-muted">No CV uploaded yet.</p>
            </div>
          )}
        </div>

        {/* Upload new CV */}
        <div className="glass-card--light p-6">
          <h2 className="text-lg font-semibold text-text font-display mb-4">
            {metadata ? 'Replace CV' : 'Upload CV'}
          </h2>
          <p className="text-sm text-text-muted mb-4">
            Upload a PDF file. The existing CV will be replaced.
          </p>

          <label className="flex flex-col items-center justify-center border-2 border-dashed border-[var(--glass-border)] rounded-xl p-8 cursor-pointer hover:border-primary/50 motion-safe:transition-colors">
            <svg className="w-10 h-10 text-text-muted mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-sm font-medium text-text-muted">
              {uploading ? 'Uploading...' : 'Click to select a PDF file'}
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleUpload}
              disabled={uploading}
              className="hidden"
            />
          </label>
        </div>
      </div>
    </div>
  );
}
