// src/components/search/SearchBar.jsx
import { FiSearch } from "react-icons/fi";

export default function SearchBar({
  keyword,
  setKeyword,
  target,
  setTarget,
  onSearch,
}) {
  return (
    <div className="flex flex-col gap-3 bg-white/95 p-4 rounded-2xl shadow-xl mb-4">
      <div className="flex gap-3">
        <select
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          className="border h-[40px] rounded-xl px-3 bg-gray-50 border-gray-200 focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
        >
          <option value="TITLE">제목</option>
          <option value="USERNAME">작성자</option>
          <option value="HASHTAG">해시태그</option>
        </select>

        <input
          className="flex-1 border rounded-xl px-3 h-[40px] bg-gray-50 border-gray-200 focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
          placeholder="검색어 입력"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />

        <button
          onClick={onSearch}
          className="bg-rebay-blue text-white px-4 flex items-center justify-center rounded-xl"
        >
          <FiSearch size={20} />
        </button>
      </div>
    </div>
  );
}
