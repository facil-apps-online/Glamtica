import { create } from 'zustand';

interface ImageStoreState {
  imageUrls: Record<string, string>;
  addUrl: (key: string, url: string) => void;
}

export const useImageStore = create<ImageStoreState>((set) => ({
  imageUrls: {},
  addUrl: (key, url) =>
    set((state) => ({
      imageUrls: {
        ...state.imageUrls,
        [key]: url,
      },
    })),
}));
