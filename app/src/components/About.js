import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from "react-i18next";
import { setPrimaryTheme } from "../utils/setTheme";

const About = () => {
  const { t } = useTranslation('support');
  const navigate = useNavigate();
  const [content, setContent] = useState(`
    <div class="prose max-w-none"><h3 class="text-xl font-semibold text-gray-800 mb-6">We’re Here to Help</h3>
      <p class="text-lg text-gray-600 mb-6">At Wello Solutions, your success is our priority. Whether you’re facing a technical challenge, need guidance on using our products, or want to ask a question, our support team is ready to assist you.</p>

      <h2 class="text-2xl font-semibold text-gray-800 mb-6">Contact Our Support Team</h2>
      <p class="text-lg text-gray-600 mb-6">If you couldn’t find what you’re looking for, we’re just a message away.</p>

      <ul>
        <li class="text-lg text-gray-600">Email: support@wello.solutions</li>
        <li class="text-lg text-gray-600">Chat: Available Mon–Fri, 9 AM – 6 PM (IST)</li>
        <li class="text-lg text-gray-600">Phone: +91-999999999</li>
      </ul>
    </div>
  `);
  useEffect(() => {
    if (window.welloServiceDesk) {
      const { support_page_content, color_primary } = window.welloServiceDesk;
      setContent(support_page_content);
      setPrimaryTheme(color_primary);
    }
  }, []);

  return (
    <div className="w-full mx-auto p-1 md:p-8">
      <h1 className="text-2xl font-semibold text-primary mb-6">{t("support_page_title")}</h1>
      <div className='flex'>
        {/* Back Button */}
        <button
          onClick={() => navigate('/')} // Navigate back one step in history
          className="flex items-center mb-4 font-semibold text-gray-800"
        >
          <ArrowLeft className="mr-2 w-5 h-5" /> {t("support_page_go_back")}
        </button>
      </div>
      <p className="text-lg mb-6">
        {t("support_page_content")}
      </p>
      <div className="prose max-w-none"
        dangerouslySetInnerHTML={{ __html: content }} />
    </div>
  );
};

export default About;