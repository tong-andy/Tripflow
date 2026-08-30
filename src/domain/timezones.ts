export interface TimezoneOption {
  value: string;
  label: string;
  region: string;
  searchText: string;
}

const fallbackTimezones = [
  'Asia/Shanghai','Asia/Hong_Kong','Asia/Taipei','Asia/Tokyo','Asia/Seoul','Asia/Singapore','Asia/Bangkok','Asia/Ho_Chi_Minh','Asia/Jakarta','Asia/Manila','Asia/Kuala_Lumpur','Asia/Kolkata','Asia/Kathmandu','Asia/Dhaka','Asia/Colombo','Asia/Dubai','Asia/Riyadh','Asia/Jerusalem','Asia/Istanbul',
  'Europe/London','Europe/Dublin','Europe/Lisbon','Europe/Paris','Europe/Madrid','Europe/Rome','Europe/Berlin','Europe/Amsterdam','Europe/Brussels','Europe/Zurich','Europe/Vienna','Europe/Prague','Europe/Warsaw','Europe/Stockholm','Europe/Oslo','Europe/Copenhagen','Europe/Helsinki','Europe/Athens','Europe/Bucharest','Europe/Kyiv','Europe/Moscow',
  'America/New_York','America/Toronto','America/Chicago','America/Denver','America/Phoenix','America/Los_Angeles','America/Vancouver','America/Anchorage','Pacific/Honolulu','America/Mexico_City','America/Panama','America/Havana','America/Puerto_Rico',
  'America/Bogota','America/Lima','America/Guayaquil','America/Caracas','America/La_Paz','America/Santiago','America/Argentina/Buenos_Aires','America/Montevideo','America/Asuncion','America/Sao_Paulo',
  'Australia/Perth','Australia/Darwin','Australia/Adelaide','Australia/Brisbane','Australia/Sydney','Australia/Melbourne','Pacific/Auckland','Pacific/Fiji','Pacific/Guam','Pacific/Tahiti',
  'Africa/Cairo','Africa/Casablanca','Africa/Algiers','Africa/Tunis','Africa/Lagos','Africa/Accra','Africa/Nairobi','Africa/Addis_Ababa','Africa/Johannesburg','Africa/Maputo','Africa/Khartoum',
  'Atlantic/Reykjavik','Atlantic/Azores','Indian/Maldives','Indian/Mauritius','Indian/Reunion','UTC',
] as const;

const friendlyNames: Record<string, string> = {
  'Asia/Shanghai': '上海', 'Asia/Hong_Kong': '香港', 'Asia/Taipei': '台北',
  'Asia/Tokyo': '东京', 'Asia/Seoul': '首尔', 'Asia/Singapore': '新加坡',
  'Asia/Bangkok': '曼谷', 'Asia/Dubai': '迪拜', 'Asia/Kolkata': '加尔各答',
  'Europe/London': '伦敦', 'Europe/Paris': '巴黎', 'Europe/Rome': '罗马',
  'Europe/Berlin': '柏林', 'Europe/Madrid': '马德里', 'Europe/Amsterdam': '阿姆斯特丹',
  'America/New_York': '纽约', 'America/Chicago': '芝加哥', 'America/Denver': '丹佛',
  'America/Los_Angeles': '洛杉矶', 'America/Toronto': '多伦多',
  'America/Vancouver': '温哥华', 'America/Mexico_City': '墨西哥城',
  'America/Sao_Paulo': '圣保罗', 'America/Argentina/Buenos_Aires': '布宜诺斯艾利斯',
  'America/Santiago': '圣地亚哥', 'America/Lima': '利马',
  'Australia/Sydney': '悉尼', 'Australia/Melbourne': '墨尔本',
  'Pacific/Auckland': '奥克兰', 'Pacific/Honolulu': '檀香山',
  'Africa/Cairo': '开罗', 'Africa/Casablanca': '卡萨布兰卡',
  'Africa/Nairobi': '内罗毕', 'Africa/Johannesburg': '约翰内斯堡',
  UTC: '协调世界时',
};

const southAmericanZones = [
  'Argentina','Asuncion','Bahia','Belem','Boa_Vista','Bogota','Caracas','Cayenne',
  'Cuiaba','Eirunepe','Fortaleza','Guayaquil','Guyana','La_Paz','Lima','Maceio',
  'Manaus','Montevideo','Noronha','Paramaribo','Porto_Velho','Punta_Arenas',
  'Recife','Rio_Branco','Santarem','Santiago','Sao_Paulo',
];

function regionFor(timezone: string): string {
  if (timezone.startsWith('Asia/')) return '亚洲';
  if (timezone.startsWith('Europe/')) return '欧洲';
  if (timezone.startsWith('Africa/')) return '非洲';
  if (timezone.startsWith('Australia/') || timezone.startsWith('Pacific/')) return '大洋洲';
  if (timezone.startsWith('America/')) {
    return southAmericanZones.some((zone) => timezone.includes(zone)) ? '南美洲' : '北美洲';
  }
  return '其他';
}

function derivedCity(timezone: string): string {
  const city = timezone.split('/').at(-1) ?? timezone;
  return city.replaceAll('_', ' ');
}

function supportedTimezones(): string[] {
  const extendedIntl = Intl as typeof Intl & {
    supportedValuesOf?: (key: 'timeZone') => string[];
  };
  try {
    return extendedIntl.supportedValuesOf?.('timeZone') ?? [...fallbackTimezones];
  } catch {
    return [...fallbackTimezones];
  }
}

export const timezoneOptions: TimezoneOption[] = Array.from(
  new Set([...supportedTimezones(), ...fallbackTimezones]),
)
  .map((value) => {
    const city = derivedCity(value);
    const friendly = friendlyNames[value] ?? city;
    return {
      value,
      label: `${friendly}（${value}）`,
      region: regionFor(value),
      searchText: `${friendly} ${city} ${value}`.toLocaleLowerCase(),
    };
  })
  .sort((left, right) => left.region.localeCompare(right.region, 'zh-CN') || left.label.localeCompare(right.label, 'zh-CN'));

export function findTimezoneOptions(query: string, limit = 80): TimezoneOption[] {
  const normalized = query.trim().toLocaleLowerCase();
  return timezoneOptions
    .filter((option) => !normalized || option.searchText.includes(normalized))
    .slice(0, limit);
}

export function timezoneLabel(value: string): string {
  return timezoneOptions.find((option) => option.value === value)?.label ?? value;
}
