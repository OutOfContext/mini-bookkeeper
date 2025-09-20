import React from 'react';
import { Edit, Trash2, Eye } from 'lucide-react';

interface Column {
  key: string;
  label: string;
  format?: (value: any, item?: any) => string | React.ReactNode;
  width?: string;
}

interface DataTableProps {
  columns: Column[];
  data: any[];
  onEdit?: (item: any) => void;
  onDelete?: (item: any) => void;
  onView?: (item: any) => void;
  actions?: boolean;
  emptyMessage?: string;
}

const DataTable: React.FC<DataTableProps> = ({
  columns,
  data,
  onEdit,
  onDelete,
  onView,
  actions = true,
  emptyMessage = 'No data available'
}) => {
  if (data.length === 0) {
    return (
      <div className="card text-center py-12">
        <p className="text-gray-500 text-lg">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <>
      {/* Desktop/Tablet Table View */}
      <div className="hidden sm:block card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 table-responsive">
            <thead className="bg-gray-50">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${column.width || ''}`}
                  >
                    {column.label}
                  </th>
                ))}
                {actions && (
                  <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-32">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.map((item, index) => (
                <tr key={item.id || index} className="hover:bg-gray-50">
                  {columns.map((column) => (
                    <td key={column.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {column.format 
                        ? column.format(item[column.key], item)
                        : item[column.key]
                      }
                    </td>
                  ))}
                  {actions && (
                    <td className="px-2 py-4 whitespace-nowrap">
                      <div className="flex flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-2 md:justify-end">
                        {onEdit && (
                          <button
                            onClick={() => onEdit(item)}
                            className="btn-inventory text-sm py-3 px-4 flex items-center justify-center min-w-24"
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            <span className="hidden md:inline">Edit</span>
                          </button>
                        )}
                        {onDelete && (
                          <button
                            onClick={() => onDelete(item)}
                            className="btn-expense text-sm py-3 px-4 flex items-center justify-center min-w-24"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            <span className="hidden md:inline">Delete</span>
                          </button>
                        )}
                        {onView && (
                          <button
                            onClick={() => onView(item)}
                            className="btn-employee text-sm py-3 px-4 flex items-center justify-center min-w-24"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            <span className="hidden md:inline">View</span>
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="sm:hidden space-y-4">
        {data.map((item, index) => (
          <div key={item.id || index} className="card border border-gray-200">
            <div className="space-y-3">
              {columns.map((column) => (
                <div key={column.key} className="flex justify-between items-start">
                  <span className="text-sm font-medium text-gray-600 min-w-0 flex-1">
                    {column.label}:
                  </span>
                  <span className="text-sm text-gray-900 ml-2 text-right flex-1">
                    {column.format 
                      ? column.format(item[column.key], item)
                      : item[column.key]
                    }
                  </span>
                </div>
              ))}
              
              {actions && (
                <div className="pt-3 border-t border-gray-200">
                  <div className="flex space-x-2">
                    {onEdit && (
                      <button
                        onClick={() => onEdit(item)}
                        className="btn-inventory flex-1 py-3 flex items-center justify-center"
                      >
                        <Edit className="h-5 w-5 mr-2" />
                        Bearbeiten
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => onDelete(item)}
                        className="btn-expense flex-1 py-3 flex items-center justify-center"
                      >
                        <Trash2 className="h-5 w-5 mr-2" />
                        Löschen
                      </button>
                    )}
                    {onView && (
                      <button
                        onClick={() => onView(item)}
                        className="btn-employee flex-1 py-3 flex items-center justify-center"
                      >
                        <Eye className="h-5 w-5 mr-2" />
                        Anzeigen
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export default DataTable;