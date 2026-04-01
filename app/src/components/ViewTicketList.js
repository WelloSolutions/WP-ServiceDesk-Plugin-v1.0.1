import React, { useMemo, useState, useEffect } from 'react';
import { useTable, useSortBy, usePagination } from 'react-table';
//import { fetchData } from '../services/apiService.js';
import { fetchDocuments } from '../services/apiServiceDocuments.js';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { BadgeInfo, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, ArrowLeftToLine, ArrowRightToLine, Circle } from 'lucide-react';
import { useTranslation } from "react-i18next";
import { setPrimaryTheme } from "../utils/setTheme";

const ViewTicketList = () => {
  const navigate = useNavigate();
  const { auth } = useAuth();
  setPrimaryTheme(auth?.colorPrimary);
  const [tickets, setTickets] = useState([]);
  const [ticketsStatus, setTicketsStatus] = useState([]);
  const [ticketsType, setTicketsType] = useState([]);
  const [translationsLoaded, setTranslationsLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isArchived, setIsArchived] = useState(false);
  const [error, setError] = useState(null);
  const [selectedTab, setSelectedTab] = useState('open');
  const { t, i18n } = useTranslation('ticketList');

  useEffect(() => {
    if (translationsLoaded) return;

    const fetchStatusTranslations = async () => {
      const response = await fetchDocuments('api/TaskStatus/Translations', 'GET', auth.authKey);
      setTicketsStatus(response);
      //console.log('Task Status Translations:', response);
    };
    const fetchTypeTranslations = async () => {
      const response = await fetchDocuments('api/TaskType/Translations', 'GET', auth.authKey);
      setTicketsType(response);
      //console.log('Task Type Translations:', response);
    };
    fetchStatusTranslations();
    fetchTypeTranslations();
    setTranslationsLoaded(true);
  }, [auth, translationsLoaded]);

  const statusTicket = useMemo(() => ({
    "bb68d95e-1706-486b-b282-2ba7bede3ea6": {
      "name": "Credit Blocked",
      "statusColors": "bg-purple-100 text-purple-600",
      "statusDotColors": "bg-purple-600 text-purple-600",
    },
    "b6eccbf1-26c3-4f95-9b20-f2ebabd6bd00": {
      "name": "Credit Released",
      "statusColors": "bg-purple-100 text-purple-600",
      "statusDotColors": "bg-purple-600 text-purple-600",
    },
    "4c1a28dc-e213-429d-bbd0-2595814ca9fc": {
      "name": "In progress",
      "statusColors": "bg-yellow-100 text-yellow-600",
      "statusDotColors": "bg-yellow-600 text-yellow-600",
    },
    "0d738f35-d5e2-4065-8639-a41202531c96": {
      "name": "Pre-diagnose",
      "statusColors": "bg-blue-100 text-blue-600",
      "statusDotColors": "bg-blue-600 text-blue-600",
    },
    "8b9d1c19-bb96-4e1c-8b32-4b433d0d1a62": {
      "name": "Quote/Order",
      "statusColors": "bg-green-100 text-green-600",
      "statusDotColors": "bg-green-600 text-green-600",
    },
    "d106c501-9b89-4a2a-886b-f0bee640045a": {
      "name": "Waiting for Parts",
      "statusColors": "bg-indigo-100 text-indigo-600",
      "statusDotColors": "bg-indigo-600 text-indigo-600",
    },
    "df41bd97-ea7e-412f-bdfe-8f97f783e08d": {
      "name": "Waiting for Customer",
      "statusColors": "bg-indigo-100 text-indigo-600",
      "statusDotColors": "bg-indigo-600 text-indigo-600",
    },
    "6bfec05d-f2c3-47c5-bea1-5d264503f337": {
      "name": "Canceled",
      "statusColors": "bg-red-100 text-red-600",
      "statusDotColors": "bg-red-600 text-red-600",
    },
    "461748f9-1c99-47b9-9456-880054ec4ce2": {
      "name": "Completed",
      "statusColors": "bg-pink-100 text-pink-600",
      "statusDotColors": "bg-pink-600 text-pink-600",
    },
    "9a33634d-eb69-42fc-aaee-96f3296f4f40": {
      "name": "Escalated to WO",
      "statusColors": "bg-orange-100 text-orange-600",
      "statusDotColors": "bg-orange-600 text-orange-600",
    },
    "e06515b5-b8c0-4529-befa-84dc7f23c25a": {
      "name": "Verzending transport",
      "statusColors": "bg-green-100 text-green-600",
      "statusDotColors": "bg-green-600 text-green-600",
    },
  }), []);

  useEffect(() => {
    const fetchTickets = async (archivedStatus, startRow = 0, endRow = 500) => {
      setIsLoading(true);
      try {
        const payload = {
          "period": "",
          "archived": archivedStatus,
          "query_object":
          {
            "startRow": startRow || 0,
            "endRow": endRow || 500,
            "rowGroupCols": [],
            "valueCols": [],
            "pivotCols": [],
            "pivotMode": false,
            "groupKeys": [],
            "filterModel": {},
            "sortModel": []
          }
        }
        const response = await fetchDocuments('api/TaskView/Search', 'POST', auth.authKey, payload);
        setTickets(response); // Adjusted for your API's response structure
        setLoading(false);
      } catch (err) {
        setError(err);
        setLoading(false);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTickets(isArchived);
  }, [isArchived, auth]);

  const columns = useMemo(
    () => [
      {
        Header: t('tickets_list_table_heading_reference_text'),
        accessor: 'id2',
        Cell: ({ row }) => (
          <div className="text-center">
            <span className="font-medium">
              {row.original.id2}
            </span></div>
        ),
      },
      {
        Header: t('tickets_list_table_heading_created_date_text'), accessor: 'date_create',
        Cell: ({ value }) => new Date(value).toLocaleDateString("en-GB")
      },
      {
        Header: t('tickets_list_table_heading_name_text'), accessor: 'subject',
        Cell: ({ value }) => (
          <span>
          {value.length > 30 ? value.slice(0, 50) + '...' : value}
          </span>
        ),
      },
      {
        Header: t('tickets_list_table_heading_assigned_name_text'), accessor: 'assigned_to_user_fullname',
        Cell: ({ row }) => (
          row.original.assigned_to_user_fullname?.trim() ? row.original.assigned_to_user_fullname : 'Not Assigned'
        ),
      },
      {
        Header: t('tickets_list_table_heading_type_text'), accessor: 'task_type_name',
        Cell: ({ row }) => (
          <span className={`text-base font-medium`}>
            {
              ticketsType.find(t => t.id === row.original.task_type_id)?.translations
                ?.find(t => t.language_code === i18n.language.split("-")[0].toUpperCase())?.value
              ?? ticketsType.find(t => t.id === row.original.task_type_id)?.name
              ?? row.original.task_type_name
            }
          </span>
        ),
      },
      {
        Header: t('tickets_list_table_heading_status_text'), accessor: 'task_status_name',
        Cell: ({ row }) => (
          <span className={`text-base min-w-max inline-flex items-center font-medium pe-3 px-2 pb-1 pt-1 rounded-full ${statusTicket[row.original.task_status_id]?.statusColors || "bg-gray-200 text-gray-800"}`}>
            <Circle className={`inline w-2 h-2 mr-1 rounded-full ${statusTicket[row.original.task_status_id]?.statusDotColors || "bg-gray-800 text-gray-800"}`} /> {row.original.project_status_name}
            {
              ticketsStatus.find(t => t.id === row.original.task_status_id)?.translations
                ?.find(t => t.language_code === i18n.language.split("-")[0].toUpperCase())?.value
              ?? ticketsStatus.find(t => t.id === row.original.task_status_id)?.name
              ?? row.original.task_status_name
            }
          </span>
        ),
      },
    ],
    [ticketsType, ticketsStatus, statusTicket, t, i18n]
  );

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    page, // Use page instead of rows for pagination
    prepareRow,
    canPreviousPage,
    canNextPage,
    pageOptions,
    gotoPage,
    nextPage,
    previousPage,
    setPageSize,
    state: { pageIndex, pageSize },
  } = useTable(
    {
      columns,
      data: tickets,
      initialState: { pageIndex: 0, pageSize: 12 }, // Set initial page size to 10
    },
    useSortBy,
    usePagination
  );

  if (loading) {
    return <div className="flex w-full items-center justify-center h-screen">
      <div className="relative">
        <div className="w-20 h-20 border-purple-200 border-2 rounded-full"></div>
        <div className="w-20 h-20 border-purple-700 border-t-2 animate-spin rounded-full absolute left-0 top-0"></div>
      </div>
    </div>;
  }

  if (error) {
    return <div className="text-center mt-10 text-red-600">Error fetching tickets: {error.message}</div>;
  }

  return (
    <div className="w-full mx-auto p-1 md:p-4">
      <h1 className="text-zinc-900 text-3xl font-semibold mb-6">{t("tickets_list_page_title")}</h1>

      {/* Back Button */}
      <button
        onClick={() => navigate('/')} // Navigate back one step in history
        className="flex items-center mb-6 font-semibold text-zinc-900 text-base"
      >
        <ArrowLeft className="mr-2 w-5 h-5" /> {t("tickets_list_page_go_back")}
      </button>

      <div className='shadow-md rounded-lg'>
        <div className="flex text-lg mb-4">
          <button
            className={`px-4 py-2 mr-2 font-semibold leading-7 ${selectedTab === 'open' ? 'text-gray-900 border-b-2 border-zinc-800' : 'text-slate-500'}`}
            onClick={() => { setSelectedTab('open'); setIsArchived(false); }}
          >
            {t("tickets_list_toggle_open_tickets_text")}
          </button>
          <button
            className={`px-4 py-2 font-semibold leading-7 ${selectedTab === 'completed' ? 'text-gray-900 border-b-2 border-zinc-800' : 'text-slate-500'}`}
            onClick={() => { setSelectedTab('completed'); setIsArchived(true); }}
          >
            {t("tickets_list_toggle_completed_tickets_text")}
          </button>
        </div>

        <div className="bg-blue-100 flex items-center text-blue-500 text-base font-normal px-4 py-1 mb-2 rounded-lg">
          <BadgeInfo className='mr-2 w-5 h-5 text-blue-500' /> {t("tickets_list_page_helping_text")}
        </div>
        <div className="overflow-x-auto">
          <table {...getTableProps()} className="min-w-full divide-y divide-gray-200 border border-gray-300">
            <thead className="bg-white">
              {headerGroups.map((headerGroup, hgIdx) => {
                const headerGroupProps = headerGroup.getHeaderGroupProps();
                const { key: headerGroupKey, ...restHeaderGroupProps } = headerGroupProps;
                return (
                  <tr key={headerGroupKey || hgIdx} {...restHeaderGroupProps} className="bg-white divide-x divide-gray-300">
                    {headerGroup.headers.map((column, colIdx) => {
                      const headerProps = column.getHeaderProps(column.getSortByToggleProps());
                      const { key: headerKey, ...restHeaderProps } = headerProps;
                      return (
                        <th key={headerKey || colIdx} {...restHeaderProps}
                          className="p-2 whitespace-nowrap text-slate-500 text-base font-medium leading-none">
                          {column.render('Header')}
                          {column.isSorted ? (
                            column.isSortedDesc ? (
                              <ArrowDown className="inline w-4 h-4 ml-1" />
                            ) : (
                              <ArrowUp className="inline w-4 h-4 ml-1" />
                            )
                          ) : null}
                        </th>
                      );
                    })}
                  </tr>
                );
              })}
            </thead>
            <tbody {...getTableBodyProps()} className="bg-white divide-y divide-gray-200">
              {!isLoading &&
                page.map((row, rowIdx) => {
                  prepareRow(row);
                  const rowProps = row.getRowProps();
                  const { key: rowKey, ...restRowProps } = rowProps;
                  return (
                    <tr key={rowKey || row.original.id || rowIdx} {...restRowProps}
                      className="cursor-pointer hover:bg-primary/50 hover:text-primary-foreground transition-colors duration-200 ease-in-out"
                      onClick={() => window.open(`${window.location.origin}/service-desk/ticket/${row.original.id}`, "_blank")}>
                      {row.cells.map((cell, cellIdx) => {
                        const cellProps = cell.getCellProps();
                        const { key: cellKey, ...restCellProps } = cellProps;
                        return (
                          <td key={cellKey || cellIdx} {...restCellProps} className="self-stretch px-1 py-2 text-base font-normal">
                            {cell.render('Cell')}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        {isLoading && (
          <div className="ml-2 space-y-2 p-2">
            <div className="h-6 bg-gray-200 rounded animate-pulse w-64"></div>
            <div className="h-6 bg-gray-200 rounded animate-pulse w-40"></div>
          </div>
        )}

        {/* Pagination Controls - Only show if filteredTickets exceed pageSize (10) */}
        {!isLoading && tickets.length > 12 && (
          <div className="flex items-center justify-between p-4">
            <span className="text-base text-slate-700">
              {t("ticket_list_table_pagination_page")} {pageIndex + 1} {t("ticket_list_table_pagination_of")} {pageOptions.length}
            </span>
            <div>
              <button onClick={() => gotoPage(0)} disabled={!canPreviousPage} className="py-0.5 px-1 md:px-2 mr-1 text-primary rounded-md border border-primary disabled:opacity-50">
                <ArrowLeftToLine className="w-4" />
              </button>
              <button onClick={() => previousPage()} disabled={!canPreviousPage} className="py-0.5 px-1 md:px-2 mr-1 text-primary rounded-md border border-primary disabled:opacity-50">
                <ArrowLeft className="w-4" />
              </button>
              <button onClick={() => nextPage()} disabled={!canNextPage} className="py-0.5 px-1 md:px-2 mr-1 text-primary rounded-md border border-primary disabled:opacity-50">
                <ArrowRight className="w-4" />
              </button>
              <button onClick={() => gotoPage(pageOptions.length - 1)} disabled={!canNextPage} className="py-0.5 px-1 md:px-2 mr-1 text-primary rounded-md border border-primary disabled:opacity-50">
                <ArrowRightToLine className="w-4" />
              </button>
            </div>
            <select name="table_pagination" id="table_pagination" value={pageSize} onChange={e => setPageSize(Number(e.target.value))} className="ml-1 p-1 md:p-1 text-base text-slate-700 border border-slate-700 rounded-md max-w-32">
              {[12, 24, 36, 48].map(size => (
                <option key={size} value={size}>
                  {t("ticket_list_table_pagination_show")} {size}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewTicketList;