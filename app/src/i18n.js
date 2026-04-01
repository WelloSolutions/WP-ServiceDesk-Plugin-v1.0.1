import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Login Page
import login_en from './locales/en/login.json';
import login_fr from './locales/fr/login.json';
import login_nl from './locales/nl/login.json';

// Navigation Bar
import dashboard_en from './locales/en/dashboard.json';
import dashboard_fr from './locales/fr/dashboard.json';
import dashboard_nl from './locales/nl/dashboard.json';

// Home Page JSON
import home_en from './locales/en/home.json';
import home_fr from './locales/fr/home.json';
import home_nl from './locales/nl/home.json';

// Ticket List Page JSON
import ticketList_en from './locales/en/ticketList.json';
import ticketList_fr from './locales/fr/ticketList.json';
import ticketList_nl from './locales/nl/ticketList.json';

// Work Order List Page JSON
import workOrderList_en from './locales/en/workOrderList.json';
import workOrderList_fr from './locales/fr/workOrderList.json';
import workOrderList_nl from './locales/nl/workOrderList.json';

// Work Order List Page JSON
import equipmentList_en from './locales/en/equipmentList.json';
import equipmentList_fr from './locales/fr/equipmentList.json';
import equipmentList_nl from './locales/nl/equipmentList.json';

// Users JSON
import users_en from './locales/en/users.json';
import users_fr from './locales/fr/users.json';
import users_nl from './locales/nl/users.json';

// Calender Page JSON
import calendar_en from './locales/en/calendar.json';
import calendar_fr from './locales/fr/calendar.json';
import calendar_nl from './locales/nl/calendar.json';

// Support Page JSON
import support_en from './locales/en/support.json';
import support_fr from './locales/fr/support.json';
import support_nl from './locales/nl/support.json';

// 404 Not Found JSON
import notFound_en from './locales/en/notFound.json';
import notFound_fr from './locales/fr/notFound.json';
import notFound_nl from './locales/nl/notFound.json';

// Update Password JSON
import updatePassword_en from './locales/en/updatePassword.json';
import updatePassword_fr from './locales/fr/updatePassword.json';
import updatePassword_nl from './locales/nl/updatePassword.json';

// Single Ticket JSON
import singleTicket_en from './locales/en/singleTicket.json';
import singleTicket_fr from './locales/fr/singleTicket.json';
import singleTicket_nl from './locales/nl/singleTicket.json';

// Single Work Order JSON
import singleWorkOrder_en from './locales/en/singleWorkOrder.json';
import singleWorkOrder_fr from './locales/fr/singleWorkOrder.json';
import singleWorkOrder_nl from './locales/nl/singleWorkOrder.json';

// Single Equipment JSON
import singleEquipment_en from './locales/en/singleEquipment.json';
import singleEquipment_fr from './locales/fr/singleEquipment.json';
import singleEquipment_nl from './locales/nl/singleEquipment.json';

// Create Ticket JSON
import createTicket_en from './locales/en/createTicket.json';
import createTicket_fr from './locales/fr/createTicket.json';
import createTicket_nl from './locales/nl/createTicket.json';

// Documents Page JSON
import documents_en from './locales/en/documents.json';
import documents_fr from './locales/fr/documents.json';
import documents_nl from './locales/nl/documents.json';

const dynamicLang = localStorage.getItem('i18nextLng');

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        home: home_en,
        login: login_en,
        dashboard: dashboard_en,
        ticketList: ticketList_en,
        workOrderList: workOrderList_en,
        equipmentList: equipmentList_en,
        users: users_en,
        calendar: calendar_en,
        support: support_en,
        notFound: notFound_en,
        updatePassword: updatePassword_en,
        singleTicket: singleTicket_en,
        singleWorkOrder: singleWorkOrder_en,
        singleEquipment: singleEquipment_en,
        createTicket: createTicket_en,
        documents: documents_en,
      },
      fr: {
        home: home_fr,
        login: login_fr,
        dashboard: dashboard_fr,
        ticketList: ticketList_fr,
        workOrderList: workOrderList_fr,
        equipmentList: equipmentList_fr,
        users: users_fr,
        calendar: calendar_fr,
        support: support_fr,
        notFound: notFound_fr,
        updatePassword: updatePassword_fr,
        singleTicket: singleTicket_fr,
        singleWorkOrder: singleWorkOrder_fr,
        singleEquipment: singleEquipment_fr,
        createTicket: createTicket_fr,
        documents: documents_fr,
      },
      nl: {
        home: home_nl,
        login: login_nl,
        dashboard: dashboard_nl,
        ticketList: ticketList_nl,
        workOrderList: workOrderList_nl,
        equipmentList: equipmentList_nl,
        users: users_nl,
        calendar: calendar_nl,
        support: support_nl,
        notFound: notFound_nl,
        updatePassword: updatePassword_nl,
        singleTicket: singleTicket_nl,
        singleWorkOrder: singleWorkOrder_nl,
        singleEquipment: singleEquipment_nl,
        createTicket: createTicket_nl,
        documents: documents_nl,
      },
    },
    lng: dynamicLang,
    fallbackLng: 'en',
    ns: [
      'home',
      'login',
      'dashboard',
      'users',
      'ticketList',
      'workOrderList',
      'equipmentList',
      'calendar',
      'support',
      'notFound',
      'updatePassword',
      'singleTicket',
      'singleWorkOrder',
      'singleEquipment',
      'createTicket',
      'documents',
    ],
    defaultNS: 'home',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;