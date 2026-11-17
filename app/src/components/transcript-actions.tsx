'use client';

import { Copy, Download } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

interface TranscriptActionsProps {
  messages: { role: string; content: string }[];
  fileName: string;
}

const speakers: Record<string, string> = { user: 'You', assistant: 'Assistant', system: 'System' };

const toText = (messages: TranscriptActionsProps['messages']) =>
  messages.map((m) => `${speakers[m.role] ?? m.role}: ${m.content.replaceAll('  ', ' ').trim()}`).join('\n\n');

export default function TranscriptActions({ messages, fileName }: TranscriptActionsProps) {
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(toText(messages));
      toast.success('Transcript copied');
    } catch {
      toast.error('Could not copy the transcript');
    }
  };

  const handleDownload = () => {
    const url = URL.createObjectURL(new Blob([toText(messages)], { type: 'text/plain' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex items-center gap-1">
      <Button variant="ghost" size="sm" aria-label="Copy transcript" onClick={handleCopy}>
        <Copy />
        <span className="hidden sm:inline">Copy</span>
      </Button>
      <Button variant="ghost" size="sm" aria-label="Download transcript" onClick={handleDownload}>
        <Download />
        <span className="hidden sm:inline">Download</span>
      </Button>
    </div>
  );
}
