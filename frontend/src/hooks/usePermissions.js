import { useSelector } from "react-redux";
import { selectUser } from "@store/auth/authSelector.js";

/**
 * Hook untuk mengecek permission user di level komponen
 * @param {Object} options - Opsi permission
 * @param {string|string[]} [options.role] - Role yang diizinkan
 * @param {string|string[]} [options.anyRole] - Minimal salah satu role terpenuhi
 * @param {string|string[]} [options.allRoles] - Semua role harus terpenuhi
 * @returns {boolean} Status permission
 */
export const usePermission = (options = {}) => {
  const user = useSelector(selectUser);
  const { role, anyRole, allRoles } = options;

  if (role) {
    const roles = Array.isArray(role) ? role : [role];
    return roles.includes(user.role);
  }

  if (anyRole) {
    const roles = Array.isArray(anyRole) ? anyRole : [anyRole];
    return roles.includes(user.role);
  }

  if (allRoles) {
    const roles = Array.isArray(allRoles) ? allRoles : [allRoles];
    return roles.every((r) => r === user.role);
  }

  return true;
};
