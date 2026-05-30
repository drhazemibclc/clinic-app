import { Icons } from "@clinic-app/ui/components/icons";
import { cn } from "@clinic-app/ui/lib/utils";
import type { FC } from "react";

export interface UploadedFile {
  description?: string;
  id: string;
  isUploading?: boolean;
  name: string;
  type: string;
  url?: string;
}

export interface FilePreviewProps {
  className?: string;
  files: UploadedFile[];
  onRemove?: (id: string) => void;
  variant?: "default" | "inverted";
}

const getFileExtension = (fileName: string): string => {
  const parts = fileName.split(".");
  return parts.length > 1 ? (parts.at(-1) ?? "") : "";
};

const getFileIcon = (fileType: string, fileName: string) => {
  const extension = getFileExtension(fileName).toLowerCase();
  const iconProps = { size: 24 };

  if (fileType.startsWith("image/"))
    return (
      <Icons.media
        {...iconProps}
        className="text-emerald-500 dark:text-emerald-400"
      />
    );

  if (fileType === "application/pdf" || extension === "pdf")
    return (
      <Icons.fileTypePdf
        {...iconProps}
        className="text-red-500 dark:text-red-400"
      />
    );

  if (
    ["doc", "docx", "odt", "rtf"].includes(extension) ||
    fileType.includes("wordprocessing") ||
    fileType.includes("msword")
  )
    return (
      <Icons.fileTypeDoc
        {...iconProps}
        className="text-blue-500 dark:text-blue-400"
      />
    );

  if (
    ["xls", "xlsx", "csv", "ods"].includes(extension) ||
    fileType.includes("spreadsheet") ||
    fileType.includes("excel")
  )
    return (
      <Icons.fileTypeXls
        {...iconProps}
        className="text-green-500 dark:text-green-400"
      />
    );

  if (["txt", "md"].includes(extension) || fileType === "text/plain")
    return (
      <Icons.post {...iconProps} className="text-zinc-500 dark:text-zinc-400" />
    );

  if (
    [
      "js",
      "ts",
      "jsx",
      "tsx",
      "py",
      "java",
      "c",
      "cpp",
      "html",
      "css",
    ].includes(extension) ||
    fileType.includes("javascript") ||
    fileType.includes("typescript")
  )
    return (
      <Icons.code
        {...iconProps}
        className="text-yellow-500 dark:text-yellow-400"
      />
    );

  if (["json", "xml", "yaml", "yml"].includes(extension))
    return (
      <Icons.code {...iconProps} className="text-zinc-500 dark:text-zinc-400" />
    );

  if (
    fileType.startsWith("video/") ||
    ["mp4", "avi", "mov", "mkv"].includes(extension)
  )
    return (
      <Icons.video
        {...iconProps}
        className="text-purple-500 dark:text-purple-400"
      />
    );

  if (
    fileType.startsWith("audio/") ||
    ["mp3", "wav", "ogg"].includes(extension)
  )
    return (
      <Icons.music
        {...iconProps}
        className="text-pink-500 dark:text-pink-400"
      />
    );

  if (
    ["zip", "rar", "tar", "gz", "7z"].includes(extension) ||
    fileType.includes("archive") ||
    fileType.includes("compressed")
  )
    return (
      <Icons.fileZip
        {...iconProps}
        className="text-amber-500 dark:text-amber-400"
      />
    );

  return (
    <Icons.page {...iconProps} className="text-zinc-500 dark:text-zinc-400" />
  );
};

const getFormattedFileType = (fileType: string, fileName: string): string => {
  const ext = getFileExtension(fileName).toUpperCase();

  if (fileType.includes("msword") || fileType.includes("wordprocessing"))
    return "DOC";

  if (fileType.includes("spreadsheet") || fileType.includes("excel"))
    return "SPREADSHEET";

  const typePart = fileType.split("/")[1];

  if (!typePart || typePart === "octet-stream") {
    return ext || "FILE";
  }

  const cleanType = typePart
    .replace("vnd.openxmlformats-officedocument.", "")
    .replace("vnd.ms-", "")
    .replace("x-", "")
    .replace("document.", "")
    .replace("presentation.", "")
    .replace("application.", "")
    .split(".")[0];

  return cleanType?.toUpperCase().slice(0, 8) || "FILE";
};

export const FilePreview: FC<FilePreviewProps> = ({
  files,
  onRemove,
  className,
  variant = "default",
}) => {
  const isInverted = variant === "inverted";
  if (files.length === 0) return null;

  return (
    <div className={cn("flex w-full flex-col gap-2 rounded-xl p-2", className)}>
      <div className="flex w-full flex-wrap gap-2">
        {files.map((file) => (
          <div
            className={cn(
              "group/file relative flex items-center rounded-xl transition-all",
              isInverted
                ? "bg-primary-foreground/15 hover:bg-primary-foreground/20"
                : "bg-muted hover:bg-muted/80",
              file.type.startsWith("image/") && file.url
                ? "h-14 w-14 justify-center"
                : "min-w-[180px] max-w-[220px] p-2 pr-8",
            )}
            key={file.id}
          >
            {file.isUploading && (
              <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/30">
                <Icons.spinner className="animate-spin text-white" size={20} />
              </div>
            )}

            {onRemove && (
              <button
                aria-label={`Remove ${file.name}`}
                className={cn(
                  "absolute -top-1 -right-1 z-10 flex h-5 w-5 items-center justify-center rounded-full",
                  "scale-75 opacity-0 transition-all duration-150 group-hover/file:scale-100 group-hover/file:opacity-100",
                  "cursor-pointer bg-muted-foreground/60 hover:bg-muted-foreground/80",
                )}
                onClick={() => onRemove(file.id)}
                type="button"
              >
                <Icons.close className="text-white" size={10} />
              </button>
            )}

            {file.type.startsWith("image/") && file.url ? (
              <div className="h-12 w-12 overflow-hidden rounded-md">
                <img
                  alt={file.name}
                  className="h-full w-full object-cover"
                  height={48}
                  src={file.url}
                  width={48}
                />
              </div>
            ) : (
              <>
                <div
                  className={cn(
                    "mr-3 flex h-10 w-10 items-center justify-center rounded-lg",
                    isInverted
                      ? "bg-primary-foreground/10"
                      : "bg-muted-foreground/10",
                  )}
                >
                  {getFileIcon(file.type, file.name)}
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
                  <p
                    className={cn(
                      "truncate font-medium text-sm",
                      isInverted
                        ? "text-primary-foreground"
                        : "text-foreground",
                    )}
                  >
                    {file.name.length > 18
                      ? `${file.name.slice(0, 15)}...`
                      : file.name}
                  </p>
                  <span
                    className={cn(
                      "text-xs",
                      isInverted
                        ? "text-primary-foreground/70"
                        : "text-muted-foreground",
                    )}
                  >
                    {getFormattedFileType(file.type, file.name)}
                  </span>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
