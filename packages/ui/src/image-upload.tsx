'use client';

import * as React from 'react';
import { ImageIcon, Loader2, X, UploadCloud } from 'lucide-react';
import { cn } from './lib/utils';
import { Button } from './button';

export interface ImageUploadProps extends React.InputHTMLAttributes<HTMLInputElement> {
  value?: string;
  onUpload?: (file: File) => Promise<{ url: string }>;
  onValueChange?: (url: string) => void;
  onUploadError?: (error: unknown) => void;
  isUploading?: boolean;
  uploadedImageAlt?: string;
  changeLabel?: string;
  uploadingLabel?: string;
  emptyLabel?: string;
  helperText?: string;
}

export const ImageUpload = React.forwardRef<HTMLInputElement, ImageUploadProps>(
  (
    {
      className,
      value,
      onUpload,
      onValueChange,
      onUploadError,
      isUploading: externalIsUploading,
      uploadedImageAlt = 'Uploaded image',
      changeLabel = 'Change',
      uploadingLabel = 'Uploading...',
      emptyLabel = 'Click or drag image to upload',
      helperText = 'SVG, PNG, JPG or GIF (max. 5MB)',
      ...props
    },
    ref,
  ) => {
    const inputRef = React.useRef<HTMLInputElement>(null);
    const [internalUploading, setInternalUploading] = React.useState(false);
    const isUploading = externalIsUploading || internalUploading;

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      if (onUpload) {
        try {
          setInternalUploading(true);
          const result = await onUpload(file);
          if (result.url && onValueChange) {
            onValueChange(result.url);
          }
        } catch (error) {
          onUploadError?.(error);
        } finally {
          setInternalUploading(false);
          if (inputRef.current) {
            inputRef.current.value = ''; // Reset input
          }
        }
      }
    };

    const handleRemove = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (onValueChange) {
        onValueChange('');
      }
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    };

    return (
      <div className={cn('relative group', className)}>
        <input
          type="file"
          accept="image/*"
          className="hidden"
          ref={(node) => {
            // Handle both refs
            if (typeof ref === 'function') {
              ref(node);
            } else if (ref) {
              (ref as React.MutableRefObject<HTMLInputElement | null>).current = node;
            }
            (inputRef as React.MutableRefObject<HTMLInputElement | null>).current = node;
          }}
          onChange={handleFileChange}
          disabled={isUploading || props.disabled}
          {...props}
        />

        {value ? (
          <div className="relative aspect-video w-full overflow-hidden rounded-lg border bg-muted flex items-center justify-center">
            <img src={value} alt={uploadedImageAlt} className="w-full h-full object-cover" />
            {isUploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                <Loader2 className="w-8 h-8 text-white animate-spin" />
              </div>
            )}
            {!isUploading && !props.disabled && (
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="h-8"
                  onClick={() => inputRef.current?.click()}
                >
                  <UploadCloud className="w-4 h-4 mr-2" />
                  {changeLabel}
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleRemove}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div
            onClick={() => !isUploading && !props.disabled && inputRef.current?.click()}
            className={cn(
              'flex flex-col items-center justify-center w-full aspect-video rounded-lg border-2 border-dashed transition-colors',
              isUploading || props.disabled
                ? 'opacity-50 cursor-not-allowed bg-muted'
                : 'cursor-pointer hover:border-primary/50 hover:bg-muted/50',
            )}
          >
            {isUploading ? (
              <Loader2 className="w-8 h-8 text-muted-foreground animate-spin mb-2" />
            ) : (
              <ImageIcon className="w-10 h-10 text-muted-foreground mb-3 opacity-50" />
            )}
            <div className="text-sm font-medium text-muted-foreground">
              {isUploading ? uploadingLabel : emptyLabel}
            </div>
            <div className="text-xs text-muted-foreground/70 mt-1">{helperText}</div>
          </div>
        )}
      </div>
    );
  },
);
ImageUpload.displayName = 'ImageUpload';
