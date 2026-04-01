import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { useTable, useSortBy, useExpanded } from 'react-table';
import { fetchDocuments } from '../services/apiServiceDocuments';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { useAuth } from '../AuthContext';
import { useNavigate } from 'react-router-dom';
import { BadgeInfo, FileText, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, ArrowLeftToLine, ArrowRightToLine, Filter } from 'lucide-react';
import { useTranslation } from "react-i18next";
import { startOfMonth, endOfMonth, format } from 'date-fns';
import { setPrimaryTheme } from "../utils/setTheme";
import Select from 'react-select';
import makeAnimated from 'react-select/animated';
const animatedComponents = makeAnimated();

const ViewCalendars = () => {
  const navigate = useNavigate();
  const { auth } = useAuth();
  setPrimaryTheme(auth?.colorPrimary);
  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingDates, setLoadingDates] = useState(true);
  const [error, setError] = useState(null);
  const [date, setDate] = useState(new Date());
  const { t, i18n } = useTranslation('calendar');
  const locale = i18n?.language || 'en-US'; // used for Calendar and toLocaleString

  // Search Filter states
  //const [location, setLocation('');
  const [equipmentTypes, setEquipmentTypes] = useState([]);
  const [equipmentNames, setEquipmentNames] = useState([]);
  const [selectedEquipmentType, setSelectedEquipmentType] = useState('All');
  const [selectedEquipmentName, setSelectedEquipmentName] = useState('All');
  const [includeArchived, setIncludeArchived] = useState(false);

  const [currentMonth, setCurrentMonth] = useState(new Date());

  const [allLocations, setAllLocations] = useState([]);
  const [locationHints, setLocationHints] = useState([]);

  const [expandedRowId, setExpandedRowId] = useState(null);
  const [activeSection, setActiveSection] = useState(null); // 'popup' | 'remarks'
  const [remarksDataMap, setRemarksDataMap] = useState({});
  const [loadingMap, setLoadingMap] = useState({});

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

                const label = [name, street, streetNumber, city, zip]
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
      const filteredHints = allLocations.filter(loc =>
        loc.label.toLowerCase().includes(value.toLowerCase())
      );
      setLocationHints(filteredHints);
    } else {
      setLocationHints([]);
    }
  };

  const handleHintClick = (hint) => {
    setTempFilters(prev => ({
      ...prev,
      locationLabel: hint.label, // Show label in input
      location: hint.id          // Store ID for filtering
    }));
    setLocationHints([]);
  };

  const onDateChange = async (newDate) => {
    setIsLoading(true);
    setDate(newDate);
    setIsLoading(false);
  };

  useEffect(() => {
    const fetchJobs = async () => {
      setLoadingDates(true); // 🔄 Trigger loading before fetch starts

      const formatDate = (date) => format(date, "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'");
      const dateFrom = formatDate(startOfMonth(currentMonth));
      const dateTo = formatDate(endOfMonth(currentMonth));

      const query = `date_from gt '${dateFrom}' and date_to le '${dateTo}'`;
      const url = `api/JobPlanningView?$filter=${encodeURIComponent(query)}`;

      try {
        const response = await fetchDocuments(url, 'GET', auth.authKey);
        setContents(response.value);
      } catch (err) {
        setError(err);
      } finally {
        setLoadingDates(false); // ✅ Always stop loading after fetch
        setLoading(false);
      }
    };

    fetchJobs();
  }, [auth, currentMonth]);

  const handleMonthChange = ({ activeStartDate }) => {
    setCurrentMonth(activeStartDate);
  };

  useEffect(() => {
    const fetchEquiName = async () => {
      try {
        const resname = await fetchDocuments('api/ProjectView?$filter=root_parent_id+ne+00000000-0000-0000-0000-000000000000', 'GET', auth.authKey);
        setEquipmentNames(resname.value);
      } catch (err) {
        setError(err);
        setLoading(false);
      }
    };

    const fetchJobsType = async () => {
      try {
        const restype = await fetchDocuments('api/EquipmentFamily', 'GET', auth.authKey);
        setEquipmentTypes(restype.value);
      } catch (err) {
        setError(err);
        setLoading(false);
      }
    };

    fetchEquiName();
    fetchJobsType();
  }, [auth]);

  const equipmentNamesOptions = Array.isArray(equipmentNames)
    ? equipmentNames
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((model) => ({
        value: model.id,
        label: model.name,
      }))
    : [];

  const equipmentTypesOptions = Array.isArray(equipmentTypes)
    ? equipmentTypes
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((model) => ({
        value: model.id,
        label: model.name,
      }))
    : [];

  const handleRemarksClick = useCallback(async (rowId) => {
    if (expandedRowId === rowId && activeSection === "remarks") {
      setExpandedRowId(null);
      setActiveSection(null);
      return;
    }

    setExpandedRowId(rowId);
    setActiveSection("remarks");

    if (remarksDataMap[rowId]) return;

    setLoadingMap(prev => ({ ...prev, [rowId]: true }));
    try {
      const response = await fetchDocuments(`api/JobsView/GetAllTechnicianRemarksOfJob?jobs_id=${rowId}`);
      const res = response;
      setRemarksDataMap(prev => ({ ...prev, [rowId]: res }));
    } finally {
      setLoadingMap(prev => ({ ...prev, [rowId]: false }));
    }
  }, [expandedRowId, activeSection, remarksDataMap]);

  const columns = useMemo(
    () => [
      {
        Header: '', // Blank header
        accessor: 'icon', // Dummy accessor to satisfy react-table
        Cell: ({ row }) => {
          const showFileIcon = row.original.jobs_nb_notes > 0;

          if (!showFileIcon) return null;

          return (
            <span className="flex gap-2 items-center">
              {showFileIcon && (
                <FileText
                  className="w-5 h-5 cursor-pointer"
                  onClick={() => handleRemarksClick(row.original.jobs_id)}
                />
              )}
            </span>
          );
        },
      },
      {
        Header: t('calendar_table_heading_reference_text'),
        accessor: 'jobs_id2',
        Cell: ({ row }) => (
          <span
            className="text-base font-semibold" >
            {row.original.jobs_id2}
          </span>
        )
      },
      {
        Header: t('calendar_table_heading_hour_text'),
        accessor: 'date_from',
        Cell: ({ value }) => {
          if (!value) return '';
          try {
            return new Date(value).toLocaleTimeString("en-GB", { timeZone: 'UTC', hour: '2-digit', minute: '2-digit', hour12: false });
          } catch {
            return '';
          }
        }
      },
      {
        Header: t('calendar_table_heading_name_text'),
        accessor: 'jobs_name',
      },
      {
        Header: t('calendar_table_heading_address_text'),
        accessor: ({ db_address_street, db_address_city, db_address_zip }) => `${db_address_street} ${db_address_city} ${db_address_zip}`
      },
      {
        Header: t('calendar_table_heading_technician_text'),
        accessor: ({ user_firstname, user_lastname }) => `${user_firstname} ${user_lastname}`
      }
    ],
    [handleRemarksClick, t]
  );

  const { filteredContents, datesWithData } = useMemo(() => {
    const selectedDateStr = date.toDateString();

    // Filter for the selected date and other criteria (for table)
    const filtered = contents.filter(content => {
      const contentDateStr = new Date(content.date_from).toDateString();
      const matchesDate = contentDateStr === selectedDateStr;

      const matchesLocation = filters.location
        ? content.project_id === filters.location // Compare by ID
        : true;

      const matchesEquipmentType =
        selectedEquipmentType && selectedEquipmentType !== 'All'
          ? content.project_equipment_family_id === (selectedEquipmentType)
          : true;

      const matchesEquipmentName =
        selectedEquipmentName && selectedEquipmentName !== 'All'
          ? content.project_equipment_family_id === (selectedEquipmentName)
          : true;

      const matchesArchived = includeArchived
        ? true
        : content.project_status_name !== 'Archived';

      return (
        matchesDate &&
        matchesLocation &&
        matchesEquipmentType &&
        matchesEquipmentName &&
        matchesArchived
      );
    });

    // Calculate unique dates with data points, IGNORING location filter
    const uniqueDatesWithData = [...new Set(
      contents
        .filter(content => {
          // Filter by location if selected
          const matchesLocation = filters.location
            ? content.project_id === filters.location
            : true;

          // Equipment type filter
          const matchesEquipmentType =
            selectedEquipmentType && selectedEquipmentType !== 'All'
              ? content.project_equipment_family_id === (selectedEquipmentType)
              : true;

          // Equipment name filter
          const matchesEquipmentName =
            selectedEquipmentName && selectedEquipmentName !== 'All'
              ? content.project_equipment_family_id === (selectedEquipmentName)
              : true;

          // Archived filter
          const matchesArchived = includeArchived
            ? true : content.project_status_name !== 'Archived';

          return matchesLocation && matchesEquipmentType && matchesEquipmentName && matchesArchived;
        })
        .map(content => new Date(content.date_from).toDateString())
    )];

    return { filteredContents: filtered, datesWithData: uniqueDatesWithData };
  }, [contents, date, selectedEquipmentType, selectedEquipmentName, includeArchived, filters]);


  const tableInstance = useTable({ columns, data: filteredContents, initialState: { pageIndex: 0, pageSize: 12 }, }, useSortBy, useExpanded);
  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows, // Use page instead of rows for pagination
    prepareRow,
    canPreviousPage,
    canNextPage,
    pageOptions,
    gotoPage,
    nextPage,
    previousPage,
    setPageSize,
    state: { pageIndex, pageSize },
  } = tableInstance;


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

  const handleReset = () => {
    setDate(new Date());

    // Reset all equipment filters
    setSelectedEquipmentType('All');
    setSelectedEquipmentName('All');

    // Reset location filters
    setTempFilters({
      location: "",
      locationLabel: "",
      selectedEquipmentType: 'All',
      selectedEquipmentName: 'All',
    });

    setFilters({
      location: "",
      locationLabel: "",
      selectedEquipmentType: 'All',
      selectedEquipmentName: 'All',
    });

    setLocationHints([]);
    setIncludeArchived(false);
  };


  return (
    <div className="w-full mx-auto p-6">
      <h1 className="text-primary text-3xl font-semibold mb-6">{t('calendar_page_title')}</h1>

      {/* Back Button */}
      <button
        onClick={() => navigate(-1)} // Navigate back one step in history
        className="flex items-center mb-6 font-semibold text-zinc-900 text-base"
      >
        <ArrowLeft className="mr-2 w-5 h-5" /> {t("calendar_page_go_back")}
      </button>

      <div className="flex flex-col lg:flex-row gap-12">
        {/* Filters Section */}
        <div className="bg-white p-4 rounded-lg shadow-[0_0_10px_2px_rgba(0,0,0,0.1)] w-full lg:w-2/5">
          <h2 className="flex items-center text-zinc-900 text-base font-medium leading-normal pb-6">
            {t('calendar_page_filter_label')} <Filter className="w-5 h-4 ml-4" />
          </h2>
          <form
            onSubmit={e => {
              e.preventDefault();
              setFilters({
                location: tempFilters.location,
                locationLabel: tempFilters.locationLabel,
              });
              setSelectedEquipmentType(tempFilters.selectedEquipmentType || 'All');
              setSelectedEquipmentName(tempFilters.selectedEquipmentName || 'All');
              setIncludeArchived(tempFilters.includeArchived || false);
              setLocationHints([]);
            }}
            className='space-y-4'
          >
            <div className="relative mb-2">
              <label htmlFor="location" className="block text-zinc-900 text-base font-normal leading-normal mb-2">
                {t('calendar_page_filter_location_label')}
              </label>
              <input
                name="location"
                id="location"
                type="text"
                value={tempFilters.locationLabel}
                onChange={handleLocationChange}
                placeholder={t('calendar_page_filter_location_placeholder')}
                className="w-full px-2 py-2.5 text-base font-normal leading-normal border border-gray-300 rounded-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
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
            <div className="mb-2">
              <label htmlFor="equipment-type" className="block text-zinc-900 text-base font-normal leading-normal mb-2">
                {t('calendar_page_filter_equipment_type_label')}
              </label>
              <Select
                components={animatedComponents}
                options={equipmentTypesOptions}
                value={
                  tempFilters.selectedEquipmentType === 'All'
                    ? null
                    : equipmentTypesOptions.find(option => option.value === (tempFilters.selectedEquipmentType?.value || tempFilters.selectedEquipmentType))
                }
                onChange={selected => setTempFilters(prev => ({ ...prev, selectedEquipmentType: selected }))}
                placeholder={t("calendar_page_filter_equipment_type_select")}
                className="w-full py-1 text-gray-500 text-base font-normal leading-normal border rounded-md"
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
            <div className="mb-2">
              <label htmlFor="equipment" className="block text-zinc-900 text-base font-normal leading-normal mb-2">
                {t('calendar_page_filter_equipment_label')}
              </label>
              <Select
                components={animatedComponents}
                options={equipmentNamesOptions}
                value={
                  tempFilters.selectedEquipmentName === 'All'
                    ? null
                    : equipmentNamesOptions.find(option => option.value === (tempFilters.selectedEquipmentName?.value || tempFilters.selectedEquipmentName))
                }
                onChange={selected => setTempFilters(prev => ({ ...prev, selectedEquipmentName: selected }))}
                placeholder={t("calendar_page_filter_equipment_select")}
                className="w-full py-1 text-gray-500 text-base font-normal leading-normal border rounded-md"
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
            {/* <div className="mb-4 flex items-center">
              <input
                type="checkbox"
                id="includeArchived"
                checked={tempFilters.includeArchived || false}
                onChange={e => setTempFilters(prev => ({ ...prev, includeArchived: e.target.checked }))}
                className="mr-2"
              />
              <label htmlFor="includeArchived" className="text-zinc-900 text-base font-normal leading-normal">
                {t('calendar_page_filter_include_archived')}
              </label>
            </div> */}
            <div className="flex gap-2">
              <button type="button" onClick={handleReset} className="w-full border border-2 border-primary text-primary px-4 py-2 rounded-md hover:bg-primary/20 hover:text-primary transition">
                {t('calendar_page_filter_reset')}
              </button>
              <button type="submit" className="w-full border border-2 border-primary bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/20 hover:text-primary border border-primary transition">
                {t('calendar_page_filter_apply')}
              </button>
            </div>
          </form>
        </div>
        <div>
          <div className="bg-blue-100 flex items-center text-blue-500 text-base font-normal px-4 py-1 mb-2 rounded-lg">
            <BadgeInfo className='mr-2 w-5 h-5 text-blue-500' /> {t("calendar_page_calendar_helping_text")}
          </div>
          <div className="relative bg-white rounded-lg shadow-[0_0_10px_2px_rgba(0,0,0,0.1)]">
            {loadingDates && (
              <div className="absolute inset-0 bg-white bg-opacity-70 flex items-center justify-center z-10">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-purple-500"></div>
              </div>
            )}
            <Calendar
              onChange={onDateChange}
              value={date}
              onActiveStartDateChange={handleMonthChange}
              locale={locale}
              calendarType="gregory"
              className="calendar-component"
              prev2Label={null}
              next2Label={null}

              tileClassName={({ date: tileDate, view }) => {
                if (view === 'month' && datesWithData.includes(tileDate.toDateString())) {
                  return 'rounded-date text-primary font-semibold';
                }
                return null;
              }}

              formatShortWeekday={(lc, dt) => {
                const weekday = dt.toLocaleDateString(locale, { weekday: 'short' });
                return weekday.charAt(0).toUpperCase() + weekday.slice(1);
              }}

              formatMonthYear={(locale, date) => {
                const month = date.toLocaleDateString(locale, { month: 'long' });
                const year = date.getFullYear();
                return `${month.charAt(0).toUpperCase() + month.slice(1)} ${year}`;
              }}

              formatDay={(locale, date) => {
                const day = date.getDate().toString();
                return day.charAt(0).toUpperCase() + day.slice(1);
              }}
            />
          </div>
        </div>
      </div>

      <div className='shadow-[0_0_10px_2px_rgba(0,0,0,0.1)] rounded-lg mt-4'>
        <h2 className="text-gray-900 text-lg font-medium leading-7 px-4 py-2">
          {(() => {
            const formattedDate = date.toLocaleDateString(locale, {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            });

            // Capitalize each word's first letter
            return formattedDate
              .split(' ')
              .map(word => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ');
          })()}
        </h2>
        {rows?.length > 0 ? (
          <>
            <div className="bg-blue-100 flex items-center text-blue-500 text-base font-normal px-4 py-1 mb-2 rounded-lg">
              <BadgeInfo className='mr-2 w-5 h-5 text-blue-500' /> {t("calendar_page_table_helping_text")}
            </div>
            <div className="overflow-x-visible">
              <table {...getTableProps()} className="min-w-full bg-white divide-y divide-gray-200 border border-gray-300 shadow-lg">
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
                            <th key={headerKey || column.id || colIdx} {...restHeaderProps}
                              className="p-2 whitespace-nowrap text-left text-slate-500 text-base font-medium leading-none">
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
                    rows.map(row => {
                      prepareRow(row);
                      const { key: rowKey, ...restRowProps } = row.getRowProps();
                      return (
                        <React.Fragment key={row.original.id}>
                          <tr
                            {...restRowProps}
                            className="cursor-pointer hover:bg-primary/50 hover:text-primary-foreground transition-colors duration-200 ease-in-out"
                          >
                            {row.cells.map((cell, index) => {
                              const cellProps = cell.getCellProps();
                              const { key: cellKey, ...restCellProps } = cellProps;
                              return (
                                <td
                                  key={cellKey || index}
                                  {...restCellProps}
                                  className={`self-stretch px-1 py-2 text-base font-normal ${index === 0 ? 'text-center' : 'cursor-pointer'
                                    }`}
                                  onClick={
                                    index === 0 ? undefined : () => window.open(`${window.location.origin}/service-desk/workorder/${row.original.jobs_id}`, "_blank")
                                  }
                                >
                                  {cell.render('Cell')}
                                </td>
                              );
                            })}
                          </tr>

                          {expandedRowId === row.original.jobs_id && (
                            <>
                              {/* --- Technician Remarks --- */}
                              {activeSection === 'remarks' && (
                                <>
                                  {loadingMap[row.original.jobs_id] ? (
                                    <tr>
                                      <td colSpan={row.cells.length} className="bg-gray-50 p-4 text-center">
                                        <div className="ml-2 space-y-2 p-2">
                                          <div className="h-6 bg-gray-200 rounded animate-pulse w-64"></div>
                                          <div className="h-6 bg-gray-200 rounded animate-pulse w-40"></div>
                                        </div>
                                      </td>
                                    </tr>
                                  ) : remarksDataMap[row.original.jobs_id]?.length > 0 && (
                                    <tr>
                                      <td colSpan={row.cells.length} className="bg-gray-50 p-4">
                                        <div className="p-1">
                                          <table className="table-auto w-full text-base font-normal text-left border-collapse">
                                            <thead>
                                              <tr className="text-gray-700 border-b">
                                                <th className="pb-2">{t("calendar_table_work_order_list_remarks_ref")}</th>
                                                <th className="pb-2">{t("calendar_table_work_order_list_remarks_technician")}</th>
                                                <th className="pb-2">{t("calendar_table_work_order_list_remarks_date")}</th>
                                                <th className="pb-2">{t("calendar_table_work_order_list_remarks_technicians_remarks")}</th>
                                              </tr>
                                            </thead>
                                            <tbody>
                                              {remarksDataMap[row.original.jobs_id].map(item => (
                                                <tr key={item.id} className="text-gray-500 border-b last:border-none">
                                                  <td className="py-2 font-medium">{item.object_id2}</td>
                                                  <td className="py-2">{item.user_fullname}</td>
                                                  <td className="py-2 font-medium text-gray-700">
                                                    {new Date(item.date_add).toLocaleString(locale, {
                                                      timeZone: 'UTC',
                                                      year: '2-digit',
                                                      month: '2-digit',
                                                      day: '2-digit',
                                                      hour: '2-digit',
                                                      minute: '2-digit',
                                                    })}
                                                  </td>
                                                  <td className="py-2 w-1/2">{item.notes}</td>
                                                </tr>
                                              ))}
                                            </tbody>
                                          </table>
                                        </div>
                                      </td>
                                    </tr>
                                  )}
                                </>
                              )}
                            </>
                          )}
                        </React.Fragment>
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
          </>
        ) : (
          <div className='px-4 py-2'>{t("calendar_table_no_records_text")}</div>
        )}
        {/* Pagination Controls - Only show if filteredTickets exceed pageSize (10) */}
        {filteredContents.length > 12 && (
          <div className="flex items-center justify-between p-4">
            <span className="text-base text-gray-700">
              {t("calendar_table_pagination_page")} {pageIndex + 1} {t("calendar_table_pagination_of")} {pageOptions.length}
            </span>
            <div>
              <button onClick={() => gotoPage(0)} disabled={!canPreviousPage} className="py-1 px-2 md:py-1 md:px-3 mr-1 text-gray-900 rounded-md border border-gray-900 disabled:border-gray-700">
                <ArrowLeftToLine className="w-4" />
              </button>
              <button onClick={() => previousPage()} disabled={!canPreviousPage} className="py-1 px-2 md:py-1 md:px-3 mr-1 text-gray-900 rounded-md border border-gray-900 disabled:border-gray-700">
                <ArrowLeft className="w-4" />
              </button>
              <button onClick={() => nextPage()} disabled={!canNextPage} className="py-1 px-2 md:py-1 md:px-3 mr-1 text-gray-900 rounded-md border border-gray-900 disabled:border-gray-700">
                <ArrowRight className="w-4" />
              </button>
              <button onClick={() => gotoPage(pageOptions.length - 1)} disabled={!canNextPage} className="py-1 px-2 md:py-1 md:px-3 mr-1 text-gray-900 rounded-md border border-gray-900 disabled:border-gray-700">
                <ArrowRightToLine className="w-4" />
              </button>
            </div>
            <select value={pageSize} onChange={e => setPageSize(Number(e.target.value))} className="ml-1 p-1 md:p-1 border border-gray-300 rounded-md max-w-32">
              {[12, 24, 36, 48].map(size => (
                <option key={size} value={size}>
                  {t("calendar_table_pagination_show")} {size}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewCalendars;