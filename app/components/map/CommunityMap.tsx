import { useMemo, useState, useRef } from 'react';
import MapLibreGL, { type LngLatBoundsLike } from 'maplibre-gl';
import useSupercluster from 'use-supercluster';

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

    // Clustering setup
    const mapRef = useRef<MapLibreGL.Map | null>(null);
    const [zoom, setZoom] = useState(10);
    const [mapBounds, setMapBounds] = useState<
        [number, number, number, number] | null
    >(null);

    const pointsGeoJson = useMemo(() => {
        return points.map(p => ({
            type: 'Feature' as const,
            properties: { cluster: false, pointId: p.zip, ...p },
            geometry: {
                type: 'Point' as const,
                coordinates: [p.lon, p.lat]
            }
        }));
    }, [points]);

    const { clusters, supercluster } = useSupercluster({
        points: pointsGeoJson,
        bounds: mapBounds ?? undefined,
        zoom,
        options: { radius: 75, maxZoom: 15 }
    });

    const updateMapState = () => {
        if (mapRef.current) {
            setZoom(mapRef.current.getZoom());
            const b = mapRef.current.getBounds();
            setMapBounds([
                b.getWest(),
                b.getSouth(),
                b.getEast(),
                b.getNorth()
            ]);
        }
    };

    if (!bounds) {
        return <div>No data to map</div>;
    }

    return (
        <div className="w-full h-96 md:h-150 bg-zinc-950 overflow-hidden relative border-2 border-border">
            <Map
                ref={mapRef}
                bounds={bounds}
                fitBoundsOptions={{ padding: 50 }}
                onMoveEnd={updateMapState}
                onLoad={updateMapState}
            >
                {clusters.map(cluster => {
                    const [longitude, latitude] = cluster.geometry.coordinates;
                    const { cluster: isCluster, point_count: pointCount } =
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        cluster.properties as any;

                    if (isCluster) {
                        const leaves = supercluster?.getLeaves(
                            cluster.id as number,
                            Infinity
                        );

                        return (
                            <MapMarker
                                key={`cluster-${cluster.id}`}
                                latitude={latitude}
                                longitude={longitude}
                                onClick={() => {
                                    const expansionZoom = Math.min(
                                        supercluster!.getClusterExpansionZoom(
                                            cluster.id as number
                                        ),
                                        20
                                    );
                                    mapRef.current?.flyTo({
                                        center: [longitude, latitude],
                                        zoom: expansionZoom,
                                        speed: 1.2
                                    });
                                }}
                            >
                                <MarkerContent>
                                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground border-2 border-primary-foreground font-bold shadow-lg hover:scale-110 transition-transform cursor-pointer">
                                        {pointCount}
                                    </div>
                                </MarkerContent>
                                <MarkerTooltip className="p-0 border-none bg-transparent shadow-none">
                                    <div className="w-56 rounded-md border bg-popover text-popover-foreground shadow-md overflow-hidden">
                                        <div className="bg-muted/50 px-3 py-2 border-b">
                                            <h4 className="font-medium text-xs text-muted-foreground uppercase tracking-wider">
                                                Zip Codes
                                            </h4>
                                        </div>
                                        <div className="max-h-48 overflow-y-auto p-2">
                                            {leaves?.map(leaf => {
                                                const p =
                                                    leaf.properties as unknown as MapPoint;
                                                return (
                                                    <div
                                                        key={p.zip}
                                                        className="flex justify-between items-center py-1.5 px-2 hover:bg-muted/50 rounded-sm transition-colors"
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <div className="size-1.5 rounded-full bg-primary/70" />
                                                            <span className="font-sans text-sm text-foreground">
                                                                {p.zip}
                                                            </span>
                                                        </div>
                                                        <span className="text-xs font-medium text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">
                                                            {p.count} guests
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        <div className="bg-muted/30 px-3 py-1.5 border-t text-[10px] text-muted-foreground text-center">
                                            {leaves?.length} locations in this
                                            cluster
                                        </div>
                                    </div>
                                </MarkerTooltip>
                            </MapMarker>
                        );
                    }

                    // Individual point
                    const point = cluster.properties as unknown as MapPoint;
                    const radius = Math.sqrt(point.count) * 4 + 2;
                    const size = radius * 2;

                    return (
                        <MapMarker
                            key={point.zip}
                            longitude={longitude}
                            latitude={latitude}
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
        </div>
    );
}
