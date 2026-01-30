/**
 * App admin utilities.
 *
 * App admins are calendar administrators who manage the Hello Miami Luma calendar.
 * Since the Luma API does not expose calendar admin information, we configure
 * admin emails via an environment variable.
 *
 * Set the APP_ADMIN_EMAILS environment variable to a comma-separated list
 * of email addresses to configure app admins.
 */

/**
 * Get the list of app admin emails from the environment.
 */
export function getAppAdminEmails(): string[] {
    const emailsString = process.env.APP_ADMIN_EMAILS || '';
    if (!emailsString.trim()) {
        return [];
    }
    return emailsString
        .split(',')
        .map(email => email.trim().toLowerCase())
        .filter(Boolean);
}

/**
 * Check if an email belongs to an app admin.
 */
export function isAppAdmin(email: string): boolean {
    const adminEmails = getAppAdminEmails();
    return adminEmails.includes(email.toLowerCase());
}
