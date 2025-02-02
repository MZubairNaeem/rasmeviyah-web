
import { deleteUser, fetchUser, Role, User } from '@/store/apps/user_management/UserSlice';
import { useDispatch, useSelector } from '@/store/hooks';
import { RootState } from '@/store/store';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button/Button';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Paper from '@mui/material/Paper';
import { useTheme } from '@mui/material/styles';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import TableSortLabel from '@mui/material/TableSortLabel';
import TextField from '@mui/material/TextField';
import Toolbar from '@mui/material/Toolbar';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { visuallyHidden } from '@mui/utils';
import { IconEdit, IconSearch, IconTrash } from '@tabler/icons-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import * as React from 'react';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
// import useAuth from '../../../../../auth/useAuth/page';

function descendingComparator<T>(a: T, b: T, orderBy: keyof T) {
  if (b[orderBy] < a[orderBy]) {
    return -1;
  }
  if (b[orderBy] > a[orderBy]) {
    return 1;
  }

  return 0;
}

type Order = 'asc' | 'desc';

function getComparator<Key extends keyof any>(
  order: Order,
  orderBy: Key
): (
  a: { [key in Key]: number | string },
  b: { [key in Key]: number | string }
) => number {
  return order === 'desc'
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}

function stableSort<T>(array: T[], comparator: (a: T, b: T) => number) {
  const stabilizedThis = array.map((el, index) => [el, index] as [T, number]);
  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) {
      return order;
    }

    return a[1] - b[1];
  });

  return stabilizedThis.map((el) => el[0]);
}

interface HeadCell {
  disablePadding: boolean;
  id: string;
  label: string;
  numeric: boolean;
}

const headCells: readonly HeadCell[] = [
  {
    id: 'name',
    numeric: false,
    disablePadding: false,
    label: 'Name',
  },
  {
    id: 'email',
    numeric: false,
    disablePadding: false,
    label: 'Email',
  },

  {
    id: 'role',
    numeric: false,
    disablePadding: false,
    label: 'Role',
  },
  {
    id: 'action',
    numeric: false,
    disablePadding: false,
    label: 'Action',
  },
];

interface EnhancedTableProps {
  numSelected: number;
  onRequestSort: (event: React.MouseEvent<unknown>, property: any) => void;
  onSelectAllClick: (event: React.ChangeEvent<HTMLInputElement>) => void;
  order: Order;
  orderBy: string;
  rowCount: number;
}

function EnhancedTableHead(props: EnhancedTableProps) {
  const {
    order,
    orderBy,
    onRequestSort,
  } = props;
  const createSortHandler =
    (property: any) => (event: React.MouseEvent<unknown>) => {
      onRequestSort(event, property);
    };

  return (
    <TableHead>
      <TableRow>
        <TableCell>
          <Typography
            fontWeight="400"
            sx={{
              pl: 2,
              pr: 1,
            }}
          >
            #
          </Typography>
        </TableCell>
        {headCells.map((headCell) => (
          <TableCell
            key={headCell.id}
            align={headCell.numeric ? 'right' : 'left'}
            padding={headCell.disablePadding ? 'none' : 'normal'}
            sortDirection={orderBy === headCell.id ? order : false}
          >
            <TableSortLabel
              active={orderBy === headCell.id}
              direction={orderBy === headCell.id ? order : 'asc'}
              onClick={createSortHandler(headCell.id)}
            >
              {headCell.label}
              {orderBy === headCell.id ? (
                <Box component="span" sx={visuallyHidden}>
                  {order === 'desc' ? 'sorted descending' : 'sorted ascending'}
                </Box>
              ) : null}
            </TableSortLabel>
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  );
}

interface EnhancedTableToolbarProps {
  numSelected: number;
  handleSearch: React.ChangeEvent<HTMLInputElement> | any;
  search: string;
}

const EnhancedTableToolbar = (props: EnhancedTableToolbarProps) => {
  const { handleSearch, search } = props;

  return (
    <Toolbar>
      <Box sx={{ flex: '1 1 100%' }}>
        <TextField
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <IconSearch size="1.1rem" />
              </InputAdornment>
            ),
          }}
          placeholder="Search User"
          size="small"
          onChange={handleSearch}
          value={search}
        />
      </Box>
      <Tooltip title="Add User">
        <Button
          variant="contained"
          component={Link}
          href="/dashboard/user_management/users/add"
          color="secondary"
          sx={{ fontSize: '0.875rem', whiteSpace: 'nowrap' }}
        >
          Add User
        </Button>
      </Tooltip>
    </Toolbar>
  );
};

const UsersTableList = () => {
  const [order, setOrder] = React.useState<Order>('asc');
  const [orderBy, setOrderBy] = React.useState<any>('calories');
  const [selected, setSelected] = React.useState<readonly string[]>([]);
  const [page, setPage] = React.useState(0);
  const [dense, setDense] = React.useState(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);

  const dispatch = useDispatch();
  const router = useRouter();


  const users = useSelector(
    (state: RootState) => state.UserReducer.users
  ) as User[];

  const [rows, setRows] = React.useState<any>(users);
  const [search, setSearch] = React.useState('');

  React.useEffect(() => {
    setRows(users);
  }, [users]);

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    const searchValue = event.target.value.toLowerCase();
    setSearch(searchValue);
    if (searchValue === '') {
      setRows(users);
    } else {
      const filteredUser = users.filter((user) =>
        user.name.toLowerCase().includes(searchValue)
      );
      setRows(filteredUser);
    }
  };

  // This is for the sorting
  const handleRequestSort = (
    event: React.MouseEvent<unknown>,
    property: any
  ) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  // This is for select all the row
  const handleSelectAllClick = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const newSelecteds = rows.map((n: any) => n.title);
      setSelected(newSelecteds);

      return;
    }
    setSelected([]);
  };

 

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };


  const theme = useTheme();
  const borderColor = theme.palette.divider;

  const status = useSelector((state: RootState) => state.UserReducer.status);

  useEffect(() => {
    setLoading(true);
    const user = async () => {
      if (status === 'idle') {
        dispatch(fetchUser())
          .unwrap()
          .then((result) => {})
          .catch((error) => {
            toast.error(error.message)
          });
      }
    };
    user();
    setLoading(false);
  }, [dispatch, status]);

  const handleDeleteUser = async (userId: string) => {
    try {
      const resultAction = await dispatch(deleteUser(userId));

      if (deleteUser.fulfilled.match(resultAction)) {
        toast.success('User deleted successfully');
      } else if (deleteUser.rejected.match(resultAction)) {
      }
    } catch (error: any) {
      toast.error(error.message)

    }
  };

  const handleEdit = (userId: string) => {
    router.push(`/dashboard/user_management/users/edit/${userId}`);
  };

  return (
    <Box>
      <Box>
        <EnhancedTableToolbar
          numSelected={selected.length}
          search={search}
          handleSearch={(event: any) => handleSearch(event)}
        />
        <Paper
          variant="outlined"
          sx={{ mx: 2, mt: 1, border: `1px solid ${borderColor}` }}
        >
          <TableContainer>
            <Table
              sx={{ minWidth: 750 }}
              aria-labelledby="tableTitle"
              size={dense ? 'small' : 'medium'}
            >
              <EnhancedTableHead
                numSelected={selected.length}
                order={order}
                orderBy={orderBy}
                onSelectAllClick={handleSelectAllClick}
                onRequestSort={handleRequestSort}
                rowCount={rows.length}
              />
              <TableBody>
                {stableSort(rows, getComparator(order, orderBy))
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((user, index) => {
                    return (
                      <TableRow
                        hover
                        role="checkbox"
                        tabIndex={-1}
                        key={user.id}
                      >
                        <TableCell>
                          <Typography
                            variant="h6"
                            fontWeight="400"
                            sx={{
                              pl: 2,
                              pr: 1,
                            }}
                          >
                            {index + 1}
                          </Typography>
                        </TableCell>

                        <TableCell>
                          <Typography variant="h6" fontWeight="600">
                            {user.name}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography>{user.email}</Typography>
                        </TableCell>

                        <TableCell>
                          <Typography color="textSecondary" variant="subtitle2">
                            {(user.roles as unknown as Role)?.name || <Typography color='blue'>No Role Assigned</Typography>}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Tooltip title="Update">
                            <IconButton
                              size="small"
                              onClick={() => handleEdit(String(user.id))}
                            >
                              <IconEdit size="1.1rem"  style={{ color: '#4caf50' }}/>
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteUser(String(user.id))}
                            >
                              <IconTrash size="1.1rem"  style={{ color: '#CF0000' }}/>
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={rows.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Paper>
      </Box>
    </Box>
  );
};

export default UsersTableList;
