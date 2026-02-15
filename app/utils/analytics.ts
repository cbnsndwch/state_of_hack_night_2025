/**
 * Analytics utilities for tracking user interactions
 *
 * This module provides a simple interface for tracking navigation and user events.
 * Can be extended to send data to analytics services like Plausible, PostHog, etc.
 */

interface NavClickEvent {
    href: string;
    label: string;
    timestamp: number;
    deviceType: 'mobile' | 'desktop';
}

/**
 * Track navigation item clicks
 *
 * @param href - The navigation destination
 * @param label - The navigation item label
 */
export function trackNavClick(href: string, label: string): void {
    const deviceType = window.innerWidth < 768 ? 'mobile' : 'desktop';

    const event: NavClickEvent = {
        href,
        label,
        timestamp: Date.now(),
        deviceType
    };

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
        console.log('[Analytics] Nav click:', event);
    }

    // Store in localStorage for basic tracking
    // In production, this would send to an analytics service
    try {
        const storedEvents = localStorage.getItem('nav_analytics');
        const events: NavClickEvent[] = storedEvents
            ? JSON.parse(storedEvents)
            : [];

        // Keep only last 100 events
        events.push(event);
        if (events.length > 100) {
            events.shift();
        }

        localStorage.setItem('nav_analytics', JSON.stringify(events));
    } catch (error) {
        // Silently fail if localStorage is not available
        console.warn('[Analytics] Failed to store event:', error);
    }

    // TODO: Send to analytics service (e.g., Plausible, PostHog)
    // Example: plausible('Navigation Click', { props: { href, label, deviceType } });
}

/**
 * Get navigation analytics summary
 *
 * @returns Analytics summary with most clicked items
 */
export function getNavAnalytics(): {
    mostClicked: Array<{ label: string; count: number }>;
    mobileVsDesktop: { mobile: number; desktop: number };
    totalClicks: number;
} {
    try {
        const storedEvents = localStorage.getItem('nav_analytics');
        if (!storedEvents) {
            return {
                mostClicked: [],
                mobileVsDesktop: { mobile: 0, desktop: 0 },
                totalClicks: 0
            };
        }

        const events: NavClickEvent[] = JSON.parse(storedEvents);

        // Count clicks by label
        const clickCounts = new Map<string, number>();
        let mobileCount = 0;
        let desktopCount = 0;

        events.forEach(event => {
            clickCounts.set(
                event.label,
                (clickCounts.get(event.label) || 0) + 1
            );
            if (event.deviceType === 'mobile') {
                mobileCount++;
            } else {
                desktopCount++;
            }
        });

        // Sort by count and get top items
        const mostClicked = Array.from(clickCounts.entries())
            .map(([label, count]) => ({ label, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        return {
            mostClicked,
            mobileVsDesktop: { mobile: mobileCount, desktop: desktopCount },
            totalClicks: events.length
        };
    } catch (error) {
        console.warn('[Analytics] Failed to get analytics:', error);
        return {
            mostClicked: [],
            mobileVsDesktop: { mobile: 0, desktop: 0 },
            totalClicks: 0
        };
    }
}

/**
 * Clear analytics data
 */
export function clearNavAnalytics(): void {
    try {
        localStorage.removeItem('nav_analytics');
    } catch (error) {
        console.warn('[Analytics] Failed to clear analytics:', error);
    }
}
