export type RawSearchEntry = {
  id?: string;
  title: string;
  description?: string;
  keywords?: string[];
  path: string;
};

export type GlobalSearchProps = {
  className?: string;
  onNavigate?: () => void;
};

export type SearchMessages = {
  entries?: RawSearchEntry[];
};

export type MessagesShape = Record<string, unknown>;
