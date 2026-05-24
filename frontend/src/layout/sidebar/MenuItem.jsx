/**
 * MenuItem - Recursive sidebar menu item supporting collapse, group, link, and badge.
 *
 * @component
 * @param {Object} props
 * @param {Object} props.item - Menu item configuration object
 * @param {boolean} props.isCollapsed - Whether sidebar is collapsed
 * @param {number} [props.level=0] - Nesting level for indentation
 * @param {Function} [props.onItemClick] - Callback when item is clicked
 * @returns {JSX.Element} Rendered menu item
 */
import { useState, useEffect, memo } from "react";
import {
  Box,
  Collapse,
  Typography,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Tooltip,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { alpha } from "@mui/material/styles";
import { Link, useLocation } from "react-router-dom";
import { ChevronDown, Dot } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";

import { setActiveItem } from "@store/sidebar/sidebarSlices.js";
import { selectSidebarActiveItem } from "@store/sidebar/sidebarSelector.js";

const MenuItem = memo(function MenuItem({
  item,
  isCollapsed,
  level = 0,
  onItemClick,
}) {
  const theme = useTheme();
  const location = useLocation();
  const dispatch = useDispatch();
  const activeItemId = useSelector(selectSidebarActiveItem);

  const [open, setOpen] = useState(false);

  const isExactMatch =
    activeItemId === item.id || location.pathname === item.url;

  const isChildMatch =
    item.type === "collapse" &&
    item.children?.some(
      (child) =>
        child.id === activeItemId || location.pathname === child.url
    );

  const isSelected = isExactMatch || isChildMatch;

  useEffect(() => {
    if (item.type === "collapse") {
      setOpen(isSelected && !isCollapsed);
    }
  }, [isSelected, item.type, isCollapsed]);

  const handleClick = (e) => {
    if (item.type === "collapse") {
      if (!isCollapsed) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      return;
    }

    dispatch(setActiveItem(item.id));
    onItemClick?.();
  };

  if (item.type === "group") {
    return (
      <Box
        sx={{
          mt: isCollapsed ? 0 : level === 0 ? 3 : 1.5,
          mb: isCollapsed ? 0 : 1,
        }}
      >
        {!isCollapsed && item.title && (
          <Typography
            variant="overline"
            sx={{
              px: 2,
              mb: 1.5,
              mt: level === 0 ? 0 : 0.5,
              display: "block",
              fontWeight: 500,
              color: "text.disabled",
              letterSpacing: "0.06em",
              fontSize: "0.625rem",
            }}
          >
            {item.title}
          </Typography>
        )}

        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
          {item.children?.map((child) => (
            <MenuItem
              key={child.id}
              item={child}
              isCollapsed={isCollapsed}
              level={level}
              onItemClick={onItemClick}
            />
          ))}
        </Box>
      </Box>
    );
  }

  const Icon = item.icon;
  const hasChildren =
    item.type === "collapse" && item.children?.length > 0;

  const indentPadding = isCollapsed ? 0 : 2 + level * 2.5;

  const listItem = (
    <ListItemButton
      component={item.url ? Link : "div"}
      to={item.url || undefined}
      onClick={handleClick}
      selected={isExactMatch}
      sx={{
        minHeight: 44,
        pl: indentPadding,
        pr: isCollapsed ? 0 : 1.5,
        py: 1.25,
        justifyContent: isCollapsed ? "center" : "flex-start",
        borderRadius: `${theme.shape.borderRadius}px`,
        "&.Mui-selected": {
          backgroundColor: alpha(theme.palette.secondary.main, 0.08),
          color: theme.palette.secondary.main,
          "& .MuiListItemIcon-root": {
            color: theme.palette.secondary.main,
          },
          "&:hover": {
            backgroundColor: alpha(theme.palette.secondary.main, 0.12),
          },
        },
        "&:hover": {
          backgroundColor: alpha(theme.palette.secondary.main, 0.04),
        },
        transition: "all 0.2s ease",
      }}
    >
      {Icon && (
        <ListItemIcon
          sx={{
            minWidth: isCollapsed ? "auto" : 40,
            mr: isCollapsed ? 0 : 1.5,
            color: isSelected ? theme.palette.secondary.main : "text.secondary",
            transition: "color 0.2s ease",
          }}
        >
          <Icon
            size={level > 0 ? 15 : 17}
            strokeWidth={isSelected ? 1.75 : 1.5}
          />
        </ListItemIcon>
      )}

      {level > 0 && !isCollapsed && (
        <Box
          sx={{
            width: 16,
            height: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            mr: 0.5,
            color: isSelected ? theme.palette.secondary.main : "text.disabled",
            transition: "all 0.2s ease",
          }}
        >
          <Dot
            size={isSelected ? 12 : 8}
            strokeWidth={isSelected ? 2.5 : 1.5}
            fill={isSelected ? theme.palette.secondary.main : "transparent"}
          />
        </Box>
      )}

      {!isCollapsed && (
        <>
          <ListItemText
            primary={item.title}
            slotProps={{
              primary: {
                sx: {
                  fontSize: level > 0 ? "0.8125rem" : "0.84375rem",
                  fontWeight: isSelected ? 500 : 400,
                  transition: "all 0.2s ease",
                },
              },
            }}
          />

          {hasChildren && (
            <ChevronDown
              size={13}
              strokeWidth={1.5}
              style={{
                color: isSelected
                  ? theme.palette.secondary.main
                  : theme.palette.text.disabled,
                transition: "transform 0.25s ease",
                transform: open ? "rotate(180deg)" : "rotate(0deg)",
              }}
            />
          )}

          {item.badge && (
            <Box
              sx={{
                ml: 1,
                px: 0.8,
                py: 0.2,
                borderRadius: `${theme.shape.borderRadius}px`,
                fontSize: "0.625rem",
                fontWeight: 500,
                backgroundColor: alpha(theme.palette.secondary.main, 0.1),
                color: theme.palette.secondary.main,
                border: `1px solid ${alpha(theme.palette.secondary.main, 0.2)}`,
                lineHeight: 1.2,
              }}
            >
              {item.badge}
            </Box>
          )}
        </>
      )}
    </ListItemButton>
  );

  const wrapped = isCollapsed ? (
    <Tooltip
      title={item.title}
      placement="right"
      enterDelay={400}
      leaveDelay={100}
    >
      {listItem}
    </Tooltip>
  ) : (
    listItem
  );

  if (hasChildren) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column" }}>
        {wrapped}

        <Collapse in={open && !isCollapsed} timeout="auto" unmountOnExit>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 0.5,
              mt: 0.5,
              mb: 0.5,
              ml: isCollapsed ? 0 : 4,
            }}
          >
            {item.children.map((child) => (
              <MenuItem
                key={child.id}
                item={child}
                isCollapsed={isCollapsed}
                level={level + 1}
                onItemClick={onItemClick}
              />
            ))}
          </Box>
        </Collapse>
      </Box>
    );
  }

  return wrapped;
});

export default MenuItem;