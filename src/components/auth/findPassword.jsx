import { useCallback, useState } from "react";
import useUserStore from "../../store/userStore";
import { FiX } from "react-icons/fi";
import Input from "../ui/Input";
import ResetPassword from "./resetPassword";

const FindPassword = ({ onClose }) => {
  const { findPassword, resetPassword, loading, error } = useUserStore();

  const [loginIdForm, setLoginIdForm] = useState({ emailOrUsername: "" });
  const [actualFullName, setActualFullName] = useState(null);
  const [loginData, setLoginData] = useState(null);
  const [authForm, setAuthForm] = useState({
    enteredFullName: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [isIdSubmitted, setIsIdSubmitted] = useState(false);
  const [isVerified, setIsVerified] = useState(false); // fullName 인증 성공 여부

  const [clientMessage, setClientMessage] = useState({
    text: null,
    type: "info",
  });

  const isEmail = (value) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  };

  const handleIdSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setClientMessage({ text: null, type: "info" });

      const data = isEmail(loginIdForm.emailOrUsername)
        ? { email: loginIdForm.emailOrUsername }
        : { username: loginIdForm.emailOrUsername };

      try {
        // 서버에서 실제 fullName 가져오기
        const nameFromBackend = await findPassword(data);

        setActualFullName(nameFromBackend);
        setLoginData(data);
        setIsIdSubmitted(true); // 2단계 UI로 전환
        // 이전 단계의 입력값 초기화
        setAuthForm((prev) => ({ ...prev, enteredFullName: "" }));
        setClientMessage({
          text: `${maskFullName(nameFromBackend)} 님의 본인 인증을 진행합니다.`,
          type: "info",
        });
      } catch (err) {
        console.error(err);
        setClientMessage({
          text: err.message || "로그인 ID를 찾을 수 없거나 서버 오류입니다.",
          type: "error",
        });
        setActualFullName(null);
        setIsIdSubmitted(false);
      }
    },
    [loginIdForm.emailOrUsername, findPassword]
  );

  const handleVerification = useCallback(
    (e) => {
      e.preventDefault();
      setClientMessage({ text: null, type: "info" });

      if (authForm.enteredFullName === actualFullName) {
        setIsVerified(true);

        setAuthForm((prev) => ({
          ...prev,
          newPassword: "",
          confirmPassword: "",
        }));
        setClientMessage({
          text: "본인 인증에 성공했습니다. 새 비밀번호를 설정해주세요.",
          type: "success",
        });
      } else {
        setClientMessage({
          text: "입력하신 이름이 일치하지 않습니다.",
          type: "error",
        });
        setIsVerified(false);
      }
    },
    [authForm.enteredFullName, actualFullName]
  );

  const handleResetPassword = useCallback(
    async (e) => {
      e.preventDefault();
      setClientMessage({ text: null, type: "info" });

      const { newPassword, confirmPassword } = authForm;

      if (newPassword !== confirmPassword) {
        setClientMessage({
          text: "새 비밀번호가 일치하지 않습니다.",
          type: "error",
        });
        return;
      }

      if (newPassword.length < 8) {
        setClientMessage({
          text: "새 비밀번호는 최소 8자 이상이어야 합니다.",
          type: "error",
        });
        return;
      }

      const dataToSend = {
        ...loginData,
        password: newPassword,
      };

      try {
        await resetPassword(dataToSend);
        setClientMessage({
          text: "비밀번호가 성공적으로 변경되었습니다. 창을 닫아주세요.",
          type: "success",
        });
      } catch (err) {
        console.error(err);
        setClientMessage({
          text: err.message || "비밀번호 재설정 중 오류가 발생했습니다.",
          type: "error",
        });
      }
    },
    [authForm.newPassword, authForm.confirmPassword, loginData, resetPassword]
  );

  const handleIdChange = (e) => {
    setLoginIdForm({
      ...loginIdForm,
      [e.target.name]: e.target.value,
    });
  };

  const handleAuthChange = (e) => {
    setAuthForm({
      ...authForm,
      [e.target.name]: e.target.value,
    });
  };

  const maskFullName = (name) => {
    try {
      if (!name || name.length >= 2) {
        const firstChar = name.slice(0, 1);
        const lastChar = name.slice(-1);
        const maskedLength = name.length - 2;
        const middleMask = "*".repeat(maskedLength);

        return firstChar + middleMask + lastChar;
      }
    } catch (err) {
      console.error(err);
    }
  };

  const maskedName = actualFullName ? maskFullName(actualFullName) : null;

  return (
    <div>
      <div className="w-[350px]">
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl ">
          <div className="flex justify-end pt-4 pr-4">
            <FiX onClick={onClose} className="cursor-pointer" />
          </div>
          <div className="px-12 py-6">
            <form
              className="font-presentation flex flex-col gap-[15px]"
              onSubmit={handleSubmit}
            >
              <div className="flex ">
                <div>로그인 ID를 입력해주세요.</div>
              </div>
              <Input
                type="text"
                name="emailOrUsername"
                placeholder="Email address or Username"
                value={formData.emailOrUsername}
                onChange={handleChange}
                required
              />
              <button
                className="cursor-pointer mt-4 bg-rebay-blue w-full h-[40px] rounded-xl text-white font-bold"
                type="submit"
                disabled={loading || !formData.emailOrUsername}
              >
                {loading ? "확인 중..." : "확인"}
              </button>
            </form>

            {error && <p className="text-error">{error}</p>}
          </div>
        </div>
      </div>
      {<ResetPassword LoginData={LoginData} fullName={fullName} />}
    </div>
  );
};

export default FindPassword;
