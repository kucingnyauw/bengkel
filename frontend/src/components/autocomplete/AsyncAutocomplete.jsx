/**
 * AsyncAutocomplete - Reusable async autocomplete component with debounced search and infinite query support.
 *
 * @component
 * @param {Object} props - Component props
 * @param {Object|null} props.value - Current selected value
 * @param {Function} props.onChange - Change handler, receives selected value
 * @param {string[]} [props.queryKey=[]] - React Query cache key prefix
 * @param {Function} props.fetchOptions - Async function to fetch options, receives search string
 * @param {Function} props.getOptionLabel - Function to get display label from option object
 * @param {Function} [props.renderOption] - Custom render function for option items
 * @param {string} [props.placeholder="Cari..."] - Input placeholder text
 * @param {number} [props.debounceMs=300] - Debounce delay in milliseconds
 * @param {Function} [props.isOptionEqualToValue] - Custom equality checker for value matching
 * @param {boolean} [props.disabled=false] - Disabled state
 * @param {string} [props.loadingText="Memuat..."] - Loading indicator text
 * @param {Object} [props.slotProps] - Additional slot props passed to Autocomplete
 *
 * @returns {JSX.Element} Rendered async autocomplete component
 *
 * @example
 * // Basic usage
 * <AsyncAutocomplete
 *   value={selectedCustomer}
 *   onChange={setSelectedCustomer}
 *   queryKey={["customers"]}
 *   fetchOptions={async (search) => {
 *     const res = await getCustomers({ search });
 *     return res?.data || [];
 *   }}
 *   getOptionLabel={(o) => o?.name || ""}
 *   placeholder="Cari pelanggan..."
 * />
 */
import { useState, useMemo } from "react";
import {
  Autocomplete,
  CircularProgress,
  TextField,
  useTheme,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useDebounce } from "@hooks/useDebounce.js";
import { STALE_TIME } from "@shared/constant";

const AsyncAutocomplete = ({
  value,
  onChange,
  queryKey = [],
  fetchOptions,
  getOptionLabel,
  renderOption,
  placeholder = "Cari...",
  debounceMs = 300,
  isOptionEqualToValue = (a, b) => a?.id === b?.id,
  disabled = false,
  loadingText = "Memuat...",
  slotProps,
}) => {
  const theme = useTheme();
  const [input, setInput] = useState("");

  const debounced = useDebounce(input, debounceMs);

  const { data, isLoading } = useQuery({
    queryKey: [...queryKey, debounced],
    queryFn: () => fetchOptions(debounced),
    enabled: true,
    staleTime: STALE_TIME,
    placeholderData: (prev) => prev,
  });

  const options = useMemo(() => data || [], [data]);

  return (
    <Autocomplete
      size="small"
      options={options}
      value={value}
      onChange={(_, v) => onChange(v)}
      onInputChange={(_, v) => setInput(v)}
      getOptionLabel={getOptionLabel}
      isOptionEqualToValue={isOptionEqualToValue}
      loading={isLoading}
      disabled={disabled}
      noOptionsText={isLoading ? loadingText : "Tidak ditemukan"}
      loadingText={loadingText}
      filterOptions={(x) => x}
      renderInput={(params) => (
        <TextField
          {...params}
          placeholder={placeholder}
          slotProps={{
            ...params.slotProps,
            input: {
              ...params.slotProps?.input,
              endAdornment: (
                <>
                  {isLoading && (
                    <CircularProgress
                      size={16}
                      sx={{ color: theme.palette.text.secondary }}
                    />
                  )}
                  {params.slotProps?.input?.endAdornment}
                </>
              ),
            },
          }}
        />
      )}
      renderOption={
        renderOption ||
        ((props, option) => (
          <li {...props} key={option.id || getOptionLabel(option)}>
            {getOptionLabel(option)}
          </li>
        ))
      }
      slotProps={{ paper: { sx: { mt: 0.5 } }, ...slotProps }}
    />
  );
};

export default AsyncAutocomplete;