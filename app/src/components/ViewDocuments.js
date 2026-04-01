import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { useTable, useSortBy, usePagination } from 'react-table';
import { fetchDocuments } from '../services/apiServiceDocuments.js';
import { downloadFiles } from "../services/apiServiceDownloads";
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import {
  File, Eye, Download, BadgeInfo, ArrowUp, ArrowDown, ArrowLeft, ArrowLeftToLine, ArrowRight, ArrowRightToLine,
  LayoutGrid, Table, Type, MapPin, Milestone, Building, Calendar, FileText, Wrench, Image, Loader
} from 'lucide-react';
import { ToastContainer, toast } from 'react-toastify';
import { useAuth } from '../AuthContext.js';
import { useTranslation } from "react-i18next";
import { setPrimaryTheme } from "../utils/setTheme";

import Select from 'react-select';
import makeAnimated from 'react-select/animated';
const animatedComponents = makeAnimated();

const url = process.env.REACT_APP_API_URL || 'https://servicedeskapi.wello.solutions/';

const ViewDocuments = () => {
  const navigate = useNavigate();
  const { auth } = useAuth();
  setPrimaryTheme(auth?.colorPrimary);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [thumbnailLoading, setThumbnailLoading] = useState({});
  const [isURLLoading, setIsURLLoading] = useState(false);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('table');

  const [fileThumbnails, setFileThumbnails] = useState({});

  const [allLocations, setAllLocations] = useState([]);
  const [locationHints, setLocationHints] = useState([]);

  const EmptyGuid = "00000000-0000-0000-0000-000000000000";

  const [filters, setFilters] = useState({
    location: "",
    locationLabel: "",
    keyword: "",
    brand: EmptyGuid,
    model: EmptyGuid,
    status: EmptyGuid,
    includeArchived: false
  });

  const [tempFilters, setTempFilters] = useState(filters);

  const [downloadMsg, setDownloadMsg] = useState('');
  const { t } = useTranslation('documents');

  const [gridPageIndex, setGridPageIndex] = useState(0);
  const [gridPageSize, setGridPageSize] = useState(12);

  const gridPageCount = Math.ceil(contacts.length / gridPageSize);
  const gridPageOptions = Array.from({ length: gridPageCount }, (_, i) => i);

  const gotoGridPage = (page) => {
    setGridPageIndex(Math.max(0, Math.min(page, gridPageCount - 1)));
  };

  const previousGridPage = () => {
    if (gridPageIndex > 0) setGridPageIndex(gridPageIndex - 1);
  };

  const nextGridPage = () => {
    if (gridPageIndex < gridPageCount - 1) setGridPageIndex(gridPageIndex + 1);
  };

  const canGridPreviousPage = gridPageIndex > 0;
  const canGridNextPage = gridPageIndex < gridPageCount - 1;

  const paginatedContacts = contacts.slice(
    gridPageIndex * gridPageSize,
    gridPageIndex * gridPageSize + gridPageSize
  );

  const fileTypesOptions = [
    { value: "documents", label: "Documents", extentions: ["DOC", "DOCX"] },
    { value: "pdf", label: "PDF", extentions: ["PDF"] },
    { value: "formpdf", label: "Form PDF", extentions: ["FORM_PDF"] },
    { value: "approvalpdf", label: "Approval PDF", extentions: ["APPROVAL_PDF"] },
    { value: "sheet", label: "Sheet XLS", extentions: ["XLS", "XLSX", "CSV"] },
    { value: "text", label: "Text", extentions: ["TXT", "CSV"] },
    { value: "image", label: "Images", extentions: ["JPG", "PNG", "JPEG", "BMP", "TIFF", "GIF", "TGA"] },
    { value: "presentation", label: "Presentation", extentions: ["PPT", "PPTX"] },
    { value: "other", label: "Other", extentions: [] }
  ];

  const uniqueDates = [
    { value: '2026', label: "2026" },
    { value: '2025', label: "2025" },
    { value: '2024', label: "2024" },
    { value: '2023', label: "2023" },
    { value: '2022', label: "2022" },
    { value: '2021', label: "2021" },
    { value: '2020', label: "2020" },
    { value: '2019', label: "2019" }
  ];

  const uniqueObjects = [
    { value: "you", label: "Uploaded By You" },
    { value: "company", label: "Company" },
    { value: "task", label: "Task" },
    { value: "jobs", label: "Work Orders" },
    { value: "project", label: "Equipment" }
  ];

  const getTimestamp = () => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}_${hh}${min}`;
  };


  // Search Filter states
  const [keyword, setKeyword] = useState('');
  //const [location, setLocation] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [date, setDate] = useState([uniqueDates[0]]);
  const [fileType, setFileType] = useState(fileTypesOptions);
  const [object, setObject] = useState(uniqueObjects);
  const [selectedFiles, setSelectedFiles] = useState([]);

  useEffect(() => {
    setLoading(true)
  }, []);


  useEffect(() => {
    if (downloadMsg) {
      toast.success("Downloading!");
    }
  }, [downloadMsg]);

  const fetchProjects = useCallback(
    async ({ parentOnly, groupKeys = [], parentId = null }) => {
      const url = `api/ProjectView/Search?keyword=&projectReference=&projectReferenceBackOffice=&companyID=${EmptyGuid}&equipmentModelID=${EmptyGuid}&equipmentBrandID=${EmptyGuid}&equipmentFamilyID=${EmptyGuid}&projectStatusID=${EmptyGuid}&createdFrom=1980-01-01T00:00:00.000&createdTo=1980-01-01T00:00:00.000&includesClosed=false&parentOnly=${parentOnly}&contactId=${auth.userId}&rootParentId=${EmptyGuid}&includeLocation=true`;

      const payload = {
        startRow: 0,
        endRow: 500,
        rowGroupCols: [],
        valueCols: [],
        pivotCols: [],
        pivotMode: false,
        groupKeys,
        filterModel: {},
        sortModel: []
      };

      try {
        const response = await fetchDocuments(url, 'POST', auth.authKey, payload);
        const mapped = response.map(item => ({
          ...item,
          subRows: item.has_child ? [] : []
        }));
        return await mapped;
      } catch (err) {
        console.error(err);
        setError(err);
      } finally {
        setLoading(false);
      }
    },
    [auth]
  );

  useEffect(() => {
    const loadLocations = async () => {
      try {
        const projects = await fetchProjects({ parentOnly: true });

        const locations = Array.isArray(projects)
          ? [
            ...new Map(
              projects.map(p => {
                const name = p.name ? `${p.name} -` : '';
                const street = p.db_address_street || '';
                const streetNumber = p.db_address_street_number || '';
                const zip = p.db_address_zip || '';
                const city = p.db_address_city || '';

                const label = [name, street, streetNumber, zip, city]
                  .filter(Boolean)
                  .join(' ');

                return [p.id, { id: p.id, label }];
              })
            ).values(),
          ]
          : [];

        setAllLocations(locations); // locations: Array<{ id, label }>
      } catch (err) {
        console.error('Failed to fetch locations', err);
      }
    };

    loadLocations();
  }, [fetchProjects]);

  const handleLocationChange = (e) => {
    const value = e.target.value;
    setTempFilters(prev => ({ ...prev, locationLabel: value }));

    if (value.length >= 3) {
      const filtered = allLocations.filter(loc =>
        loc.label.toLowerCase().includes(value.toLowerCase())
      );
      setLocationHints(filtered);
    } else {
      setLocationHints([]);
    }
  };

  const handleHintClick = (hint) => {
    setTempFilters(prev => ({
      ...prev,
      location: hint.id,         // ✅ store ID
      locationLabel: hint.label  // show label in input
    }));
    setLocationHints([]);
  };


  const fetchDocumentsData = async (filters) => {
    try {
      const payload = {
        keyword: keyword,
        file_types: fileType.map((type) => type.value),
        project_id: filters.location || EmptyGuid,
        db_report_type_ids: [],
        street: street || '',
        city: city || '',
        added_date: date.length ? date.map((d) => d.value) : date.value,
        object_list: object.map((obj) => obj.value) || [
          "company",
          "task",
          "jobs",
          "project",
          "you"
        ],
        file_extentions: fileType.reduce((acc, type) => acc.concat(type.extentions), []),
        file_extentions_not_in: [],
        date_add_min: `${date.length ? date.map((d) => d.value) : date.value}-01-01T00:00:00.000`,
        date_add_max: `${date.length ? date.map((d) => d.value) : date.value}-12-31T23:59:59.000`,
        query_object: {
          startRow: 0,
          endRow: 500,
          rowGroupCols: [
            {
              id: "object_type",
              displayName: "Object",
              field: "object_type"
            }
          ],
          valueCols: [],
          pivotCols: [],
          pivotMode: false,
          groupKeys: object.map((obj) => obj.label) || [],
          filterModel: {},
          sortModel: []
        }
      };
      const response = await fetchDocuments(`api/DbFileView/Search`, 'POST', auth.authKey, payload);
      setContacts(response || []);
    } catch (err) {
      setError(err);
      setIsLoading(false);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    const loadThumbnailsSequentially = async () => {
      if (viewMode !== 'grid' || contacts.length === 0 || !auth?.authKey) {
        return;
      }

      for (const item of contacts) {
        if (!item.id || !item.mime_type?.startsWith("image/")) continue;

        // Start loading
        setThumbnailLoading(prev => ({ ...prev, [item.id]: true }));

        try {
          const endpoint = `api/DbFileView/GetFileThumbnail/?id=${item.id}&maxWidth=${item.image_width || '500'}&maxHeight=${item.image_heigth || '500'}`;
          const response = await fetchDocuments(endpoint, "GET", auth.authKey, null, "image/png");

          setFileThumbnails(prev => ({
            ...prev,
            [item.id]: URL.createObjectURL(response),
          }));
        } catch (err) {
          console.warn(`Failed to load thumbnail for ${item.id}:`, err);
        } finally {
          // End loading regardless of success
          setThumbnailLoading(prev => ({ ...prev, [item.id]: false }));
        }
      }

    };

    loadThumbnailsSequentially();
  }, [contacts, auth, viewMode]);

  // Confirm button
  const handleSearch = () => {
    // Sync UI state
    setFilters(tempFilters);

    // Build filters object for API call
    const filtersObj = {
      keyword,
      street,
      city,
      date,
      fileType,
      object,
      location: tempFilters.location, // Pass selected location ID
    };

    setIsLoading(true);
    fetchDocumentsData(filtersObj);
  };

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


  const columns = useMemo(() => [
    {
      id: '1', // Unique ID for this column
      Header: ({ rows }) => {
        const hasRows = rows.length > 0;

        const allVisibleSelected = hasRows && rows.every(row =>
          selectedFiles.some(file => file.id === row.original.id)
        );

        const someVisibleSelected = hasRows && rows.some(row =>
          selectedFiles.some(file => file.id === row.original.id)
        );

        const handleSelectAll = () => {
          if (!hasRows) return;

          if (allVisibleSelected) {
            const visibleIds = rows.map(row => row.original.id);
            setSelectedFiles(prev =>
              prev.filter(file => !visibleIds.includes(file.id))
            );
          } else {
            const newSelections = rows
              .map(row => row.original)
              .filter(file => !selectedFiles.some(f => f.id === file.id));
            setSelectedFiles(prev => [...prev, ...newSelections]);
          }
        };

        return (
          <div className='flex justify-around items-center'>
            <span>{t("documents_table_heading_select_all_text")}</span>
            <input
              className='w-4 h-4 rounded-sm'
              type="checkbox"
              onChange={handleSelectAll}
              checked={hasRows && allVisibleSelected}
              ref={el => {
                if (el) el.indeterminate = hasRows && !allVisibleSelected && someVisibleSelected;
              }}
            />
          </div>
        )
      },
      Cell: ({ row }) =>
        row.original.file_name ? (
          <input
            type="checkbox"
            className='w-4 h-4 rounded-sm'
            onChange={() => toggleFileSelection(row.original)}
            checked={selectedFiles.some(file => file.id === row.original.id)}
          />
        ) : null,
      disableSortBy: true,
    },
    {
      Header: t('documents_table_heading_object_text'),
      accessor: 'object_type',
      Cell: ({ row }) => (
        <span>{row.original.object_type || '—'}</span>
      )
    },
    {
      Header: t('documents_table_heading_object_name_text'), accessor: 'object_name',
      Cell: ({ row }) =>
        row.original.object_name ? (
          <Link
            to={
              (() => {
                let path;
                switch (row.original.object_type) {
                  case 'Work Orders':
                    path = `/workorder/${row.original.object_id}`;
                    break;
                  case 'Task':
                    path = `/ticket/${row.original.object_id}`;
                    break;
                  case 'Uploaded By You':
                    path = `/ticket/${row.original.object_id}`;
                    break;
                  case 'Equipment':
                    path = `/equipment/${row.original.object_id}`;
                    break;
                  default:
                    path = '#';
                }
                // prepend origin so new tab loads correctly
                return `${window.location.origin}/service-desk${path}`;
              })()
            }
            target="_blank"
            rel="noopener noreferrer"
            className="text-left"
          >
            {row.original.object_name}
          </Link>
        ) : null
    },
    {
      Header: t('documents_table_heading_file_type_text'),
      accessor: 'file_extention',
      Cell: ({ row }) =>
        row.original.file_name ? (
          <span className='text-base'>
            {row.original.file_extention}
          </span>
        ) : null
    },
    {
      Header: t('documents_table_heading_file_name_text'), accessor: 'file_name',
      Cell: ({ row }) =>
        row.original.file_name ? (
          <button
            onClick={() => openDocumentInNewTab(row.original.id)}
            className="text-left"
          >
            {row.original.file_name}
          </button>
        ) : ' '
    },
    {
      Header: t('documents_table_heading_upload_when_text'), accessor: 'date_add',
      Cell: ({ row }) =>
        row.original.file_name && new Date(row.original.date_add).getFullYear() !== 1980
          ? new Date(row.original.date_add).toLocaleString("en-GB", {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
          })
          : null
    },
  ], [selectedFiles, openDocumentInNewTab, t]);

  const toggleFileSelection = (file) => {
    setSelectedFiles((prev) =>
      prev.some((f) => f.id === file.id)
        ? prev.filter((f) => f.id !== file.id)
        : [...prev, file]
    );
  };

  const handleDownloadAll = async () => {
    const endpoint = `${url}api/DbFileView/downloadall/?token=${encodeURIComponent(auth.authKey)}`;
    //const selectedIds = contacts.map(file => file.id);

    const payload = {
      keyword: keyword,
      file_types: fileType.map((type) => type.value),
      project_id: "00000000-0000-0000-0000-000000000000",
      db_report_type_ids: [],
      street: street,
      city: city,
      added_date: date.length ? date.map((d) => d.value) : date.value,
      object_list: object.map((obj) => obj.value) || [
        "company",
        "task",
        "jobs",
        "project",
        "you"
      ],
      file_extentions: fileType.reduce((acc, type) => acc.concat(type.extentions), []),
      file_extentions_not_in: [],
      date_add_min: `${date.length ? date.map((d) => d.value) : date.value}-01-01T00:00:00.000`,
      date_add_max: `${date.length ? date.map((d) => d.value) : date.value}-12-31T23:59:59.000`,
      query_object: {
        startRow: 0,
        endRow: 500,
        rowGroupCols: [
          {
            id: "object_type",
            displayName: "Object",
            field: "object_type"
          }
        ],
        valueCols: [],
        pivotCols: [],
        pivotMode: false,
        groupKeys: object.map((obj) => obj.label) || [],
        filterModel: {},
        sortModel: []
      }
    };

    const formData = new URLSearchParams();
    formData.append('paraString', JSON.stringify(payload));

    try {
      const response = await axios.post(endpoint, formData.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        responseType: 'blob', // Important for binary file download
      });

      // Extract filename if available
      const timestamp = getTimestamp();
      const filename = `downloadall_${timestamp}.zip`;
      const blob = new Blob([response.data], { type: 'application/zip' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
      setDownloadMsg('Downloading...');
    } catch (error) {
      console.error('Download failed:', error);
      // Optional: show toast or fallback UI
    }
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

  const handleReset = () => {
    setKeyword('');
    setStreet('');
    setCity('');
    setFileType(fileTypesOptions);
    setObject(uniqueObjects);
    setTempFilters({ location: "", locationLabel: "" }); // <-- Reset locationLabel too
    setFilters({ location: "", locationLabel: "" });     // <-- Reset locationLabel too
    setLocationHints([]);                                // <-- Clear locationHints
    setContacts([]);
    setFileThumbnails({});
    setError(null);
  };

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    page,
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
      data: contacts,
      initialState: { pageIndex: 0, pageSize: 12, sortBy: [{ id: 'object_type', desc: false }] },
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
    return <div className="text-center mt-10 text-red-600">Error fetching data: {error.message}</div>;
  }

  return (
    <div className="w-full mx-auto p-1 md:p-8">
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

      <h1 className="text-primary text-3xl font-semibold mb-6">{t("documents_page_title")}</h1>
      {/* Back Button */}
      <button
        onClick={() => navigate('/')} // Navigate back one step in history
        className="flex items-center mb-6 font-semibold text-zinc-900 text-base"
      >
        <ArrowLeft className="mr-2 w-5 h-5" /> {t("documents_page_go_back")}
      </button>

      {/* Search Filter UI */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 shadow-sm border rounded-lg p-4">
        <div className="relative">
          <Type className="absolute left-3 top-3 w-6 h-6 text-gray-500" />
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder={t('documents_table_filter_keyword')}
            className="w-full pl-12 pr-3.5 py-3 text-gray-500 text-base font-normal leading-normal border rounded-md focus:outline-none focus:ring-1 focus:ring-gray-500"
          />
        </div>
        <div className="relative">
          <div className="relative">
            <MapPin className="absolute left-3 top-3 w-6 h-6 text-gray-500" />
            <input
              name="location"
              id="location"
              type="text"
              value={tempFilters.locationLabel}
              onChange={handleLocationChange}
              placeholder={t('documents_table_filter_location')}
              className="w-full pl-12 pr-3.5 py-3 text-gray-500 text-base font-normal leading-normal border rounded-md text-base focus:outline-none focus:ring-1 focus:ring-gray-400"
            />
          </div>
          {locationHints.length > 0 && (
            <ul className="absolute z-10 bg-white border mt-1 rounded-md w-full shadow-md">
              {locationHints.map(hint => (
                <li
                  key={hint.id}
                  onClick={() => handleHintClick(hint)}
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-base text-gray-700"
                >
                  {hint.label}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="relative">
          <Milestone className="absolute left-3 top-3 w-6 h-6 text-gray-500" />
          <input
            type="text"
            value={street}
            onChange={(e) => setStreet(e.target.value)}
            placeholder={t('documents_table_filter_street')}
            className="w-full pl-12 pr-3.5 py-3 text-gray-500 text-base font-normal leading-normal border rounded-md text-base focus:outline-none focus:ring-1 focus:ring-gray-400"
          />
        </div>
        <div className="relative">
          <Building className="absolute left-3 top-3 w-6 h-6 text-gray-500" />
          <input
            type="text"
            value={city}
            onInput={(e) => setCity(e.target.value)}
            placeholder={t('documents_table_filter_city')}
            className="w-full pl-12 pr-3.5 py-3 text-gray-500 text-base font-normal leading-normal border rounded-md text-base focus:outline-none focus:ring-1 focus:ring-gray-400"
          />
        </div>
        <div className="relative">
          <Calendar className="absolute left-3 top-3 w-6 h-6 text-gray-500" />
          <Select
            components={animatedComponents}
            defaultValue={uniqueDates[0]}
            options={uniqueDates}
            value={date}
            onChange={setDate}
            className="w-full pl-10 py-1 text-gray-500 text-base font-normal leading-normal border rounded-md"
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
                width: '85%', // controls dropdown menu width
              }),
            }}
          />
        </div>
        <div className="relative">
          <FileText className="absolute left-3 top-3 w-6 h-6 text-gray-500" />
          <Select
            closeMenuOnSelect={false}
            components={animatedComponents}
            isMulti
            defaultValue={fileTypesOptions}
            options={fileTypesOptions}
            value={fileType.length === fileTypesOptions.length ? [{ value: 'all', label: t('All') }] : fileType}
            onChange={(selected) => {
              if (!selected) return setFileType([]);
              // if synthetic All was used or all real options selected
              if (Array.isArray(selected) && selected.some(s => s.value === 'all')) {
                return setFileType(fileTypesOptions);
              }
              if (Array.isArray(selected) && selected.length === fileTypesOptions.length) {
                return setFileType(fileTypesOptions);
              }
              return setFileType(selected || []);
            }}
            placeholder={t("documents_table_filter_file_type")}
            className="w-full pl-10 py-1 text-gray-500 text-base font-normal leading-normal border rounded-md"
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
                width: '85%', // controls dropdown menu width
              }),
            }}
          />
        </div>
        <div className="relative">
          <div className="relative w-full">
            <Wrench className="absolute left-3 top-3 w-6 h-6 text-gray-500" />
            <Select
              closeMenuOnSelect={false}
              components={animatedComponents}
              isMulti
              defaultValue={uniqueObjects}
              options={uniqueObjects}
              value={object.length === uniqueObjects.length ? [{ value: 'all', label: t('All') }] : object}
              onChange={(selected) => {
                if (!selected) return setObject([]);
                if (Array.isArray(selected) && selected.some(s => s.value === 'all')) {
                  return setObject(uniqueObjects);
                }
                if (Array.isArray(selected) && selected.length === uniqueObjects.length) {
                  return setObject(uniqueObjects);
                }
                return setObject(selected || []);
              }}
              placeholder={t("documents_table_filter_objects")}
              className="w-full pl-10 py-1 text-gray-500 text-base font-normal leading-normal border rounded-md"
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
                  width: '85%', // controls dropdown menu width
                }),
              }}
            />
          </div>
        </div>
        <div className="flex items-end gap-x-2">
          <button onClick={handleReset} className="w-[50%] md:min-w-40 px-5 py-2 border border-2 border-primary rounded-md text-base text-primary hover:bg-primary/20 hover:text-primary">
            {t("documents_table_filter_reset_button")}
          </button>
          <button onClick={handleSearch} className="w-[50%] md:min-w-40 px-5 py-2 border border-2 border-primary rounded-md text-base text-primary-foreground bg-primary hover:bg-primary/20 hover:text-primary hover:shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)]">
            {t("documents_table_filter_apply_button")}
          </button>
        </div>
      </div>

      <div className="shadow-md rounded-lg mb-4">
        <div className="flex items-center justify-end gap-x-2 py-2 px-4">
          {viewMode === 'grid' && (
            <h2 className="text-2xl text-primary font-semibold mr-auto">
              {t("documents_table_view_download_text")}
            </h2>
          )}
          <button
            className="text-primary px-2 py-1"
            onClick={() => setViewMode(viewMode === 'table' ? 'grid' : 'table')}
          >
            {viewMode === 'table' ? <LayoutGrid className="w-10 h-10" /> : <Table className="w-10 h-10" />}
          </button>
          {contacts.length !== 0 && (
            selectedFiles.length !== 0 && (
              <button
                onClick={handleDownloadSelected}
                className="md:min-w-40 px-2 md:px-5 py-2 border border-2 border-primary bg-primary rounded-lg flex items-center justify-center text-primary-foreground text-base font-medium leading-normal hover:bg-primary/20 hover:text-primary hover:shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)]"
              >
                <Download className="mr-2 w-6 h-5" /> {t("documents_table_download_button")}
              </button>
            )
          )}
          <button
            onClick={handleDownloadAll}
            className="md:min-w-40 px-2 md:px-5 py-2 border border-2 border-primary bg-primary-foreground rounded-lg flex items-center justify-center text-primary text-base font-medium leading-normal hover:bg-primary/20 hover:text-primary hover:shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)]"
          >
            <Download className="mr-2 w-6 h-5" /> {t("documents_table_downloadall_button")}
          </button>
        </div>

        {
          isURLLoading && (
            <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-white/10">
              <div className="text-white text-lg font-semibold animate-pulse">
                <Loader className="w-20 h-20 ml-2 text-blue-600 animate-spin" />
              </div>
            </div>
          )
        }

        {/* Table displaying data */}
        {viewMode === 'table' && (
          <>
            <div className="bg-blue-100 flex items-center text-blue-500 text-base font-normal px-4 py-1 mb-2 rounded-lg">
              <BadgeInfo className='mr-2 w-5 h-5 text-blue-500' /> {t("documents_page_helping_text")}
            </div>
            <div className="overflow-x-hidden">
              <table {...getTableProps()} className="min-w-full divide-y divide-gray-200 border border-gray-300">
                <thead className="bg-white">
                  {headerGroups.map((headerGroup, hgIdx) => {
                    const headerGroupProps = headerGroup.getHeaderGroupProps();
                    const { key: headerGroupKey, ...restHeaderGroupProps } = headerGroupProps;
                    return (
                      <tr key={headerGroupKey || hgIdx} {...restHeaderGroupProps} className="divide-x divide-gray-300">
                        {headerGroup.headers.map((column, colIdx) => {
                          const headerProps = column.getHeaderProps(column.getSortByToggleProps());
                          const { key: headerKey, ...restHeaderProps } = headerProps;
                          return (
                            <th
                              key={headerKey || colIdx}
                              {...restHeaderProps}
                              className="p-2 whitespace-nowrap text-left text-slate-500 text-base font-medium leading-none"
                            >
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
                  {page.map((row, rowIdx) => {
                    prepareRow(row);
                    const rowProps = row.getRowProps();
                    const { key: rowKey, ...restRowProps } = rowProps;
                    return (
                      !isLoading && (
                        <tr key={rowKey || row.original.id || rowIdx} {...restRowProps}
                          className="cursor-pointer hover:bg-primary/50 hover:text-primary-foreground transition-colors duration-200 ease-in-out">
                          {row.cells.map((cell, cellIdx) => {
                            const cellProps = cell.getCellProps();
                            const { key: cellKey, ...restCellProps } = cellProps;
                            return (
                              <td
                                key={cellKey || cellIdx}
                                {...restCellProps}
                                className={`self-stretch px-1 py-2 text-base font-normal ${cellIdx === 0 ? 'text-center' : ''}`}
                              >
                                {cell.render('Cell')}
                              </td>
                            );
                          })}
                        </tr>
                      )
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
            {/* Pagination Controls */}
            {!isLoading && contacts.length > 12 && (
              <div className="flex items-center justify-between p-2">
                <span className="text-base text-primary">
                  {t("documents_table_pagination_page")} {pageIndex + 1} {t("documents_table_pagination_of")} {pageOptions.length}
                </span>
                <div>
                  <button onClick={() => gotoPage(0)} disabled={!canPreviousPage} className="py-0.5 px-1 md:px-2 mr-1 text-primary rounded-md border border-primary  disabled:opacity-50">
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
                <select value={pageSize} onChange={e => setPageSize(Number(e.target.value))} className="ml-1 p-1 md:p-1 text-base text-primary border border-primary rounded-md max-w-32">
                  {[12, 24, 36, 48].map(size => (
                    <option key={size} value={size}>
                      {t("documents_table_pagination_show")} {size}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </>
        )}

        {viewMode === 'grid' && (
          <>
            {isLoading && (
              <div className="ml-2 space-y-2 p-2">
                <div className="h-6 bg-gray-200 rounded animate-pulse w-64"></div>
                <div className="h-6 bg-gray-200 rounded animate-pulse w-40"></div>
              </div>
            )}
            <div className='grid grid-cols-1 md:grid-cols-4 gap-4 p-8'>
              {paginatedContacts?.length > 0 ? (
                paginatedContacts.map(item => (
                  <div key={item.id} className="p-2 flex flex-col border rounded-lg shadow-md">
                    {/* Show image thumbnail if it's an image, otherwise show file icon */}
                    {item.mime_type?.startsWith("image/") ? (
                      fileThumbnails[item.id] ? (
                        <img
                          src={fileThumbnails[item.id]}
                          alt={item.name}
                          className="w-full h-40 md:h-48 object-cover rounded-md mx-auto opacity-0.5 transition-opacity duration-500 ease-in-out"
                          onLoad={(e) => e.currentTarget.classList.remove("opacity-0")}
                        />
                      ) : thumbnailLoading[item.id] ? (
                        <div className="relative w-40 md:w-48 h-40 md:h-48 flex items-center justify-center mx-auto bg-gray-100 rounded-md overflow-hidden">
                          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-70 z-10">
                            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-gray-500"></div>
                          </div>
                          <Image className="w-20 h-20 text-gray-300" />
                        </div>
                      ) : (
                        <div className="w-40 md:w-48 h-40 md:h-48 flex items-center justify-center mx-auto rounded-md">
                          <Image className="w-20 h-20 text-gray-300" />
                        </div>
                      )
                    ) : (
                      <File className="w-40 md:w-48 h-40 md:h-48 text-gray-600 mx-auto" />
                    )}

                    <h4 className="text-gray-500 text-base py-1 break-words">{item.name}</h4>
                    <p className="text-gray-500 text-base">{new Date(item.date_add).toLocaleString("en-GB")}</p>

                    {item.file_name && (
                      <label className="mt-2 flex space-x-2 items-start text-base">
                        <input
                          type="checkbox"
                          onChange={() => toggleFileSelection(item)}
                          checked={selectedFiles.some((file) => file.id === item.id)}
                          className='mt-1'
                        />
                        <span className='text-base'>{t("documents_table_download_checkbox")}</span>
                      </label>
                    )}

                    {item.mime_type?.startsWith("image/") ? (
                      <button
                        target="_blank"
                        rel={item.mime_type?.startsWith("image/") ? "noopener noreferrer" : "noreferrer"}
                        className={`flex items-center no-underline mt-2 text-base ${fileThumbnails[item.id] ? "hover:underline" : "cursor-not-allowed pointer-events-none"
                          }`}
                        onClick={() => openDocumentInNewTab(item.id)}
                      >
                        <Eye className="w-6 h-6 mr-2 text-gray-600" />
                        {t("documents_table_view_document_text")}
                      </button>
                    ) : (
                      <button
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center no-underline mt-2 text-base hover:underline"
                        onClick={() => openDocumentInNewTab(item.id)}
                      >
                        <Eye className="w-6 h-6 mr-2 text-gray-600" />
                        {t("documents_table_view_document_text")}
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-gray-600 p-4 text-center">
                  {t("documents_table_no_document_available")}
                </p>
              )}

              {!fileThumbnails && (!paginatedContacts || paginatedContacts.length === 0) && (
                <p className="text-gray-600 p-4 text-center">
                  {t("documents_table_no_document_available")}
                </p>
              )}
            </div>

            {contacts.length > 12 && (
              <div className="flex items-center justify-between p-2">
                <span className="text-base text-primary">
                  {t("documents_table_pagination_page")} {gridPageIndex + 1} {t("documents_table_pagination_of")} {gridPageOptions.length}
                </span>
                <div>
                  <button onClick={() => gotoGridPage(0)} disabled={!canGridPreviousPage} className="py-0.5 px-1 md:px-2 mr-1 text-primary rounded-md border border-primary disabled:opacity-50">
                    <ArrowLeftToLine className="w-4" />
                  </button>
                  <button onClick={() => previousGridPage()} disabled={!canGridPreviousPage} className="py-0.5 px-1 md:px-2 mr-1 text-primary rounded-md border border-primary disabled:opacity-50">
                    <ArrowLeft className="w-4" />
                  </button>
                  <button onClick={() => nextGridPage()} disabled={!canGridNextPage} className="py-0.5 px-1 md:px-2 mr-1 text-primary rounded-md border border-primary disabled:opacity-50">
                    <ArrowRight className="w-4" />
                  </button>
                  <button onClick={() => gotoGridPage(gridPageOptions.length - 1)} disabled={!canGridNextPage} className="py-0.5 px-1 md:px-2 mr-1 text-primary rounded-md border border-primary disabled:opacity-50">
                    <ArrowRightToLine className="w-4" />
                  </button>
                </div>
                <select value={gridPageSize} onChange={e => setGridPageSize(Number(e.target.value))} className="ml-1 p-1 md:p-1 text-base text-primary border border-primary rounded-md max-w-32">
                  {[12, 24, 36, 48].map(size => (
                    <option key={size} value={size}>
                      {t("documents_table_pagination_show")} {size}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </>
        )}
      </div>
    </div >
  );
};

export default ViewDocuments;