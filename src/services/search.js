import api from "./api";

const searchService = {
  // 🔍 일반 검색
  async searchPosts({ keyword, target, page = 0 }) {
    const response = await api.get("/api/search/posts", {
      params: { keyword, target, page },
    });
    return response.data;
  },

  // ✨ 자동완성(Suggest)
  async fetchSuggests({ keyword, target }) {
    const response = await api.get("/api/search/suggest", {
      params: { keyword, target, size: 10 },
    });
    return response.data.content;
  },
};

export default searchService;
