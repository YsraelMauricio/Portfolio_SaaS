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
        <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-zinc-900 dark:text-[#FAFAFA]">CV Management</h1>
      <p className="mt-2 text-zinc-500 dark:text-[rgba(250,250,250,0.6])">
        Upload, replace, or download your CV. Only one active CV file is stored at a time.
      </p>

      {error && (
        <div className="mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-4 py-3 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {success && (
        <div className="mt-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg px-4 py-3 text-sm text-green-600 dark:text-green-400">
          {success}
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current CV info */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-[#FAFAFA] mb-4">
            Current CV
          </h2>
          {metadata ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-zinc-100 dark:border-zinc-800">
                <span className="text-sm text-zinc-500 dark:text-[rgba(250,250,250,0.55)]">File Name</span>
                <span className="text-sm font-medium text-zinc-900 dark:text-[#FAFAFA]">
                  {metadata.file_name}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-zinc-100 dark:border-zinc-800">
                <span className="text-sm text-zinc-500 dark:text-[rgba(250,250,250,0.55)]">Size</span>
                <span className="text-sm font-medium text-zinc-900 dark:text-[#FAFAFA]">
                  {formatSize(metadata.size_bytes)}
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-zinc-500 dark:text-[rgba(250,250,250,0.55)]">Last Updated</span>
                <span className="text-sm font-medium text-zinc-900 dark:text-[#FAFAFA]">
                  {new Date(metadata.updated_at).toLocaleDateString()}
                </span>
              </div>
              <a
                href={`${API_BASE}/cv/download`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-[#6D28D9] text-white rounded-lg hover:bg-[#5B21B6] transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download CV
              </a>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-sm text-zinc-400 dark:text-zinc-500">No CV uploaded yet.</p>
            </div>
          )}
        </div>

        {/* Upload new CV */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-[#FAFAFA] mb-4">
            {metadata ? 'Replace CV' : 'Upload CV'}
          </h2>
          <p className="text-sm text-zinc-500 dark:text-[rgba(250,250,250,0.55)] mb-4">
            Upload a PDF file. The existing CV will be replaced.
          </p>

          <label className="flex flex-col items-center justify-center border-2 border-dashed border-zinc-300 dark:border-zinc-600 rounded-xl p-8 cursor-pointer hover:border-[#6D28D9]/50 transition-colors">
            <svg className="w-10 h-10 text-zinc-400 dark:text-zinc-500 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
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
