import React from 'react';
import { CheckCircle2, AlertCircle, Loader2, Download } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { QueueFile } from '@/pages/BatchRemover';
import { Button } from './ui/button';

export const FileQueueItem: React.FC<QueueFile> = ({ file, status, progress, result, error }) => {
  const handleDownload = () => {
    if (!result) return;
    const link = document.createElement('a');
    link.href = result;
    const originalName = file.name.split('.').slice(0, -1).join('.');
    link.download = `${originalName}-processed.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderStatusIcon = () => {
    switch (status) {
      case 'done':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-destructive" />;
      case 'processing':
        return <Loader2 className="w-5 h-5 animate-spin text-primary" />;
      default:
        return <div className="w-5 h-5" />; // Placeholder for queued
    }
  };

  return (
    <div className="flex items-center gap-4 p-3 border rounded-lg bg-background">
      <div className="flex-shrink-0 w-12 h-12 bg-muted rounded-md overflow-hidden flex items-center justify-center">
        {result ? (
          <img src={result} alt="Processed thumbnail" className="w-full h-full object-contain" />
        ) : (
          <img src={URL.createObjectURL(file)} alt="Original thumbnail" className="w-full h-full object-cover opacity-50" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{file.name}</p>
        <div className="flex items-center gap-2 mt-1">
          <Progress value={progress} className="w-full h-2" />
          <span className="text-xs text-muted-foreground w-10 text-right">{progress}%</span>
        </div>
        {status === 'error' && <p className="text-xs text-destructive mt-1">{error}</p>}
      </div>
      <div className="w-16 text-center">{renderStatusIcon()}</div>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleDownload}
        disabled={status !== 'done'}
        aria-label="Download processed image"
      >
        <Download className="w-4 h-4" />
      </Button>
    </div>
  );
};