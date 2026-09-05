export type NewsCategory =
  | 'All'
  | 'Politics'
  | 'Economy'
  | 'Technology'
  | 'World'
  | 'Culture'
  | 'Science'
  | 'Sports';

export interface Article {
  id: string;
  slug: string;
  title: string;
  kicker: string;
  summary: string;
  content: string[];
  category: NewsCategory;
  imageUrl: string;
  imageCaption: string;
  author: {
    name: string;
    role: string;
    avatar: string;
  };
  publishedAt: string;
  readTimeMinutes: number;
  isBreaking?: boolean;
  isLeadStory?: boolean;
  isHot?: boolean;
  viewCount: number;
  reactions: {
    likes: number;
    insightful: number;
    shocked: number;
  };
  tags: string[];
}

export interface MarketItem {
  symbol: string;
  name: string;
  value: string;
  change: string;
  isPositive: boolean;
}

export interface FactCheckItem {
  id: string;
  claim: string;
  claimant: string;
  verdict: 'True' | 'Mostly True' | 'Half True' | 'Misleading' | 'False';
  explanation: string;
  source: string;
  date: string;
}

export interface OpinionPiece {
  id: string;
  title: string;
  author: {
    name: string;
    title: string;
    avatar: string;
  };
  pullQuote: string;
  category: string;
  readTime: string;
}

export interface PollOption {
  id: string;
  text: string;
  votes: number;
}

export interface PollQuestion {
  id: string;
  question: string;
  description: string;
  totalVotes: number;
  options: PollOption[];
}
