import React, { useCallback, useEffect, useMemo, useState } from "react";
import { usePagination, useRowSelect, useSortBy, useTable } from "react-table";
import {
  ArrowDown,
  ArrowLeft,
  ArrowLeftToLine,
  ArrowRight,
  ArrowRightToLine,
  ArrowUp,
  Calendar,
  Download,
  Info,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Select from "react-select";
import makeAnimated from "react-select/animated";
import axios from "axios";
import { useAuth } from "../AuthContext.js";
import { fetchDocuments } from '../services/apiServiceDocuments';
import { setPrimaryTheme } from "../utils/setTheme";

const animatedComponents = makeAnimated();

const uniqueYear = [
  { value: "2026", label: "2026" },
  { value: "2025", label: "2025" },
  { value: "2024", label: "2024" },
  { value: "2023", label: "2023" },
];

const invoiceTypeByTab = {
  orders: "WorkOrderApproval",
  invoices: "Invoice",
  credits: "CreditNote",
};

const parseDateValue = (dateStr) => {
  if (!dateStr) return 0;
  if (String(dateStr).includes("/")) {
    const [day, month, year] = String(dateStr).split("/").map(Number);
    if (!day || !month || !year) return 0;
    return new Date(year, month - 1, day).getTime();
  }
  const timestamp = new Date(dateStr).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
};

const formatDateValue = (dateStr) => {
  if (!dateStr) return "-";
  if (String(dateStr).includes("/")) return dateStr;
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return String(dateStr);
  return date.toLocaleDateString("en-GB");
};

const parseMoneyValue = (moneyStr) => {
  if (moneyStr === null || moneyStr === undefined || moneyStr === "") return 0;
  if (typeof moneyStr === "number") return moneyStr;

  const value = String(moneyStr)
    .replace(/EUR/gi, "")
    .replace(/\u20AC/g, "")
    .trim();

  const normalized = value.includes(",")
    ? value.replace(/\./g, "").replace(",", ".").replace(/\s/g, "")
    : value.replace(/\s/g, "");

  return Number(normalized) || 0;
};

const formatEuroValue = (moneyValue) => {
  const numeric = parseMoneyValue(moneyValue);
  const sign = numeric < 0 ? "-" : "";
  const absValue = Math.abs(numeric);
  return `\u20AC ${sign}${absValue.toLocaleString("nl-BE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const getInvoiceId = (row) =>
  row?.id ??
  row?.invoice_id ??
  row?.invoiceid ??
  row?.db_invoice_id ??
  row?.guid ??
  null;

const getDownloadFilename = (headers, selectedCount) => {
  const disposition =
    headers?.["content-disposition"] || headers?.["Content-Disposition"] || "";
  const filenameStarMatch = disposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (filenameStarMatch?.[1]) return decodeURIComponent(filenameStarMatch[1]);

  const filenameMatch = disposition.match(/filename="?([^"]+)"?/i);
  if (filenameMatch?.[1]) return filenameMatch[1];

  const contentType = headers?.["content-type"] || headers?.["Content-Type"] || "";
  if (contentType.includes("application/pdf") && selectedCount === 1) return "invoice.pdf";
  return "invoices.zip";
};

const triggerFileDownload = (blobData, filename, contentType) => {
  const blob = new Blob([blobData], { type: contentType || "application/octet-stream" });
  const downloadUrl = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = downloadUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(downloadUrl);
};

const RowCheckbox = React.forwardRef(({ indeterminate, ...rest }, ref) => {
  const defaultRef = React.useRef();
  const resolvedRef = ref || defaultRef;

  React.useEffect(() => {
    if (resolvedRef.current) {
      resolvedRef.current.indeterminate = indeterminate;
    }
  }, [resolvedRef, indeterminate]);

  return <input type="checkbox" ref={resolvedRef} className="h-4 w-4" {...rest} />;
});

RowCheckbox.displayName = "RowCheckbox";

function TableLoadingSkeleton() {
  return (
    <div className="overflow-x-auto animate-pulse">
      <div className="w-full table-auto border-collapse">
        <div className="grid grid-cols-6 bg-gray-100">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={`head-${index}`} className="px-4 py-3">
              <div className="h-3 w-20 rounded bg-gray-300" />
            </div>
          ))}
        </div>
        {Array.from({ length: 7 }).map((_, rowIndex) => (
          <div key={`row-${rowIndex}`} className="grid grid-cols-6 border-t">
            {Array.from({ length: 6 }).map((__, colIndex) => (
              <div key={`cell-${rowIndex}-${colIndex}`} className="px-4 py-3">
                <div className="h-3 w-24 rounded bg-gray-200" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function ReactTableBilling({ columns, data, onSelectionChange }) {
  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    page,
    prepareRow,
    pageOptions,
    canNextPage,
    canPreviousPage,
    gotoPage,
    nextPage,
    previousPage,
    setPageSize,
    selectedFlatRows,
    toggleAllRowsSelected,
    state: { pageIndex, pageSize },
  } = useTable(
    {
      columns,
      data,
      initialState: { pageIndex: 0, pageSize: 12 },
      autoResetPage: true,
      getRowId: (row, relativeIndex) =>
        String(
          getInvoiceId(row) ??
            row?.invoice_number ??
            row?.id2 ??
            row?.id ??
            relativeIndex
        ),
    },
    useSortBy,
    usePagination,
    useRowSelect,
    (hooks) => {
      hooks.visibleColumns.push((tableColumns) => [
        {
          id: "selection",
          Header: ({ getToggleAllRowsSelectedProps }) => (
            <div className="flex items-center justify-center">
              <RowCheckbox {...getToggleAllRowsSelectedProps()} />
            </div>
          ),
          Cell: ({ row }) => (
            <div className="flex items-center justify-center">
              <RowCheckbox {...row.getToggleRowSelectedProps()} />
            </div>
          ),
          disableSortBy: true,
        },
        ...tableColumns,
      ]);
    }
  );

  useEffect(() => {
    if (typeof onSelectionChange === "function") {
      onSelectionChange(selectedFlatRows.map((selectedRow) => selectedRow.original));
    }
  }, [selectedFlatRows, onSelectionChange]);

  useEffect(() => {
    toggleAllRowsSelected(false);
  }, [data, toggleAllRowsSelected]);

  const visibleColumnCount = headerGroups[0]?.headers?.length || columns.length + 1;

  return (
    <>
      <div className="overflow-x-auto">
        <table {...getTableProps()} className="w-full table-auto border-collapse">
          <thead>
            {headerGroups.map((headerGroup) => {
              const { key: headerGroupKey, ...headerGroupProps } =
                headerGroup.getHeaderGroupProps();

              return (
                <tr key={headerGroupKey} {...headerGroupProps} className="bg-gray-100 text-left">
                  {headerGroup.headers.map((column) => {
                    const rawHeaderProps = column.canSort
                      ? column.getHeaderProps(column.getSortByToggleProps())
                      : column.getHeaderProps();
                    const { key: headerKey, ...headerProps } = rawHeaderProps;

                    return (
                      <th
                        key={headerKey}
                        {...headerProps}
                        className={`px-4 py-2 text-sm font-medium text-gray-500 select-none ${
                          column.canSort ? "cursor-pointer" : ""
                        }`}
                      >
                        <span className="inline-flex items-center gap-1">
                          {column.render("Header")}
                          {column.canSort && column.isSorted ? (
                            column.isSortedDesc ? (
                              <ArrowUp className="inline w-4 h-4 ml-1" />
                            ) : (
                              <ArrowDown className="inline w-4 h-4 ml-1" />
                            )
                          ) : (
                            ""
                          )}
                        </span>
                      </th>
                    );
                  })}
                </tr>
              );
            })}
          </thead>
          <tbody {...getTableBodyProps()}>
            {page.length === 0 ? (
              <tr>
                <td
                  className="px-4 py-8 text-center text-sm text-gray-500"
                  colSpan={visibleColumnCount}
                >
                  No records found.
                </td>
              </tr>
            ) : (
              page.map((row) => {
                prepareRow(row);
                const { key: rowKey, ...rowProps } = row.getRowProps();
                return (
                  <tr key={rowKey} {...rowProps} className="border-t cursor-pointer hover:bg-gray-50">
                    {row.cells.map((cell) => {
                      const { key: cellKey, ...cellProps } = cell.getCellProps();
                      return (
                        <td key={cellKey} {...cellProps} className="px-4 py-3 text-sm text-gray-700">
                          {cell.render("Cell")}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {data.length > 12 && (
        <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <span className="text-sm text-slate-700">
            Page {pageIndex + 1} of {pageOptions.length}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => gotoPage(0)}
              disabled={!canPreviousPage}
              className="px-2 py-1 rounded border border-slate-300 text-slate-700 disabled:opacity-50"
            >
              <ArrowLeftToLine className="w-4" />
            </button>
            <button
              onClick={() => previousPage()}
              disabled={!canPreviousPage}
              className="px-2 py-1 rounded border border-slate-300 text-slate-700 disabled:opacity-50"
            >
              <ArrowLeft className="w-4" />
            </button>
            <button
              onClick={() => nextPage()}
              disabled={!canNextPage}
              className="px-2 py-1 rounded border border-slate-300 text-slate-700 disabled:opacity-50"
            >
              <ArrowRight className="w-4" />
            </button>
            <button
              onClick={() => gotoPage(pageOptions.length - 1)}
              disabled={!canNextPage}
              className="px-2 py-1 rounded border border-slate-300 text-slate-700 disabled:opacity-50"
            >
              <ArrowRightToLine className="w-4" />
            </button>
          </div>
          <select
            value={pageSize}
            onChange={(event) => setPageSize(Number(event.target.value))}
            className="w-28 rounded border border-slate-300 p-1 text-sm text-slate-700"
          >
            {[12, 24, 36, 48].map((size) => (
              <option key={size} value={size}>
                Show {size}
              </option>
            ))}
          </select>
        </div>
      )}
    </>
  );
}

export default function ViewBillingInvoice() {
  const navigate = useNavigate();
  const { auth } = useAuth();
  setPrimaryTheme(auth?.colorPrimary);
  const [invoices, setInvoices] = useState([]);
  const [activeTab, setActiveTab] = useState("invoices");
  const [year, setYear] = useState(uniqueYear[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState([]);
  const [downloadError, setDownloadError] = useState("");

  useEffect(() => {
    setPrimaryTheme(auth?.colorPrimary);
  }, [auth?.colorPrimary]);

  const apiBaseUrl = process.env.REACT_APP_API_URL || 'https://servicedeskapi.wello.solutions/';

  useEffect(() => {
    let isMounted = true;

    const fetchInvoices = async () => {
      if (!auth?.authKey) {
        if (isMounted) {
          setInvoices([]);
          setIsLoading(false);
        }
        return;
      }

      setIsLoading(true);
      try {
        const selectedYear = Number(year?.value);
        const dateFrom = `${selectedYear}-01-01`;
        const dateTo = `${selectedYear}-12-31`;
        const invoiceType = invoiceTypeByTab[activeTab] || "Invoice";
        const filter = `dateutc_confirmation ge '${dateFrom}' and dateutc_confirmation le '${dateTo}' and invoice_type eq '${invoiceType}'`;

        const res = await fetchDocuments('api/Invoices?$filter=' + encodeURIComponent(filter), 'GET', auth.authKey);

        const normalizedRows = Array.isArray(res?.value)
          ? res.value
          : Array.isArray(res)
            ? res
            : [];

        if (isMounted) setInvoices(normalizedRows);
      } catch (err) {
        console.error("Error fetching invoices:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchInvoices();

    return () => {
      isMounted = false;
    };
  }, [activeTab, auth?.authKey, year]);

  const handleTabChange = useCallback(
    (tabKey) => {
      if (tabKey === activeTab) return;
      setDownloadError("");
      setSelectedInvoiceIds([]);
      setIsLoading(true);
      setActiveTab(tabKey);
    },
    [activeTab]
  );

  const handleSelectionChange = useCallback((selectedRows) => {
    const ids = selectedRows
      .map((row) => getInvoiceId(row))
      .filter((id) => typeof id === "string" && id.trim().length > 0);
    const uniqueIds = [...new Set(ids)];

    setDownloadError("");
    setSelectedInvoiceIds((prev) => {
      if (prev.length === uniqueIds.length && prev.every((item, index) => item === uniqueIds[index])) {
        return prev;
      }
      return uniqueIds;
    });
  }, []);

  const handleDownloadSelectedInvoices = useCallback(async () => {
    if (!auth?.authKey || selectedInvoiceIds.length === 0 || isDownloading || isDownloadingAll) return;

    setDownloadError("");
    setIsDownloading(true);
    try {
      const response = await axios({
        url: `${apiBaseUrl}api/invoices/download`,
        method: "POST",
        data: { invoice_ids: selectedInvoiceIds },
        responseType: "blob",
        headers: {
          Authorization: `Basic ${auth.authKey}`,
          Accept: "application/pdf,application/zip",
          "Content-Type": "application/json",
        },
      });

      const contentType = response.headers?.["content-type"] || "application/octet-stream";
      const filename = getDownloadFilename(response.headers, selectedInvoiceIds.length);
      triggerFileDownload(response.data, filename, contentType);
    } catch (err) {
      let message = "Failed to download selected invoice file(s).";
      if (err?.response?.status === 400) message = "Invalid request. Please select valid invoice IDs.";
      if (err?.response?.status === 404) message = "No PDF exists for one or more selected invoices.";
      if (err?.response?.status === 500) message = "Server error while generating invoice download.";

      if (err?.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          if (text) {
            try {
              const parsed = JSON.parse(text);
              message = parsed?.message || parsed?.error || text;
            } catch {
              message = text;
            }
          }
        } catch {
          // keep fallback message
        }
      }

      setDownloadError(message);
      console.error("Download selected invoices failed:", err);
    } finally {
      setIsDownloading(false);
    }
  }, [auth?.authKey, apiBaseUrl, isDownloading, isDownloadingAll, selectedInvoiceIds]);

  const handleDownloadAllInvoices = useCallback(async () => {
    if (!auth?.authKey || isDownloading || isDownloadingAll) return;

    const selectedYear = Number(year?.value);
    const dateFrom = `${selectedYear}-01-01`;
    const dateTo = `${selectedYear}-12-31`;

    setDownloadError("");
    setIsDownloadingAll(true);
    try {
      const response = await axios({
        url: `${apiBaseUrl}api/invoices/downloadall`,
        method: "POST",
        params: {
          date_from: dateFrom,
          date_to: dateTo,
        },
        data: {
          date_from: dateFrom,
          date_to: dateTo,
        },
        responseType: "blob",
        headers: {
          Authorization: `Basic ${auth.authKey}`,
          Accept: "application/zip,application/octet-stream",
          "Content-Type": "application/json",
        },
      });

      const contentType = response.headers?.["content-type"] || "application/zip";
      const filename =
        getDownloadFilename(response.headers, 2) || `invoices_${selectedYear}.zip`;
      triggerFileDownload(response.data, filename, contentType);
    } catch (err) {
      let message = "Failed to download invoice archive for the selected date range.";
      if (err?.response?.status === 400) message = "Invalid date range. Please verify selected dates.";
      if (err?.response?.status === 404) message = "No invoice PDFs found for the selected date range.";
      if (err?.response?.status === 500) message = "Server error while generating invoice archive.";

      if (err?.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          if (text) {
            try {
              const parsed = JSON.parse(text);
              message = parsed?.message || parsed?.error || text;
            } catch {
              message = text;
            }
          }
        } catch {
          // keep fallback message
        }
      }

      setDownloadError(message);
      console.error("Download all invoices failed:", err);
    } finally {
      setIsDownloadingAll(false);
    }
  }, [apiBaseUrl, auth?.authKey, isDownloading, isDownloadingAll, year]);

  const filteredRows = useMemo(() => {
    const selectedYear = Number(year?.value);
    return invoices.filter((row) => {
      const rawDate = row.modified_dateutc ?? row.dateutc_confirmation ?? row.date;
      const timestamp = parseDateValue(rawDate);
      if (!timestamp) return false;
      return new Date(timestamp).getUTCFullYear() === selectedYear;
    });
  }, [invoices, year]);

  const columns = useMemo(() => {
    const firstHeader =
      activeTab === "invoices"
        ? "Invoice number"
        : activeTab === "credits"
          ? "Credit Note no."
          : "Order number";

    return [
      {
        Header: firstHeader,
        id: "invoice_number",
        accessor: (row) => row.invoice_number ?? row.id2 ?? row.id ?? "-",
        sortType: (rowA, rowB, columnId) =>
          String(rowA.values[columnId]).localeCompare(String(rowB.values[columnId]), undefined, {
            numeric: true,
            sensitivity: "base",
          }),
      },
      {
        Header: "Source",
        id: "source",
        accessor: (row) => row.source ?? row.invoice_source ?? "-",
      },
      {
        Header: "Invoice Date",
        id: "modified_dateutc",
        accessor: (row) => row.modified_dateutc ?? row.dateutc_confirmation ?? row.date ?? "",
        Cell: ({ value }) => formatDateValue(value),
        sortType: (rowA, rowB, columnId) =>
          parseDateValue(rowA.values[columnId]) - parseDateValue(rowB.values[columnId]),
      },
      {
        Header: "Net Amount",
        id: "net_amount",
        accessor: (row) => row.net_amount ?? row.amount_net ?? 0,
        Cell: ({ value }) => formatEuroValue(value),
        sortType: (rowA, rowB, columnId) =>
          parseMoneyValue(rowA.values[columnId]) - parseMoneyValue(rowB.values[columnId]),
      },
      {
        Header: "VAT included",
        id: "total_vat",
        accessor: (row) => row.total_vat ?? row.amount_vat ?? 0,
        Cell: ({ value }) => formatEuroValue(value),
        sortType: (rowA, rowB, columnId) =>
          parseMoneyValue(rowA.values[columnId]) - parseMoneyValue(rowB.values[columnId]),
      },
      {
        Header: "Total Amount",
        id: "total_amount",
        accessor: (row) => row.total_amount ?? row.amount_total ?? 0,
        Cell: ({ value }) => formatEuroValue(value),
        sortType: (rowA, rowB, columnId) =>
          parseMoneyValue(rowA.values[columnId]) - parseMoneyValue(rowB.values[columnId]),
      },
    ];
  }, [activeTab]);

  return (
    <div className="w-full mx-auto p-1 md:p-8">
      <h1 className="text-primary text-3xl font-semibold mb-6">Billing and invoices</h1>

      <button onClick={() => navigate("/")} className="flex items-center mb-6 font-semibold text-zinc-900 text-base">
        <ArrowLeft className="mr-2 w-5 h-5" /> Go back
      </button>

      <div className="mb-4">
        {/*
        <button
          className={`px-2 md:px-4 py-2 md:mr-2 text-lg font-medium leading-7 ${activeTab === "orders" ? "text-gray-900 border-b-2 border-gray-900" : "text-slate-500"}`}
          onClick={() => handleTabChange("orders")}
        >
          Order History
        </button>
        */}
        <button
          className={`px-2 md:px-4 py-2 md:mr-2 text-lg font-medium leading-7 ${activeTab === "invoices" ? "text-gray-900 border-b-2 border-gray-900" : "text-slate-500"}`}
          onClick={() => handleTabChange("invoices")}
        >
          Invoices
        </button>
        <button
          className={`px-2 md:px-4 py-2 md:mr-2 text-lg font-medium leading-7 ${activeTab === "credits" ? "text-gray-900 border-b-2 border-gray-900" : "text-slate-500"}`}
          onClick={() => handleTabChange("credits")}
        >
          Credit Notes
        </button>
      </div>

      <div className="mt-5 rounded-xl border border-zinc-200 p-4">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative">
            <Calendar className="absolute left-3 top-3 w-6 h-6 text-gray-500" />
            <Select
              components={animatedComponents}
              defaultValue={uniqueYear[0]}
              options={uniqueYear}
              value={year}
              onChange={(selected) => {
                setYear(selected);
                setSelectedInvoiceIds([]);
                setDownloadError("");
              }}
              className="w-full pl-10 py-1 text-gray-500 text-base font-normal leading-normal border rounded-md"
              styles={{
                control: (base) => ({
                  ...base,
                  border: "none",
                  boxShadow: "none",
                }),
                option: (base, state) => ({
                  ...base,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  color: state.isSelected
                    ? "rgb(var(--color-primary-foreground) / var(--tw-bg-opacity, 1))"
                    : state.isFocused
                      ? "rgb(var(--color-primary-foreground) / var(--tw-bg-opacity, 1))"
                      : "rgb(var(--color-primary) / var(--tw-bg-opacity, 1))",
                  backgroundColor: state.isSelected
                    ? "rgb(var(--color-primary) / 0.7)"
                    : state.isFocused
                      ? "rgb(var(--color-primary) / 0.5)"
                      : "transparent",
                  cursor: "pointer",
                }),
                menu: (provided) => ({
                  ...provided,
                  width: "85%",
                }),
              }}
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="bg-blue-100 flex items-center text-blue-500 text-base font-normal px-4 py-1 mb-2 rounded-lg">
              <Info className="mr-2 h-5 w-5" />
              Select multiple invoices and click download
            </div>
            {selectedInvoiceIds.length > 0 && (
            <button
              onClick={handleDownloadSelectedInvoices}
              disabled={isDownloading || isDownloadingAll || isLoading || selectedInvoiceIds.length === 0}
              className="md:min-w-40 px-2 md:px-5 py-2 border border-2 border-primary bg-primary rounded-lg flex items-center justify-center text-primary-foreground text-base font-medium leading-normal hover:bg-primary/20 hover:text-primary hover:shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="mr-3 h-5 w-5" />
              {isDownloading ? "Downloading..." : `Download (${selectedInvoiceIds.length})`}
            </button> )}
            <button
              onClick={handleDownloadAllInvoices}
              disabled={isDownloading || isDownloadingAll || isLoading}
              className="md:min-w-40 px-2 md:px-5 py-2 border border-2 border-primary text-primary bg-white rounded-lg flex items-center justify-center text-base font-medium leading-normal hover:bg-primary/10 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="mr-3 h-5 w-5" />
              {isDownloadingAll ? "Downloading All..." : "Download All"}
            </button>
          </div>
        </div>

        {downloadError && (
          <div className="mb-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {downloadError}
          </div>
        )}

        <div className="bg-blue-100 flex items-center text-blue-500 text-base font-normal px-4 py-1 mb-2 rounded-lg">
          <Info className="mr-2 h-5 w-5" />
          Click on the row to view the PDF.
        </div>

        {isLoading ? (
          <TableLoadingSkeleton />
        ) : (
          <ReactTableBilling
            columns={columns}
            data={filteredRows}
            onSelectionChange={handleSelectionChange}
          />
        )}
      </div>
    </div>
  );
}
