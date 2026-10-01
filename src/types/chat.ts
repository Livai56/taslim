export type ChatContact = {
  id: string;
  name: string;
  role?: string;
  avatarUrl?: string;
  preview?: string;
  updatedAt?: string;
};

export type ChatMessage = {
  id: string;
  senderId: string;
  text: string;
  createdAt: string;
  audioUrl?: string;
};