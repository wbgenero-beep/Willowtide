import { NavProvider, useNav } from './state/Nav';
import { PhoneFrame } from './components/PhoneFrame';
import { TopBar } from './components/TopBar';
import { BottomNav } from './components/BottomNav';
import { Home } from './screens/Home';
import { Shores } from './screens/Shores';
import { Album } from './screens/Album';
import { Ranks } from './screens/Ranks';
import { Play } from './screens/Play';
import { BoosterSelect } from './screens/BoosterSelect';
import { Level } from './screens/Level';
import { FreePlayGame } from './screens/FreePlayGame';
import { Shop } from './screens/Shop';
import { Daily } from './screens/Daily';
import { TidePass } from './screens/TidePass';
import { Friends } from './screens/Friends';
import { PearlJar } from './screens/PearlJar';

const MAIN = new Set(['home', 'shores', 'album', 'ranks', 'play']);

function Router() {
  const { route } = useNav();
  const isMain = MAIN.has(route.name);

  let screen = null;
  switch (route.name) {
    case 'home':
      screen = <Home />;
      break;
    case 'shores':
      screen = <Shores />;
      break;
    case 'album':
      screen = <Album />;
      break;
    case 'ranks':
      screen = <Ranks />;
      break;
    case 'play':
      screen = <Play />;
      break;
    case 'boosterSelect':
      screen = <BoosterSelect levelId={route.levelId} />;
      break;
    case 'level':
      screen = <Level levelId={route.levelId} headStarts={route.headStarts} />;
      break;
    case 'freeplay':
      screen = <FreePlayGame mode={route.mode} />;
      break;
    case 'shop':
      screen = <Shop />;
      break;
    case 'daily':
      screen = <Daily />;
      break;
    case 'tidepass':
      screen = <TidePass />;
      break;
    case 'friends':
      screen = <Friends />;
      break;
    case 'pearljar':
      screen = <PearlJar />;
      break;
  }

  return (
    <PhoneFrame>
      {isMain && <TopBar />}
      <div className="scroll-area relative flex-1 overflow-y-auto">{screen}</div>
      {isMain && <BottomNav />}
    </PhoneFrame>
  );
}

export default function App() {
  return (
    <NavProvider>
      <Router />
    </NavProvider>
  );
}
