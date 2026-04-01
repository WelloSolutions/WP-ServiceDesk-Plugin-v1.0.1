import React, { useEffect, useState } from 'react';
import { Menu, X, Languages, FileBadge, ChevronRight, ChevronLeft, House, Wrench, Ticket, Calendar, Users, Drill, MessageCircleQuestion, Folder, Settings, LogOut } from "lucide-react";
import { NavLink } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useTranslation } from "react-i18next";
import { setPrimaryTheme } from "../utils/setTheme";

import Select from 'react-select';
import makeAnimated from 'react-select/animated';
const animatedComponents = makeAnimated();

export default function DashboardSidebar() {
    const { auth, logout, updateLanguage } = useAuth();
    setPrimaryTheme(auth?.colorPrimary);
    // const [query, setQuery] = useState('');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const isMobile = window.innerWidth < 768;
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [logo, setLogo] = useState('/service-desk/logo.png');
    const [logo_2, setLogo_2] = useState('/service-desk/logo_2.png');
    const { i18n } = useTranslation();
    // const userLangShort = auth?.userLang?.split('-')[0];
    const { t } = useTranslation('dashboard');

    useEffect(() => {
        if (window.welloServiceDesk) {
            const { logo_primary, logo_secondary } = window.welloServiceDesk;
            setLogo(logo_primary);
            setLogo_2(logo_secondary);
        }
    }, []);

    const toggleCollapse = () => {
        setIsCollapsed(!isCollapsed);
    };

    const handleToggle = () => {
        if (isCollapsed) {
            setIsCollapsed(false);
        }
    };

    const languageOptions = {
        en: t('navbar_lang_en'),
        fr: t('navbar_lang_fr'),
        nl: t('navbar_lang_nl')
        // de: 'Deutsch',
        // es: 'Español',
        // pt: 'Português',
        // it: 'Italiano',
        // pl: 'Polski',
    };

    const changeLanguage = (lng) => {
        updateLanguage(lng);
        i18n.changeLanguage(lng);
    };

    // Convert your languageOptions object into react-select's { value, label } format
    const options = Object.entries(languageOptions).map(([code, label]) => ({
        value: code,
        label,
    }));

    // Current selected value
    const selectedValue = options.find(
        (opt) => opt.value === i18n.language.split("-")[0]
    );



    const getFirstLetters = (str) => {
        let words = str.split(" ");
        return words[0][0] + words[1][0];
    };


    return (
        <>
            <button
                className="md:hidden fixed top-2 right-2 z-10 p-2 bg-white shadow rounded-lg"
                onClick={() => setIsMobileMenuOpen(true)}
            >
                <Menu size={24} />
            </button>
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/40 z-30 md:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                ></div>
            )}
            <div
                className={`
                    fixed md:static top-0 left-0 h-full z-40
                    transform transition-transform duration-300
                    ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
                    
                    md:sticky md:top-0 min-h-screen flex flex-col justify-between 
                    outline outline-1 outline-offset-[-1px] outline-gray-300 overflow-y-auto
                    rounded-br-2xl rounded-tr-2xl bg-white p-4
                    ${isCollapsed ? "w-[5rem]" : "w-[80%] md:w-1/4 lg:w-1/5"}
                `}
            >
                {isMobile && (
                    <button
                        className="md:hidden absolute right-1 top-1 p-1 bg-primary text-primary-foreground rounded-full"
                        onClick={() => setIsMobileMenuOpen(false)}
                    >
                        <X size={20} />
                    </button>
                )}

                <div className="">
                    <div className="flex items-center justify-center h-16 gap-2 mb-2 w-full">
                        <a href="/" className="flex items-center justify-center w-full">
                            {!isCollapsed ? <img src={logo} alt="Logo" className="w-32" /> : <img src={logo_2} alt="Logo" className="w-12" />}
                        </a>
                    </div>

                    {/* Collapse Button */}
                    <div className="flex justify-start items-center text-gray-500 mb-4">
                        <button onClick={toggleCollapse} className="px-2 py-2">
                            {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
                        </button>
                        <p className={`text-base ${isCollapsed ? 'hidden' : ''}`}>{t("navbar_collapse_arrow")}</p>
                    </div>

                    {/* <div
                        className={`relative w-full mb-4 transition-all duration-300 ${isCollapsed ? 'px-2 py-2 border-2 rounded-lg cursor-pointer' : ''
                            }`}
                        onClick={handleToggle}
                    >
                        {!isCollapsed && (
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder={t('navbar_search_box')}
                                className="w-full px-3 py-2 pl-10 text-gray-500 text-base border border-gray-500 rounded-lg focus:outline-none focus:text-primary focus:ring-1 focus:ring-primary"
                            />
                        )}

                        <Search
                            className={`w-5 h-5 transition-all duration-200 ${isCollapsed ? '' : 'absolute left-3 top-2.5'}`}
                        />
                    </div> */}

                    {/* Navigation Links */}
                    <NavLink
                        to="/"
                        end // ensures exact match for root path
                        className={({ isActive }) =>
                            [
                                'flex items-center gap-2 leading-none no-underline cursor-pointer w-full px-2 py-2 mb-0.5 rounded-lg',
                                'hover:bg-primary/20 hover:text-primary focus:border-r-4 focus:border-primary focus:bg-primary/20',
                                isActive
                                    ? 'text-primary border-r-4 border-primary bg-primary/50'
                                    : 'text-gray-500'
                            ].join(' ')
                        }
                    >
                        <House className="w-5 h-5" />
                        {!isCollapsed && t('navbar_home_page_link')}
                    </NavLink>

                    <NavLink to="/createticket"
                        end // ensures exact match for root path
                        className={({ isActive }) =>
                            [
                                'flex items-center gap-2 leading-none no-underline cursor-pointer w-full px-2 py-2 mb-0.5 rounded-lg',
                                'hover:bg-primary/20 hover:text-primary focus:border-r-4 focus:border-primary focus:bg-primary/20',
                                isActive
                                    ? 'text-primary border-r-4 border-primary bg-primary/20'
                                    : 'text-gray-500'
                            ].join(' ')
                        }
                    >
                        <Wrench className="w-5 h-5" /> {!isCollapsed && t('navbar_create_ticket_link')}
                    </NavLink>
                    <NavLink to="/tickets"
                        end // ensures exact match for root path
                        className={({ isActive }) =>
                            [
                                'flex items-center gap-2 leading-none no-underline cursor-pointer w-full px-2 py-2 mb-0.5 rounded-lg',
                                'hover:bg-primary/20 hover:text-primary focus:border-r-4 focus:border-primary focus:bg-primary/20',
                                isActive
                                    ? 'text-primary border-r-4 border-primary bg-primary/20'
                                    : 'text-gray-500'
                            ].join(' ')
                        }
                    >
                        <Ticket className="w-5 h-5" /> {!isCollapsed && t('navbar_tickets_list_link')}
                    </NavLink>
                    <NavLink to="/workorders"
                        end // ensures exact match for root path
                        className={({ isActive }) =>
                            [
                                'flex items-center gap-2 leading-none no-underline cursor-pointer w-full px-2 py-2 mb-0.5 rounded-lg',
                                'hover:bg-primary/20 hover:text-primary focus:border-r-4 focus:border-primary focus:bg-primary/20',
                                isActive
                                    ? 'text-primary border-r-4 border-primary bg-primary/20'
                                    : 'text-gray-500'
                            ].join(' ')
                        }
                    >
                        <Settings className="w-5 h-5" /> {!isCollapsed && t('navbar_work_order_list_link')}
                    </NavLink>
                    <NavLink to="/calendar"
                        end // ensures exact match for root path
                        className={({ isActive }) =>
                            [
                                'flex items-center gap-2 leading-none no-underline cursor-pointer w-full px-2 py-2 mb-0.5 rounded-lg',
                                'hover:bg-primary/20 hover:text-primary focus:border-r-4 focus:border-primary focus:bg-primary/20',
                                isActive
                                    ? 'text-primary border-r-4 border-primary bg-primary/20'
                                    : 'text-gray-500'
                            ].join(' ')
                        }
                    >
                        <Calendar className="w-5 h-5" /> {!isCollapsed && t('navbar_calendar_page_link')}
                    </NavLink>

                    <div className="border-t-2 border-gray-100 my-4"></div>
                    <NavLink to="/users"
                        end // ensures exact match for root path
                        className={({ isActive }) =>
                            [
                                'flex items-center gap-2 leading-none no-underline cursor-pointer w-full px-2 py-2 mb-0.5 rounded-lg',
                                'hover:bg-primary/20 hover:text-primary focus:border-r-4 focus:border-primary focus:bg-primary/20',
                                isActive
                                    ? 'text-primary border-r-4 border-primary bg-primary/20'
                                    : 'text-gray-500'
                            ].join(' ')
                        }
                    >
                        <Users className="w-5 h-5" /> {!isCollapsed && t('navbar_users_list_link')}
                    </NavLink>
                    <NavLink to="/equipments"
                        end // ensures exact match for root path
                        className={({ isActive }) =>
                            [
                                'flex items-center gap-2 leading-none no-underline cursor-pointer w-full px-2 py-2 mb-0.5 rounded-lg',
                                'hover:bg-primary/20 hover:text-primary focus:border-r-4 focus:border-primary focus:bg-primary/20',
                                isActive
                                    ? 'text-primary border-r-4 border-primary bg-primary/20'
                                    : 'text-gray-500'
                            ].join(' ')
                        }
                    >
                        <Drill className="w-5 h-5" /> {!isCollapsed && t('navbar_equipments_list_link')}
                    </NavLink>
                    <NavLink to="/documents"
                        end // ensures exact match for root path
                        className={({ isActive }) =>
                            [
                                'flex items-center gap-2 leading-none no-underline cursor-pointer w-full px-2 py-2 mb-0.5 rounded-lg',
                                'hover:bg-primary/20 hover:text-primary focus:border-r-4 focus:border-primary focus:bg-primary/20',
                                isActive
                                    ? 'text-primary border-r-4 border-primary bg-primary/20'
                                    : 'text-gray-500'
                            ].join(' ')
                        }
                    >
                        <Folder className="w-5 h-5" /> {!isCollapsed && t('navbar_documents_list_link')}
                    </NavLink>
                    <NavLink to="/billing-invoice"
                        end // ensures exact match for root path
                        className={({ isActive }) =>
                            [
                                'flex items-center gap-2 leading-none no-underline cursor-pointer w-full px-2 py-2 mb-0.5 rounded-lg',
                                'hover:bg-primary/20 hover:text-primary focus:border-r-4 focus:border-primary focus:bg-primary/20',
                                isActive
                                    ? 'text-primary border-r-4 border-primary bg-primary/20'
                                    : 'text-gray-500'
                            ].join(' ')
                        }
                    >
                        <FileBadge className="w-5 h-5" /> {!isCollapsed && t('Billing and Invoices')}
                    </NavLink>
                </div>

                <div className="mt-5 relative ">

                    {/* Language Switcher */}
                    {!isCollapsed ? (
                        <div className="px-2 py-2 text-primary flex items-center gap-2">
                            <Languages className="w-5 h-5" />
                            <Select
                                components={animatedComponents}
                                id="language-select"
                                options={options}
                                value={selectedValue}
                                onChange={(selected) => changeLanguage(selected.value)}
                                className="w-full text-primary"
                                classNamePrefix="react-select"
                                styles={{
                                    control: (base) => ({
                                        ...base,
                                        border: 'none',
                                        boxShadow: 'none', // also remove focus ring
                                    }),
                                    option: (base, state) => ({
                                        ...base,
                                        whiteSpace: "nowrap", // prevent wrapping
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        color: state.isSelected
                                            ? 'rgb(var(--color-primary-foreground) / var(--tw-bg-opacity, 1))'
                                            : state.isFocused
                                                ? 'rgb(var(--color-primary-foreground) / var(--tw-bg-opacity, 1))'
                                                : 'rgb(var(--color-primary) / var(--tw-bg-opacity, 1))',
                                        backgroundColor: state.isSelected
                                            ? 'rgb(var(--color-primary) / 0.7)'
                                            : state.isFocused
                                                ? 'rgb(var(--color-primary) / 0.5)'
                                                : 'transparent',
                                        cursor: 'pointer',
                                    }),
                                    menu: (provided) => ({
                                        ...provided,
                                        width: '100%', // controls dropdown menu width
                                    }),
                                }}
                            />
                        </div>
                    ) : (
                        <div
                            className={`relative w-full mb-4 leading-none rounded-lg transition-all duration-300 hover:bg-primary/20 ${isCollapsed ? 'px-2 py-2 cursor-pointer' : ''}`}
                            onClick={handleToggle}
                        >
                            <Languages className={`w-5 h-5 transition-all duration-200 ${isCollapsed ? '' : 'absolute left-3 top-2.5'}`} />
                        </div>
                    )}

                    <NavLink to="/about"
                        end // ensures exact match for root path
                        className={({ isActive }) =>
                            [
                                'flex items-center gap-2 leading-none no-underline cursor-pointer w-full px-2 py-2 mb-0.5 rounded-lg',
                                'hover:bg-primary/20 hover:text-primary focus:border-r-4 focus:border-primary focus:bg-primary/20',
                                isActive
                                    ? 'text-primary border-r-4 border-primary bg-primary/20'
                                    : 'text-gray-500'
                            ].join(' ')
                        }
                    >
                        <MessageCircleQuestion className="w-5 h-5" /> {!isCollapsed && t('navbar_support_page_link')}
                    </NavLink>
                    {/* Profile and Logout */}
                    <div className="border-t-2 border-primary/20 my-4"></div>
                    {auth && (
                        <div className="flex justify-between items-center rounded-lg gap-1 px-1 py-2">
                            {!isCollapsed && (
                                <div className="flex items-center gap-1 font-semibold">
                                    <span className="flex justify-center px-2 py-2 w-8 h-8 text-xs rounded-full bg-primary text-primary-foreground">{getFirstLetters(auth.userName)}</span>
                                    <span className="text-primary leading-none">{auth.userName}</span>
                                </div>
                            )}
                            <div className="flex flex-col text-base cursor-pointer">
                                <button onClick={logout}>
                                    <LogOut className="w-5 h-5 text-primary" />
                                </button>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </>
    );
}
