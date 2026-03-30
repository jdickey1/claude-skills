#!/usr/bin/env python3
"""
Business mileage pipeline — filter calendar events, build trip chains, calculate totals.

Usage:
    python3 mileage-pipeline.py filter --month YYYY-MM --events-file /tmp/raw.json [--output /tmp/filtered.json]
    python3 mileage-pipeline.py build-trips --home-address "..." --events-file /tmp/classified.json [--output /tmp/trips.json]
    python3 mileage-pipeline.py calc-totals --irs-rate 0.70 --month "January 2026" --trips-file /tmp/trips.json
"""

import argparse
import json
import re
import sys
from datetime import datetime, timedelta


# --- Shared utilities ---

VIRTUAL_PATTERNS = [
    r"zoom\.us",
    r"teams\.microsoft\.com",
    r"meet\.google\.com",
    r"calendly\.com",
    r"bnionline\.zoom\.us",
]

# Plain text location strings that indicate virtual events (case-insensitive exact match)
VIRTUAL_LOCATION_TEXT = [
    "microsoft teams meeting",
]

DRIVE_PATTERNS = [
    r"^🚗",
    r"^Drive to\b",
    r"^Drive from\b",
    r"^Drive home\b",
    r"^Drive Home\b",
    r"^Prep/Leave for\b",
]

ARROW = "\u2192"  # →


def is_drive_event(subject):
    """Check if an event is a drive event based on subject."""
    for pattern in DRIVE_PATTERNS:
        if re.search(pattern, subject, re.IGNORECASE):
            return True
    # Check for car emoji (various unicode representations)
    if subject and ord(subject[0]) > 127:
        # Common car/vehicle emoji codepoints
        if any(c in subject[:2] for c in ["🚗", "🚙", "🏎"]):
            return True
    return False


def is_virtual_location(location):
    """Check if a location indicates a virtual event."""
    if not location:
        return False
    loc_lower = location.lower().strip()
    # Check plain text virtual location strings (e.g., "Microsoft Teams Meeting")
    for text in VIRTUAL_LOCATION_TEXT:
        if loc_lower == text:
            return True
    # Check known virtual URL patterns
    for pattern in VIRTUAL_PATTERNS:
        if re.search(pattern, loc_lower):
            return True
    # Bare URL with no physical address tokens
    if loc_lower.startswith("http://") or loc_lower.startswith("https://"):
        # Check if there's also a physical address component (street number + name)
        if not re.search(r"\d+\s+[A-Za-z]", location):
            return True
    return False


def parse_datetime(dt_str):
    """Parse a datetime string from Microsoft Graph API."""
    if not dt_str:
        return None
    # Handle various formats
    for fmt in ["%Y-%m-%dT%H:%M:%S.%f", "%Y-%m-%dT%H:%M:%S"]:
        try:
            return datetime.strptime(dt_str.rstrip("0"), fmt)
        except ValueError:
            continue
    # Try truncating to seconds
    try:
        return datetime.strptime(dt_str[:19], "%Y-%m-%dT%H:%M:%S")
    except ValueError:
        return None


def parse_arrow_location(location):
    """Parse 'Origin → Destination' format from drive event locations."""
    if ARROW in location:
        parts = location.split(ARROW)
        return parts[0].strip(), parts[-1].strip()
    return None, None


def normalize_location_key(location):
    """Normalize a location string for grouping same-place events.

    Extracts the leading street number to group addresses like
    '908 East 5th Street #109D' and '908 E. 5th St' together.
    """
    if not location:
        return "_no_location_"
    loc = location.strip()
    # Extract leading street number
    m = re.match(r"(\d+)\s", loc)
    if m:
        return m.group(1)
    return loc.lower().strip()


# --- Filter subcommand ---

def cmd_filter(args):
    """Filter calendar events to target month and remove virtual events."""
    with open(args.events_file, "r", encoding="utf-8") as f:
        raw = json.load(f)

    # Handle the MCP response wrapper format
    if isinstance(raw, list) and len(raw) > 0 and isinstance(raw[0], dict) and "text" in raw[0]:
        events = json.loads(raw[0]["text"])
    elif isinstance(raw, list):
        events = raw
    else:
        events = raw.get("value", raw.get("events", []))

    year, month = map(int, args.month.split("-"))

    # Filter to target month
    month_events = []
    for event in events:
        start = event.get("start", {})
        dt_str = start.get("dateTime", "") if isinstance(start, dict) else ""
        dt = parse_datetime(dt_str)
        if dt and dt.year == year and dt.month == month:
            event["_parsed_start"] = dt.isoformat()
            event["_is_drive"] = is_drive_event(event.get("subject", ""))
            month_events.append(event)

    # Two-pass virtual detection (ADV-002):
    # Pass 1: identify drive events and their time windows
    drive_windows = []
    for event in month_events:
        if event["_is_drive"]:
            dt = parse_datetime(event["_parsed_start"])
            end_str = event.get("end", {}).get("dateTime", "") if isinstance(event.get("end"), dict) else ""
            end_dt = parse_datetime(end_str) or (dt + timedelta(hours=1) if dt else None)
            if dt:
                drive_windows.append({
                    "date": dt.date(),
                    "start": dt,
                    "end": end_dt,
                })

    # Pass 2: filter virtual events, preserving those within a drive window
    in_person = []
    virtual_removed = []

    for event in month_events:
        location = ""
        loc_obj = event.get("location", {})
        if isinstance(loc_obj, dict):
            location = loc_obj.get("displayName", "")
        elif isinstance(loc_obj, str):
            location = loc_obj

        # Drive events always pass through
        if event["_is_drive"]:
            in_person.append(event)
            continue

        # Check if virtual
        if is_virtual_location(location):
            # But preserve if a drive event exists on the same day near this event's time
            dt = parse_datetime(event["_parsed_start"])
            preserved = False
            if dt:
                for window in drive_windows:
                    if window["date"] == dt.date():
                        # Drive event on same day — preserve the meeting
                        preserved = True
                        break
            if preserved:
                event["_note"] = "Virtual location but drive events on same day — preserved"
                in_person.append(event)
            else:
                virtual_removed.append(event)
            continue

        # No location or physical location — keep
        in_person.append(event)

    # Sort by start time
    in_person.sort(key=lambda e: e.get("_parsed_start", ""))
    virtual_removed.sort(key=lambda e: e.get("_parsed_start", ""))

    result = {
        "in_person": in_person,
        "virtual_removed": virtual_removed,
        "summary": {
            "total_month_events": len(month_events),
            "in_person": len(in_person),
            "virtual_removed": len(virtual_removed),
        },
    }

    output_file = args.output or args.events_file.replace(".json", "-filtered.json")
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(result, f, indent=2, ensure_ascii=False)

    print(json.dumps(result["summary"]))
    print(f"Output: {output_file}")


# --- Build-trips subcommand ---

def cmd_build_trips(args):
    """Build trip chains from classified business events."""
    with open(args.events_file, "r", encoding="utf-8") as f:
        events = json.load(f)

    home_address = args.home_address

    # Group events by date
    by_date = {}
    for event in events:
        dt = parse_datetime(event.get("_parsed_start", event.get("start", {}).get("dateTime", "")))
        if not dt:
            continue
        date_key = dt.date().isoformat()
        if date_key not in by_date:
            by_date[date_key] = []
        event["_dt"] = dt.isoformat()
        by_date[date_key].append(event)

    # Sort each day's events by time
    for date_key in by_date:
        by_date[date_key].sort(key=lambda e: e.get("_dt", ""))

    # Build trip chains
    trips = []
    trip_id = 1
    used_dates = set()

    for date_key in sorted(by_date.keys()):
        if date_key in used_dates:
            continue

        day_events = by_date[date_key]
        drive_events = [e for e in day_events if e.get("_is_drive")]
        meeting_events = [e for e in day_events if not e.get("_is_drive")]

        if not drive_events and not meeting_events:
            continue

        # If no drive events but meetings exist, group by location into trips
        if not drive_events:
            # Group meetings by normalized location to consolidate same-location events
            location_groups = {}
            for meeting in meeting_events:
                loc = ""
                loc_obj = meeting.get("location", {})
                if isinstance(loc_obj, dict):
                    loc = loc_obj.get("displayName", "")
                elif isinstance(loc_obj, str):
                    loc = loc_obj
                loc_key = normalize_location_key(loc)
                if loc_key not in location_groups:
                    location_groups[loc_key] = []
                location_groups[loc_key].append(meeting)

            for loc_key, group in location_groups.items():
                descriptions = [m.get("subject", "Unknown") for m in group]
                # Deduplicate similar descriptions (e.g., JPR Studios + Winning on Issues at same place)
                unique_descs = list(dict.fromkeys(descriptions))
                trips.append({
                    "id": trip_id,
                    "date": date_key,
                    "description": " + ".join(unique_descs),
                    "legs": [],
                    "flags": ["needs_confirmation"],
                    "events": unique_descs,
                })
                trip_id += 1
            continue

        # Build legs from drive events
        legs = []
        trip_descriptions = []
        is_multi_day = False
        chain_dates = [date_key]

        for drive in drive_events:
            location = ""
            loc_obj = drive.get("location", {})
            if isinstance(loc_obj, dict):
                location = loc_obj.get("displayName", "")
            elif isinstance(loc_obj, str):
                location = loc_obj

            origin, destination = parse_arrow_location(location)

            # Normalize "Home" references
            if origin and origin.lower() == "home":
                origin = home_address
            if destination and destination.lower() == "home":
                destination = home_address

            if origin and destination:
                legs.append({
                    "from": origin,
                    "to": destination,
                    "miles": None,
                    "source_event": drive.get("subject", ""),
                })
            else:
                # No arrow notation — try to use location as destination from Home
                if location:
                    legs.append({
                        "from": home_address if not legs else "previous",
                        "to": location,
                        "miles": None,
                        "source_event": drive.get("subject", ""),
                        "flags": ["no_arrow_notation"],
                    })

        # Check for return-home leg
        has_return = False
        if legs:
            last_dest = legs[-1].get("to", "")
            if home_address.lower() in last_dest.lower() or "home" in last_dest.lower():
                has_return = True

        # Multi-day: scan up to 3 days ahead for return drive
        if not has_return:
            dt_obj = datetime.fromisoformat(date_key)
            for day_offset in range(1, 4):
                next_date = (dt_obj + timedelta(days=day_offset)).date().isoformat()
                if next_date in by_date:
                    next_drives = [e for e in by_date[next_date] if e.get("_is_drive")]
                    for nd in next_drives:
                        nd_loc = ""
                        nd_loc_obj = nd.get("location", {})
                        if isinstance(nd_loc_obj, dict):
                            nd_loc = nd_loc_obj.get("displayName", "")
                        elif isinstance(nd_loc_obj, str):
                            nd_loc = nd_loc_obj

                        nd_origin, nd_dest = parse_arrow_location(nd_loc)
                        if nd_dest and (home_address.lower() in nd_dest.lower() or "home" in nd_dest.lower()):
                            # Found return-home on a later day
                            if nd_origin:
                                legs.append({
                                    "from": nd_origin,
                                    "to": home_address,
                                    "miles": None,
                                    "source_event": nd.get("subject", ""),
                                })
                            is_multi_day = True
                            chain_dates.append(next_date)
                            used_dates.add(next_date)
                            has_return = True
                            break
                if has_return:
                    break

        # Collect meeting descriptions for this chain
        for meeting in meeting_events:
            trip_descriptions.append(meeting.get("subject", ""))

        # Also collect meetings from multi-day continuation dates
        for extra_date in chain_dates[1:]:
            if extra_date in by_date:
                for e in by_date[extra_date]:
                    if not e.get("_is_drive"):
                        trip_descriptions.append(e.get("subject", ""))

        used_dates.add(date_key)

        flags = []
        if is_multi_day:
            flags.append("multi_day")
        if not has_return:
            flags.append("no_return_home")

        trips.append({
            "id": trip_id,
            "date": date_key,
            "dates": chain_dates,
            "description": " + ".join(trip_descriptions) if trip_descriptions else "Drive only",
            "legs": legs,
            "flags": flags,
        })
        trip_id += 1

    output_file = args.output or args.events_file.replace(".json", "-trips.json")
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(trips, f, indent=2, ensure_ascii=False)

    # Print summary
    print(f"Built {len(trips)} trip chains")
    flagged = [t for t in trips if t.get("flags")]
    if flagged:
        print(f"Flagged trips: {len(flagged)}")
        for t in flagged:
            print(f"  Trip {t['id']} ({t['date']}): {', '.join(t['flags'])} — {t['description'][:60]}")
    print(f"Output: {output_file}")


# --- Calc-totals subcommand ---

def cmd_calc_totals(args):
    """Calculate totals and format the mileage report as markdown."""
    with open(args.trips_file, "r", encoding="utf-8") as f:
        trips = json.load(f)

    irs_rate = float(args.irs_rate)
    month_label = args.month  # e.g., "January 2026"

    lines = []
    lines.append(f"## {month_label}")
    lines.append("")

    grand_total = 0.0
    trip_rows = []

    for trip in trips:
        trip_miles = sum(leg.get("miles", 0) or 0 for leg in trip.get("legs", []))
        grand_total += trip_miles

        # Format route legs
        leg_strs = []
        for leg in trip.get("legs", []):
            from_addr = leg["from"]
            to_addr = leg["to"]
            miles = leg.get("miles", 0) or 0
            # Shorten home address to "Home"
            if "green thread" in from_addr.lower():
                from_addr = "Home"
            if "green thread" in to_addr.lower():
                to_addr = "Home"
            leg_strs.append(f"{from_addr} ({miles})")

        # Add final destination
        if trip.get("legs"):
            last_to = trip["legs"][-1]["to"]
            if "green thread" in last_to.lower():
                last_to = "Home"
            route = " → ".join(leg_strs) + f" → {last_to}"
        else:
            route = "No drive legs"

        # Format date
        date_str = trip.get("date", "")
        try:
            dt = datetime.fromisoformat(date_str)
            date_display = dt.strftime("%b %-d")
        except (ValueError, TypeError):
            date_display = date_str

        trip_rows.append({
            "id": trip["id"],
            "date": date_display,
            "miles": trip_miles,
            "description": trip.get("description", ""),
            "route": route,
        })

    lines.append(f"**Total: {grand_total:,.1f} miles**")
    lines.append("")
    lines.append("| # | Date | Miles | Description | Route Legs |")
    lines.append("|---|------|------:|-------------|------------|")

    for row in trip_rows:
        lines.append(
            f"| {row['id']} | {row['date']} | {row['miles']:.1f} | "
            f"{row['description']} | {row['route']} |"
        )

    # IRS reimbursement
    reimbursement = grand_total * irs_rate
    lines.append("")
    lines.append("### IRS Mileage Reimbursement")
    lines.append(f"- Rate: ${irs_rate:.2f}/mile")
    lines.append(f"- Total: {grand_total:,.1f} miles x ${irs_rate:.2f} = **${reimbursement:,.2f}**")

    report = "\n".join(lines)
    print(report)

    # Also output as JSON for Claude to use
    summary = {
        "month": month_label,
        "total_miles": round(grand_total, 1),
        "total_trips": len(trips),
        "irs_rate": irs_rate,
        "reimbursement": round(reimbursement, 2),
        "new_destinations": [],  # Claude fills this from cache comparison
    }
    print("\n--- SUMMARY JSON ---")
    print(json.dumps(summary))


# --- Main ---

def main():
    parser = argparse.ArgumentParser(description="Business mileage pipeline")
    subparsers = parser.add_subparsers(dest="command", required=True)

    # filter
    p_filter = subparsers.add_parser("filter", help="Filter events to target month, remove virtual")
    p_filter.add_argument("--month", required=True, help="Target month as YYYY-MM")
    p_filter.add_argument("--events-file", required=True, help="Path to raw events JSON")
    p_filter.add_argument("--output", help="Output file path (default: events-file with -filtered suffix)")

    # build-trips
    p_trips = subparsers.add_parser("build-trips", help="Build trip chains from events")
    p_trips.add_argument("--home-address", required=True, help="Home address for trip chain building")
    p_trips.add_argument("--events-file", required=True, help="Path to classified events JSON")
    p_trips.add_argument("--output", help="Output file path")

    # calc-totals
    p_calc = subparsers.add_parser("calc-totals", help="Calculate totals and format report")
    p_calc.add_argument("--irs-rate", required=True, help="IRS standard mileage rate")
    p_calc.add_argument("--month", required=True, help="Month label, e.g. 'January 2026'")
    p_calc.add_argument("--trips-file", required=True, help="Path to trips JSON with distances filled")

    args = parser.parse_args()

    if args.command == "filter":
        cmd_filter(args)
    elif args.command == "build-trips":
        cmd_build_trips(args)
    elif args.command == "calc-totals":
        cmd_calc_totals(args)


if __name__ == "__main__":
    main()
