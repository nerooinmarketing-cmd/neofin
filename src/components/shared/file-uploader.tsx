"use client";

import { useId, useState } from "react";
import { FileText, Image as ImageIcon, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface FileUploaderProps {
  label?: string;
  description?: string;
  accept?: string;
  multiple?: boolean;
  value: File[];
  onValueChange: (files: File[]) => void;
  error?: string;
  disabled?: boolean;
}

/** Tap-to-upload / drag-and-drop area; prioritizes the camera on mobile. */
export function FileUploader({
  label,
  description = "PDF, JPG veya PNG yükleyin ya da fotoğraf çekin.",
  accept = "application/pdf,image/*",
  multiple = false,
  value,
  onValueChange,
  error,
  disabled,
}: FileUploaderProps) {
  const inputId = useId();
  const [dragActive, setDragActive] = useState(false);

  function addFiles(fileList: FileList | null) {
    if (!fileList) return;
    const incoming = Array.from(fileList);
    onValueChange(multiple ? [...value, ...incoming] : incoming.slice(0, 1));
  }

  function removeFile(index: number) {
    onValueChange(value.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-1.5">
      {label ? (
        <p className="text-sm font-medium text-foreground">{label}</p>
      ) : null}
      <label
        htmlFor={inputId}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragActive(false);
          if (!disabled) addFiles(e.dataTransfer.files);
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors",
          dragActive ? "border-primary bg-accent" : "border-border bg-card",
          disabled && "cursor-not-allowed opacity-60",
          error && "border-danger",
        )}
      >
        <Upload className="size-6 text-muted-foreground" />
        <p className="text-sm font-medium text-foreground">
          Dosya seçin veya buraya sürükleyin
        </p>
        <p className="text-xs text-muted-foreground">{description}</p>
        <input
          id={inputId}
          type="file"
          accept={accept}
          multiple={multiple}
          capture="environment"
          disabled={disabled}
          className="hidden"
          onChange={(e) => addFiles(e.target.files)}
        />
      </label>
      {value.length > 0 ? (
        <ul className="space-y-2">
          {value.map((file, index) => (
            <li
              key={`${file.name}-${index}`}
              className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm"
            >
              {file.type.startsWith("image/") ? (
                <ImageIcon className="size-4 shrink-0 text-muted-foreground" />
              ) : (
                <FileText className="size-4 shrink-0 text-muted-foreground" />
              )}
              <span className="flex-1 truncate">{file.name}</span>
              <span className="shrink-0 text-xs text-muted-foreground">
                {(file.size / 1024).toFixed(0)} KB
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-6"
                onClick={() => removeFile(index)}
                aria-label="Dosyayı kaldır"
              >
                <X className="size-4" />
              </Button>
            </li>
          ))}
        </ul>
      ) : null}
      {error ? <p className="text-xs text-danger">{error}</p> : null}
    </div>
  );
}
