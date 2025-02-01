'use client';
import {
  deleteRole,
  fetchRole,
  RoleHasPermission,
  Roles,
} from '@/store/apps/user_management/RoleManagmentSlice';
import { useDispatch, useSelector } from '@/store/hooks';
import { RootState } from '@/store/store';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button/Button';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
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
import {
  IconEdit,
  IconEyeCheck,
  IconSearch,
  IconTrash,
  IconX
} from '@tabler/icons-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import * as React from 'react';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import useAuth from '../../../../../auth/useAuth/page';

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
    id: 'pname',
    numeric: false,
    disablePadding: false,
    label: 'Description',
  },

  {
    id: 'status',
    numeric: false,
    disablePadding: false,
    label: 'Permissions',
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
    onSelectAllClick,
    order,
    orderBy,
    numSelected,
    rowCount,
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
  const { numSelected, handleSearch, search } = props;

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
          placeholder="Search Role"
          size="small"
          onChange={handleSearch}
          value={search}
        />
      </Box>
      <Tooltip title="Add Role">
        <Button
          variant="contained"
          color="secondary"
          sx={{ fontSize: '0.875rem', whiteSpace: 'nowrap' }}
          component={Link}
          href="/dashboard/user_management/roles/add"
        >
          Add Role
        </Button>
      </Tooltip>
    </Toolbar>
  );
};

const RolesTableList = () => {
  const [order, setOrder] = React.useState<Order>('asc');
  const [orderBy, setOrderBy] = React.useState<any>('calories');
  const [selected, setSelected] = React.useState<readonly string[]>([]);
  const [page, setPage] = React.useState(0);
  const [dense, setDense] = React.useState(false);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);

  const dispatch = useDispatch();
  const router = useRouter();
  
  const rolepermissions: Roles[] = useSelector(
    (state: RootState) => state.RoleReducer.rolePermissions
  );

  const [rows, setRows] = React.useState<any>(rolepermissions);
  const [search, setSearch] = React.useState('');

  React.useEffect(() => {
    setRows(rolepermissions);
  }, [rolepermissions]);

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    const searchValue = event.target.value.toLowerCase();
    setSearch(searchValue);
    if (searchValue === '') {
      setRows(rolepermissions);
    } else {
      const filteredRoles = rolepermissions.filter((role) =>
        role.name.toLowerCase().includes(searchValue)
      );
      console.log('search role', filteredRoles);
      setRows(filteredRoles);
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

  // This is for the single row sleect
  const handleClick = (event: React.MouseEvent<unknown>, name: string) => {
    const selectedIndex = selected.indexOf(name);
    let newSelected: readonly string[] = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, name);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1));
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selected.slice(0, selectedIndex),
        selected.slice(selectedIndex + 1)
      );
    }

    setSelected(newSelected);
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

  const handleChangeDense = (event: React.ChangeEvent<HTMLInputElement>) => {
    setDense(event.target.checked);
  };

  const isSelected = (name: string) => selected.indexOf(name) !== -1;

  // Avoid a layout jump when reaching the last page with empty rows.
  const emptyRows =
    page > 0 ? Math.max(0, (1 + page) * rowsPerPage - rows.length) : 0;

  const theme = useTheme();
  const borderColor = theme.palette.divider;

  // fetch role_has_permissions & roles
  const status = useSelector((state: RootState) => state.RoleReducer.status);
  const error = useSelector((state: RootState) => state.RoleReducer.error);

  const [showDrawer2, setShowDrawer2] = useState<string | null>(null);
  const [showDrawer1, setShowDrawer1] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);

  const handleDrawerClose1 = () => {
    setShowDrawer1(null);
  };
  const handleOpenDialog = (roleId: string) => {
    setShowDrawer2(roleId);
  };

  const handleDrawerClose2 = () => {
    setShowDrawer2(null);
  };

  useEffect(() => {
    const role = async () => {
      if (status === 'idle') {
        dispatch(fetchRole())
          .unwrap()
          .then((result) => {})
          .catch((error) => {
            toast.error(error.message);
          });
      }
    };
    role();
  }, [dispatch, status]);

  const handleDeleteRole = (roleId: string) => {
    dispatch(deleteRole(roleId))
      .unwrap()
      .then(() => {
        toast.success('Role deleted successfully!');
      })
      .catch((err) => {
        toast.error(err.message);
      });
  };

  const handleEdit = (roleId: string) => {
    router.push(`/dashboard/user_management/roles/edit/${roleId}`);
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
              size="medium"
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
                  .map((role, index) => {
                    return (
                      <TableRow
                        hover
                        role="checkbox"
                        tabIndex={-1}
                        key={role.id}
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
                            {role.name}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {role.description.toString().length > 20 ? (
                            <Typography>
                              {role.description.toString().substring(0, 20)}
                              <Typography color='primary'
                              sx={{
                               cursor: 'pointer'
                              }}
                                onClick={() => setShowDrawer1(String(role.id))}
                              >
                                ..._see more_
                              </Typography>
                              <Dialog
                                open={showDrawer1 === role.id}
                                onClose={() => setShowDrawer1(String(role.id))}
                                fullWidth
                                maxWidth={'sm'}
                                aria-labelledby="alert-dialog-title"
                                aria-describedby="alert-dialog-description"
                                PaperProps={{
                                  sx: { position: 'fixed', top: 30, m: 0 },
                                }}
                              >
                                <DialogContent className="testdialog">
                                  <Stack
                                    direction="row"
                                    spacing={6}
                                    alignItems="center"
                                    justifyContent="space-between"
                                  >
                                    <Typography variant="h5" p={1}>
                                      Description
                                    </Typography>
                                    <IconButton
                                      size="small"
                                      onClick={handleDrawerClose1}
                                    >
                                      <IconX size="18" />
                                    </IconButton>
                                  </Stack>
                                </DialogContent>
                                <Divider />
                                <Box
                                  p={2}
                                  sx={{
                                    maxHeight: '60vh',
                                    overflowY: 'auto',
                                    wordBreak: 'break-word',
                                    whiteSpace: 'normal',
                                    padding: '8px',
                                  }}
                                >
                                  <Box>
                                    <Typography>{role.description}</Typography>
                                  </Box>
                                </Box>
                              </Dialog>
                            </Typography>
                          ) : (
                            <Typography>{role.description}</Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Tooltip title="Permissions">
                            <IconButton
                              size="small"
                              onClick={() => setShowDrawer2(String(role.id))}
                            >
                              <IconEyeCheck size="1.1rem" />
                            </IconButton>
                          </Tooltip>
                          <Dialog
                            open={showDrawer2 === role.id}
                            onClose={() => setShowDrawer2(String(role.id))}
                            fullWidth
                            maxWidth={'sm'}
                            aria-labelledby="alert-dialog-title"
                            aria-describedby="alert-dialog-description"
                            PaperProps={{
                              sx: { position: 'fixed', top: 30, m: 0 },
                            }}
                          >
                            <DialogContent className="testdialog">
                              <Stack
                                direction="row"
                                spacing={6}
                                alignItems="center"
                                justifyContent="space-between"
                              >
                                <Typography variant="h5" p={1}>
                                  Allowed Permissions
                                </Typography>
                                <IconButton
                                  size="small"
                                  onClick={handleDrawerClose2}
                                >
                                  <IconX size="18" />
                                </IconButton>
                              </Stack>
                            </DialogContent>
                            <Divider />
                            <Box
                              p={2}
                              sx={{ maxHeight: '60vh', overflow: 'auto' }}
                            >
                              <Box>
                                {Array.isArray(role.role_has_permissions) &&
                                role.role_has_permissions.length === 0 ? (
                                  <Typography
                                    color="textSecondary"
                                    variant="subtitle2"
                                  >
                                    This role has no permission
                                  </Typography>
                                ) : (
                                  Array.isArray(role.role_has_permissions) &&
                                  role.role_has_permissions.map(
                                    (permission: RoleHasPermission) => (
                                      <Typography
                                        color="textSecondary"
                                        variant="subtitle2"
                                        key={permission.permissions.id}
                                      >
                                        {permission.permissions.name}
                                      </Typography>
                                    )
                                  )
                                )}
                              </Box>
                            </Box>
                          </Dialog>
                        </TableCell>
                        <TableCell>
                          <Tooltip title="Update">
                            <IconButton
                              size="small"
                              onClick={() => handleEdit(String(role.id))}
                            >
                              <IconEdit
                                size="1.1rem"
                                style={{ color: '#4caf50' }}
                              />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteRole(String(role.id))}
                            >
                              <IconTrash
                                size="1.1rem"
                                style={{ color: '#CF0000' }}
                              />
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

export default useAuth(RolesTableList);
