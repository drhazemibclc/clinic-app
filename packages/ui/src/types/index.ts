import type { Icons } from "@clinic-app/ui/components/icons";
import type { DataTableConfig } from "@clinic-app/ui/lib/data-table";
import type { FilterItemSchema } from "@clinic-app/ui/lib/parsers";
import type { ColumnSort, Row } from "@tanstack/react-table";

export type NavItem = {
  badge?: React.ReactNode;
  description?: string;
  disabled?: boolean;
  external?: boolean;
  icon?: keyof typeof Icons;
  isActive?: boolean;
  items?: NavItem[];
  label?: string;
  pageType?: string;
  patientId?: string | undefined;
  requiredRole?: boolean;
  shortcut?: [string, string];
  title: string;
  url: string;
};

export type NavGroup = {
  items: NavItem[];
  label: string;
};

export type NavItemWithChildren = {
  items: NavItemWithChildren[];
} & NavItem;

export type NavItemWithOptionalChildren = {
  items?: NavItemWithChildren[];
} & NavItem;

export type FooterItem = {
  items: {
    title: string;
    href: string;
    external?: boolean;
  }[];
  title: string;
};

export type MainNavItem = NavItemWithOptionalChildren;

export type SidebarNavItem = NavItemWithChildren;

export const UPLOAD_STATUS = {
  PENDING: "pending",
  UPLOADING: "uploading",
  PAUSED: "paused",
  COMPLETED: "completed",
  ERROR: "error",
} as const;

export const UPLOADER_CONFIG = {
  DEFAULT_ENDPOINT: "/api/upload",
  DEFAULT_CONCURRENT_LIMIT: 5,
  DEFAULT_RETRY_DELAYS: [0, 3000, 5000, 10_000] as number[],
  MAX_FILE_LIST_HEIGHT: 300,
  PROGRESS_BAR_HEIGHT: 1.5,
  CHUNK_SIZE: 25 * 1024 * 1024,
} as const;
export const COMMON_FILE_EXTENSIONS = [
  "exe",
  "bat",
  "sh",
  "cmd",
  "js",
  "ts",
  "jsx",
  "tsx",
  "py",
  "rb",
  "php",
  "dll",
  "msi",
  "apk",
  "dmg",
  "iso",
  "zip",
  "rar",
  "7z",
  "tar",
  "gz",
];
export const unknownError =
  "An unknown error occurred. Please try again later.";

export type UploadStatus = (typeof UPLOAD_STATUS)[keyof typeof UPLOAD_STATUS];

export type UploadControl = {
  cancel: () => void;
  pause: () => void;
  start: () => void;
};

export type FileUploadState = {
  progress: number;
  status: UploadStatus;
};

export type FileRow = {
  filename: string;
  id: string;
  mimeType: string;
  size: number;
  slug: string;
};

export type FolderRow = {
  createdAt: Date;
  id: string;
  name: string;
  parentId: string | null;
  updatedAt: Date;
  userId: string;
};

export type SnakeToCamelCase<S extends string> =
  S extends `${infer Head}_${infer Tail}`
    ? `${Lowercase<Head>}${Capitalize<SnakeToCamelCase<Tail>>}`
    : Lowercase<S>;

export type CamelCaseKeys<T> =
  T extends Array<infer U>
    ? CamelCaseKeys<U>[]
    : T extends object
      ? {
          [K in keyof T as SnakeToCamelCase<K & string>]: CamelCaseKeys<T[K]>;
        }
      : T;

export type QueryKeys = {
  filters: string;
  joinOperator: string;
  page: string;
  perPage: string;
  sort: string;
};

export type Option = {
  count?: number;
  icon?: React.FC<React.SVGProps<SVGSVGElement>>;
  label: string;
  value: string;
};

export type FilterOperator = DataTableConfig["operators"][number];
export type FilterVariant = DataTableConfig["filterVariants"][number];
export type JoinOperator = DataTableConfig["joinOperators"][number];

export type ExtendedColumnSort<TData> = {
  id: Extract<keyof TData, string>;
} & Omit<ColumnSort, "id">;

export type ExtendedColumnFilter<TData> = {
  id: Extract<keyof TData, string>;
} & FilterItemSchema;

export type DataTableRowAction<TData> = {
  row: Row<TData>;
  variant: "update" | "delete";
};

export type AvailableDoctorProps = {
  id: string;
  name: string;
  specialty: string;
  img?: string;
  colorCode?: string;
  workingDays: {
    day: string;
    startTime: string;
    closeTime: string;
  }[];
}[];
