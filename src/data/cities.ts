import type { TripDestinationInput } from '../types/trip';

export interface CityOption extends TripDestinationInput {
  id: string;
  aliases: string;
}

// Deliberately compact, dependency-free catalog of major travel cities.
// Additions only require another data row; UI and persistence are data-driven.
export const cityCatalog: CityOption[] = [
  { id: 'cn-beijing', cityName: '北京', countryName: '中国', latitude: 39.9042, longitude: 116.4074, aliases: 'Beijing Peking' },
  { id: 'cn-shanghai', cityName: '上海', countryName: '中国', latitude: 31.2304, longitude: 121.4737, aliases: 'Shanghai' },
  { id: 'cn-guangzhou', cityName: '广州', countryName: '中国', latitude: 23.1291, longitude: 113.2644, aliases: 'Guangzhou Canton' },
  { id: 'cn-shenzhen', cityName: '深圳', countryName: '中国', latitude: 22.5431, longitude: 114.0579, aliases: 'Shenzhen' },
  { id: 'cn-chengdu', cityName: '成都', countryName: '中国', latitude: 30.5728, longitude: 104.0668, aliases: 'Chengdu' },
  { id: 'cn-xian', cityName: '西安', countryName: '中国', latitude: 34.3416, longitude: 108.9398, aliases: 'Xian Xi an' },
  { id: 'cn-hangzhou', cityName: '杭州', countryName: '中国', latitude: 30.2741, longitude: 120.1551, aliases: 'Hangzhou' },
  { id: 'cn-hongkong', cityName: '香港', countryName: '中国香港', latitude: 22.3193, longitude: 114.1694, aliases: 'Hong Kong' },
  { id: 'cn-macau', cityName: '澳门', countryName: '中国澳门', latitude: 22.1987, longitude: 113.5439, aliases: 'Macau Macao' },
  { id: 'tw-taipei', cityName: '台北', countryName: '中国台湾', latitude: 25.033, longitude: 121.5654, aliases: 'Taipei' },
  { id: 'jp-tokyo', cityName: '东京', countryName: '日本', latitude: 35.6762, longitude: 139.6503, aliases: 'Tokyo' },
  { id: 'jp-kyoto', cityName: '京都', countryName: '日本', latitude: 35.0116, longitude: 135.7681, aliases: 'Kyoto' },
  { id: 'jp-osaka', cityName: '大阪', countryName: '日本', latitude: 34.6937, longitude: 135.5023, aliases: 'Osaka' },
  { id: 'jp-kamakura', cityName: '镰仓', countryName: '日本', latitude: 35.3192, longitude: 139.5467, aliases: 'Kamakura' },
  { id: 'jp-ito', cityName: '伊东', countryName: '日本', latitude: 34.9657, longitude: 139.1019, aliases: 'Ito Shizuoka' },
  { id: 'jp-sapporo', cityName: '札幌', countryName: '日本', latitude: 43.0618, longitude: 141.3545, aliases: 'Sapporo' },
  { id: 'jp-fukuoka', cityName: '福冈', countryName: '日本', latitude: 33.5904, longitude: 130.4017, aliases: 'Fukuoka' },
  { id: 'kr-seoul', cityName: '首尔', countryName: '韩国', latitude: 37.5665, longitude: 126.978, aliases: 'Seoul' },
  { id: 'kr-busan', cityName: '釜山', countryName: '韩国', latitude: 35.1796, longitude: 129.0756, aliases: 'Busan Pusan' },
  { id: 'sg-singapore', cityName: '新加坡', countryName: '新加坡', latitude: 1.3521, longitude: 103.8198, aliases: 'Singapore' },
  { id: 'th-bangkok', cityName: '曼谷', countryName: '泰国', latitude: 13.7563, longitude: 100.5018, aliases: 'Bangkok' },
  { id: 'th-chiangmai', cityName: '清迈', countryName: '泰国', latitude: 18.7883, longitude: 98.9853, aliases: 'Chiang Mai' },
  { id: 'vn-hanoi', cityName: '河内', countryName: '越南', latitude: 21.0278, longitude: 105.8342, aliases: 'Hanoi' },
  { id: 'vn-hochiminh', cityName: '胡志明市', countryName: '越南', latitude: 10.8231, longitude: 106.6297, aliases: 'Ho Chi Minh Saigon' },
  { id: 'id-bali', cityName: '巴厘岛', countryName: '印度尼西亚', latitude: -8.4095, longitude: 115.1889, aliases: 'Bali Denpasar' },
  { id: 'my-kualalumpur', cityName: '吉隆坡', countryName: '马来西亚', latitude: 3.139, longitude: 101.6869, aliases: 'Kuala Lumpur' },
  { id: 'ph-manila', cityName: '马尼拉', countryName: '菲律宾', latitude: 14.5995, longitude: 120.9842, aliases: 'Manila' },
  { id: 'in-delhi', cityName: '德里', countryName: '印度', latitude: 28.6139, longitude: 77.209, aliases: 'Delhi New Delhi' },
  { id: 'ae-dubai', cityName: '迪拜', countryName: '阿联酋', latitude: 25.2048, longitude: 55.2708, aliases: 'Dubai UAE' },
  { id: 'tr-istanbul', cityName: '伊斯坦布尔', countryName: '土耳其', latitude: 41.0082, longitude: 28.9784, aliases: 'Istanbul' },
  { id: 'gb-london', cityName: '伦敦', countryName: '英国', latitude: 51.5074, longitude: -0.1278, aliases: 'London' },
  { id: 'fr-paris', cityName: '巴黎', countryName: '法国', latitude: 48.8566, longitude: 2.3522, aliases: 'Paris' },
  { id: 'it-rome', cityName: '罗马', countryName: '意大利', latitude: 41.9028, longitude: 12.4964, aliases: 'Rome Roma' },
  { id: 'it-florence', cityName: '佛罗伦萨', countryName: '意大利', latitude: 43.7696, longitude: 11.2558, aliases: 'Florence Firenze' },
  { id: 'es-barcelona', cityName: '巴塞罗那', countryName: '西班牙', latitude: 41.3874, longitude: 2.1686, aliases: 'Barcelona' },
  { id: 'es-madrid', cityName: '马德里', countryName: '西班牙', latitude: 40.4168, longitude: -3.7038, aliases: 'Madrid' },
  { id: 'de-berlin', cityName: '柏林', countryName: '德国', latitude: 52.52, longitude: 13.405, aliases: 'Berlin' },
  { id: 'nl-amsterdam', cityName: '阿姆斯特丹', countryName: '荷兰', latitude: 52.3676, longitude: 4.9041, aliases: 'Amsterdam' },
  { id: 'ch-zurich', cityName: '苏黎世', countryName: '瑞士', latitude: 47.3769, longitude: 8.5417, aliases: 'Zurich Zürich' },
  { id: 'at-vienna', cityName: '维也纳', countryName: '奥地利', latitude: 48.2082, longitude: 16.3738, aliases: 'Vienna Wien' },
  { id: 'cz-prague', cityName: '布拉格', countryName: '捷克', latitude: 50.0755, longitude: 14.4378, aliases: 'Prague Praha' },
  { id: 'gr-athens', cityName: '雅典', countryName: '希腊', latitude: 37.9838, longitude: 23.7275, aliases: 'Athens' },
  { id: 'pt-lisbon', cityName: '里斯本', countryName: '葡萄牙', latitude: 38.7223, longitude: -9.1393, aliases: 'Lisbon Lisboa' },
  { id: 'is-reykjavik', cityName: '雷克雅未克', countryName: '冰岛', latitude: 64.1466, longitude: -21.9426, aliases: 'Reykjavik' },
  { id: 'us-newyork', cityName: '纽约', countryName: '美国', latitude: 40.7128, longitude: -74.006, aliases: 'New York NYC' },
  { id: 'us-losangeles', cityName: '洛杉矶', countryName: '美国', latitude: 34.0522, longitude: -118.2437, aliases: 'Los Angeles LA' },
  { id: 'us-sanfrancisco', cityName: '旧金山', countryName: '美国', latitude: 37.7749, longitude: -122.4194, aliases: 'San Francisco SF' },
  { id: 'us-honolulu', cityName: '檀香山', countryName: '美国', latitude: 21.3099, longitude: -157.8581, aliases: 'Honolulu Hawaii' },
  { id: 'ca-vancouver', cityName: '温哥华', countryName: '加拿大', latitude: 49.2827, longitude: -123.1207, aliases: 'Vancouver' },
  { id: 'ca-toronto', cityName: '多伦多', countryName: '加拿大', latitude: 43.6532, longitude: -79.3832, aliases: 'Toronto' },
  { id: 'mx-mexicocity', cityName: '墨西哥城', countryName: '墨西哥', latitude: 19.4326, longitude: -99.1332, aliases: 'Mexico City CDMX' },
  { id: 'br-riodejaneiro', cityName: '里约热内卢', countryName: '巴西', latitude: -22.9068, longitude: -43.1729, aliases: 'Rio de Janeiro Rio' },
  { id: 'ar-buenosaires', cityName: '布宜诺斯艾利斯', countryName: '阿根廷', latitude: -34.6037, longitude: -58.3816, aliases: 'Buenos Aires' },
  { id: 'pe-lima', cityName: '利马', countryName: '秘鲁', latitude: -12.0464, longitude: -77.0428, aliases: 'Lima' },
  { id: 'au-sydney', cityName: '悉尼', countryName: '澳大利亚', latitude: -33.8688, longitude: 151.2093, aliases: 'Sydney' },
  { id: 'au-melbourne', cityName: '墨尔本', countryName: '澳大利亚', latitude: -37.8136, longitude: 144.9631, aliases: 'Melbourne' },
  { id: 'nz-auckland', cityName: '奥克兰', countryName: '新西兰', latitude: -36.8509, longitude: 174.7645, aliases: 'Auckland' },
  { id: 'eg-cairo', cityName: '开罗', countryName: '埃及', latitude: 30.0444, longitude: 31.2357, aliases: 'Cairo' },
  { id: 'ma-marrakech', cityName: '马拉喀什', countryName: '摩洛哥', latitude: 31.6295, longitude: -7.9811, aliases: 'Marrakech Marrakesh' },
  { id: 'za-capetown', cityName: '开普敦', countryName: '南非', latitude: -33.9249, longitude: 18.4241, aliases: 'Cape Town' },
];

export function findCityOptions(query: string, limit = 12): CityOption[] {
  const normalized = query.trim().toLocaleLowerCase();
  if (!normalized) return cityCatalog.slice(0, limit);
  return cityCatalog
    .filter((city) =>
      `${city.cityName} ${city.countryName} ${city.aliases}`
        .toLocaleLowerCase()
        .includes(normalized),
    )
    .slice(0, limit);
}
