import { useEffect, useState } from "react";
import useUserStore from "../../store/userStore";
import { FiX } from "react-icons/fi";
import Input from "../ui/Input";

const ResetPassword = ({ onClose, fullName, LoginData }) => {
  const { resetPassword, loading, error } = useUserStore();

  const [clientError, setClientError] = useState(null);
  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordData, setPasswordData] = useState({
    fullName: "",
  });
  const [maskName, setMaskName] = useState(null);
  const [isSame, SetIsame] = useState(false);

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
  useEffect(() => {
    setMaskName(maskFullName(fullName));
  }, []);

  const handleConfirm = async (e) => {
    e.preventDefault();
    try {
      if (fullName == formData.fullName) {
        SetIsame(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const isPasswordMatch =
    passwordData.newPassword === passwordData.confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setClientError(null); // 클라이언트 에러 초기화

    if (!isPasswordMatch) {
      setClientError("새 비밀번호가 일치하지 않습니다.");
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setClientError("새 비밀번호는 최소 8자 이상이어야 합니다.");
      return;
    }

    const dataToSend = {
      ...LoginData,
      password: passwordData.newPassword,
    };

    try {
      console.log(dataToSend);
      await resetPassword(dataToSend);

      onClose();
      alert("비밀번호가 성공적으로 변경되었습니다.");
    } catch (err) {}
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value,
    });
  };
  return (
    <div>
      {maskName && (
        <div className="w-[350px]">
          <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl ">
            <div className="flex justify-end pt-4 pr-4">
              <FiX onClick={onClose} className="cursor-pointer" />
            </div>
            <div className="px-12 py-6">
              <form
                className="font-presentation flex flex-col gap-[15px]"
                onSubmit={handleConfirm}
              >
                <div className="flex items-center">
                  <label>fullName:</label>
                  <label>{maskName}</label>
                </div>
                <div className="flex items-center">
                  <label>fullName:</label>
                  <Input
                    type="text"
                    name="fullName"
                    placeholder="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    required
                  />
                </div>
                <button
                  className="cursor-pointer mt-4 bg-rebay-blue w-full h-[40px] rounded-xl text-white font-bold"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? "확인 중..." : "확인"}
                </button>
              </form>

              {error && <p className="text-error">{error}</p>}
            </div>

            {isSame && (
              <div className="px-12 py-6">
                <form
                  className="font-presentation flex flex-col gap-[15px]"
                  onSubmit={handleSubmit}
                >
                  <Input
                    type="password"
                    name="newPassword"
                    placeholder="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    required
                  />
                  <Input
                    type="password"
                    name="confirmPassword"
                    placeholder="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    required
                  />
                  <button
                    className="cursor-pointer mt-4 bg-rebay-blue w-full h-[40px] rounded-xl text-white font-bold"
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? "확인 중..." : "확인"}
                  </button>
                </form>

                {error && <p className="text-error">{error}</p>}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ResetPassword;
