/* Every route in the product is registered, whether or not its screen has been
   drawn yet, so nothing is ever stranded. A route with no component falls to
   ToBuild, which names the frame it should be built from.

   There is no tab bar and no menu: you get around the app the way the design
   intends, by tapping through it and using the dock. */
import React from 'react';
import { NavigationContainer, LinkingOptions } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Route, routeList } from './routes';
import { ToBuild } from './screens/ToBuild';
import { Start } from './screens/Start';
import { Actions } from './screens/Actions';
import { Number, Code, Nin, Who, Face, Passcode, Ready, Signin, Signcode, NewCode, NoMatch } from './screens/way-in';
import { Ask, Chat, Confirm, DoneSend, Share } from './screens/send';
import {
  Checking, IWillNot, Misheard, AlreadyGone, Short, Pending, Failed, Reversed,
  Wrong, Recall, DisputeOpen, DisputeEnd, NoNetwork, Amend,
} from './screens/act-one';
import {
  Rule, Rules, Settings, Lock, Limits, LimitStop, Devices, LostPhone,
} from './screens/act-two';

export type Stack = { [K in Route]: undefined };
const Nav = createNativeStackNavigator<Stack>();

/* Screens that have been built. Everything else falls to ToBuild. */
const BUILT: Partial<Record<Route, React.ComponentType<{ nav: Nav }>>> = {
  start: ({ nav }) => <Start go={r => nav.navigate(r)} />,
  actions: ({ nav }) => <Actions go={r => nav.navigate(r)} close={() => nav.goBack()} />,
  number: ({ nav }) => <Number nav={as(nav)} />,
  code: ({ nav }) => <Code nav={as(nav)} />,
  nin: ({ nav }) => <Nin nav={as(nav)} />,
  who: ({ nav }) => <Who nav={as(nav)} />,
  face: ({ nav }) => <Face nav={as(nav)} />,
  passcode: ({ nav }) => <Passcode nav={as(nav)} />,
  ready: ({ nav }) => <Ready nav={as(nav)} />,
  signin: ({ nav }) => <Signin nav={as(nav)} />,
  signcode: ({ nav }) => <Signcode nav={as(nav)} />,

  ask: ({ nav }) => <Ask nav={as(nav)} />,
  chat: ({ nav }) => <Chat nav={as(nav)} />,
  confirm: ({ nav }) => <Confirm nav={as(nav)} />,
  noface: ({ nav }) => <Confirm nav={as(nav)} faceMissed />,
  donesend: ({ nav }) => <DoneSend nav={as(nav)} />,
  share: ({ nav }) => <Share nav={as(nav)} />,

  checking: ({ nav }) => <Checking nav={as(nav)} />,
  iwillnot: ({ nav }) => <IWillNot nav={as(nav)} />,
  misheard: ({ nav }) => <Misheard nav={as(nav)} />,
  alreadygone: ({ nav }) => <AlreadyGone nav={as(nav)} />,
  short: ({ nav }) => <Short nav={as(nav)} />,
  pending: ({ nav }) => <Pending nav={as(nav)} />,
  failed: ({ nav }) => <Failed nav={as(nav)} />,
  reversed: ({ nav }) => <Reversed nav={as(nav)} />,
  wrong: ({ nav }) => <Wrong nav={as(nav)} />,
  recall: ({ nav }) => <Recall nav={as(nav)} />,
  amend: ({ nav }) => <Amend nav={as(nav)} />,
  disputeopen: ({ nav }) => <DisputeOpen nav={as(nav)} />,
  disputeend: ({ nav }) => <DisputeEnd nav={as(nav)} />,
  nonetwork: ({ nav }) => <NoNetwork nav={as(nav)} />,

  rule: ({ nav }) => <Rule nav={as(nav)} />,
  rules: ({ nav }) => <Rules nav={as(nav)} />,
  settings: ({ nav }) => <Settings nav={as(nav)} />,
  lock: ({ nav }) => <Lock nav={as(nav)} />,
  limits: ({ nav }) => <Limits nav={as(nav)} />,
  limitstop: ({ nav }) => <LimitStop nav={as(nav)} />,
  devices: ({ nav }) => <Devices nav={as(nav)} />,
  lostphone: ({ nav }) => <LostPhone nav={as(nav)} />,
  newcode: ({ nav }) => <NewCode nav={as(nav)} />,
  nomatch: ({ nav }) => <NoMatch nav={as(nav)} />,
};

/* the screens take { go, back }; the stack hands over { navigate, goBack } */
const as = (n: Nav) => ({ go: n.navigate, back: n.goBack });

type Nav = { navigate: (r: Route) => void; goBack: () => void };

/* Every route has a path of its own, so a screen can be opened directly while
   working on it and a link into the app lands where it says it will. */
const linking: LinkingOptions<Stack> = {
  prefixes: ['beetle://', 'https://beetle.app'],
  config: { screens: Object.fromEntries(routeList.map(r => [r, r])) as never },
};

export function App() {
  return (
    <NavigationContainer linking={linking}>
      <Nav.Navigator initialRouteName="start" screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        {routeList.map(id => (
          <Nav.Screen key={id} name={id}>
            {({ navigation }) => {
              const nav: Nav = {
                navigate: r => navigation.navigate(r as never),
                goBack: () => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('home' as never)),
              };
              const Built = BUILT[id];
              return Built ? <Built nav={nav} /> : <ToBuild route={id} onBack={nav.goBack} />;
            }}
          </Nav.Screen>
        ))}
      </Nav.Navigator>
    </NavigationContainer>
  );
}
