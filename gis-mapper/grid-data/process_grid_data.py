"""
Process OSM Overpass API power infrastructure data into clean GeoJSON layers.
Merges with existing hard-coded data from power-grid-map.html for Ko Phangan.
"""

import json
import os

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

# --- Existing Ko Phangan data from power-grid-map.html ---
EXISTING_KP_DATA = {
    "substations": [
        {
            "name": "PEA 115 kV Substation Koh Phangan",
            "name_th": "สถานีไฟฟ้า 115 kV เกาะพะงัน",
            "lat": 9.7066, "lng": 99.9948,
            "voltage": "115000",
            "substation_type": "transmission",
            "operator": "PEA",
            "source": "power-grid-map.html"
        }
    ],
    "cables": [
        {
            "name": "115 kV Submarine Cable Samui-Phangan",
            "voltage": "115000",
            "cable_type": "submarine",
            "operator": "EGAT/PEA",
            "coordinates": [
                [100.0032039, 9.5672669],  # Samui end
                [100.0010000, 9.5900000],
                [99.9980000, 9.6200000],
                [99.9960000, 9.6500000],
                [99.9950000, 9.6800000],
                [99.9947557, 9.7064741],  # Phangan substation
            ],
            "source": "power-grid-map.html"
        }
    ],
    "distribution_lines": [
        {
            "name": "33kV North Coast Feeder",
            "voltage": "33000",
            "coordinates": [
                [99.9948, 9.7066],  # Substation
                [99.9700, 9.7200],  # Ban Tai Beach
                [99.9450, 9.7350],  # Sri Thanu
                [99.9250, 9.7500],  # Mae Haad
                [99.9300, 9.7700],  # Chaloklum
            ],
            "source": "power-grid-map.html (estimated)"
        },
        {
            "name": "33kV Thongsala Feeder",
            "voltage": "33000",
            "coordinates": [
                [99.9948, 9.7066],  # Substation
                [99.9860, 9.7175],  # PEA Office / Thongsala
                [99.9750, 9.7250],  # Wok Tum
            ],
            "source": "power-grid-map.html (estimated)"
        },
        {
            "name": "33kV South Feeder (Haad Rin)",
            "voltage": "33000",
            "coordinates": [
                [99.9948, 9.7066],  # Substation
                [100.0100, 9.6900],  # Southeast
                [100.0600, 9.6750],  # Haad Rin
            ],
            "source": "power-grid-map.html (estimated)"
        },
        {
            "name": "33kV East Coast Feeder",
            "voltage": "33000",
            "coordinates": [
                [99.9948, 9.7066],  # Substation
                [100.0200, 9.7200],  # East coast
                [100.0500, 9.7450],  # Thong Nai Pan
            ],
            "source": "power-grid-map.html (estimated)"
        },
        {
            "name": "33kV Ban Tai Feeder",
            "voltage": "33000",
            "coordinates": [
                [99.9948, 9.7066],  # Substation
                [99.9800, 9.6950],  # Ban Tai junction
                [99.9600, 9.6900],  # Ban Tai Beach south
            ],
            "source": "power-grid-map.html (estimated)"
        }
    ],
    "transformers": [
        {"name": "Ban Tai Junction", "lat": 9.6950, "lng": 99.9800, "voltage": "33000/400"},
        {"name": "Ban Tai Beach", "lat": 9.7200, "lng": 99.9700, "voltage": "33000/400"},
        {"name": "Sri Thanu", "lat": 9.7350, "lng": 99.9450, "voltage": "33000/400"},
        {"name": "Mae Haad", "lat": 9.7500, "lng": 99.9250, "voltage": "33000/400"},
        {"name": "Chaloklum", "lat": 9.7700, "lng": 99.9300, "voltage": "33000/400"},
        {"name": "Thongsala Center", "lat": 9.7175, "lng": 99.9860, "voltage": "33000/400"},
        {"name": "Wok Tum", "lat": 9.7250, "lng": 99.9750, "voltage": "33000/400"},
        {"name": "Haad Rin Road", "lat": 9.6900, "lng": 100.0100, "voltage": "33000/400"},
        {"name": "Haad Rin", "lat": 9.6750, "lng": 100.0600, "voltage": "33000/400"},
        {"name": "Thong Nai Pan", "lat": 9.7450, "lng": 100.0500, "voltage": "33000/400"},
        {"name": "Bottle Beach Road", "lat": 9.7600, "lng": 100.0200, "voltage": "33000/400"},
    ],
    "pea_offices": [
        {"name": "PEA Koh Phangan Office", "lat": 9.7175, "lng": 99.9860, "phone": "077-377072"},
    ]
}


def osm_element_to_geojson_feature(element, region):
    """Convert an OSM element to a GeoJSON Feature."""
    tags = element.get("tags", {})
    power_type = tags.get("power", "unknown")

    props = {
        "id": f"osm_{element.get('id', 'unknown')}",
        "osm_id": element.get("id"),
        "osm_type": element.get("type"),
        "power_type": power_type,
        "region": region,
        "source": "osm",
    }

    # Copy relevant tags
    for key in ["name", "name:en", "name:th", "operator", "voltage",
                "cables", "circuits", "substation", "generator:source",
                "generator:output:electricity", "plant:output:electricity",
                "frequency"]:
        if key in tags:
            props[key] = tags[key]

    # Determine geometry
    etype = element.get("type")

    if etype == "node":
        geometry = {
            "type": "Point",
            "coordinates": [element["lon"], element["lat"]]
        }
    elif etype == "way":
        geom = element.get("geometry", [])
        coords = [[pt["lon"], pt["lat"]] for pt in geom]
        if len(coords) < 2:
            return None
        # Check if it's a closed way (polygon) — for substations, plants
        if power_type in ("substation", "plant", "generator") and len(coords) >= 4 and coords[0] == coords[-1]:
            geometry = {"type": "Polygon", "coordinates": [coords]}
        else:
            geometry = {"type": "LineString", "coordinates": coords}
    elif etype == "relation":
        # For relations, try to extract geometry from members
        members = element.get("members", [])
        coords = []
        for member in members:
            if "geometry" in member:
                coords.extend([[pt["lon"], pt["lat"]] for pt in member["geometry"]])
            elif "lat" in member and "lon" in member:
                coords.append([member["lon"], member["lat"]])
        if not coords:
            return None
        if len(coords) == 1:
            geometry = {"type": "Point", "coordinates": coords[0]}
        elif power_type in ("substation", "plant"):
            if len(coords) >= 4 and coords[0] == coords[-1]:
                geometry = {"type": "Polygon", "coordinates": [coords]}
            else:
                geometry = {"type": "LineString", "coordinates": coords}
        else:
            geometry = {"type": "LineString", "coordinates": coords}
    else:
        return None

    return {"type": "Feature", "geometry": geometry, "properties": props}


def classify_power_type(power_type):
    """Map OSM power types to our layer categories."""
    mapping = {
        "substation": "substations",
        "line": "transmission_lines",
        "minor_line": "distribution_lines",
        "cable": "cables",
        "tower": "towers",
        "pole": "poles",
        "portal": "towers",
        "transformer": "transformers",
        "generator": "generators",
        "plant": "generators",
        "converter": "substations",
        "switchgear": "substations",
        "insulator": "towers",
        "catenary_mast": "poles",
    }
    return mapping.get(power_type, "other")


def add_existing_kp_data(layers):
    """Add existing hard-coded Ko Phangan data to layers."""
    # Substations
    for sub in EXISTING_KP_DATA["substations"]:
        feature = {
            "type": "Feature",
            "geometry": {"type": "Point", "coordinates": [sub["lng"], sub["lat"]]},
            "properties": {
                "id": f"kp_sub_{sub['name'].replace(' ', '_').lower()}",
                "power_type": "substation",
                "name": sub["name"],
                "name:th": sub.get("name_th", ""),
                "voltage": sub["voltage"],
                "substation": sub.get("substation_type", ""),
                "operator": sub.get("operator", ""),
                "region": "koh_phangan",
                "source": sub["source"],
            }
        }
        layers["substations"]["features"].append(feature)

    # Submarine cables
    for cable in EXISTING_KP_DATA["cables"]:
        feature = {
            "type": "Feature",
            "geometry": {"type": "LineString", "coordinates": cable["coordinates"]},
            "properties": {
                "id": f"kp_cable_{cable['name'].replace(' ', '_').lower()}",
                "power_type": "cable",
                "name": cable["name"],
                "voltage": cable["voltage"],
                "cable_type": cable.get("cable_type", ""),
                "operator": cable.get("operator", ""),
                "region": "koh_phangan",
                "source": cable["source"],
            }
        }
        layers["cables"]["features"].append(feature)

    # Distribution lines
    for line in EXISTING_KP_DATA["distribution_lines"]:
        feature = {
            "type": "Feature",
            "geometry": {"type": "LineString", "coordinates": [[c[0], c[1]] for c in line["coordinates"]]},
            "properties": {
                "id": f"kp_dist_{line['name'].replace(' ', '_').lower()}",
                "power_type": "minor_line",
                "name": line["name"],
                "voltage": line["voltage"],
                "region": "koh_phangan",
                "source": line["source"],
            }
        }
        layers["distribution_lines"]["features"].append(feature)

    # Transformers
    for i, tx in enumerate(EXISTING_KP_DATA["transformers"]):
        feature = {
            "type": "Feature",
            "geometry": {"type": "Point", "coordinates": [tx["lng"], tx["lat"]]},
            "properties": {
                "id": f"kp_tx_{i}_{tx['name'].replace(' ', '_').lower()}",
                "power_type": "transformer",
                "name": tx["name"],
                "voltage": tx["voltage"],
                "region": "koh_phangan",
                "source": "power-grid-map.html (estimated)",
            }
        }
        layers["transformers"]["features"].append(feature)


def process_all():
    """Main processing pipeline."""
    # Initialize layer collections
    layer_names = [
        "substations", "transmission_lines", "distribution_lines",
        "cables", "towers", "poles", "transformers", "generators", "other"
    ]
    layers = {
        name: {"type": "FeatureCollection", "features": []}
        for name in layer_names
    }

    # Process each region's raw OSM data
    regions = {
        "koh_phangan": "koh_phangan_raw.json",
        "koh_samui": "koh_samui_raw.json",
        "surat_thani": "surat_thani_raw.json",
    }

    stats = {}
    for region, filename in regions.items():
        filepath = os.path.join(SCRIPT_DIR, filename)
        if not os.path.exists(filepath):
            print(f"WARNING: {filename} not found, skipping")
            continue

        with open(filepath) as f:
            data = json.load(f)

        elements = data.get("elements", [])
        region_stats = {"total": len(elements)}

        for element in elements:
            power_type = element.get("tags", {}).get("power", "unknown")
            layer_name = classify_power_type(power_type)

            feature = osm_element_to_geojson_feature(element, region)
            if feature and layer_name in layers:
                layers[layer_name]["features"].append(feature)
                region_stats[layer_name] = region_stats.get(layer_name, 0) + 1

        stats[region] = region_stats
        print(f"\n{region}: {len(elements)} elements processed")
        for k, v in sorted(region_stats.items()):
            if k != "total":
                print(f"  {k}: {v}")

    # Add existing Ko Phangan hard-coded data
    print("\nAdding existing Ko Phangan data from power-grid-map.html...")
    add_existing_kp_data(layers)

    # Write output files
    print("\nWriting GeoJSON files:")
    for name, collection in layers.items():
        count = len(collection["features"])
        if count == 0:
            continue
        outpath = os.path.join(SCRIPT_DIR, f"{name}.geojson")
        with open(outpath, "w") as f:
            json.dump(collection, f, indent=2)
        print(f"  {name}.geojson: {count} features")

    # Write combined file for MapLibre
    combined = {"type": "FeatureCollection", "features": []}
    for name, collection in layers.items():
        combined["features"].extend(collection["features"])

    outpath = os.path.join(SCRIPT_DIR, "grid_all.geojson")
    with open(outpath, "w") as f:
        json.dump(combined, f, indent=2)
    print(f"\n  grid_all.geojson: {len(combined['features'])} total features")

    # Write summary
    summary = {
        "generated": "2026-03-13",
        "regions": list(regions.keys()),
        "stats": stats,
        "layers": {name: len(col["features"]) for name, col in layers.items()},
        "total_features": len(combined["features"]),
    }
    with open(os.path.join(SCRIPT_DIR, "grid_summary.json"), "w") as f:
        json.dump(summary, f, indent=2)
    print(f"\nDone! Summary written to grid_summary.json")


if __name__ == "__main__":
    process_all()
