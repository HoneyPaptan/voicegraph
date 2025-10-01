import { serve } from 'inngest/next';
import { inngest } from '@/lib/inngest/client';
import { executeWorkflowFunction } from '@/lib/inngest/functions';

/**
 * Inngest API route - required for Inngest to communicate with Next.js
 * This endpoint handles all Inngest function invocations
 */
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    executeWorkflowFunction,
  ],
});

