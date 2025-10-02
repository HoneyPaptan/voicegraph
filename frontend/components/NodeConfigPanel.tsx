'use client';

import { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { X, Save, Settings } from 'lucide-react';
import { WorkflowNode } from '@/lib/types';
import { FileUploadNode } from './FileUploadNode';

interface NodeConfigPanelProps {
  node: WorkflowNode | null;
  onClose: () => void;
  onSave: (nodeId: string, params: Record<string, any>) => void;
}

// Get file type restrictions based on node type
function getFileTypeRestrictions(nodeType: string): string[] | undefined {
  switch (nodeType) {
    case 'csv_upload':
      return ['text/csv', 'application/csv'];
    case 'pdf_upload':
      return ['application/pdf'];
    case 'txt_upload':
      return ['text/plain', 'text/txt'];
    case 'file_upload':
    default:
      return undefined; // Allow all types
  }
}

// Define parameter configurations for each node type and action
const NODE_PARAMS_CONFIG: Record<string, Record<string, Array<{
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'url' | 'email';
  placeholder: string;
  required?: boolean;
  description?: string;
}>>> = {
  notion: {
    fetch_page: [
      { key: 'pageId', label: 'Page ID', type: 'text', placeholder: 'Enter Notion page ID', required: true, description: 'The ID of the Notion page to fetch' },
    ],
    fetch_database: [
      { key: 'databaseId', label: 'Database ID', type: 'text', placeholder: 'Enter Notion database ID', required: true, description: 'The ID of the Notion database to fetch' },
    ],
    query_database: [
      { key: 'databaseId', label: 'Database ID', type: 'text', placeholder: 'Enter Notion database ID', required: true },
      { key: 'filter', label: 'Filter Query', type: 'textarea', placeholder: 'Enter filter criteria (optional)', description: 'JSON filter for database query' },
    ],
  },
  notion_create: {
    create_page: [
      { key: 'parentId', label: 'Parent Page/Database ID', type: 'text', placeholder: 'Enter parent ID', required: true },
      { key: 'title', label: 'Page Title', type: 'text', placeholder: 'Enter page title', required: true },
      { key: 'content', label: 'Page Content', type: 'textarea', placeholder: 'Enter page content', description: 'Content will be added to the page' },
    ],
  },
  llm: {
    summarize: [
      { key: 'prompt', label: 'Custom Prompt', type: 'textarea', placeholder: 'Optional: Add custom instructions for summarization', description: 'Override default summarization prompt' },
      { key: 'maxLength', label: 'Max Length', type: 'text', placeholder: '500', description: 'Maximum length of summary in words' },
    ],
    analyze: [
      { key: 'prompt', label: 'Analysis Prompt', type: 'textarea', placeholder: 'What should the AI analyze?', required: true },
    ],
    extract_insights: [
      { key: 'prompt', label: 'Insights Prompt', type: 'textarea', placeholder: 'What insights to extract?', description: 'Guide the AI on what to look for' },
    ],
    transform: [
      { key: 'prompt', label: 'Transformation Instructions', type: 'textarea', placeholder: 'How should the data be transformed?', required: true },
    ],
    generate: [
      { key: 'prompt', label: 'Generation Prompt', type: 'textarea', placeholder: 'What should be generated?', required: true },
    ],
  },
  email: {
    send: [
      { key: 'to', label: 'Recipient Email', type: 'email', placeholder: 'recipient@example.com', required: true },
      { key: 'subject', label: 'Email Subject', type: 'text', placeholder: 'Enter email subject', required: true },
      { key: 'customMessage', label: 'Custom Message', type: 'textarea', placeholder: 'Optional: Add a custom message before the content' },
    ],
  },
  tavily: {
    search: [
      { key: 'query', label: 'Search Query', type: 'text', placeholder: 'Enter search query', required: true, description: 'What to search for' },
      { key: 'maxResults', label: 'Max Results', type: 'text', placeholder: '5', description: 'Number of results to return' },
    ],
    search_news: [
      { key: 'query', label: 'News Query', type: 'text', placeholder: 'Enter news search query', required: true },
      { key: 'maxResults', label: 'Max Results', type: 'text', placeholder: '5' },
    ],
  },
  github: {
    get_commits: [
      { key: 'owner', label: 'Repository Owner', type: 'text', placeholder: 'username or org', required: true },
      { key: 'repo', label: 'Repository Name', type: 'text', placeholder: 'repository-name', required: true },
      { key: 'limit', label: 'Number of Commits', type: 'text', placeholder: '10', description: 'How many recent commits to fetch' },
    ],
    get_repo_info: [
      { key: 'owner', label: 'Repository Owner', type: 'text', placeholder: 'username or org', required: true },
      { key: 'repo', label: 'Repository Name', type: 'text', placeholder: 'repository-name', required: true },
    ],
    get_pull_requests: [
      { key: 'owner', label: 'Repository Owner', type: 'text', placeholder: 'username or org', required: true },
      { key: 'repo', label: 'Repository Name', type: 'text', placeholder: 'repository-name', required: true },
      { key: 'state', label: 'PR State', type: 'text', placeholder: 'open, closed, or all', description: 'Filter by PR state' },
    ],
  },
};

export function NodeConfigPanel({ node, onClose, onSave }: NodeConfigPanelProps) {
  const [params, setParams] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (node) {
      // Initialize with existing params or empty object
      setParams(node.params || {});
      setErrors({});
    }
  }, [node]);

  if (!node) return null;

  const paramConfig = NODE_PARAMS_CONFIG[node.type]?.[node.action] || [];

  const handleChange = (key: string, value: string) => {
    setParams(prev => ({
      ...prev,
      [key]: value,
    }));
    
    // Clear error for this field
    if (errors[key]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[key];
        return newErrors;
      });
    }
  };

  const handleSave = () => {
    // Validate required fields
    const newErrors: Record<string, string> = {};
    
    paramConfig.forEach(config => {
      if (config.required && !params[config.key]?.trim()) {
        newErrors[config.key] = `${config.label} is required`;
      }
    });

    // Special validation for file upload nodes
    if (['file_upload', 'csv_upload', 'pdf_upload', 'txt_upload'].includes(node.type) && !params.fileContent) {
      newErrors.fileContent = 'Please upload a file before saving';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // For file upload nodes, we need to pass the file content in a special way
    if (['file_upload', 'csv_upload', 'pdf_upload', 'txt_upload'].includes(node.type)) {
      const fileUploadParams = {
        ...params,
        // Store file content in the node structure for the executor
        fileContent: params.fileContent,
        fileName: params.fileName,
        fileType: params.fileType,
      };
      onSave(node.id, fileUploadParams);
    } else {
      onSave(node.id, params);
    }
    
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center pointer-events-auto">
      <Card className="w-[500px] max-h-[80vh] bg-gray-900/95 border-2 border-blue-600/50 backdrop-blur-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-800 flex items-center justify-between bg-blue-600/10">
          <div className="flex items-center gap-3">
            <Settings className="w-5 h-5 text-blue-400" />
            <div>
              <h3 className="font-semibold text-lg">Configure Node</h3>
              <p className="text-xs text-gray-400 capitalize">
                {node.type.replace(/_/g, ' ')} - {node.action.replace(/_/g, ' ')}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="hover:bg-gray-800"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {['file_upload', 'csv_upload', 'pdf_upload', 'txt_upload'].includes(node.type) ? (
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-300 mb-2 block">
                  Upload File
                </Label>
                <FileUploadNode
                  nodeId={node.id}
                  onFileUploaded={(nodeId, result) => {
                    if (result.success) {
                      // Update the node with file content
                      const updatedParams = {
                        ...params,
                        fileContent: result.text,
                        fileName: result.metadata?.fileName,
                        fileType: result.metadata?.fileType,
                        uploadedFile: result.uploadedFile, // Store file reference
                      };
                      setParams(updatedParams);
                    }
                  }}
                  onFileRemoved={(nodeId) => {
                    const updatedParams = { ...params };
                    delete updatedParams.fileContent;
                    delete updatedParams.fileName;
                    delete updatedParams.fileType;
                    setParams(updatedParams);
                  }}
                  initialFile={node.uploadedFile}
                  initialContent={node.fileContent}
                  allowedTypes={getFileTypeRestrictions(node.type)}
                  nodeType={node.type}
                />
                <p className="text-xs text-gray-500 mt-2">
                  {node.type === 'csv_upload' && 'Upload CSV files. The data will be converted to readable text and passed to downstream nodes.'}
                  {node.type === 'pdf_upload' && 'Upload PDF files. The text content will be extracted and passed to downstream nodes.'}
                  {node.type === 'txt_upload' && 'Upload text files. The content will be passed to downstream nodes.'}
                  {node.type === 'file_upload' && 'Upload CSV, PDF, or TXT files. The text content will be extracted and passed to downstream nodes.'}
                </p>
              </div>
            </div>
          ) : paramConfig.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p className="text-sm">No configuration needed for this node</p>
              <p className="text-xs mt-2">This node will use data from previous steps</p>
            </div>
          ) : (
            <div className="space-y-4">
              {paramConfig.map((config) => (
                <div key={config.key}>
                  <Label htmlFor={config.key} className="text-sm font-medium text-gray-300">
                    {config.label}
                    {config.required && <span className="text-red-400 ml-1">*</span>}
                  </Label>
                  
                  {config.type === 'textarea' ? (
                    <textarea
                      id={config.key}
                      value={params[config.key] || ''}
                      onChange={(e) => handleChange(config.key, e.target.value)}
                      placeholder={config.placeholder}
                      className={`mt-1 w-full px-3 py-2 bg-gray-800 border rounded-md text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors[config.key] ? 'border-red-500' : 'border-gray-700'
                      }`}
                      rows={4}
                    />
                  ) : (
                    <Input
                      id={config.key}
                      type={config.type}
                      value={params[config.key] || ''}
                      onChange={(e) => handleChange(config.key, e.target.value)}
                      placeholder={config.placeholder}
                      className={`mt-1 bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:ring-blue-500 ${
                        errors[config.key] ? 'border-red-500' : ''
                      }`}
                    />
                  )}
                  
                  {config.description && (
                    <p className="mt-1 text-xs text-gray-500">{config.description}</p>
                  )}
                  
                  {errors[config.key] && (
                    <p className="mt-1 text-xs text-red-400">{errors[config.key]}</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Info Box */}
          <div className="mt-6 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <p className="text-xs text-blue-300">
              <strong>💡 Tip:</strong> Parameters support dynamic data from previous nodes. 
              Use the actual values or placeholders that will be replaced during execution.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800 flex items-center justify-between bg-gray-900/50">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-gray-700"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="bg-blue-600 hover:bg-blue-700 gap-2"
          >
            <Save className="w-4 h-4" />
            Save Configuration
          </Button>
        </div>
      </Card>
    </div>
  );
}

