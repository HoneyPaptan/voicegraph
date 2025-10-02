'use client';

import { useState, useRef, useCallback } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Upload, File, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { processUploadedFile, validateFile, FileUploadResult } from '@/lib/tools/file-upload';

interface FileUploadNodeProps {
  nodeId: string;
  onFileUploaded: (nodeId: string, result: FileUploadResult) => void;
  onFileRemoved: (nodeId: string) => void;
  initialFile?: File;
  initialContent?: string;
  allowedTypes?: string[]; // Specific file types allowed for this node
  nodeType?: string; // The node type (csv_upload, pdf_upload, etc.)
}

export function FileUploadNode({ 
  nodeId, 
  onFileUploaded, 
  onFileRemoved,
  initialFile,
  initialContent,
  allowedTypes,
  nodeType
}: FileUploadNodeProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(initialFile || null);
  const [uploadResult, setUploadResult] = useState<FileUploadResult | null>(
    initialContent ? { success: true, text: initialContent } : null
  );
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(async (file: File) => {
    setError(null);
    setIsProcessing(true);

    try {
      // Validate file with specific type restrictions
      const validation = validateFile(file, allowedTypes);
      if (!validation.valid) {
        setError(validation.error || 'Invalid file');
        setIsProcessing(false);
        return;
      }

      // Process file
      const result = await processUploadedFile(file);
      
      if (result.success) {
        setUploadedFile(file);
        setUploadResult(result);
        // Pass the file reference in the result
        onFileUploaded(nodeId, { ...result, uploadedFile: file });
      } else {
        setError(result.error || 'Failed to process file');
      }
    } catch (err: any) {
      console.error('File upload error:', err);
      setError(err.message || 'Failed to upload file');
    } finally {
      setIsProcessing(false);
    }
  }, [nodeId, onFileUploaded]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const handleRemoveFile = useCallback(() => {
    setUploadedFile(null);
    setUploadResult(null);
    setError(null);
    onFileRemoved(nodeId);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [nodeId, onFileRemoved]);

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'csv':
        return '📊';
      case 'pdf':
        return '📄';
      case 'txt':
        return '📝';
      default:
        return '📁';
    }
  };

  const getFileTypeColor = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'csv':
        return 'text-green-400';
      case 'pdf':
        return 'text-red-400';
      case 'txt':
        return 'text-blue-400';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <div className="w-full">
      {!uploadedFile ? (
        <Card
          className={`
            border-2 border-dashed p-6 text-center cursor-pointer transition-all
            ${isDragOver 
              ? 'border-blue-400 bg-blue-50/10' 
              : 'border-gray-600 hover:border-gray-500'
            }
            ${isProcessing ? 'pointer-events-none opacity-50' : ''}
          `}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={allowedTypes ? allowedTypes.map(t => {
              const ext = t.split('/')[1] || t;
              return ext === 'csv' ? '.csv' : ext === 'pdf' ? '.pdf' : ext === 'txt' ? '.txt' : `.${ext}`;
            }).join(',') : ".csv,.pdf,.txt"}
            onChange={handleFileInputChange}
            className="hidden"
          />
          
          {isProcessing ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
              <p className="text-sm text-gray-300">Processing file...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <Upload className="w-8 h-8 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-200">Upload File</p>
                <p className="text-xs text-gray-400 mt-1">
                  Drag & drop or click to select
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  {allowedTypes ? 
                    `Supports ${allowedTypes.map(t => t.split('/')[1]?.toUpperCase() || t.toUpperCase()).join(', ')} (max 10MB)` :
                    'Supports CSV, PDF, TXT (max 10MB)'
                  }
                </p>
              </div>
            </div>
          )}
        </Card>
      ) : (
        <Card className="p-4 bg-gray-800/50 border-gray-700">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1">
              <div className="text-2xl">{getFileIcon(uploadedFile.name)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-medium text-gray-200 truncate">
                    {uploadedFile.name}
                  </p>
                  {uploadResult?.success ? (
                    <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  )}
                </div>
                <p className={`text-xs ${getFileTypeColor(uploadedFile.name)}`}>
                  {(uploadedFile.size / 1024).toFixed(1)} KB
                </p>
                {uploadResult?.metadata?.rowCount && (
                  <p className="text-xs text-gray-500 mt-1">
                    {uploadResult.metadata.rowCount} rows
                  </p>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRemoveFile}
              className="text-gray-400 hover:text-red-400 p-1"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          {error && (
            <div className="mt-3 p-2 bg-red-900/20 border border-red-700/50 rounded text-xs text-red-300">
              {error}
            </div>
          )}
          
          {uploadResult?.success && uploadResult.text && (
            <div className="mt-3 p-2 bg-green-900/20 border border-green-700/50 rounded">
              <p className="text-xs text-green-300">
                ✓ Text extracted successfully ({uploadResult.text.length} characters)
              </p>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
