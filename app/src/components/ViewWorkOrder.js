import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { fetchDocuments } from '../services/apiServiceDocuments';
import { downloadFiles } from "../services/apiServiceDownloads";
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import { File, Eye, Phone, ArrowLeft, Circle, Wrench, User, MapPin, Image, Loader, Download } from "lucide-react";
import { useAuth } from '../AuthContext';
import { useTranslation } from "react-i18next";
import { setPrimaryTheme } from "../utils/setTheme";

const SingleWordOrder = () => {
  const navigate = useNavigate();
  const { auth } = useAuth();
  setPrimaryTheme(auth?.colorPrimary);
  const { workOrderId } = useParams();
  const [workOrder, setWorkOrder] = useState(null);
  const [doc, setDoc] = useState([]);
  const [subWO, setSubWO] = useState([]);
  const [planned, setPlanned] = useState([]);
  const [remarks, setRemarks] = useState([]);
  const [docsLoaded, setDocsLoaded] = useState(false);
  const [detailsLoaded, setDetailsLoaded] = useState(false);
  const [subLoaded, setSubLoaded] = useState(false);
  //const [file, setFile] = useState('');
  const [loading, setLoading] = useState(true);
  const [isURLLoading, setIsURLLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('details'); // State to manage active tab
  const [fileThumbnails, setFileThumbnails] = useState({});
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [downloadMsg, setDownloadMsg] = useState('');
  const { t } = useTranslation('singleWorkOrder');

  // Reset per-tab loaded flags when switching to a different work order
  useEffect(() => {
    setDocsLoaded(false);
    setDetailsLoaded(false);
    setSubLoaded(true);
    setDoc([]);
    setPlanned([]);
    setRemarks([]);
    setSubWO([]);
    setFileThumbnails({});
    setSelectedFiles([]);
  }, [workOrderId]);

  const url = process.env.REACT_APP_API_URL || 'https://servicedeskapi.wello.solutions/';

  const TableLoadingSkeleton = ({ rows = 5, columns = 6 }) => {
    return (
      <div className="overflow-x-auto animate-pulse">
        <div className="w-full table-auto border-collapse">
          <div className="grid grid-cols-6 bg-gray-100">
            {Array.from({ length: columns }).map((_, index) => (
              <div key={`head-${index}`} className="px-4 py-3">
                <div className="h-3 w-20 rounded bg-gray-300" />
              </div>
            ))}
          </div>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <div key={`row-${rowIndex}`} className="grid grid-cols-6 border-t">
              {Array.from({ length: columns }).map((__, colIndex) => (
                <div key={`cell-${rowIndex}-${colIndex}`} className="px-4 py-3">
                  <div className="h-3 w-40 rounded bg-gray-200" />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const statusColors = useMemo(() => ({
    "In Progress": "bg-yellow-100 text-yellow-600",
    "Planned": "bg-blue-100 text-blue-600",
    "Dispatched": "bg-violet-100 text-violet-600",
    "To be Planned": "bg-purple-100 text-purple-700",
    "In progress (W)": "bg-orange-100 text-orange-600",
    "Open": "bg-green-100 text-green-600",
    "Ready for Review": "bg-indigo-100 text-indigo-600",
    "Cancelled": "bg-red-100 text-red-600",
    "Completed": "bg-pink-100 text-pink-600",
  }), []);

  const statusDotColors = useMemo(() => ({
    "In Progress": "bg-yellow-600 text-yellow-600",
    "Planned": "bg-blue-600 text-blue-600",
    "Dispatched": "bg-violet-600 text-violet-600",
    "To be Planned": "bg-purple-600 text-purple-600",
    "In progress (W)": "bg-orange-600 text-orange-600",
    "Open": "bg-green-600 text-green-600",
    "Ready for Review": "bg-indigo-600 text-indigo-600",
    "Cancelled": "bg-red-600 text-red-600",
    "Completed": "bg-pink-600 text-pink-600",
  }), []);

  useEffect(() => {
    if (downloadMsg) {
      toast.success("Downloading!");
    }
  }, [downloadMsg]);

  useEffect(() => {
    const getworkOrderDetails = async () => {
      try {
        if (!workOrderId) {
          setError(t('single_work_order_page_err_no_ticket_id'));
          setLoading(false);
          return;
        }

        const endpoint = `api/JobsView(${workOrderId})`;
        const data = await fetchDocuments(endpoint, 'GET', auth.authKey);
        setWorkOrder(data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching workOrder details:", err);
        setError(t('single_work_order_page_err_failed_to_fetch_wo'));
        setLoading(false);
      }
    };

    // always load basic workOrder details (header/info)
    getworkOrderDetails();
  }, [workOrderId, auth, t]);

  // Load detailed info (planned + remarks) only when the details tab is active
  useEffect(() => {
    if (activeTab !== 'details' || detailsLoaded) return;

    const getworkOrderPlanned = async () => {
      try {
        const response = await fetchDocuments(`api/JobPlanningView?$filter=jobs_id eq ${workOrderId}&$orderby=date_from`);
        setPlanned(response.value);
      } catch (err) {
        console.error("Error fetching planned:", err);
        setError(t('single_work_order_page_err_failed_to_fetch_thumbnail'));
      }
    };

    const getworkOrderRemarks = async () => {
      try {
        const responseRemarks = await fetchDocuments(`api/JobsView/GetAllTechnicianRemarksOfJob?jobs_id=${workOrderId}`);
        setRemarks(responseRemarks || []);
      } catch (err) {
        console.error("Error fetching remarks:", err);
        setError(t('single_work_order_page_err_failed_to_fetch_thumbnail'));
      }
    };

    getworkOrderPlanned();
    getworkOrderRemarks();
    setDetailsLoaded(true);
  }, [activeTab, detailsLoaded, workOrderId, auth, t]);

  useEffect(() => {
    if (activeTab !== 'documents' || docsLoaded) return;

    const getworkOrderDoc = async () => {
      try {
        const endpoint_1 = `api/DbFileView?$filter=db_table_name+eq+%27jobs%27+and+id_in_table+eq+${workOrderId}`;
        const data_1 = await fetchDocuments(endpoint_1, 'GET', auth.authKey);
        setDoc(data_1.value);
        setDocsLoaded(true);
      } catch (err) {
        console.error("Error fetching documents:", err);
        setError(t('single_work_order_page_err_failed_to_fetch_document'));
      }
    };
    getworkOrderDoc();
  }, [workOrderId, auth, t, activeTab, docsLoaded]);

  useEffect(() => {
    if (activeTab !== 'sub-wo') return;

    const getworkOrderSub = async () => {
      try {
        const endpoint_2 = `api/JobsView?$filter=root_parent_id+eq+${workOrderId}+and+has_child+eq+false&$orderby=id2%20desc`;
        const data_2 = await fetchDocuments(endpoint_2, 'GET', auth.authKey);
        setSubWO(data_2.value);
        setSubLoaded(false);
      } catch (err) {
        console.error("Error fetching sub WO:", err);
        setError(t('single_work_order_page_err_failed_to_fetch_thumbnail'));
      }
    };

    getworkOrderSub();
  }, [workOrderId, auth, t, activeTab, subLoaded]);

  useEffect(() => {
    const GetFileThumbnails = async () => {
      try {
        if (!doc || doc.length === 0) return;

        const authKey = auth?.authKey;
        if (!authKey) return;

        const updatedThumbnails = {};

        await Promise.all(
          doc.map(async (item) => {
            if (!item.id) return;

            try {
              const endpoint = `api/DbFileView/GetFileThumbnail/?id=${item.id}&maxWidth=500&maxHeight=500`;

              // fetchDocuments returns blob when accept="image/png"
              const blob = await fetchDocuments(endpoint, "GET", authKey, null, "image/png");

              updatedThumbnails[item.id] = URL.createObjectURL(blob);
            } catch (err) {
              console.warn(`Failed to load thumbnail for ${item.id}:`, err);
              // Skip just this one
            }
          })
        );

        setFileThumbnails(updatedThumbnails);
      } catch (err) {
        console.error("Error fetching thumbnails:", err);
        setError(t("single_work_order_page_err_failed_to_fetch_thumbnail"));
      } finally {
        setLoading(false);
      }
    };


    if (activeTab === "documents") {
      GetFileThumbnails();
    }
  }, [doc, auth, activeTab, t]);


  const handleDownloadAll = async () => {
    await downloadFiles(url, auth.authKey, doc.map(d => d.id));
    setDownloadMsg("Downloading all files...");
  };

  const handleDownloadSelected = async () => {
    const ids = selectedFiles.map(f => f.id);

    let fallbackName = "download.zip";
    if (ids.length === 1) {
      const file = selectedFiles.find(f => f.id === ids[0]);
      if (file?.name) {
        fallbackName = file.name; // keep original filename if possible
      }
    }

    await downloadFiles(url, auth.authKey, ids, fallbackName);
    setDownloadMsg("Downloading selected files...");
  };

  const toggleFileSelection = (file) => {
    setSelectedFiles((prev) =>
      prev.some((f) => f.id === file.id)
        ? prev.filter((f) => f.id !== file.id)
        : [...prev, file]
    );
  };

  //// Function ////
  const openDocumentInNewTab = useCallback(async (id) => {
    if (!id || !auth?.authKey) return;

    setIsURLLoading(true); // Show loading overlay

    const endpoint = `api/DbFileView/View/?id=${id}`;
    try {
      const response = await fetchDocuments(
        endpoint,
        "GET",
        auth.authKey,
        null,
        "image/png"
      );

      if (response) {
        const blob = await response.blob?.() ?? response;
        const blobUrl = URL.createObjectURL(blob);
        window.open(blobUrl, '_blank', 'noopener,noreferrer');
      } else {
        console.error("Failed to fetch thumbnail:", response?.statusText);
      }
    } catch (error) {
      console.error("Error fetching document thumbnail:", error);
    } finally {
      setIsURLLoading(false); // Hide loading overlay
    }
  }, [auth?.authKey]);


  if (loading) {
    return <div className="flex w-full items-center justify-center h-screen">
      <div className="relative">
        <div className="w-20 h-20 border-purple-200 border-2 rounded-full"></div>
        <div className="w-20 h-20 border-purple-700 border-t-2 animate-spin rounded-full absolute left-0 top-0"></div>
      </div>
    </div>;
  }
  if (error) return <div className="text-center text-red-600">{error}</div>;

  return (
    <div className="mx-auto w-full p-1 md:p-4 bg-white">
      <div className='flex'>
        {/* Back Button */}
        <button
          onClick={() => {
            if (activeTab !== 'details') {
              setActiveTab('details');
            } else {
              navigate(-1);
            }
          }}
          className="flex items-center mb-6 font-semibold text-zinc-900 text-base"
        >
          <ArrowLeft className="mr-2 w-5 h-5" /> {t("single_work_order_page_go_back")}
        </button>
      </div>
      <div className='shadow-md rounded-lg p-2 md:p-8'>
        <h2 className="capitalize text-zinc-900 text-lg md:text-2xl font-semibold mb-4">{t("single_work_order_page_reference")}: {workOrder?.id2} | {workOrder?.name}</h2>
        {/* Tab Navigation */}
        <div className="flex space-x-4 mb-4">
          <button
            className={`px-2 md:px-4 py-2 mr-2 text-md md:text-lg font-medium leading-7 ${activeTab === 'details' ? 'text-gray-900 border-b-2 border-gray-900' : 'text-slate-500'}`}
            onClick={() => setActiveTab('details')}
          >
            {t("single_work_order_page_ticket_details")}
          </button>

          <button
            className={`px-2 md:px-4 py-2 mr-2 text-md md:text-lg font-medium leading-7 ${activeTab === 'documents' ? 'text-gray-900 border-b-2 border-gray-900' : 'text-slate-500'}`}
            onClick={() => setActiveTab('documents')}
          >
            {t("single_work_order_page_documents")}
          </button>
          {workOrder?.has_child && (
            <button
              className={`px-2 md:px-4 py-2 mr-2 text-md md:text-lg font-medium leading-7 ${activeTab === 'sub-wo' ? 'text-gray-900 border-b-2 border-gray-900' : 'text-slate-500'}`}
              onClick={() => setActiveTab('sub-wo')}
            >
              {t("single_work_order_page_sub_wo_list")}
            </button>
          )
          }
        </div>

        {activeTab === 'details' ? (
          <>
            <div className='grid grid-cols-1 md:grid-cols-[1fr_0.9fr_1.1fr] gap-4'>
              <div className='shadow-sm border rounded-lg p-4 '>
                <h4 className="block text-zinc-900 text-base font-semibold leading-normal pb-2">{t("single_work_order_page_equipment")}</h4>
                <ul className="list-none list-inside text-slate-500 text-base font-medium">
                  <li className='flex items-center'>
                    <span className="w-8 flex"><MapPin className='w-4 h-4 mr-2' /></span>
                    <span className="flex-1">{workOrder?.db_address_street}</span>
                  </li>
                  <li className='ml-8 pb-1'>{workOrder?.db_address_zip} {workOrder?.db_address_city}</li>
                  {workOrder?.contact_mobile && (
                    <li className='flex items-center'>
                      <span className="w-8 flex"><Phone className="w-4 h-4 mr-1" /></span>
                      <span className="flex-1"><a href={`tel:${workOrder.contact_mobile}`} className='no-underline'>{workOrder.contact_mobile}</a></span>
                    </li>
                  )}
                  {workOrder?.name && (
                    <li className='flex items-center' >
                      <span className="w-8 flex"><Wrench className='w-4 h-4 mr-2' /></span>
                      <span className="flex-1">{workOrder?.name}</span>
                    </li>
                  )}
                </ul>
              </div>

              <div className='shadow-sm border rounded-lg p-4 '>
                <h4 className="block text-zinc-900 text-base font-semibold leading-normal pb-2">{t("single_work_order_page_contact")}</h4>
                <ul className="list-none list-inside text-slate-500 text-base font-medium">
                  {workOrder?.contact_fullname && (
                    <li className='flex items-center'><User className='w-4 h-4 mr-2' />{workOrder?.contact_fullname}</li>
                  )}
                  {workOrder?.contact_phone && (
                    <li className='flex items-center'>
                      <Phone className="w-4 h-4 mr-2" /> <a href={`tel:${workOrder.contact_phone}`} className='no-underline'>{workOrder.contact_phone}</a>
                    </li>
                  )}
                </ul>
              </div>

              <div className='shadow-sm border rounded-lg p-4 '>
                <h4 className="block text-zinc-900 text-base font-semibold leading-normal pb-2">{t("single_work_order_page_sla_info")}</h4>
                <ul className="list-none list-inside text-slate-500 text-base font-medium">
                  <li className="grid grid-cols-2 gap-2">
                    <span>{t("single_work_order_page_response_time")}</span>
                    <span>
                      {workOrder?.dateutc_max_sla_resolution &&
                        new Date(workOrder.dateutc_max_sla_resolution).getFullYear() !== 1980
                        ? new Date(workOrder.dateutc_max_sla_resolution).toLocaleString("en-GB", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                        : "N/A"}
                    </span>
                  </li>
                  <li className='grid grid-cols-2 gap-2'><span>{t("single_work_order_page_arrival_time")}</span> <span>{
                    new Date(workOrder?.dateutc_max_sla_contact).getFullYear() !== 1980
                      ? new Date(workOrder?.dateutc_max_sla_contact).toLocaleDateString({
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                      : 'N/A'
                  }</span></li>
                  <li className='grid grid-cols-2 gap-2'><span>{t("single_work_order_page_resolution_time")}</span> <span>{
                    new Date(workOrder?.dateutc_max_sla_contact).getFullYear() !== 1980
                      ? new Date(workOrder?.dateutc_max_sla_contact).toLocaleDateString({
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                      : <span className='text-red-500'>SLA exceeded</span>
                  }</span></li>
                </ul>
              </div>

              <div className='shadow-sm border rounded-lg p-4 '>
                <h4 className="block text-zinc-900 text-base font-semibold leading-normal pb-2">{t("single_work_order_page_priority")}</h4>
                <ul className="list-none list-inside text-slate-500 text-base font-medium">
                  <li>{workOrder?.job_priority_name}</li>
                </ul>
              </div>

              <div className='shadow-sm border rounded-lg p-4 '>
                <h4 className="block text-zinc-900 text-base font-semibold leading-normal pb-2">{t("single_work_order_page_type_status")}</h4>
                <ul className="list-none list-inside text-slate-500 text-base font-medium">
                  <li>
                    {workOrder?.job_type_name}
                  </li>
                  <li className='mt-2.5'>
                    <span className={`pe-3 px-2 pb-1 pt-0.5 rounded-full ${statusColors[workOrder?.job_status_name] || "bg-gray-200 text-gray-800"}`}>
                      <Circle className={`inline w-2 h-2 mr-1 rounded-full ${statusDotColors[workOrder?.job_status_name] || "bg-gray-800 text-gray-800"}`} />
                      {workOrder?.job_status_name}
                    </span>
                  </li>
                </ul>
              </div>

              <div className='shadow-sm border rounded-lg p-4 '>
                <h4 className="block text-zinc-900 text-base font-semibold leading-normal pb-2">{t("single_work_order_page_total_planned_time")}</h4>
                <ul className="list-none list-inside text-slate-500 text-base font-medium">
                  <li>{Math.floor(workOrder?.total_time_planned / 60).toString().padStart(2, '0')}{t("single_work_order_page_total_planned_time_h")} {(workOrder?.total_time_planned % 60).toString().padStart(2, '0')}{t("single_work_order_page_total_planned_time_m")}</li>
                </ul>
              </div>
            </div>

            <div className='shadow-sm border rounded-lg p-4 mt-4'>
              {planned.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="border-b-2">
                      <tr>
                        <th className="px-4 py-2 text-left text-zinc-900 text-base font-semibold leading-normal">
                          {t("single_work_order_page_planned_date")}
                        </th>
                        <th className="px-4 py-2 text-left text-zinc-900 text-base font-semibold leading-normal">
                          {t("single_work_order_page_planned_by")}
                        </th>
                        <th className="px-4 py-2 text-left text-zinc-900 text-base font-semibold leading-normal">
                          {t("single_work_order_page_planned_duration")}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {planned.map((item, idx) => (
                        <tr key={item?.id ?? `planned-${idx}`} className="hover:bg-primary/50 hover:text-primary-foreground transition-colors duration-200 ease-in-out">
                          <td className="px-4 py-2 text-base font-medium">
                            {(() => {
                              const date = new Date(item.date_from);
                              return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear().toString().slice(-2)}`;
                            })()}
                          </td>

                          <td className="px-4 py-2 text-base font-medium">
                            {new Date(item.date_from).toLocaleTimeString('en-GB', {
                              timeZone: 'UTC',
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: false,
                            })} {item.user_firstname || ''} {item.user_lastname || ''}
                          </td>

                          <td className="px-4 py-2 text-base font-medium">
                            {(() => {
                              const closed = new Date(item.date_to);
                              const created = new Date(item.date_from);
                              const diffMs = closed - created;

                              const totalMinutes = Math.floor(diffMs / (1000 * 60));
                              const hours = Math.floor(totalMinutes / 60);
                              const minutes = totalMinutes % 60;

                              return `${hours}${t("single_work_order_page_total_planned_time_h")} ${minutes}${t("single_work_order_page_total_planned_time_m")}`;
                            })()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-slate-500 text-base font-medium">{t("single_work_order_page_no_record")}</p>
              )}
            </div>

            <div className='shadow-sm border rounded-lg p-4 mt-4'>
              <h4 className="block text-zinc-900 text-base font-semibold leading-normal pb-2">{t("single_work_order_page_description")}</h4>
              {workOrder.description ? (<p className="mb-4 text-slate-500 text-base font-medium">{workOrder.description}</p>) : (<p className="mb-4 text-slate-500 text-base font-medium">{t("single_work_order_page_no_description")}</p>)}
            </div>
            {workOrder?.nb_notes > 0 && <div className='shadow-sm border rounded-lg p-4 mt-4'>
              <h4 className="block text-zinc-900 text-base font-semibold leading-normal pb-2">{t("Technician Remarks")}</h4>
              {Array.isArray(remarks) && remarks.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <tbody className="bg-white divide-y divide-gray-200">
                      {remarks.map((item, idx) => (
                        <tr key={item?.id ?? `remark-${idx}`} className="hover:bg-primary/50 hover:text-primary-foreground transition-colors duration-200 ease-in-out">
                          <td className="px-4 py-2 text-base font-medium">
                            {new Date(item.date_add).toLocaleDateString('en-GB', {
                              day: '2-digit',
                              month: '2-digit',
                              year: '2-digit',
                            })}
                          </td>

                          <td className="px-4 py-2 text-base font-medium">
                            {item.user_fullname || ' '}
                          </td>

                          <td className="px-4 py-2 text-base font-medium">
                            {item.notes}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : ''}
            </div>}
          </>
        ) : activeTab === 'documents' ? (
          <div className=''>
            <ToastContainer
              position="bottom-right"
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
            {
              isURLLoading && (
                <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-white/10">
                  <div className="text-white text-lg font-semibold animate-pulse">
                    <Loader className="w-20 h-20 ml-2 text-blue-600 animate-spin" />
                  </div>
                </div>
              )
            }
            {doc?.length > 0 ? (
              <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
                {doc.map(item => (
                  <div key={item.id} className="p-2 flex flex-col border rounded-lg shadow-md">
                    <div className='flex flex-col items-center'>
                      {/* Show image thumbnail if it's an image, otherwise show file icon */}
                      {item.mime_type?.startsWith("image/") ? (
                        fileThumbnails[item.id] ? (
                          <img
                            src={fileThumbnails[item.id]}
                            alt={item.name}
                            className="w-full h-40 md:h-48 object-cover rounded-md mx-auto"
                          />
                        ) : (
                          <div className="relative w-40 md:w-48 h-40 md:h-48 flex items-center justify-center mx-auto bg-gray-100 rounded-md">
                            {/* Loading overlay */}
                            <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-70 z-10">
                              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-gray-500"></div>
                            </div>

                            {/* Fallback icon */}
                            <Image className="w-20 h-20 text-gray-300" />
                          </div>
                        )
                      ) : (
                        <File className="w-40 md:w-48 h-40 md:h-48 text-gray-600 mx-auto" />
                      )}
                    </div>
                    <div className='flex flex-col'>
                      <h4 className="text-gray-500 text-base py-1 break-words">{item.name}</h4>

                      <p className="text-gray-500 text-base">{new Date(item.date_add).toLocaleString('en-GB', {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: false,
                      })}</p>

                      {item.file_name ? (
                        <label className="mt-2 flex space-x-2 items-start text-base">
                          <input
                            type="checkbox"
                            onChange={() => toggleFileSelection(item)}
                            checked={selectedFiles.some((file) => file.id === item.id)}
                            className='mt-1'
                          /><span>{t("single_work_order_page_select_to_download")}</span>
                        </label>) : null}

                      {/* Show "View Document" only if it's an image */}
                      {item.mime_type?.startsWith("image/") ? (
                        <button
                          target="_blank"
                          rel={item.mime_type?.startsWith("image/") ? "noopener noreferrer" : "noreferrer"}
                          className={`flex items-center no-underline mt-2 text-base ${fileThumbnails[item.id] ? "hover:underline" : "cursor-not-allowed pointer-events-none"
                            }`}
                          onClick={() => openDocumentInNewTab(item.id)}
                        >
                          <Eye className="w-6 h-6 mr-2 text-gray-600" />
                          {t("single_work_order_page_view_document")}
                        </button>
                      ) : (
                        <button
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center no-underline mt-2 text-base hover:underline"
                          onClick={() => openDocumentInNewTab(item.id)}
                        >
                          <Eye className="w-6 h-6 mr-2 text-gray-600" />
                          {t("single_work_order_page_view_document")}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (<p className="text-gray-800 p-4 font-semibold">{t("single_work_order_page_no_document")}</p>)
            }
            {!fileThumbnails && (!doc || doc.length === 0) && (
              <p className="text-gray-400 p-4 text-center">{t("single_work_order_page_no_document")}</p>
            )}
            {doc.length > 0 && (
              <div className='flex justify-end mt-4'>
                {selectedFiles.length !== 0 && (
                  <button
                    onClick={handleDownloadSelected}
                    className="w-48 px-4 py-2 bg-primary border border-2 border-primary rounded-lg flex items-center justify-center text-primary-foreground text-base font-medium leading-normal hover:bg-primary/20 hover:text-primary hover:shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)]">
                    {t("single_work_order_page_download_button")} <Download className="ml-2 w-6 h-5" />
                  </button>)}
                <button
                  onClick={handleDownloadAll}
                  className="w-48 px-4 py-2 ml-2 bg-primary-foreground border border-2 border-primary rounded-lg flex items-center justify-center text-primary text-base font-medium leading-normal hover:bg-primary/20 hover:text-primary hover:shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)]">
                  {t("single_work_order_page_download_all_button")} <Download className="ml-2 w-6 h-5" />
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 border border-gray-300">
                <thead className="bg-gray-100">
                  <tr className="bg-white divide-x divide-gray-300">
                    <th className="p-2 whitespace-nowrap text-left text-slate-500 text-base font-medium leading-none">
                      {t("single_work_order_page_sub_wo_status")}
                    </th>
                    <th className="p-2 whitespace-nowrap text-left text-slate-500 text-base font-medium leading-none">
                      {t("single_work_order_page_sub_wo_name")}
                    </th>
                    <th className="p-2 whitespace-nowrap text-left text-slate-500 text-base font-medium leading-none">
                      {t("single_work_order_page_sub_wo_reference")}
                    </th>
                    <th className="p-2 whitespace-nowrap text-left text-slate-500 text-base font-medium leading-none">
                      {t("single_work_order_page_sub_wo_type")}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {subWO.map((item) => (
                      <tr key={item.id} className="hover:bg-primary/50 hover:text-primary-foreground transition-colors duration-200 ease-in-out">
                        <td className="self-stretch p-2 text-base font-normal whitespace-nowrap">
                          {item.job_status_name}
                        </td>
                        <td className="self-stretch p-2 text-base font-normal whitespace-nowrap">
                          {item.project_name}
                        </td>
                        <td className="self-stretch p-2 text-base font-normal whitespace-nowrap">
                          {item.job_reference}
                        </td>
                        <td className="self-stretch p-2 text-base font-normal whitespace-nowrap">
                          {item.job_type_name}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
              {subLoaded && (
                <TableLoadingSkeleton rows={8} columns={5} />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SingleWordOrder;