// src/store/searchStore.js
import { create } from "zustand";
import searchService from "../services/search";

const useSearchStore = create((set) => ({
  /** ============================
   * 🔍 일반 검색 상태
   * ============================ */
  results: [],
  pageable: null,
  loading: false,
  error: null,

  searchPosts: async ({ keyword, target, page = 0 }) => {
    if (!keyword || keyword.trim() === "") return;

    set({ loading: true, error: null });

    try {
      const data = await searchService.searchPosts({ keyword, target, page });

      set({
        results: data.content,
        pageable: data,
        loading: false,
      });
    } catch (error) {
      set({
        error: "검색 중 오류가 발생했습니다.",
        loading: false,
      });
    }
  },

  /** ============================
   * ✨ 자동완성 상태(Suggest)
   * ============================ */
  suggests: [],
  suggestLoading: false,

  fetchSuggests: async ({ keyword, target }) => {
    if (!keyword.trim()) {
      return set({ suggests: [] });
    }

    set({ suggestLoading: true });

    try {
      const list = await searchService.fetchSuggests({ keyword, target });
      set({ suggests: list });
    } catch (err) {
      console.error("Suggest error:", err);
    } finally {
      set({ suggestLoading: false });
    }
  },

  clearSuggests: () => set({ suggests: [] }),
}));

export default useSearchStore;
