<?php

namespace App\Support;

use App\Models\User;

/** Role and permission helpers for API authorization. */
class RoleAccess
{
    public static function hasPermission(?User $user, string $permission): bool
    {
        $perms = $user?->role?->permissions;

        return is_array($perms) && in_array($permission, $perms, true);
    }

    public static function isSystemAdmin(?User $user): bool
    {
        return $user?->role?->role_name === 'system_admin';
    }

    public static function isSecurityAdmin(?User $user): bool
    {
        return in_array($user?->role?->role_name, ['security_admin', 'system_admin'], true);
    }

    public static function isClinician(?User $user): bool
    {
        return $user?->role?->role_name === 'clinician';
    }

    /** Can manage PHI policies (create/update/delete) for at least their org. */
    public static function canManagePolicies(?User $user): bool
    {
        return self::hasPermission($user, 'policies');
    }

    /** Can view audit events (org-wide for security admin, all orgs for system admin via filter). */
    public static function canViewAudit(?User $user): bool
    {
        return self::hasPermission($user, 'audit');
    }

    /** Can list conversations for everyone in the organization. */
    public static function canViewOrgConversations(?User $user): bool
    {
        return self::hasPermission($user, 'view_org_conversations');
    }

    /** Can list conversations across all organizations (system admin). */
    public static function canViewAllConversations(?User $user): bool
    {
        return self::hasPermission($user, 'view_all_conversations');
    }

    public static function canManageUsers(?User $user): bool
    {
        return self::isSystemAdmin($user) || self::hasPermission($user, 'manage_users');
    }

    public static function canManageOrganizations(?User $user): bool
    {
        return self::isSystemAdmin($user) || self::hasPermission($user, 'manage_organizations');
    }
}
