import { parse } from 'papaparse';

export interface FileUploadResult {
  success: boolean;
  text?: string;
  error?: string;
  uploadedFile?: File;
  metadata?: {
    fileName: string;
    fileType: string;
    fileSize: number;
    rowCount?: number; // for CSV
  };
}

/**
 * Process uploaded file and extract text content
 * Supports CSV, PDF, and TXT files
 */
export async function processUploadedFile(file: File): Promise<FileUploadResult> {
  try {
    console.log(`📁 Processing file: ${file.name} (${file.type}, ${file.size} bytes)`);

    const metadata = {
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
    };

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return {
        success: false,
        error: `File too large. Maximum size is ${maxSize / (1024 * 1024)}MB`,
        metadata,
      };
    }

    // Validate file type
    const allowedTypes = [
      'text/csv',
      'application/csv',
      'text/plain',
      'application/pdf',
      'text/txt',
    ];
    
    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(csv|txt|pdf)$/i)) {
      return {
        success: false,
        error: 'Unsupported file type. Please upload CSV, PDF, or TXT files only.',
        metadata,
      };
    }

    let extractedText: string;
    let rowCount: number | undefined;

    // Process based on file type
    if (file.type === 'text/csv' || file.type === 'application/csv' || file.name.toLowerCase().endsWith('.csv')) {
      const result = await processCSVFile(file);
      extractedText = result.text;
      rowCount = result.rowCount;
    } else if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
      extractedText = await processPDFFile(file);
    } else {
      // TXT file
      extractedText = await processTXTFile(file);
    }

    return {
      success: true,
      text: extractedText,
      metadata: {
        ...metadata,
        rowCount,
      },
    };

  } catch (error: any) {
    console.error('File processing error:', error);
    return {
      success: false,
      error: `Failed to process file: ${error.message}`,
      metadata: {
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
      },
    };
  }
}

/**
 * Process CSV file and convert to readable text
 */
async function processCSVFile(file: File): Promise<{ text: string; rowCount: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const csvText = e.target?.result as string;
        const parsed = parse(csvText, { header: true, skipEmptyLines: true });
        
        if (parsed.errors.length > 0) {
          console.warn('CSV parsing warnings:', parsed.errors);
        }

        // Convert to readable text format
        const headers = Object.keys(parsed.data[0] || {});
        let text = `CSV Data from ${file.name}\n\n`;
        text += `Headers: ${headers.join(', ')}\n\n`;
        text += `Total Rows: ${parsed.data.length}\n\n`;
        
        // Add first few rows as sample
        const sampleRows = parsed.data.slice(0, 5);
        text += 'Sample Data:\n';
        text += headers.join(' | ') + '\n';
        text += '-'.repeat(headers.join(' | ').length) + '\n';
        
        sampleRows.forEach((row: any) => {
          const values = headers.map(header => String(row[header] || '')).join(' | ');
          text += values + '\n';
        });
        
        if (parsed.data.length > 5) {
          text += `\n... and ${parsed.data.length - 5} more rows\n`;
        }

        resolve({
          text,
          rowCount: parsed.data.length,
        });
      } catch (error) {
        reject(new Error(`CSV parsing failed: ${error}`));
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read CSV file'));
    reader.readAsText(file);
  });
}

/**
 * Process PDF file and extract text
 * Note: This is a basic implementation. For production, consider using a proper PDF parser
 */
async function processPDFFile(file: File): Promise<string> {
  // For now, we'll return a placeholder since PDF parsing requires additional libraries
  // In a real implementation, you'd use something like pdf-parse or pdf2pic
  return `PDF file: ${file.name}\n\nNote: PDF text extraction requires additional setup. Please convert to TXT or CSV for now.\n\nFile size: ${(file.size / 1024).toFixed(2)} KB`;
}

/**
 * Process TXT file and extract text
 */
async function processTXTFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const text = e.target?.result as string;
      resolve(`Text file: ${file.name}\n\n${text}`);
    };
    
    reader.onerror = () => reject(new Error('Failed to read text file'));
    reader.readAsText(file);
  });
}

/**
 * Validate file before upload
 */
export function validateFile(file: File, allowedTypes?: string[]): { valid: boolean; error?: string } {
  // Check file size
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File too large. Maximum size is ${maxSize / (1024 * 1024)}MB`,
    };
  }

  // Check file type
  const defaultAllowedTypes = [
    'text/csv',
    'application/csv',
    'text/plain',
    'application/pdf',
    'text/txt',
  ];
  
  const typesToCheck = allowedTypes || defaultAllowedTypes;
  const isValidType = typesToCheck.includes(file.type) || file.name.match(new RegExp(`\\.(${typesToCheck.map(t => t.split('/')[1] || t).join('|')})$`, 'i'));
  
  if (!isValidType) {
    const typeNames = allowedTypes ? allowedTypes.map(t => t.split('/')[1]?.toUpperCase() || t.toUpperCase()).join(', ') : 'CSV, PDF, or TXT';
    return {
      valid: false,
      error: `Unsupported file type. Please upload ${typeNames} files only.`,
    };
  }

  return { valid: true };
}
