export type ContentList = {
  title?: string;
  items?: string[];
};

export type ContentSection = {
  heading: string;
  paragraphs?: string[];
  lists?: ContentList[];
  notes?: string[];
};

export type ContactSection = {
  title: string;
  paragraphs?: string[];
  channels?: string[];
};
