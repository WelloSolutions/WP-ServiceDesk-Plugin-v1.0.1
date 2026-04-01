import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { useTable, useSortBy, useExpanded } from 'react-table';
import { fetchDocuments } from '../services/apiServiceDocuments.js';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext.js';
import {
  CornerDownRight, ChevronDown, ChevronUp, ArrowUp, ArrowDown, ArrowLeft, BadgeInfo, Circle, Filter,
  MapPin, Text, Bold, BarChart, Hash, X
} from 'lucide-react';
import { useTranslation } from "react-i18next";
import { setPrimaryTheme } from "../utils/setTheme";

import Select from 'react-select';
import makeAnimated from 'react-select/animated';
const animatedComponents = makeAnimated();

const ViewInstallations = () => {
  const navigate = useNavigate();
  const { auth } = useAuth();
  setPrimaryTheme(auth?.colorPrimary);
  const [contacts, setContacts] = useState([]);
  const [subRowsMap, setSubRowsMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [renderedSubRows, setRenderedSubRows] = useState({});
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { t } = useTranslation('equipmentList');
  const [expanded, setExpanded] = useState({});

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

  const [fetchBrands, setFetchBrands] = useState();
  const [fetchModels, setFetchModels] = useState();
  const [fetchStatuses, setFetchStatuses] = useState();
  const [brandsLoaded, setBrandsLoaded] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [statusesLoaded, setStatusesLoaded] = useState(false);

  const [includeArchived, setIncludeArchived] = useState(false);

  const statusColors = useMemo(() => ({
    "In progress": "bg-yellow-100 text-yellow-600",
    "Planned": "bg-blue-100 text-blue-600",
    "To be Planned": "bg-purple-100 text-purple-600",
    "Out of production": "bg-orange-100 text-orange-600",
    "Active": "bg-green-100 text-green-600",
    "Ready for Review": "bg-indigo-100 text-indigo-600",
    "Proactive": "bg-indigo-100 text-indigo-600",
    "Cancelled": "bg-red-100 text-red-600",
    "Completed": "bg-pink-100 text-pink-600",
  }), []);

  const statusDotColors = useMemo(() => ({
    "In progress": "bg-yellow-600 text-yellow-600",
    "Planned": "bg-blue-600 text-blue-600",
    "To be Planned": "bg-purple-600 text-purple-600",
    "Out of production": "bg-orange-600 text-orange-600",
    "Active": "bg-green-600 text-green-600",
    "Ready for Review": "bg-indigo-600 text-indigo-600",
    "Proactive": "bg-indigo-600 text-indigo-600",
    "Cancelled": "bg-red-600 text-red-600",
    "Completed": "bg-pink-600 text-pink-600",
  }), []);

  const fetchProjects = useCallback(
    async ({ parentOnly, groupKeys = [], parentId = null }) => {
      const url = `api/ProjectView/Search?keyword=${filters.keyword}&projectReference=&projectReferenceBackOffice=&companyID=${EmptyGuid}&equipmentModelID=${filters.model}&equipmentBrandID=${filters.brand}&equipmentFamilyID=${EmptyGuid}&projectStatusID=${filters.status}&createdFrom=1980-01-01T00:00:00.000&createdTo=1980-01-01T00:00:00.000&includesClosed=false&parentOnly=${parentOnly}&contactId=${auth.userId}&rootParentId=${EmptyGuid}&includeLocation=true`;

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

        if (parentOnly) {
          setContacts(mapped);
        }
        if (!parentOnly && parentId) {
          setSubRowsMap(prev => ({ ...prev, [parentId]: mapped }));
        }
        return await mapped;
      } catch (err) {
        console.error(err);
        setError(err);
      } finally {
        setLoading(false);
      }
    },
    [auth, filters]
  );

  useEffect(() => {
    fetchProjects({ parentOnly: true });
  }, [fetchProjects]);

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
                const street2 = p.db_address_street2 || '';
                const zip = p.db_address_zip || '';
                const city = p.db_address_city || '';

                const label = [name, street, streetNumber, street2, city, zip]
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

    if (isModalOpen) {
      loadLocations();
    }
  }, [fetchProjects, isModalOpen]);

  // Handle location input changes
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

  // When a hint is clicked
  const handleHintClick = (hint) => {
    setTempFilters(prev => ({
      ...prev,
      location: hint.id,         // ✅ store ID
      locationLabel: hint.label  // show label in input
    }));
    setLocationHints([]);
  };


  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const resbrands = await fetchDocuments('api/EquipmentBrand', 'GET', auth.authKey);
        setFetchBrands(resbrands.value);
        setBrandsLoaded(true);
      } catch (err) {
        setError(err);
      }
    };

    const fetchModels = async () => {
      try {
        const resmodels = await fetchDocuments('api/EquipmentModel', 'GET', auth.authKey);
        setFetchModels(resmodels.value);
        setModelsLoaded(true);
      } catch (err) {
        setError(err);
      }
    };

    const fetchStatuses = async () => {
      try {
        const restatuses = await fetchDocuments('api/ProjectStatus', 'GET', auth.authKey);
        setFetchStatuses(restatuses.value);
        setStatusesLoaded(true);
      } catch (err) {
        setError(err);
      }
    };

    if (isModalOpen && !brandsLoaded) {
      fetchBrands();
    }
    if (isModalOpen && !modelsLoaded) {
      fetchModels();
    }
    if (isModalOpen && !statusesLoaded) {
      fetchStatuses();
    }
  }, [auth, isModalOpen, brandsLoaded, modelsLoaded, statusesLoaded]);

  const brandOptions = Array.isArray(fetchBrands)
    ? fetchBrands
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(brand => ({
        value: brand.id,
        label: brand.name,
      }))
    : [];

  const modelOptions = Array.isArray(fetchModels)
    ? fetchModels
      .filter(model =>
        tempFilters.brand !== EmptyGuid
          ? model.equipment_brand_id === tempFilters.brand
          : true
      )
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(model => ({
        value: model.id,
        label: model.name,
      }))
    : [];

  // Prepare options with default "All Brands"
  const statusOptions = [
    ...(Array.isArray(fetchStatuses)
      ? fetchStatuses
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((status) => ({
          value: status.id,
          label: status.name,
        }))
      : []),
  ];

  const handleFetchChildren = useCallback(
    async (parentId) => {
      if (subRowsMap[parentId]) return;
      fetchProjects({ parentOnly: false, groupKeys: [parentId], parentId });
    },
    [fetchProjects, subRowsMap]
  );

  const toggleExpand = useCallback(async (id) => {
    if (!expanded[id]) {
      await handleFetchChildren(id);
    }
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  }, [expanded, handleFetchChildren]);

  const clearedFilters = {
    location: "",
    keyword: "",
    brand: EmptyGuid,
    model: EmptyGuid,
    status: EmptyGuid,
    includeArchived: false,
  };

  // Apply filters when Confirm is clicked
  const applyFilters = async () => {
    const { brand, status, model, location, keyword } = tempFilters;
    const isValid =
      brand !== clearedFilters.brand ||
      status !== clearedFilters.status ||
      model !== clearedFilters.model ||
      location.trim() !== "" ||
      keyword.trim() !== "";

    if (!isValid) return;

    setIsLoading(true);
    try {
      setFilters(tempFilters);

      // 1️⃣ Fetch parent-only rows for tree structure
      const parentData = await fetchProjects({ parentOnly: true });

      // 2️⃣ Fetch filtered rows with parentOnly: false to include children
      const filteredData = await fetchProjects({ parentOnly: false, filters: tempFilters });

      // 3️⃣ Merge parent + filtered children
      // Keep parents as the base, and for any filtered child, ensure they appear under correct parent
      const mergedSubRowsMap = { ...subRowsMap };
      filteredData.forEach(row => {
        if (row.parentId) {
          if (!mergedSubRowsMap[row.parentId]) mergedSubRowsMap[row.parentId] = [];
          // Avoid duplicates
          if (!mergedSubRowsMap[row.parentId].some(r => r.id === row.id)) {
            mergedSubRowsMap[row.parentId].push(row);
          }
        } else {
          // If a parent matches filters, make sure it's in parentData
          if (!parentData.some(r => r.id === row.id)) {
            parentData.push(row);
          }
        }
      });

      setContacts(parentData);
      setSubRowsMap(mergedSubRowsMap);
    } catch (err) {
      console.error('Failed to apply filters:', err);
    } finally {
      setIsModalOpen(false);
      setIsLoading(false);
    }
  };


  // Reset filters and reload default data
  const handleReset = async () => {
    setIsLoading(true);
    try {
      setTempFilters(clearedFilters);
      setFilters(clearedFilters);
      const data = await fetchProjects({ parentOnly: true });
      setContacts(data);
    } catch (err) {
      console.error('Reset failed:', err);
    } finally {
      setIsModalOpen(false);
      setIsLoading(false);
    }
  };


  const columns = useMemo(() => [
    {
      Header: t('equipments_list_table_heading_name_text'),
      accessor: 'name',
      Cell: ({ row }) => (
        <span
          onClick={() => navigate(`/equipment/${row.original.id}`)}
          className="me-2 text-left"
        >
          {row.original.name}
        </span>
      ),
    },
    {
      id: 'expander',
      Header: '',
      disableSortBy: true,
      Cell: ({ row }) => (
        row.original.has_child ? (
          <button
            onClick={() => toggleExpand(row.original.id)}
            className="pr-1"
          >
            {expanded[row.original.id] ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
        ) : null
      )
    },
    {
      Header: t('equipments_list_table_heading_address_text'), accessor: 'db_address_street',
      Cell: ({ row }) => {
        const isMobile = row.original.db_address_id === '00000000-0000-0000-0000-000000000000';
        return isMobile
          ? t('No address, it is mobile')
          : `${row.original.db_address_street} - ${row.original.db_address_street_number} ${row.original.db_address_street2 || ''}`;
      }
    },
    { Header: t('equipments_list_table_heading_type_text'), accessor: 'equipment_family_name' },
    { Header: t('equipments_list_table_heading_reference_text'), accessor: 'customer_reference' },
    { Header: t('equipments_list_table_heading_brand_text'), accessor: 'equipment_brand_name' },
    { Header: t('equipments_list_table_heading_modal_text'), accessor: 'equipment_model_name' },
    { Header: t('equipments_list_table_heading_serial_number_text'), accessor: 'serial_number' },
    { Header: t('equipments_list_table_heading_bar_code_text'), accessor: 'barcode' },
    {
      Header: t('equipments_list_table_heading_status_text'),
      accessor: 'project_status_name',
      Cell: ({ row }) => (
        <span className={`text-base min-w-max inline-flex items-center pe-3 px-2 pb-1 pt-1 rounded-full ${statusColors[row.original.project_status_name] || "bg-gray-200 text-gray-800"}`}>
          <Circle className={`inline w-2 h-2 mr-1 rounded-full ${statusDotColors[row.original.project_status_name] || "bg-gray-800 text-gray-800"}`} /> {row.original.project_status_name}
        </span>
      ),
    },
  ], [statusColors, statusDotColors, navigate, expanded, toggleExpand, t]);

  // Filtered data based on search criteria
  const filteredContacts = useMemo(() => {
    return contacts.filter(contact => {
      const matchesLocation = filters.location
        ? contact?.id === filters.location
        : true;

      const matchesKeyword = filters.keyword
        ? Object.values(contact || {})
          .filter(val => typeof val === 'string') // only check string fields
          .some(val => val.toLowerCase().includes(filters.keyword.toLowerCase()))
        : true;

      const matchesBrand =
        filters.brand !== EmptyGuid
          ? contact.equipment_brand_id === filters.brand
          : true;

      const matchesModel =
        filters.model !== EmptyGuid
          ? contact.equipment_model_id === filters.model
          : true;

      const matchesStatus =
        filters.status !== EmptyGuid
          ? contact.project_status_id === filters.status
          : true;

      const matchesArchived = filters.includeArchived
        ? true
        : contact.project_status_is_closed !== true;

      return (
        matchesLocation &&
        matchesKeyword &&
        matchesBrand &&
        matchesModel &&
        matchesStatus &&
        matchesArchived
      );
    });
  }, [contacts, filters]);

  // Flatten parent + child rows so filters can apply to all rows
  const flattenedContacts = useMemo(() => {
    const flat = [];
    const addRows = (rows, depth = 0, parentId = null) => {
      rows.forEach(r => {
        flat.push({ ...r, depth, parentId });
        if (subRowsMap[r.id] && subRowsMap[r.id].length > 0) {
          addRows(subRowsMap[r.id], depth + 1, r.id);
        }
      });
    };
    addRows(contacts);
    return flat;
  }, [contacts, subRowsMap]);

  const filtersActive = useMemo(() => {
    return (
      filters.location !== clearedFilters.location ||
      filters.keyword !== clearedFilters.keyword ||
      filters.brand !== clearedFilters.brand ||
      filters.model !== clearedFilters.model ||
      filters.status !== clearedFilters.status ||
      filters.includeArchived !== clearedFilters.includeArchived
    );
  }, [filters, clearedFilters.brand, clearedFilters.includeArchived, clearedFilters.keyword, clearedFilters.location, clearedFilters.model, clearedFilters.status]);

  const flatFilteredContacts = useMemo(() => {
    if (!filtersActive) return [];

    return flattenedContacts.filter(contact => {
      const matchesLocation = filters.location
        ? (contact?.id === filters.location || contact?.parentId === filters.location)
        : true;

      const matchesKeyword = filters.keyword
        ? Object.values(contact || {})
          .filter(val => typeof val === 'string') // only check string fields
          .some(val => val.toLowerCase().includes(filters.keyword.toLowerCase()))
        : true;

      const matchesBrand =
        filters.brand !== EmptyGuid
          ? contact.equipment_brand_id === filters.brand
          : true;

      const matchesModel =
        filters.model !== EmptyGuid
          ? contact.equipment_model_id === filters.model
          : true;

      const matchesStatus =
        filters.status !== EmptyGuid
          ? contact.project_status_id === filters.status
          : true;

      const matchesArchived = filters.includeArchived
        ? true
        : contact.project_status_is_closed !== true;

      return (
        matchesLocation &&
        matchesKeyword &&
        matchesBrand &&
        matchesModel &&
        matchesStatus &&
        matchesArchived
      );
    });
  }, [flattenedContacts, filters, filtersActive]);

  // Choose the data the table will use (flat when filters are active)
  const displayedData = filtersActive ? flatFilteredContacts : filteredContacts;

  // Create table instance with pagination
  const {
    getTableProps,
    headerGroups,
    rows,
  } = useTable(
    {
      columns,
      data: displayedData
    },
    useSortBy,
    useExpanded
  );

  useEffect(() => {
    Object.keys(expanded).forEach(id => {
      if (expanded[id] && subRowsMap[id] && !renderedSubRows[id]) {
        setRenderedSubRows(prev => ({ ...prev, [id]: true }));
      }
    });
  }, [expanded, subRowsMap, renderedSubRows]);


  const renderRows = (data, depth = 0) => {
    if (!data || data.length === 0) return null;

    const isFlatList = data[0] && typeof data[0].depth === 'number';

    if (isFlatList) {
      // Render flattened rows (no expansion)
      return data.map(row => (
        <tr
          key={row.id}
          className="cursor-pointer hover:bg-primary/50 hover:text-primary-foreground transition-colors duration-200 ease-in-out"
          onClick={() => window.open(`${window.location.origin}/service-desk/equipment/${row.id}`, "_blank")}
        >
          {columns.map((column, index) => {
            const isSecondColumn = index === 1; // Skip click for second column
            const cellContent = column.Cell
              ? column.Cell({ row: { original: row } })
              : row[column.accessor];

            return (
              <td
                key={column.id || column.accessor}
                className={`px-2 py-4 whitespace-nowrap text-base font-normal ${index === 0 ? 'flex' : ''}`}
                style={index === 0 ? { paddingLeft: `${(row.depth || 0) * 2 + 1}em` } : {}}
                onClick={isSecondColumn ? (e) => e.stopPropagation() : undefined}
              >
                {index === 0 && row.depth > 0 && (
                  <CornerDownRight className="mr-1" size={20} />
                )}
                {cellContent}
              </td>
            );
          })}
        </tr>
      ));
    }

    // Fallback: hierarchical rendering with expansion
    return data.map(row => (
      <React.Fragment key={row.id}>
        <tr
          className="cursor-pointer hover:bg-primary/50 hover:text-primary-foreground transition-colors duration-200 ease-in-out"
          onClick={() => window.open(`${window.location.origin}/service-desk/equipment/${row.id}`, "_blank")}
          {...getTableProps()}
        >
          {columns.map((column, index) => {
            const isSecondColumn = index === 1; // Skip click for second column
            const cellContent = column.Cell
              ? column.Cell({ row: { original: row } })
              : row[column.accessor];

            return (
              <td
                key={column.id || column.accessor}
                className={`px-2 py-4 whitespace-nowrap text-base font-normal ${index === 0 ? 'flex' : ''}`}
                style={index === 0 ? { paddingLeft: `${depth * 2 + 1}em` } : {}}
                onClick={isSecondColumn ? (e) => e.stopPropagation() : undefined}
              >
                {index === 0 && depth > 0 && (
                  <CornerDownRight className="mr-1" size={20} />
                )}
                {cellContent}
              </td>
            );
          })}
        </tr>
        {
          expanded[row.id] && subRowsMap[row.id] && (
            <>
              {renderRows(subRowsMap[row.id], depth + 1)}
            </>
          )
        }
        {expanded[row.id] && !renderedSubRows[row.id] && (
          <div className="ml-2 space-y-2 p-2">
            <div className="h-6 bg-gray-200 rounded animate-pulse w-64"></div>
            <div className="h-6 bg-gray-200 rounded animate-pulse w-40"></div>
          </div>
        )}
      </React.Fragment>
    ));
  };

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
    <div className="min-w-[78%] w-full mx-auto p-1 md:p-8">
      <h1 className="text-primary text-3xl font-semibold mb-6">{t("equipments_list_page_title")}</h1>
      {/* Back Button */}
      <button
        onClick={() => navigate('/')} // Navigate back one step in history
        className="flex items-center mb-6 font-semibold text-zinc-900 text-base"
      >
        <ArrowLeft className="mr-2 w-5 h-5" /> {t("equipments_list_page_go_back")}
      </button>

      <div className="flex items-center mb-6">
        <input
          type="checkbox"
          checked={includeArchived}
          onChange={() => setIncludeArchived(!includeArchived)}
          className="mr-2 w-4 h-4 cursor-pointer border border-primary rounded-md accent-primary"
        />
        <label className="text-zinc-800 text-base font-medium">{t('equipments_list_page_checkbox_label')}</label>
      </div>

      <button onClick={() => setIsModalOpen(true)} className="flex justify-center items-center bg-primary-foreground text-primary text-base font-medium leading-normal border border-2 border-primary w-40 px-5 py-2 rounded-md mb-4 hover:bg-primary hover:text-primary-foreground">
        {t('equipments_list_page_filter_button')} <Filter size={24} className="ml-4" />
      </button>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="relative w-100 p-4 bg-white rounded-lg shadow-md border space-y-4">
            <X onClick={() => { setIsModalOpen(false); setTempFilters(clearedFilters) }} className="absolute -top-1 -right-1 bg-primary-foreground text-primary border border-2 border-primary px-2 rounded-full h-9 w-9 flex items-center justify-center hover:bg-primary hover:text-primary-foreground" />
            {/* Header */}
            <div className="flex items-center justify-between border-b pb-2">
              <div className="flex justify-center items-center bg-primary-foreground text-primary text-base font-medium leading-normal border border-2 border-primary w-48 px-4 py-2 rounded-md mb-2 hover:bg-primary hover:text-primary-foreground">
                {t('equipments_list_page_filter_label')}
                <Filter size={24} className="ml-4" />
              </div>
            </div>

            {/* Location */}
            <div className="relative">
              <MapPin className="absolute left-3 top-2.5 w-4 h-5 text-zinc-800" />
              <input
                name="location"
                id="location"
                type="text"
                value={tempFilters.locationLabel}
                onChange={handleLocationChange}
                placeholder={t("equipments_list_page_filter_location")}
                className="w-full pl-10 pr-3 py-2 border rounded-md text-gray-500 text-base font-normal focus:outline-none focus:ring-1 focus:ring-primary"
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

            {/* Sub-Location */}
            {/* <div className="relative">
              <MapPin className="absolute left-3 top-3.5 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search by Sub-Location"
                className="w-full pl-10 pr-3 py-2 border rounded-md text-base focus:outline-none focus:ring-1 focus:ring-gray-400"
              />
            </div> */}

            {/* Keyword */}
            <div className="relative">
              <Text className="absolute left-3 top-2.5 w-4 h-5 text-zinc-800" />
              <input
                name='keyword'
                id='keyword'
                type="text"
                value={tempFilters.keyword}
                onChange={(e) => setTempFilters(prev => ({ ...prev, keyword: e.target.value }))}
                placeholder={t("equipments_list_page_filter_keyword")}
                className="w-full pl-10 pr-3 py-2 border rounded-md text-gray-500 text-base font-normal focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Brands */}
            <div className="relative">
              <Bold className="absolute left-3 top-2.5 w-4 h-5 text-zinc-800" />
              <Select
                components={animatedComponents}
                options={brandOptions}
                value={brandOptions.find(option => option.value === tempFilters.brand) || null} // match by ID
                onChange={(selected) => setTempFilters((prev) => ({ ...prev, brand: selected.value, }))}
                placeholder={t("equipments_list_page_filter_brands")}
                className="w-full pl-10 border rounded-md text-gray-500 text-base font-normal"
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

            {/* Models */}
            <div className="relative">
              <Hash className="absolute left-3 top-2.5 w-4 h-5 text-zinc-800" />
              <Select
                components={animatedComponents}
                options={modelOptions}
                value={modelOptions.find(option => option.value === tempFilters.model) || null} // match by ID
                onChange={(selected) => setTempFilters((prev) => ({ ...prev, model: selected.value, }))}
                placeholder={t("equipments_list_page_filter_models")}
                className="w-full pl-10 border rounded-md text-gray-500 text-base font-normal"
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

            {/* Status */}
            <div className="relative">
              <BarChart className="absolute left-3 top-2.5 w-4 h-5 text-zinc-800" />
              <Select
                components={animatedComponents}
                options={statusOptions}
                value={statusOptions.find(option => option.value === tempFilters.status) || null} // match by ID
                onChange={(selected) => setTempFilters((prev) => ({ ...prev, status: selected.value, }))}
                placeholder={t("equipments_list_page_filter_status")}
                className="w-full pl-10 border rounded-md text-gray-500 text-base font-normal"
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

            {/* Footer buttons */}
            <div className="grid grid-cols-2 gap-4 justify-between pt-2">
              <button onClick={handleReset} disabled={isLoading} className="px-5 py-2 border border-2 border-primary rounded-md text-base bg-primary-foreground text-primary hover:bg-primary hover:text-primary-foreground">
                {t('equipments_list_page_filter_reset')}
              </button>
              <button onClick={applyFilters} disabled={isLoading} className="px-5 py-2 border border-2 border-primary bg-primary text-primary-foreground rounded-md text-base hover:bg-primary-foreground hover:text-primary">
                {t('equipments_list_page_filter_confirm')}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className='shadow-md rounded-lg'>
        <div className="bg-blue-100 flex items-center text-blue-500 text-base font-normal px-4 py-1 mb-2 rounded-lg">
          <BadgeInfo className='mr-2 w-5 h-5 text-blue-500' /> {t("equipments_list_page_helping_text")}
        </div>

        {/* Table displaying filtered data */}
        <div className="w-full overflow-x-auto">
          <table {...getTableProps()} className="min-w-full divide-y divide-gray-200 border border-gray-300">
            <thead className="bg-white">
              {headerGroups.map((headerGroup, headerIndex) => (
                <tr key={(headerGroup.getHeaderGroupProps() || {}).key || headerIndex} {...(function () { const { key, ...r } = headerGroup.getHeaderGroupProps(); return r; })()} className="bg-white">
                  {headerGroup.headers.map((column, index) => {
                    const sortProps = column.canSort ? column.getSortByToggleProps() : {};
                    const headerProps = column.getHeaderProps(sortProps);
                    const { key, ...restHeaderProps } = headerProps;

                    return (
                      <th
                        key={column.id || column.accessor}
                        {...restHeaderProps}
                        className={`px-2 py-3 text-left whitespace-nowrap text-slate-500 text-base font-medium leading-none ${index !== 0 ? 'border-r border-gray-300' : ''} ${column.canSort ? 'cursor-pointer select-none' : ''}`}
                        aria-sort={column.isSorted ? (column.isSortedDesc ? 'descending' : 'ascending') : 'none'}
                      >
                        <div className="flex items-center">
                          {column.render('Header')}
                          {column.isSorted ? (
                            column.isSortedDesc ? (
                              <ArrowUp className="inline w-4 h-4 ml-1" />
                            ) : (
                              <ArrowDown className="inline w-4 h-4 ml-1" />
                            )
                          ) : null}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {!isLoading && renderRows(rows.map(r => r.original))}
            </tbody>
          </table>
        </div>
        {isLoading && (
          <div className="ml-2 space-y-2 p-2">
            <div className="h-6 bg-gray-200 rounded animate-pulse w-64"></div>
            <div className="h-6 bg-gray-200 rounded animate-pulse w-40"></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewInstallations;