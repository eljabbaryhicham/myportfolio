'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCopy, faDownload, faShare, faLink } from '@fortawesome/free-solid-svg-icons';

interface ShareLinkDialogProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  filename: string;
}

export default function ShareLinkDialog({ isOpen, onClose, url, filename }: ShareLinkDialogProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast({ title: 'Link copied!', description: 'The download link is now in your clipboard.' });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({ variant: 'destructive', title: 'Failed to copy', description: 'Please copy the link manually.' });
    }
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);
      toast({ title: 'Download started', description: filename });
    } catch (err) {
      // Fallback: just open in new tab
      window.open(url, '_blank');
      toast({ title: 'Opening in new tab', description: 'Download may not start automatically.' });
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: filename,
          text: `Download ${filename}`,
          url: url,
        });
        toast({ title: 'Shared successfully' });
      } catch (err) {
        // User cancelled or share failed
      }
    } else {
      handleCopy();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FontAwesomeIcon icon={faShare} />
            Share Upload Link
          </DialogTitle>
          <DialogDescription>
            Share this link to allow others to download <strong>{filename}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Input
              value={url}
              readOnly
              onClick={(e) => e.currentTarget.select()}
              className="flex-1 text-xs"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={handleCopy}
              title="Copy link"
            >
              <FontAwesomeIcon icon={faCopy} />
            </Button>
          </div>

          {copied && (
            <p className="text-xs text-green-600">✓ Copied to clipboard</p>
          )}

          <div className="flex flex-col gap-2 pt-2">
            <Button
              variant="default"
              onClick={handleDownload}
              className="w-full"
            >
              <FontAwesomeIcon icon={faDownload} className="mr-2" />
              Download Now
            </Button>

            {typeof navigator !== 'undefined' && 'share' in navigator && (
              <Button
                variant="outline"
                onClick={handleNativeShare}
                className="w-full"
              >
                <FontAwesomeIcon icon={faLink} className="mr-2" />
                Share via...
              </Button>
            )}
          </div>

          <p className="text-xs text-muted-foreground pt-2">
            The link is hosted on Vercel Blob storage and will remain accessible.
          </p>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}