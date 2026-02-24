import React from "react";
import Button from "./button";

interface Props {
  title: string;
  headers: string[];
  children: React.ReactNode;
  onFilter: (filter: string) => Promise<void>;
  page: number;
  setPage: (page: number) => void;
  more: boolean;
  createAction?: {
    label: string;
    onPress: () => void;
  };
  filterPlaceholder: string;
}

export default function AdminControlTable(props: Props) {
  const filterRef = React.useRef<HTMLInputElement>(null);

  async function filter() {
    await props.onFilter(`*${filterRef.current?.value}*`);
  }

  return (
    <div className="text-start py-8 px-4 sm:px-6 lg:px-8">
      <h3 className="text-neutral-100 text-xl">{props.title}</h3>
      <div className="bg-neutral-100 overflow-clip my-4">
        <div className="flex flex-col">
          <div className="-m-1.5 overflow-x-auto">
            <div className="p-1.5 min-w-full inline-block align-middle">
              <div className="overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="uppercase text-neutral-100 bg-slate-400 border-b-2 border-gray-500">
                    <tr>
                      {props.headers.map((header) => (
                        <th
                          key={header}
                          scope="col"
                          className="px-6 py-3 text-center text-xs font-medium"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  {props.children}
                  <tfoot>
                    <tr>
                      <td className="px-1 py-1">
                        <input
                          type="text"
                          ref={filterRef}
                          name="filter"
                          placeholder={props.filterPlaceholder}
                          className="px-2 py-1 text-sm border border-gray-300 rounded-lg"
                        />
                        <button
                          type="submit"
                          className="ml-2 px-2 py-1 text-sm font-semibold rounded-lg border border-orange-400 text-orange-400 hover:border-orange-800 hover:text-orange-800"
                          onClick={filter}
                        >
                          Submit
                        </button>
                      </td>
                      <td
                        colSpan={props.headers.length - 1}
                        className="text-end text-sm font-medium"
                      >
                        <button
                          className="w-12 p-1 text-sm font-semibold rounded-lg border border-transparent bg-white text-grey border-grey m-1 hover:bg-orange-200 disabled:bg-neutral-300 "
                          onClick={() => props.setPage(props.page - 1)}
                          disabled={props.page <= 0}
                        >
                          {" "}
                          «{" "}
                        </button>
                        <button
                          className="w-12 p-1 text-sm font-semibold rounded-lg border border-transparent bg-white text-grey border-grey m-1 hover:bg-orange-200 disabled:bg-neutral-300"
                          onClick={() => props.setPage(props.page + 1)}
                          disabled={!props.more}
                        >
                          {" "}
                          »{" "}
                        </button>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
      {props.createAction && (
        <div>
          <Button
            className="w-36 text-xs sm:text-sm sm:w-64"
            title={props.createAction.label}
            onPress={props.createAction.onPress}
          />
        </div>
      )}
    </div>
  );
}
