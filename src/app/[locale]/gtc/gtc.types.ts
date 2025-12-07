export type GTCList = {
  type?: 'ordered' | 'unordered';
  title?: string;
  items?: string[];
};

export type GTCSection = {
  heading: string;
  paragraphs?: string[];
  lists?: GTCList[];
  notes?: string[];
};
