import { getTodayItineraryState, getTodayTripDay, getTripStatus, getZonedClock } from './travelMode';
import type { ItineraryItem, Trip } from '../types/trip';
const trip={startDate:'2026-09-10',endDate:'2026-09-12',timezone:'Asia/Tokyo',days:[{id:'d1',tripId:'t',dayNumber:1,date:'2026-09-10'},{id:'d2',tripId:'t',dayNumber:2,date:'2026-09-11'}]} as Trip;
const now=(iso:string)=>new Date(iso);
const item=(id:string,time:string|null,status:ItineraryItem['status']='planned',durationMinutes=60):ItineraryItem=>({id,tripId:'t',tripDayId:'d1',time,placeName:id,address:'',durationMinutes,notes:'',status,createdAt:id,updatedAt:id});
describe('travel mode',()=>{
 it('classifies upcoming, active and completed in the trip timezone',()=>{expect(getTripStatus(trip,now('2026-09-09T14:59:00Z'))).toBe('upcoming');expect(getTripStatus(trip,now('2026-09-09T15:00:00Z'))).toBe('active');expect(getTripStatus(trip,now('2026-09-12T15:00:00Z'))).toBe('completed');});
 it('matches Today without UTC date drift',()=>{expect(getZonedClock(now('2026-09-10T15:30:00Z'),'Asia/Tokyo').date).toBe('2026-09-11');expect(getTodayTripDay(trip,now('2026-09-10T15:30:00Z'))?.id).toBe('d2');});
 it('selects current and next while separating past and untimed items',()=>{const state=getTodayItineraryState([item('past','08:00'),item('current','10:00','planned',90),item('next','12:00'),item('free',null),item('done','15:00','completed')],10*60+30);expect(state.current?.id).toBe('current');expect(state.next?.id).toBe('next');expect(state.past.map(x=>x.id)).toEqual(expect.arrayContaining(['past','done']));expect(state.untimed.map(x=>x.id)).toEqual(['free']);});
 it('keeps skipped items out of current and next candidates',()=>{const state=getTodayItineraryState([item('skip','10:00','skipped'),item('next','11:00')],10*60+10);expect(state.current).toBeUndefined();expect(state.next?.id).toBe('next');});
});
