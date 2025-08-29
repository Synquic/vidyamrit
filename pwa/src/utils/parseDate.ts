import { DateTime } from 'luxon';

export default function ParseDate(isoString: string): string {
    return DateTime.fromISO(isoString, { zone: 'utc' }).toFormat("dd LLLL yyyy, hh:mm a");
}