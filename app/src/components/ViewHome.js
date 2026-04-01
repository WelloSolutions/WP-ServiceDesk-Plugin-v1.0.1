import React, { useState, useEffect } from 'react';
import { NotebookPen, Ticket, CalendarDays, FileText } from "lucide-react";
import { Link } from 'react-router-dom';
import { useTranslation } from "react-i18next";
import { setPrimaryTheme } from "../utils/setTheme";

const Home = () => {
  const [banner_img, setBanner_img] = useState('service-desk/banner_img.png');
  const { t } = useTranslation('home');

  useEffect(() => {
    if (window.welloServiceDesk) {
      const { background_image, color_primary } = window.welloServiceDesk;
      // console.log(color_primary, color_secondary);
      setBanner_img(background_image);
      setPrimaryTheme(color_primary);
    }
  }, []);

  return (
    <div className="min-h-screen w-full">
      <div className="relative w-full">
        <img src={banner_img} alt="Banner" className="w-full" />
        {/* <div className="absolute -bottom-4 w-full h-12 bg-gradient-to-t from-white/10 to-transparent backdrop-blur-sm flex items-center justify-center"> */}
        <div className="absolute -bottom-1 w-full h-full bg-gradient-to-b from-stone-500/0 to-white" >  
        </div>
      </div>
      <main className="relative mx-8 md:mx-32 mt-8 p-8">
        <div className="grid md:grid-cols-2 gap-6">
          <Link to="/createticket" className="block no-underline">
            <div className='bg-primary text-primary-foreground border border-4 border-primary p-2 md:p-6 rounded-2xl shadow transition-colors relative hover:bg-primary/20 hover:text-primary hover:shadow-[4px_4px_20px_0px_rgba(31,39,45,0.40)] active:bg-primary/70'>
              <div className="flex items-center space-x-2">
                <NotebookPen className="w-12 h-12" />
                <span className="text-lg md:text-3xl font-bold ps-1 md:ps-6">{t("home_page_create_ticket_button")}</span>
              </div>
            </div>
          </Link>
          <Link to="/tickets" className="block no-underline">
            <div className="bg-primary text-primary-foreground border border-4 border-primary p-2 md:p-6 rounded-2xl shadow transition-colors relative hover:bg-primary/20 hover:text-primary hover:shadow-[4px_4px_20px_0px_rgba(31,39,45,0.40)] active:bg-primary/70">
              <div className="flex items-center space-x-2">
                <Ticket className="w-12 h-12" />
                <span className="text-lg md:text-3xl font-bold ps-1 md:ps-6">{t("home_page_view_ticket_button")}</span>
              </div>
              {/* <span className="absolute top-2 right-2 text-zinc-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                {contactCount}
              </span> */}
            </div>
          </Link> 
          <Link to="/calendar" className="block no-underline">
            <div className="bg-primary text-primary-foreground border border-4 border-primary p-2 md:p-6 rounded-2xl shadow transition-colors relative hover:bg-primary/20 hover:text-primary hover:shadow-[4px_4px_20px_0px_rgba(31,39,45,0.40)] active:bg-primary/70">
              <div className="flex items-center space-x-2">
                <CalendarDays className="w-12 h-12" />
                <span className="text-lg md:text-3xl font-bold ps-1 md:ps-6">{t("home_page_calendar_button")}</span>
              </div>
            </div>
          </Link>
          <Link to="/workorders" className="block no-underline">
            <div className="bg-primary text-primary-foreground border border-4 border-primary p-2 md:p-6 rounded-2xl shadow transition-colors relative hover:bg-primary/20 hover:text-primary hover:shadow-[4px_4px_20px_0px_rgba(31,39,45,0.40)] active:bg-primary/70">
              <div className="flex items-center space-x-2">
                <FileText className="w-12 h-12" />
                <span className="text-lg md:text-3xl font-bold ps-1 md:ps-6">{t("home_page_work_order_button")}</span>
              </div>
            </div>
          </Link>
        </div>
      </main>
    </div>
  )
};

export default Home;