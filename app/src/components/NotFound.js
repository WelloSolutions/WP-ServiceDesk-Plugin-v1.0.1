import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from "react-i18next";
import { setPrimaryTheme } from "../utils/setTheme";

const NotFound = () => {
  const { t } = useTranslation('notFound');
  useEffect(() => {
    if (window.welloServiceDesk) {
      const { color_primary } = window.welloServiceDesk;
      setPrimaryTheme(color_primary);
    }
  }, []);

  return <div className="min-h-screen w-full bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center px-4 sm:px-6 lg:px-8">
    <div className="max-w-lg w-full space-y-8 text-center">
      <div>
        <h1 className="text-9xl font-extrabold text-primary">404</h1>
        <p className="text-4xl font-bold text-primary mt-4">{t("not_found_page_heading")}</p>
        <p className="text-lg text-gray-600 mt-6">{t("not_found_page_subheading")}</p>
      </div>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
        <Link to="/"
          className="mb-6 bg-primary text-primary-foreground border border-primary px-4 py-1 rounded-md hover:bg-primary/20 hover:text-primary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition"
        >
          {t("not_found_page_go_home")}
        </Link>
      </div>
    </div>
  </div>
};

export default NotFound;
