import { useMemo } from 'react';
import type { LngLatBoundsLike } from 'maplibre-gl';

import { Map, MapMarker, MarkerContent, MarkerTooltip } from '../ui/map';
import zipCounts from '../../data/zip-counts.json';
import zipGeoCache from '../../data/zip-geo-cache.json';

// Type for our data point
interface MapPoint {
    zip: string;
    count: number;
    lat: number;
    lon: number;
    name: string;
}

interface GeoCacheItem {
    lat: string;
    lon: string;
    display_name: string;
}

const geoCache = zipGeoCache as Record<string, GeoCacheItem>;

export function CommunityMap() {
    const points: MapPoint[] = useMemo(() => {
        return Object.entries(zipCounts)
            .map(([zip, count]) => {
                const geo = geoCache[zip];
                if (!geo) return null;
                return {
                    zip,
                    count: count as number,
                    lat: parseFloat(geo.lat),
                    lon: parseFloat(geo.lon),
                    name: geo.display_name.split(',')[0]
                };
            })
            .filter((p): p is MapPoint => p !== null)
            .sort((a, b) => b.count - a.count);
    }, []);

    const bounds = useMemo((): LngLatBoundsLike | undefined => {
        if (points.length === 0) return undefined;
        let minLat = Infinity,
            maxLat = -Infinity,
            minLon = Infinity,
            maxLon = -Infinity;

        points.forEach(p => {
            if (p.lat < minLat) minLat = p.lat;
            if (p.lat > maxLat) maxLat = p.lat;
            if (p.lon < minLon) minLon = p.lon;
            if (p.lon > maxLon) maxLon = p.lon;
        });

        return [
            [minLon, minLat],
            [maxLon, maxLat]
        ];
    }, [points]);

    if (!bounds) return <div>No data to map</div>;

    return (
        <div className="w-full h-96 md:h-150 bg-zinc-950 overflow-hidden relative border-2 border-border">
            <Map bounds={bounds} fitBoundsOptions={{ padding: 50 }}>
                {points.map(point => {
                    const radius = Math.sqrt(point.count) * 4 + 2;
                    const size = radius * 2;

                    return (
                        <MapMarker
                            key={point.zip}
                            longitude={point.lon}
                            latitude={point.lat}
                        >
                            <MarkerContent>
                                <div
                                    style={{
                                        width: `${size}px`,
                                        height: `${size}px`
                                    }}
                                    className="bg-primary/40 rounded-full border border-primary hover:bg-primary hover:opacity-100 transition-all duration-300"
                                />
                            </MarkerContent>
                            <MarkerTooltip>
                                {point.zip}: {point.count} guests
                            </MarkerTooltip>
                        </MapMarker>
                    );
                })}
            </Map>
            <div className="absolute bottom-4 right-4 bg-zinc-950 p-3 text-xs text-white border-2 border-border z-10 font-mono">
                Guest Zip Codes
            </div>
        </div>
    );
}
