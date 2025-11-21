// src/components/products/ProductCreate.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import postService from "../../services/post";
import s3Service from "../../services/s3";
import { FiImage, FiX } from "react-icons/fi";
import MainLayout from "../layout/MainLayout";
import Header from "../layout/Header";
import Footer from "../layout/Footer";
import api from "../../services/api";

/** ========== 카테고리 계층 ========== */
const CATEGORY_HIERARCHY = {
  // Level 1: 대분류 (Large)
  200: {
    name: "전자기기",
    children: {
      210: {
        name: "카메라",
        children: {
          211: { name: "DSLR/미러리스" },
          212: { name: "일반 디지털 카메라" },
        },
      },
      220: { name: "음향기기", children: {} },
      230: { name: "게임/취미", children: {} },
      240: {
        name: "노트북/PC",
        children: {
          241: { name: "노트북" },
          242: { name: "데스크탑/본체" },
          243: { name: "모니터/주변기기" },
        },
      },
      250: { name: "태블릿/웨어러블", children: {} },
      260: {
        name: "핸드폰",
        children: {
          261: { name: "아이폰13" },
          262: { name: "아이폰13 mini" },
          263: { name: "아이폰13 Pro" },
          264: { name: "아이폰13 Pro Max" },
          265: { name: "아이폰14" },
          266: { name: "아이폰14 Pro" },
          267: { name: "아이폰14 Pro Max" },
          268: { name: "아이폰14 Plus" },
          269: { name: "아이폰15" },
          270: { name: "아이폰15 Pro" },
          271: { name: "아이폰15 Pro Max" },
          272: { name: "아이폰15 Plus" },
          273: { name: "아이폰16" },
          274: { name: "아이폰16 Pro" },
          275: { name: "아이폰16 Pro Max" },
          276: { name: "아이폰16 Plus" },
          277: { name: "아이폰17" },
          278: { name: "아이폰17 Air" },
          279: { name: "아이폰17 Pro Max" },
          281: { name: "기타 아이폰 모델" },
          290: { name: "갤럭시/기타 안드로이드폰" },
        },
      },
      280: { name: "디지털 액세서리", children: {} },
    },
  },

  300: {
    name: "생활가전",
    children: {
      310: { name: "대형가전", children: {} },
      320: { name: "주방가전", children: {} },
      330: { name: "미용/건강가전", children: {} },
      340: { name: "계절가전", children: {} },
    },
  },

  400: {
    name: "가구/인테리어",
    children: {
      410: {
        name: "침대/매트리스",
        children: {
          411: { name: "싱글침대" },
          412: { name: "더블/퀸/킹 침대" },
        },
      },
      420: { name: "소파/테이블", children: {} },
      430: { name: "조명", children: {} },
      440: { name: "수납/선반", children: {} },
    },
  },

  500: {
    name: "생활/주방",
    children: {
      510: { name: "조리도구", children: {} },
      520: { name: "식기/컵", children: {} },
      530: { name: "청소/세탁 용품", children: {} },
    },
  },

  600: { name: "도서", children: {} },
  700: { name: "식물/반려동물", children: {} },

  800: {
    name: "의류/잡화",
    children: {
      810: { name: "남성 의류", children: {} },
      820: { name: "여성 의류", children: {} },
      830: {
        name: "가방/잡화",
        children: {
          831: { name: "명품 가방" },
          832: { name: "지갑/벨트" },
          833: { name: "시계" },
        },
      },
    },
  },

  900: { name: "기타 중고 물품", children: {} },
};

const DEFAULT_LARGE_CODE = Object.keys(CATEGORY_HIERARCHY)[0] || "";

/** ========== 유틸 ========== */
const parseHashtags = (input) =>
  (input || "")
    .replaceAll(",", " ")
    .split(" ")
    .map((s) => s.replace(/^#/, "").trim())
    .filter(Boolean);

function findCategoryPath(finalCode) {
  if (!finalCode) return { lg: DEFAULT_LARGE_CODE, md: "", sm: "" };
  for (const [lg, lgNode] of Object.entries(CATEGORY_HIERARCHY)) {
    if (lg === String(finalCode)) return { lg, md: "", sm: "" };
    for (const [md, mdNode] of Object.entries(lgNode.children || {})) {
      if (md === String(finalCode)) return { lg, md, sm: "" };
      for (const [sm] of Object.entries(mdNode.children || {})) {
        if (sm === String(finalCode)) return { lg, md, sm };
      }
    }
  }
  return { lg: DEFAULT_LARGE_CODE, md: "", sm: "" };
}

/** ========== 컴포넌트 ========== */
const ProductCreate = ({ onCreated, goBack }) => {
  const navigate = useNavigate();
  const { postId } = useParams();
  const isEdit = Boolean(postId);

  // form
  const [form, setForm] = useState({
    title: "",
    price: "",
    finalCategoryCode: DEFAULT_LARGE_CODE,
    content: "",
  });

  // images: [{id, preview, url, file?}]
  const [images, setImages] = useState([]);

  // category selects
  const [selectedLgCode, setSelectedLgCode] = useState(DEFAULT_LARGE_CODE);
  const [selectedMdCode, setSelectedMdCode] = useState("");
  const [selectedSmCode, setSelectedSmCode] = useState("");

  const [hashtagsInput, setHashtagsInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const dragIndexRef = useRef(null);

  const titleCount = useMemo(() => form.title.length, [form.title]);
  const onChange = (e) =>
    setForm((s) => ({ ...s, [e.target.name]: e.target.value }));

  /** 편집: 기존 데이터 로드 */
  useEffect(() => {
    if (!isEdit) return;
    (async () => {
      try {
        const data = await postService.getPost(postId);

        // 카테고리
        const finalCode = data.categoryCode ?? DEFAULT_LARGE_CODE;
        setForm({
          title: data.title ?? "",
          price: data.price ?? "",
          finalCategoryCode: finalCode,
          content: data.content ?? "",
        });

        // 선택된 셀렉트 복원
        const path = findCategoryPath(String(finalCode));
        setSelectedLgCode(path.lg);
        setSelectedMdCode(path.md);
        setSelectedSmCode(path.sm);

        // 이미지들: imageUrls 있으면 그걸로, 없으면 imageUrl 단일로
        const urlList =
          (Array.isArray(data.imageUrls) && data.imageUrls.length
            ? data.imageUrls
            : data.imageUrl
            ? [data.imageUrl]
            : []) || [];

        if (urlList.length) {
          const items = await Promise.all(
            urlList.map(async (orig) => {
              const isAbs = /^https?:\/\//i.test((orig || "").trim());
              if (isAbs) {
                return { display: orig, original: orig };
              }
              try {
                const r = await api.get(
                  `/api/upload/post/image?url=${encodeURIComponent(orig)}`
                );
                return { display: r?.data?.imageUrl || orig, original: orig };
              } catch {
                return { display: orig, original: orig };
              }
            })
          );
          setImages(
            items.map(({ display, original }) => ({
              id: crypto.randomUUID(),
              preview: display, // 화면표시(만료 가능)
              url: original, // 서버 저장용 원본 키/URL
            }))
          );
        }

        setHashtagsInput(
          (data.hashtags || []).map((h) => h.name ?? h).join(" ")
        );
      } catch (e) {
        console.error(e);
        setError("상품 정보를 불러오지 못했습니다.");
      }
    })();
  }, [isEdit, postId]);

  /** finalCategoryCode 갱신 */
  useEffect(() => {
    // 가장 깊게 선택된 코드를 최종 카테고리 코드로 설정
    const finalCode = selectedSmCode || selectedMdCode || selectedLgCode;
    setForm((s) => ({ ...s, finalCategoryCode: finalCode }));
  }, [selectedLgCode, selectedMdCode, selectedSmCode]);

  /** 셀렉트 옵션 */
  const mdOptions = useMemo(() => {
    const lg = CATEGORY_HIERARCHY[selectedLgCode];
    return lg?.children || {};
  }, [selectedLgCode]);

  // 소분류 옵션 계산
  const smOptions = useMemo(() => {
    const md = mdOptions[selectedMdCode];
    return md?.children || {};
  }, [selectedMdCode, mdOptions]);

  /** 셀렉트 핸들러 */
  const handleLgChange = (e) => {
    const v = e.target.value;
    setSelectedLgCode(v);
    setSelectedMdCode("");
    setSelectedSmCode("");
  };

  // 소분류 옵션 계산
  const handleMdChange = (e) => {
    const v = e.target.value;
    setSelectedMdCode(v);
    setSelectedSmCode("");
  };
  const handleSmChange = (e) => setSelectedSmCode(e.target.value);

  /** 여러 장 업로드 */
  const onPickImage = (e) =>
    handleFiles(Array.from(e.target.files || []).slice(0, 20)); // 과도 업로드 방지

  const handleFiles = async (files) => {
    if (!files.length) return;

    // 로컬 프리뷰 먼저 삽입
    const localItems = files.map((file) => ({
      id: crypto.randomUUID(),
      preview: URL.createObjectURL(file),
      url: null,
      file,
    }));
    setImages((prev) => [...prev, ...localItems]);

    try {
      setUploading(true);
      // 순차 업로드(안전)
      for (const item of localItems) {
        const res = await s3Service.uploadImage(item.file);
        const uploadedUrl = res?.imageUrl || res?.url;
        if (!uploadedUrl) throw new Error("업로드 응답에 imageUrl/url 없음");

        setImages((prev) =>
          prev.map((p) =>
            p.id === item.id ? { ...p, url: uploadedUrl, file: undefined } : p
          )
        );
      }
    } catch (err) {
      console.error(err);
      setError(
        err?.response?.data?.message || err.message || "이미지 업로드 실패"
      );
      // 실패한 항목 제거 및 blob 정리
      setImages((prev) => {
        localItems.forEach((li) => {
          if (li.preview?.startsWith("blob:")) URL.revokeObjectURL(li.preview);
        });
        return prev.filter((p) => !localItems.some((li) => li.id === p.id));
      });
    } finally {
      setUploading(false);
    }
  };

  /** 대표/삭제/드래그 */
  const makeCover = (idx) =>
    setImages((prev) => {
      const arr = [...prev];
      const [x] = arr.splice(idx, 1);
      arr.unshift(x);
      return arr;
    });

  const removeImage = (idx) =>
    setImages((prev) => {
      const arr = [...prev];
      const [x] = arr.splice(idx, 1);
      if (x?.preview?.startsWith("blob:")) URL.revokeObjectURL(x.preview);
      return arr;
    });

  const onDragStart = (idx) => () => (dragIndexRef.current = idx);
  const onDragOver = (e) => e.preventDefault();
  const onDrop = (idx) => (e) => {
    e.preventDefault();
    const from = dragIndexRef.current;
    if (from == null || from === idx) return;
    setImages((prev) => {
      const arr = [...prev];
      const [moved] = arr.splice(from, 1);
      arr.splice(idx, 0, moved);
      return arr;
    });
    dragIndexRef.current = null;
  };

  /** 정리(cleanup) */
  useEffect(() => {
    return () => {
      images.forEach((img) => {
        if (img.preview?.startsWith("blob:")) URL.revokeObjectURL(img.preview);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** 폼 리셋 */
  const resetForm = () => {
    setForm({
      title: "",
      price: "",
      finalCategoryCode: DEFAULT_LARGE_CODE,

      content: "",
    });
    setSelectedLgCode(DEFAULT_LARGE_CODE);
    setSelectedMdCode("");
    setSelectedSmCode("");
    setHashtagsInput("");
    images.forEach((img) => {
      if (img.preview?.startsWith("blob:")) URL.revokeObjectURL(img.preview);
    });
    setImages([]);
    setError(null);
  };

  /** 취소 */
  const handleCancel = () => {
    const hasChanges =
      form.title ||
      form.price ||
      form.content ||
      hashtagsInput ||
      images.length;
    if (hasChanges) {
      const ok = window.confirm("작성 중인 내용이 있습니다. 취소할까요?");
      if (!ok) return;
    }

    resetForm();
    if (typeof goBack === "function") goBack();
    else navigate(isEdit ? `/products/${postId}` : "/");
  };

  /** 제출 */
  const onSubmit = async (e) => {
    e.preventDefault();

    if (!form.finalCategoryCode) {
      setError("카테고리를 선택해주세요.");
      return;
    }
    if (uploading) {
      setError("이미지 업로드가 끝날 때까지 잠시만 기다려 주세요.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const imageUrls = images.map((i) => i.url).filter(Boolean);
      const payload = {
        title: form.title?.trim(),
        content: form.content?.trim(),
        price: form.price === "" ? null : Number(form.price),
        categoryCode: Number(form.finalCategoryCode), // 숫자 변환
        imageUrl: imageUrls[0] || undefined, // 대표
        imageUrls, // 전체(백엔드에서 저장)
        hashtags: parseHashtags(hashtagsInput),
      };

      if (isEdit) {
        await postService.updatePost(postId, payload);
        resetForm();
        navigate(`/products/${postId}`);
      } else {
        const data = await postService.createPost(payload);
        onCreated?.(data);
        resetForm();
        navigate(`/products/${data.id}`);
      }
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || err.message || "등록 실패");
    } finally {
      setSubmitting(false);
    }
  };

  /** ========== UI ========== */
  return (
    <MainLayout>
      <Header />

      <div className="w-[960px] mx-auto p-6 font-presentation">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">
            {isEdit ? "상품 수정" : "상품정보"}
          </h2>

          {goBack && (
            <button
              onClick={goBack}
              className="px-3 py-1.5 rounded-lg border hover:bg-gray-50"
            >
              목록
            </button>
          )}
        </div>

        <form onSubmit={onSubmit} className="space-y-8">
          {/* ========== 이미지 영역 ========== */}
          <section>
            <label className="block text-sm font-medium mb-2">상품이미지</label>

            {/* 업로드 드롭존 */}
            <label
              className="group relative w-full min-h-[160px] rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-500 hover:bg-gray-50 transition cursor-pointer"
              title="이미지를 클릭해서 선택"
            >
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={onPickImage}
              />
              <div className="flex items-center gap-2 text-sm">
                <FiImage className="text-xl opacity-80" />
                <span className="font-medium">이미지 등록</span>
                {uploading && <span className="text-xs">· 업로드 중...</span>}
              </div>
            </label>

            {/* 썸네일 그리드 */}
            {images.length > 0 && (
              <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {images.map((img, idx) => (
                  <div
                    key={img.id}
                    className="group relative border rounded-lg overflow-hidden bg-gray-50 cursor-grab active:cursor-grabbing"
                    draggable
                    onDragStart={onDragStart(idx)}
                    onDragOver={onDragOver}
                    onDrop={onDrop(idx)}
                    title="드래그해서 순서 변경"
                  >
                    {/* 대표 배지: 첫 번째만 항상 표시 (검정 라벨 스타일) */}
                    {idx === 0 && (
                      <span className="absolute left-2 top-2 z-10 inline-flex items-center px-2 py-1 rounded-md text-[11px] font-semibold bg-black/70 text-white shadow-sm">
                        대표이미지
                      </span>
                    )}

                    {/* X 삭제 버튼: 호버 시 표시 */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation(); // 드래그/다른 이벤트와 충돌 방지
                        removeImage(idx);
                      }}
                      className="absolute right-2 top-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 hover:bg-black text-white rounded-full w-6 h-6 flex items-center justify-center shadow-sm"
                      aria-label="이미지 삭제"
                      title="삭제"
                      draggable={false}
                    >
                      <FiX size={14} />
                    </button>

                    <img
                      src={img.preview || img.url}
                      alt={`image-${idx}`}
                      className="w-full h-40 object-cover select-none pointer-events-none"
                      onError={(e) =>
                        (e.currentTarget.style.visibility = "hidden")
                      }
                    />
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* ========== 카테고리 3단계 ========== */}
          <section>
            <label
              htmlFor="category-select"
              className="block text-sm font-semibold mb-3 text-gray-700"
            >
              카테고리 선택 (필수)
            </label>
            {/* 3단계 계층형 드롭다운 */}
            <div className="flex flex-col sm:flex-row gap-3">
              {/* 대분류 */}
              <div className="relative flex-1">
                <select
                  name="largeCategory"
                  value={selectedLgCode}
                  onChange={handleLgChange}
                  required
                  className="w-full rounded-xl border border-gray-300 px-4 appearance-none py-2.5 pr-10 bg-white text-base focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition"
                >
                  {Object.entries(CATEGORY_HIERARCHY).map(([code, data]) => (
                    <option key={code} value={code}>
                      {data.name}
                    </option>
                  ))}
                </select>
                <svg
                  className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>

              {/* 중분류 */}
              <div className="relative flex-1">
                <select
                  name="mediumCategory"
                  value={selectedMdCode}
                  onChange={handleMdChange}
                  disabled={Object.keys(mdOptions).length === 0}
                  className={`w-full rounded-xl border px-4 appearance-none py-2.5 pr-10 bg-white text-base transition ${
                    Object.keys(mdOptions).length === 0
                      ? "border-gray-200 text-gray-400"
                      : "border-gray-300 focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                  }`}
                >
                  <option value="">
                    {Object.keys(mdOptions).length === 0
                      ? "하위 카테고리 없음"
                      : "중분류 선택"}
                  </option>
                  {Object.entries(mdOptions).map(([code, data]) => (
                    <option key={code} value={code}>
                      {data.name}
                    </option>
                  ))}
                </select>
                <svg
                  className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>

              {/* 소분류 */}
              <div className="relative flex-1">
                <select
                  name="smallCategory"
                  value={selectedSmCode}
                  onChange={handleSmChange}
                  disabled={Object.keys(smOptions).length === 0}
                  className={`w-full rounded-xl border px-4 appearance-none py-2.5 pr-10 bg-white text-base transition ${
                    Object.keys(smOptions).length === 0
                      ? "border-gray-200 text-gray-400"
                      : "border-gray-300 focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                  }`}
                >
                  <option value="">
                    {Object.keys(smOptions).length === 0
                      ? "하위 카테고리 없음"
                      : "소분류 선택"}
                  </option>
                  {Object.entries(smOptions).map(([code, data]) => (
                    <option key={code} value={code}>
                      {data.name}
                    </option>
                  ))}
                </select>
                <svg
                  className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>
          </section>

          {/* ========== 나머지 폼 ========== */}
          <section>
            <label className="block text-sm font-medium mb-2">상품명</label>
            <div className="relative">
              <input
                name="title"
                value={form.title}
                onChange={onChange}
                required
                maxLength={40}
                className="w-full rounded-lg border border-rebay-gray-400 px-3 py-2"
                placeholder="상품명을 입력해 주세요."
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                {titleCount}/40
              </span>
            </div>
          </section>

          <section>
            <label className="block text-sm font-medium mb-2">가격(원)</label>
            <input
              name="price"
              type="number"
              min="0"
              step="1"
              value={form.price}
              onChange={onChange}
              required
              className="w-[240px] rounded-lg border border-rebay-gray-400 px-3 py-2"
              placeholder="예) 420000"
            />
          </section>

          <section>
            <label className="block text-sm font-medium mb-2">설명</label>
            <textarea
              name="content"
              value={form.content}
              onChange={onChange}
              required
              rows={8}
              className="w-full rounded-lg border border-rebay-gray-400 px-3 py-2"
              placeholder={`• 브랜드, 모델명, 구매 시기, 하자 유무 등 상세 설명을 적어주세요.\n• 연락처, SNS 계정 등 개인정보 입력은 제한될 수 있어요.`}
            />
          </section>

          <section>
            <label className="block text-sm font-medium mb-2">해시태그</label>
            <input
              value={hashtagsInput}
              onChange={(e) => setHashtagsInput(e.target.value)}
              className="w-full rounded-lg border border-rebay-gray-400 px-3 py-2"
              placeholder="#아이패드, #64GB"
            />
            <div className="flex flex-wrap gap-2 mt-2">
              {parseHashtags(hashtagsInput).map((t) => (
                <span
                  key={t}
                  className="px-2 py-1 rounded-full text-xs bg-gray-100"
                >
                  #{t}
                </span>
              ))}
            </div>
          </section>

          <section className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleCancel}
              disabled={submitting || uploading}
              className="cursor-pointer px-4 py-2 rounded-lg border border-rebay-gray-400 hover:bg-gray-50 disabled:opacity-50"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={submitting || uploading}
              className="cursor-pointer px-5 py-2 rounded-lg bg-rebay-blue hover:opacity-90 text-white disabled:opacity-50"
            >
              {isEdit
                ? submitting
                  ? "수정 중..."
                  : "수정하기"
                : submitting
                ? "등록 중..."
                : "등록하기"}
            </button>
          </section>

          {error && <p className="text-sm text-red-600">{error}</p>}
        </form>
      </div>

      <Footer />
    </MainLayout>
  );
};

export default ProductCreate;
