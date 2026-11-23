export type Review = {
  id: number;
  user: string;
  userId?: string | null;
  userEmail?: string | null;
  content: string;
  rating: number;
  date: string;
  verifiedPurchase?: boolean;
};
