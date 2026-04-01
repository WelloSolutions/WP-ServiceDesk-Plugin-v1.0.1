// src/pages/PasswordUpdate.js
import { useState, useRef, useEffect } from 'react';
import { fetchDocuments } from '../services/apiServiceDocuments';
import { useAuth } from '../AuthContext';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader } from 'lucide-react';
import { useTranslation } from "react-i18next";
import { setPrimaryTheme } from "../utils/setTheme";

function maskEmail(email) {
  if (!email.includes('@')) return email;

  const [localPart, domainPart] = email.split('@');

  const maskedLocal = localPart.length <= 2
    ? '*'.repeat(localPart.length)
    : `${localPart[0]}${'*'.repeat(localPart.length - 2)}${localPart[localPart.length - 1]}`;

  const [domainName, ...rest] = domainPart.split('.');
  const maskedDomain = domainName.length <= 2
    ? '*'.repeat(domainName.length)
    : `${domainName[0]}${'*'.repeat(domainName.length - 1)}`;

  return `${maskedLocal}@${maskedDomain}.${rest.join('.')}`;
}

const PasswordUpdate = () => {
  const navigate = useNavigate();
  const { auth, login, logout, updateAuthToken } = useAuth(); // Access the user's current auth info
  setPrimaryTheme(auth?.colorPrimary);
  const [token, setToken] = useState('')
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [currentToken, setCurrentToken] = useState('');
  const [otpToken, setOtpToken] = useState('');
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const inputRefs = useRef([]);

  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useTranslation('updatePassword');

  useEffect(() => {
    if (window.welloServiceDesk) {
      const { token } = window.welloServiceDesk;
      setToken(token)
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation: Ensure new password is not the same as the old password
    if (newPassword === currentPassword) {
      setError(t('update_password_page_err_new_password_same'));
      return;
    }

    // Validation: Ensure new passwords match
    if (newPassword !== confirmNewPassword) {
      setError(t('update_password_page_err_password_not_match'));
      return;
    }

    // Validation: Ensure password is strong
    // Example rule: at least 6 characters, one uppercase, one lowercase, one number, one special character
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/;
    if (!strongPasswordRegex.test(newPassword)) {
      setError(t('update_password_page_err_weak_password'));
      return;
    }

    // Ensure that required fields are filled
    if (!auth || !auth.authEmail) {
      setError(t('update_password_page_err_authentication_missing'));
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      return;
    }

    try {
      setIsLoading(true);
      // Step 1: Login using provided credentials
      const userData = await login(token, auth.authEmail, currentPassword);

      if (!userData || !userData.data || !userData.data.auth_token) {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
        throw new Error(t('update_password_page_err_invalid_credentials'));
      }

      setCurrentToken(userData.data.auth_token);
      // Step 2: Request password change using received auth token
      const response = await fetchDocuments('api/ContactPlug/request-changepw', 'PUT', userData.data.auth_token);

      if (!response || !response.otp_token) {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
        throw new Error(t('update_password_page_err_OTP_not_received'));
      }

      // Step 3: OTP token received, continue flow
      setOtpToken(response.otp_token);
      setShowOTPModal(true);
      setIsLoading(false);
    } catch (err) {
      console.error('Password update flow error:', err);
      setError(err.message || t('update_password_page_err_failed'));
      setSuccessMessage(null);
    }

  };

  const handleChange = (index, value) => {
    if (!/^\d?$/.test(value)) return; // Allow only digits
    const updated = [...otpDigits];
    updated[index] = value;
    setOtpDigits(updated);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOTPSubmit = async () => {

    const payload = {
      'otp_token': otpToken,
      'otp_code': otpDigits.join(""),
      'new_password': newPassword
    }

    //console.log(payload);

    try {
      const response = await fetchDocuments('api/ContactPlug/verify-changepw', 'PUT', currentToken, payload);

      console.log(response);
      if (response.auth_token) {
        updateAuthToken(response.auth_token);
      }

      setSuccessMessage(t('update_password_page_err_successfully'));
      setError(null);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setTimeout(() => {
        logout();
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError(t('update_password_page_err_failed'));
      setSuccessMessage(null);
    }
    setShowOTPModal(false);
  };

  return (
    <div className="w-full mx-auto p-1 md:p-4">
      {/* Back Button */}
      <button
        onClick={() => navigate('/')} // Navigate back one step in history
        className="flex items-center mb-4 font-semibold text-gray-800"
      >
        <ArrowLeft className="mr-2 w-5 h-5" /> {t("update_password_page_go_back")}
      </button>
      <div className="max-w-md w-full mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-semibold text-primary mb-6">{t("update_password_page_title")}</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-base font-medium text-gray-700">{t("update_password_page_current_password")}</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              className="mt-1 p-2 w-full border border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-base font-medium text-gray-700">{t("update_password_page_new_password")}</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              className="mt-1 p-2 w-full border border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-base font-medium text-gray-700">{t("update_password_page_re_password")}</label>
            <input
              type="password"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              required
              className="mt-1 p-2 w-full border border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-primary text-primary-foreground py-2 px-4 rounded-md font-semibold border border-2 border-primary hover:bg-primary/20 hover:text-primary transition duration-200"
          >
            {!isLoading && t("update_password_page_update_button")}
            {isLoading && (
              <div role="status" aria-live="polite" className="flex items-center justify-center">
                <Loader className="ml-2 text-zinc-600 animate-spin" />
                <span className="ml-2">Updating Password...</span>
              </div>
            )}
          </button>
        </form>

        {/* OTP Modal */}
        {showOTPModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white text-center p-8 rounded-lg shadow-lg w-full max-w-md">
              <h2 className="text-2xl font-semibold mb-4 text-primary">{t("update_password_page_otp_popup_heading")}</h2>
              <p className='text-base mb-4 text-gray-500'>{t("update_password_page_otp_popup_subheading")} <span className='text-gray-800'>{maskEmail(auth.authEmail)}</span></p>
              <div className="flex justify-between mb-8">
                {otpDigits.map((digit, idx) => (
                  <input
                    id={idx}
                    name='OTP'
                    key={idx}
                    ref={(el) => (inputRefs.current[idx] = el)}
                    type="text"
                    value={digit}
                    onChange={(e) => handleChange(idx, e.target.value)}
                    maxLength={1}
                    required
                    className="w-14 h-16 shadow-[inset_0_0_4px_rgba(0,0,0,0.2)] bg-white text-xl font-bold text-center border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-gray-500"
                  />
                ))}
              </div>
              <div className="flex">
                <button
                  onClick={handleOTPSubmit}
                  className="px-4 py-2 bg-primary w-full text-primary-foreground rounded hover:bg-primary/20 hover:text-primary transition duration-200"
                >
                  {t("update_password_page_otp_popup_button")}
                </button>
              </div>
            </div>
          </div>
        )}

        {successMessage && <p className="mt-4 text-green-600 text-base">{successMessage}</p>}
        {error && <p className="mt-4 text-red-600 text-base">{error}</p>}
      </div>
    </div>
  );
};

export default PasswordUpdate;