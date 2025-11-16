import useSearchStore from "../../store/searchStore";
import Product from "../products/product";

export default function SearchResults({ loading }) {
  const { results, error } = useSearchStore();

  if (loading)
    return <div className="text-center py-6 text-gray-600">검색 중...</div>;

  if (error)
    return <div className="text-center text-red-500 py-4">{error}</div>;

  if (!results.length)
    return (
      <div className="text-center text-gray-400 py-6">
        검색 결과가 없습니다.
      </div>
    );

  return (
    <div className="grid grid-cols-2 gap-4 mt-6">
      {results.map((post) => (
        <Product key={post.id} post={post} />
      ))}
    </div>
  );
}
