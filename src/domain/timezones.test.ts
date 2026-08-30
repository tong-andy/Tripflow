import { findTimezoneOptions, timezoneLabel, timezoneOptions } from './timezones';

describe('timezone options',()=>{
  it('provides a broad globally grouped IANA list',()=>{expect(timezoneOptions.length).toBeGreaterThan(70);expect([...new Set(timezoneOptions.map(option=>option.region))]).toEqual(expect.arrayContaining(['亚洲','欧洲','北美洲','南美洲','大洋洲','非洲']));expect(timezoneOptions.some(option=>option.value==='Asia/Tokyo'&&option.region==='亚洲')).toBe(true);expect(timezoneOptions.some(option=>option.value==='America/New_York'&&option.region==='北美洲')).toBe(true);expect(timezoneOptions.some(option=>option.value==='America/Sao_Paulo'&&option.region==='南美洲')).toBe(true);});
  it('searches by Chinese, English city and IANA value',()=>{expect(findTimezoneOptions('东京')[0]?.value).toBe('Asia/Tokyo');expect(findTimezoneOptions('Tokyo')[0]?.value).toBe('Asia/Tokyo');expect(findTimezoneOptions('Europe/Paris')[0]?.value).toBe('Europe/Paris');expect(timezoneLabel('Asia/Shanghai')).toContain('上海');});
});
