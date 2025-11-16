// src/pages/Search.jsx
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import useSearchStore from "../store/searchStore";
import SearchResults from "../components/search/searchResults";
import SearchBar from "../components/search/searchBar";

export default function Search() {
  const { searchPosts, loading } = useSearchStore();

  // 🔍 URL query 읽기
  const [params] = useSearchParams();
  const initialKeyword = params.get("keyword") || "";
  const initialTarget = params.get("target") || "TITLE";

  const [keyword, setKeyword] = useState(initialKeyword);
  const [target, setTarget] = useState(initialTarget);

  // 🔥 페이지 첫 로드 시 자동 검색 실행
  useEffect(() => {
    if (initialKeyword.trim()) {
      searchPosts({ keyword: initialKeyword, target: initialTarget, page: 0 });
    }
  }, [initialKeyword, initialTarget]);

  const handleSearch = () => {
    searchPosts({ keyword, target, page: 0 });
  };

  return (
    <div className="px-4 py-6 max-w-3xl mx-auto">
      <SearchBar
        keyword={keyword}
        setKeyword={setKeyword}
        target={target}
        setTarget={setTarget}
        onSearch={handleSearch}
      />

      <SearchResults loading={loading} />
    </div>
  );
}
