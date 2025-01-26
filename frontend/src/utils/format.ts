import i18n from '@/lang'

export function formatBytes(bytes: number, decimals: number = 1): string {
  if (bytes === 0) return '0 B'

  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

  const i = Math.max(0, Math.floor(Math.log(bytes) / Math.log(k)))
  const formattedValue = parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))

  return `${formattedValue} ${sizes[i]}`
}

export function formatRelativeTime(d: string | number) {
	const date = new Date(d);
	const now = Date.now();
	const diffMs = date.getTime() - now;

	const units: { unit: Intl.RelativeTimeFormatUnit; threshold: number }[] = [
		{ unit: "year", threshold: 365 * 24 * 60 * 60 * 1000 },
		{ unit: "month", threshold: 30 * 24 * 60 * 60 * 1000 },
		{ unit: "day", threshold: 24 * 60 * 60 * 1000 },
		{ unit: "hour", threshold: 60 * 60 * 1000 },
		{ unit: "minute", threshold: 60 * 1000 },
		{ unit: "second", threshold: 0 },
	];

	const { unit, value } = units.reduce<{
		unit: Intl.RelativeTimeFormatUnit;
		value: number
	}>(
		(acc, { unit, threshold }) => {
			if (acc.value !== 0) return acc;

			const amount = Math.trunc(diffMs / threshold);
			return Math.abs(amount) > 0 ? { unit, value: amount } : acc;
		},
		{ unit: "second", value: 0 }
	);

	return new Intl.RelativeTimeFormat(i18n.global.locale.value, {
		 numeric: "auto"
	}).format(value, unit);
}

export function formatDate(timestamp: number | string, format: string) {
  const date = new Date(timestamp)

  const map: Record<string, any> = {
    YYYY: date.getFullYear(),
    MM: String(date.getMonth() + 1).padStart(2, '0'),
    DD: String(date.getDate()).padStart(2, '0'),
    HH: String(date.getHours()).padStart(2, '0'),
    mm: String(date.getMinutes()).padStart(2, '0'),
    ss: String(date.getSeconds()).padStart(2, '0'),
  }

  return format.replace(/YYYY|MM|DD|HH|mm|ss/g, (matched) => map[matched])
}
