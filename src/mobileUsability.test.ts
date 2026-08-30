import styles from './styles/index.css?raw';
import bottomNavigation from './components/navigation/BottomNavigation.tsx?raw';
import itineraryPage from './pages/ItineraryPage.tsx?raw';
import indexHtml from '../index.html?raw';

describe('mobile usability safeguards',()=>{
 it('keeps iOS form controls at 16px without disabling viewport zoom',()=>{expect(styles).toMatch(/max-width:\s*767px[\s\S]*font-size:\s*16px\s*!important/);expect(indexHtml).not.toContain('user-scalable=no');expect(indexHtml).not.toContain('maximum-scale');});
 it('keeps the five explicit mobile destinations and avoids uncertain history back',()=>{expect(bottomNavigation).toContain('bottomNavigationItems.map');expect(bottomNavigation).not.toContain('navigationItems.slice');expect(bottomNavigation).not.toContain('/today');expect(itineraryPage).not.toMatch(/navigate\(-1\)|history\.back/);});
});
