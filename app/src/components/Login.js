import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useTranslation } from 'react-i18next';
import { LogIn, Eye, EyeOff, Languages } from 'lucide-react';
import { ToastContainer, toast } from 'react-toastify';
import { setPrimaryTheme } from "../utils/setTheme";

const Login = () => {
  const [email, setEmail] = useState('')
  const [token, setToken] = useState('AKCDR8dilnE7ISown6JvUY/2CiBNXbEMZuBJTUwAveQBViIrXSeZq/q97oxBrIhd3YYmYBfUW5rul8UDkwFcxFR/Ozj0hvbJLPNRAaT2FeOFtxlyvMKv9QkuTmgzX0atfkgi1Rgcsq+3KX27nNJNoQNuQwqUuTUOWm08U1ZGVlIs+hgxdXUHVxRxEWB9vWjFodYxc91ujzGlOw7I8NQvXw==') //TEMPLATEFREETRIALAZURE
  //const [token, setToken] = useState('vbhPhRFQXaXPSq1rv801N3DOP+WhR5sw7xmmuAsbjzAQFYGXypuX07Naz+3LcSQ0SuyjhMf5VnqqBtJ1fMISByvklKH9rjNUtKuwCxxMlMzlUVGzccJnRtvrGua+rn+foeUykkB9CoHkWoFfOQP84umQm2Go52GGvfUul6ibRVCb/cBaK4KgvtHRJI0JUUEY')
  //const [token, setToken] = useState('H0llCbE/B0zmXa8uWKOqegUUL2zHLlomEP013H+eEKyh82Ag6c4KBdR5hkM1b2Liuq2athSackA0l6QOU9tt6+Eud5dIJUITNW1j7Sk80jflNQ92ereo4eI9mIH5EVHRug0AtrL68IoLjBblm8c6jMhxkHbRJhnj+omd2Q0EaHtjEYhRrTh7cHhnw0OFgt0u') // TESTNATIVE2
  // const [token, setToken] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [selectedLang, setSelectedLang] = useState('en'); // Selected in <select>
  const navigate = useNavigate();
  const { login } = useAuth();
  const [logo, setLogo] = useState('/service-desk/logo.png');

  useEffect(() => {
    if (window.welloServiceDesk) {
      const { logo_primary, token, color_primary } = window.welloServiceDesk;
      setLogo(logo_primary);
      setPrimaryTheme(color_primary);
      setToken(token)
    }
  }, []);

  // State setup
  const [language, setLanguage] = useState('en');
  const { t: i18nT, i18n } = useTranslation('login');

  // On first load, load language from localStorage and sync with i18n
  useEffect(() => {
    const savedLang = localStorage.getItem('i18nextLng') || 'en';
    setLanguage(savedLang);
    setSelectedLang(savedLang);
    i18n.changeLanguage(savedLang);
  }, [i18n]);

  // When language changes, update i18nextLng localStorage and sync with i18n
  useEffect(() => {
    localStorage.setItem('i18nextLng', language);
    i18n.changeLanguage(language);
  }, [language, i18n]);

  // Translation function (use i18n translations)
  const t = (key) => i18nT(key) || key;

  // Language label map (static)
  const languageOptions = {
    en: t('login_lang_en') || 'English',
    fr: t('login_lang_fr') || 'Français',
    nl: t('login_lang_nl') || 'Nederlands'
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (rememberMe) {
      localStorage.setItem('rememberedEmail', email);
    } else {
      localStorage.removeItem('rememberedEmail');
    }

    try {
      const userData = await login(token, email, password);

      if (userData) {
        navigate("/");
      } else {
        throw new Error(t("login_invalid_credentials"));
      }
    } catch (err) {
      toast.error(err.message || t("login_error_invalid_credentials"));
      //setEmail('');
      setPassword('');
      setLoading(false); // Ensure loading spinner stops
    }
  };

  if (loading) {
    return <div className="flex w-full items-center justify-center h-screen">
      <div className="relative">
        <div className="w-20 h-20 border-purple-200 border-2 rounded-full"></div>
        <div className="w-20 h-20 border-purple-700 border-t-2 animate-spin rounded-full absolute left-0 top-0"></div>
      </div>
    </div>;
  }

  return (
    <div className="min-h-screen w-full bg-gray-100 flex flex-col justify-center px-4 sm:px-6 lg:px-8">
      <ToastContainer
        position="bottom-center"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
      <div className="w-full max-w-sm mx-auto">
        <div className="bg-white p-4 shadow sm:rounded-lg">
          <div className="flex justify-center mb-4 py-1">
            <img src={logo} alt="Logo" className="w-48" />
          </div>
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="p-2 w-full border border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                value={localStorage.getItem('rememberedEmail') || email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('login_form_email')}
              />
            </div>

            <div className="relative">
              <input
                id="password"
                name="password"
                type={visible ? "text" : "password"}
                autoComplete="current-password"
                required
                className="p-2 w-full border border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('login_form_password')}
              />
              <button
                type="button"
                onClick={() => setVisible(!visible)}
                className="absolute inset-y-0 right-0 flex items-center px-2 text-gray-500 focus:outline-none"
              >
                {visible ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <label htmlFor="remember-me" className="ml-2 block text-base text-gray-900">
                  {t("login_remenber_me")}
                </label>
              </div>

              {/* <div className="text-base">
                <Link to="/forgot-password" className="font-medium text-indigo-600 hover:text-indigo-500">
                  Forgot your password?
                </Link>
              </div> */}
            </div>

            <div>
              <button
                type="submit"
                className="bg-primary text-primary-foreground w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-base font-medium hover:bg-primary/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                {t("login_form_button")} <LogIn className='w-4 h-4 ms-1' />
              </button>
            </div>
          </form>
        </div>

        <div className="flex justify-center items-center space-x-3 mt-8">
          <div className="flex space-x-2 text-gray-600">
            <Languages size={20} />
          </div>

          <select
            name='language-select'
            value={selectedLang}
            onChange={(e) => setSelectedLang(e.target.value)}
            className='p-1 rounded-md'
          >
            {Object.entries(languageOptions).map(([code, label]) => (
              <option key={code} value={code}>{label}</option>
            ))}
          </select>

          <button onClick={() => setLanguage(selectedLang)}>
            {t("login_lang_change") || "Change"}
          </button>
        </div>
      </div>
    </div>
  )
}

export default Login;
