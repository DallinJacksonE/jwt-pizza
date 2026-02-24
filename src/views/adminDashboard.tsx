import React from "react";
import View from "./view";
import { useNavigate } from "react-router-dom";
import NotFound from "./notFound";
import { pizzaService } from "../service/service";
import {
  Franchise,
  FranchiseList,
  Role,
  Store,
  User,
  UserList,
} from "../service/pizzaService";
import { TrashIcon } from "../icons";
import AdminControlTable from "../components/adminControlTable";

interface Props {
  user: User | null;
}

export default function AdminDashboard(props: Props) {
  const navigate = useNavigate();
  const [franchiseList, setFranchiseList] = React.useState<FranchiseList>({
    franchises: [],
    more: false,
  });
  const [franchisePage, setFranchisePage] = React.useState(0);
  const [franchiseFilter, setFranchiseFilter] = React.useState("*");
  const [userList, setUserList] = React.useState<UserList>({
    users: [],
    more: false,
  });
  const [userPage, setUserPage] = React.useState(0);
  const [userFilter, setUserFilter] = React.useState("*");
  const [refreshKey, setRefreshKey] = React.useState(0);

  React.useEffect(() => {
    (async () => {
      if (props.user) {
        setFranchiseList(
          await pizzaService.getFranchises(franchisePage, 10, franchiseFilter),
        );
      }
    })();
  }, [props.user, franchisePage, franchiseFilter, refreshKey]);

  React.useEffect(() => {
    (async () => {
      if (props.user) {
        setUserList(await pizzaService.getUsers(userPage, 10, userFilter));
      }
    })();
  }, [props.user, userPage, userFilter, refreshKey]);

  function createFranchise() {
    navigate("/admin-dashboard/create-franchise");
  }

  async function closeFranchise(franchise: Franchise) {
    navigate("/admin-dashboard/close-franchise", {
      state: { franchise: franchise },
    });
  }

  async function closeStore(franchise: Franchise, store: Store) {
    navigate("/admin-dashboard/close-store", {
      state: { franchise: franchise, store: store },
    });
  }

  async function filterFranchises(filter: string) {
    setFranchisePage(0);
    setFranchiseFilter(filter);
  }

  async function filterUsers(filter: string) {
    setUserPage(0);
    setUserFilter(filter);
  }

  async function deleteUser(user: User) {
    if (window.confirm(`Are you sure you want to delete user ${user.name}?`)) {
      await pizzaService.deleteUser(user);
      setRefreshKey((k) => k + 1);
    }
  }

  let response = <NotFound />;
  if (Role.isRole(props.user, Role.Admin)) {
    response = (
      <View title="Mama Ricci's kitchen">
        <AdminControlTable
          title="Franchises"
          headers={["Franchise", "Franchisee", "Store", "Revenue", "Action"]}
          page={franchisePage}
          setPage={setFranchisePage}
          more={franchiseList.more}
          onFilter={filterFranchises}
          createAction={{ label: "Add Franchise", onPress: createFranchise }}
          filterPlaceholder="Filter franchises"
        >
          {franchiseList.franchises.map((franchise, findex) => (
            <tbody key={findex} className="divide-y divide-gray-200">
              <tr className="border-neutral-500 border-t-2">
                <td className="text-start px-2 whitespace-nowrap text-l font-mono text-orange-600">
                  {franchise.name}
                </td>
                <td
                  className="text-start px-2 whitespace-nowrap text-sm font-normal text-gray-800"
                  colSpan={3}
                >
                  {franchise.admins?.map((o) => o.name).join(", ")}
                </td>
                <td className="px-6 py-1 whitespace-nowrap text-end text-sm font-medium">
                  <button
                    type="button"
                    className="px-2 py-1 inline-flex items-center gap-x-2 text-sm font-semibold rounded-lg border border-1 border-orange-400 text-orange-400  hover:border-orange-800 hover:text-orange-800"
                    onClick={() => closeFranchise(franchise)}
                  >
                    <TrashIcon />
                    Close
                  </button>
                </td>
              </tr>
              {franchise.stores.map((store, sindex) => (
                <tr key={sindex} className="bg-neutral-100">
                  <td
                    className="text-end px-2 whitespace-nowrap text-sm text-gray-800"
                    colSpan={3}
                  >
                    {store.name}
                  </td>
                  <td className="text-end px-2 whitespace-nowrap text-sm text-gray-800">
                    {store.totalRevenue?.toLocaleString()} ₿
                  </td>
                  <td className="px-6 py-1 whitespace-nowrap text-end text-sm font-medium">
                    <button
                      type="button"
                      className="px-2 py-1 inline-flex items-center gap-x-2 text-sm font-semibold rounded-lg border border-1 border-orange-400 text-orange-400 hover:border-orange-800 hover:text-orange-800"
                      onClick={() => closeStore(franchise, store)}
                    >
                      <TrashIcon />
                      Close
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          ))}
        </AdminControlTable>
        <AdminControlTable
          title="Users"
          headers={["Name", "Email", "Roles", "Action"]}
          page={userPage}
          setPage={setUserPage}
          more={userList.more}
          onFilter={filterUsers}
          filterPlaceholder="Filter by name or email"
        >
          <tbody className="divide-y divide-gray-200">
            {userList.users.map((user, uindex) => (
              <tr key={uindex} className="bg-neutral-100">
                <td className="text-start px-2 whitespace-nowrap text-sm font-normal text-gray-800">
                  {user.name}
                </td>
                <td className="text-start px-2 whitespace-nowrap text-sm font-normal text-gray-800">
                  {user.email}
                </td>
                <td className="text-start px-2 whitespace-nowrap text-sm font-normal text-gray-800">
                  {user.roles?.map((r) => r.role).join(", ")}
                </td>
                <td className="px-6 py-1 whitespace-nowrap text-end text-sm font-medium">
                  <button
                    type="button"
                    className="px-2 py-1 inline-flex items-center gap-x-2 text-sm font-semibold rounded-lg border border-1 border-red-400 text-red-400  hover:border-red-800 hover:text-red-800"
                    onClick={() => deleteUser(user)}
                  >
                    <TrashIcon />
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </AdminControlTable>
      </View>
    );
  }

  return response;
}
