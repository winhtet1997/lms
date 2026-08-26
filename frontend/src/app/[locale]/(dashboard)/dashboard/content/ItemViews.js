"use client";
import { Download, Edit, EllipsisVertical, Eye, Trash2 } from "lucide-react";
import Link from "next/link";
import { cloneElement } from "react";
import { CONTENT_TYPES } from "../../../../../../data/contentData";
import Pagination from "@/components/layout/Pagination";

const ICON_GRADIENTS = [
  "bg-gray-50 text-gray-900",
  "bg-blue-100 text-blue-800",
  "bg-indigo-100 text-indigo-600",
];

function getTypeConfig(itemType) {
  return (
    CONTENT_TYPES.find((t) => t.id === itemType?.toLowerCase()) ||
    CONTENT_TYPES[0]
  );
}

function getEditHref(item) {
  const config = getTypeConfig(item.type);
  if (config?.type === "page") {
    return `${config.href}?id=${item.id}`;
  }
  return `/dashboard/content/${item.type}/edit?id=${item.id}`;
}

const ItemViews = ({
  viewMode,
  items,
  canViewItem,
  canChangeItem,
  canDeleteItem,
  canChangeStatus,
  t,
  handleDownload,
  handleDelete,
  handleToggleStatus,
  currentPage,
  totalPages,
  onPageChange,
  itemsTotalCount,
}) => {
  return (
    <>
      {/* Count */}
      <p className="mt-4 text-sm text-gray-500">
        {t("showingCount", {
          count: items.length,
          total: itemsTotalCount,
        })}
      </p>

      {/* Cards Grid */}
      {viewMode === "grid" && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
          {items.map((item) => {
            const config = getTypeConfig(item.type);

            return (
              <div
                key={item.id}
                className="card h-full bg-base-100 shadow border border-gray-200 rounded-2xl hover:shadow-lg transition-shadow duration-300"
              >
                <div className="card-body flex flex-col">
                  <div className="flex justify-between items-start">
                    <div
                      className={`p-3 rounded-lg ${config.itembg} ${config.itemText}`}
                    >
                      {config.itemicon}
                    </div>

                    {/* Dropdown Menu */}
                    <div className="dropdown dropdown-end">
                      <div
                        tabIndex={0}
                        role="button"
                        className="btn btn-ghost btn-sm"
                      >
                        <EllipsisVertical size={16} />
                      </div>
                      <ul
                        tabIndex={0}
                        className="menu menu-sm dropdown-content bg-base-100 border border-gray-200 space-y-1 rounded-box mt-3 p-2 z-70 shadow-lg"
                      >
                        <li className="p-2 border-b border-gray-100 mb-1 font-semibold">
                          {t("dropdownActionsHeader")}
                        </li>
                        {canViewItem && (
                          <li>
                            <Link
                              href={`/dashboard/content/${item.type}?id=${item.id}`}
                            >
                              <Eye size={14} /> {t("dropdownPreview")}
                            </Link>
                          </li>
                        )}
                        {canChangeItem && (
                          <li>
                            <Link href={getEditHref(item)}>
                              <Edit size={14} /> {t("dropdownEdit")}
                            </Link>
                          </li>
                        )}
                        <li>
                          <button onClick={() => handleDownload(item)}>
                            <Download size={14} /> {t("dropdownDownload")}
                          </button>
                        </li>
                        {canDeleteItem && (
                          <li className="text-red-500 border-t border-gray-100 pt-2">
                            <button onClick={() => handleDelete(item.id)}>
                              <Trash2 size={16} /> {t("dropdownDelete")}
                            </button>
                          </li>
                        )}
                      </ul>
                    </div>
                  </div>

                  <Link href={`/dashboard/content/${item.type}?id=${item.id}`}>
                    <h2 className="card-title mt-2 text-base font-bold hover:text-info">
                      {item.title}
                    </h2>
                  </Link>

                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="badge badge-sm border border-gray-400">
                      {item.type}
                    </span>
                    {item.tags?.map((tag, tagIdx) => (
                      <span
                        key={tagIdx}
                        className={`badge badge-sm badge-soft font-normal ${ICON_GRADIENTS[tagIdx % ICON_GRADIENTS.length]}`}
                      >
                        {tag}
                      </span>
                    ))}
                    <span className="badge badge-sm badge-info font-normal">
                      {item.publication_status ? "Active" : "Archived"}
                    </span>
                  </div>

                  <div className="divider my-2"></div>

                  <div className="text-sm text-gray-500 grid grid-cols-2 gap-2">
                    <div>
                      <p>{t("statViews")}</p>
                      <p className="text-black font-medium">
                        {item.item_view || 0}
                      </p>
                    </div>
                    {item.type === "quiz" ? (
                      <div>
                        <p>{t("statLength")}</p>
                        <p className="text-black font-medium">
                          {item.item_questions || 0}
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p>{t("statSize")}</p>
                        <p className="text-black font-medium">
                          {item.item_size || "0 MB"}
                        </p>
                      </div>
                    )}
                    <div>
                      <p>{t("statDuration")}</p>
                      <p className="text-black font-medium">
                        {item.duration || "0 min"}
                      </p>
                    </div>
                    <div>
                      <p>{t("statUploaded")}</p>
                      <p className="text-black font-medium">
                        {item.created_at
                          ? new Date(item.created_at).toLocaleDateString()
                          : "N/A"}
                      </p>
                    </div>
                  </div>
                  {canChangeStatus && (
                    <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100 bg-slate-50/50 -mx-4 px-4 -mb-4 rounded-b-2xl">
                      <span className="text-[10px] uppercase font-bold text-gray-400 tracking-tight">
                        Quick Toggle Status
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-500">
                          {item.publication_status ? "Active" : "Archived"}
                        </span>
                        <input
                          type="checkbox"
                          className="toggle toggle-success toggle-sm"
                          checked={!!item.publication_status}
                          onChange={() => handleToggleStatus(item)}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* List View */}
      {viewMode === "list" && (
        <div className="rounded-2xl card shadow-md border border-gray-200 mt-4 bg-white">
          <div className="overflow-x-auto">
            <table className="table w-full min-w-5xl">
              <tbody>
                {items.map((item) => {
                  const config = getTypeConfig(item.type);

                  return (
                    <tr key={item.id} className="hover:bg-gray-400/10">
                      <td className="flex gap-4 items-center border-b border-gray-200 min-w-75">
                        <div
                          className={`p-3 rounded-lg ${config.itembg} ${config.itemText} shrink-0`}
                        >
                          {cloneElement(config.itemicon, { size: 16 })}
                        </div>
                        <div className="min-w-0">
                          <Link
                            href={`/dashboard/content/${item.type}?id=${item.id}`}
                          >
                            <h2 className="font-bold text-sm truncate">
                              {item.title}
                            </h2>
                          </Link>
                          <div className="flex flex-wrap gap-2 mt-1">
                            <div className="badge badge-sm badge-outline border-gray-500 rounded-full px-3">
                              {item.type}
                            </div>
                            {item.tags?.map((tag, tagIdx) => (
                              <span
                                key={tagIdx}
                                className={`badge badge-sm badge-soft font-normal ${ICON_GRADIENTS[tagIdx % ICON_GRADIENTS.length]}`}
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </td>
                      <td className="border-b border-gray-200">
                        <div className="flex gap-6 text-xs text-gray-500 justify-end items-center whitespace-nowrap">
                          <div className="text-center">
                            <p>{t("statViews")}</p>
                            <p className="text-black font-semibold">
                              {item.item_view || 0}
                            </p>
                          </div>
                          <div className="text-center">
                            {item.type === "quiz" ? (
                              <div>
                                <p>{t("statLength")}</p>
                                <p className="text-black font-medium">
                                  {item.item_questions || 0}
                                </p>
                              </div>
                            ) : (
                              <div>
                                <p>{t("statSize")}</p>
                                <p className="text-black font-medium">
                                  {item.item_size || "0 MB"}
                                </p>
                              </div>
                            )}
                          </div>
                          <div className="text-center">
                            <p>{t("statDuration")}</p>
                            <p className="text-black font-semibold">
                              {item.duration || "0 min"}
                            </p>
                          </div>
                          <div className="text-center">
                            <p>{t("statUploaded")}</p>
                            <p className="text-black font-semibold">
                              {item.created_at
                                ? new Date(item.created_at).toLocaleDateString()
                                : "N/A"}
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-2 mt-2 items-center">
                            <div
                              className={`flex items-center gap-1.5 bg-gray-100/50 rounded-full ${canChangeStatus ? "pl-1 pr-2 py-0.5" : "p-0"} border border-gray-200`}
                            >
                              <span
                                className={`badge badge-sm border-none font-normal ${item.publication_status ? "badge-info text-white" : "badge-ghost text-gray-500"}`}
                              >
                                {item.publication_status
                                  ? "Active"
                                  : "Archived"}
                              </span>
                              {canChangeStatus && (
                                <input
                                  type="checkbox"
                                  className="toggle toggle-success toggle-xs"
                                  checked={!!item.publication_status}
                                  onChange={() => handleToggleStatus(item)}
                                />
                              )}
                            </div>
                          </div>
                          <div className="dropdown dropdown-end">
                            <div
                              tabIndex={0}
                              role="button"
                              className="btn btn-ghost btn-xs"
                            >
                              <EllipsisVertical size={16} />
                            </div>
                            <ul
                              tabIndex={0}
                              className="menu menu-sm dropdown-content bg-base-100 border border-gray-200 space-y-1 rounded-box mt-3 p-2 z-100 shadow-lg w-32"
                            >
                              <li className="p-2 border-b border-gray-100 mb-1 font-semibold">
                                {t("dropdownActionsHeader")}
                              </li>
                              {canViewItem && (
                                <li>
                                  <Link
                                    href={`/dashboard/content/${item.type}?id=${item.id}`}
                                  >
                                    <Eye size={14} /> {t("dropdownPreview")}
                                  </Link>
                                </li>
                              )}
                              {canChangeItem && (
                                <li>
                                  <Link href={getEditHref(item)}>
                                    <Edit size={14} /> {t("dropdownEdit")}
                                  </Link>
                                </li>
                              )}
                              {canViewItem && (
                                <li>
                                  <button onClick={() => handleDownload(item)}>
                                    <Download size={14} />{" "}
                                    {t("dropdownDownload")}
                                  </button>
                                </li>
                              )}
                              {canDeleteItem && (
                                <li className="text-red-500 border-t border-gray-100 pt-2">
                                  <button onClick={() => handleDelete(item.id)}>
                                    <Trash2 size={16} /> {t("dropdownDelete")}
                                  </button>
                                </li>
                              )}
                            </ul>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
      />
    </>
  );
};

export default ItemViews;
