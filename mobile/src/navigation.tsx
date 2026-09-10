/* Every route in the product is registered, whether or not its screen has been
   drawn yet, so nothing is ever stranded. A route with no component falls to
   ToBuild, which names the frame it should be built from.

   There is no tab bar and no menu: you get around the app the way the design
   intends, by tapping through it and using the dock. */
import React from 'react';
import { View } from 'react-native';
import { NavigationContainer, LinkingOptions } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Route, routeList } from './routes';
import { ToastHost, motion } from './design';
import { ToBuild } from './screens/ToBuild';
import { Start } from './screens/Start';
import { Actions } from './screens/Actions';
import {
  Number,
  Code,
  Nin,
  Who,
  Face,
  Passcode,
  Ready,
  Signin,
  Signcode,
  NewCode,
  NoMatch,
} from './screens/way-in';
import { Ask, Chat, Confirm, DoneSend, Share } from './screens/send';
import {
  Checking,
  IWillNot,
  Misheard,
  AlreadyGone,
  Short,
  Pending,
  Failed,
  Reversed,
  Wrong,
  Recall,
  DisputeOpen,
  DisputeEnd,
  NoNetwork,
  Amend,
} from './screens/act-one';
import { Rule, Rules, Settings, Lock, Limits, LimitStop, Devices, LostPhone } from './screens/act-two';
import { Home, AgentChat } from './screens/home';
import { Scan, Typed, Pay, PayFrom, PayDollars, DraftNote } from './screens/money';
import { AskSvc, TypedBuy, Buy, ConfirmBuy, Done, ShareBuy } from './screens/buy';
import { AskReq, TypedAsk, Request, Sent } from './screens/request';
import { ScanBill, MeterRead, ConfirmMeter, Power, SharePower, Bills, PowerPay } from './screens/bills';
import { Receive, Ways, MyCode } from './screens/receive';
import { Services, Airtime, Loan, CardScreen, History, Answer } from './screens/services';
import {
  DoneIn,
  ShareIn,
  DoneFlat,
  ShareFlat,
  DoneShop,
  ShareShop,
  DoneSub,
  ShareSub,
  DoneCard,
  ShareCard,
} from './screens/receipts';
import { Health, Goal, SaveRule, Paused, Dollars, Convert, Converted } from './screens/plan';
import {
  Finish,
  IdCard,
  Income,
  Full,
  FirstHome,
  FirstAsk,
  EmptyActivity,
  EmptyGoal,
} from './screens/act-four';

export type Stack = { [K in Route]: undefined };

/* What the stack hands a screen, before it is turned into { go, back }. */
type Nav = { navigate: (r: Route) => void; goBack: () => void };
const Screens = createNativeStackNavigator<Stack>();

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

  home: ({ nav }) => <Home nav={as(nav)} />,
  agentchat: ({ nav }) => <AgentChat nav={as(nav)} />,

  /* Act Three — sending */
  scan: ({ nav }) => <Scan nav={as(nav)} />,
  typed: ({ nav }) => <Typed nav={as(nav)} />,
  pay: ({ nav }) => <Pay nav={as(nav)} />,
  payfrom: ({ nav }) => <PayFrom nav={as(nav)} />,
  paydollars: ({ nav }) => <PayDollars nav={as(nav)} />,
  draft: ({ nav }) => <DraftNote nav={as(nav)} />,

  /* buying */
  asksvc: ({ nav }) => <AskSvc nav={as(nav)} />,
  typedbuy: ({ nav }) => <TypedBuy nav={as(nav)} />,
  buy: ({ nav }) => <Buy nav={as(nav)} />,
  confirmbuy: ({ nav }) => <ConfirmBuy nav={as(nav)} />,
  done: ({ nav }) => <Done nav={as(nav)} />,
  sharebuy: ({ nav }) => <ShareBuy nav={as(nav)} />,

  /* asking to be paid */
  askreq: ({ nav }) => <AskReq nav={as(nav)} />,
  typedask: ({ nav }) => <TypedAsk nav={as(nav)} />,
  request: ({ nav }) => <Request nav={as(nav)} />,
  sent: ({ nav }) => <Sent nav={as(nav)} />,

  /* bills */
  scanbill: ({ nav }) => <ScanBill nav={as(nav)} />,
  meter: ({ nav }) => <MeterRead nav={as(nav)} />,
  confirmmeter: ({ nav }) => <ConfirmMeter nav={as(nav)} />,
  power: ({ nav }) => <Power nav={as(nav)} />,
  sharepower: ({ nav }) => <SharePower nav={as(nav)} />,
  bills: ({ nav }) => <Bills nav={as(nav)} />,
  powerpay: ({ nav }) => <PowerPay nav={as(nav)} />,

  /* being paid */
  receive: ({ nav }) => <Receive nav={as(nav)} />,
  ways: ({ nav }) => <Ways nav={as(nav)} />,
  mycode: ({ nav }) => <MyCode nav={as(nav)} />,

  /* services */
  services: ({ nav }) => <Services nav={as(nav)} />,
  airtime: ({ nav }) => <Airtime nav={as(nav)} />,
  loan: ({ nav }) => <Loan nav={as(nav)} />,
  card: ({ nav }) => <CardScreen nav={as(nav)} />,
  history: ({ nav }) => <History nav={as(nav)} />,
  answer: ({ nav }) => <Answer nav={as(nav)} />,

  /* receipts */
  donein: ({ nav }) => <DoneIn nav={as(nav)} />,
  sharein: ({ nav }) => <ShareIn nav={as(nav)} />,
  doneflat: ({ nav }) => <DoneFlat nav={as(nav)} />,
  shareflat: ({ nav }) => <ShareFlat nav={as(nav)} />,
  doneshop: ({ nav }) => <DoneShop nav={as(nav)} />,
  shareshop: ({ nav }) => <ShareShop nav={as(nav)} />,
  donesub: ({ nav }) => <DoneSub nav={as(nav)} />,
  sharesub: ({ nav }) => <ShareSub nav={as(nav)} />,
  donecard: ({ nav }) => <DoneCard nav={as(nav)} />,
  sharecard: ({ nav }) => <ShareCard nav={as(nav)} />,

  /* habits, saving, dollars */
  health: ({ nav }) => <Health nav={as(nav)} />,
  goal: ({ nav }) => <Goal nav={as(nav)} />,
  saverule: ({ nav }) => <SaveRule nav={as(nav)} />,
  paused: ({ nav }) => <Paused nav={as(nav)} />,
  dollars: ({ nav }) => <Dollars nav={as(nav)} />,
  convert: ({ nav }) => <Convert nav={as(nav)} />,
  converted: ({ nav }) => <Converted nav={as(nav)} />,

  /* Act Four */
  finish: ({ nav }) => <Finish nav={as(nav)} />,
  idcard: ({ nav }) => <IdCard nav={as(nav)} />,
  income: ({ nav }) => <Income nav={as(nav)} />,
  full: ({ nav }) => <Full nav={as(nav)} />,
  firsthome: ({ nav }) => <FirstHome nav={as(nav)} />,
  firstask: ({ nav }) => <FirstAsk nav={as(nav)} />,
  emptyactivity: ({ nav }) => <EmptyActivity nav={as(nav)} />,
  emptygoal: ({ nav }) => <EmptyGoal nav={as(nav)} />,
};

/* the screens take { go, back }; the stack hands over { navigate, goBack } */
const as = (n: Nav) => ({ go: n.navigate, back: n.goBack });

/* Every route has a path of its own, so a screen can be opened directly while
   working on it and a link into the app lands where it says it will. */
const linking: LinkingOptions<Stack> = {
  prefixes: ['beetle://', 'https://beetle.app'],
  config: { screens: Object.fromEntries(routeList.map(r => [r, r])) as never },
};

/* How each screen arrives.

   Something that came up over what you were looking at comes up from the
   bottom, because that is where a sheet lives and where a keyboard and a
   camera come from. Everything else slides in from the right, the way a stack
   of pages does. The button's menu fades, because it does its own animation
   and the fade is only there to hand over to it.

   The point is that the movement matches the tap: the same gesture that asked
   for the screen is the one that brings it in. */
const UP: Route[] = [
  /* the sheets */
  'ask',
  'asksvc',
  'askreq',
  'receive',
  'confirm',
  'noface',
  'confirmbuy',
  'confirmmeter',
  'share',
  'sharebuy',
  'sharepower',
  'sharein',
  'shareflat',
  'shareshop',
  'sharesub',
  'sharecard',
  'saverule',
  /* the keyboard comes up with them */
  'typed',
  'typedbuy',
  'typedask',
  /* and so does a camera */
  'scan',
  'scanbill',
];

const arrival = (id: Route): 'slide_from_bottom' | 'fade' | 'slide_from_right' =>
  id === 'actions' ? 'fade' : UP.includes(id) ? 'slide_from_bottom' : 'slide_from_right';

export function App() {
  return (
    <View style={{ flex: 1 }}>
      <NavigationContainer linking={linking}>
        <Screens.Navigator
          initialRouteName="start"
          screenOptions={{ headerShown: false, animation: 'slide_from_right' }}
        >
          {routeList.map(id => (
            <Screens.Screen
              key={id}
              name={id}
              options={{ animation: arrival(id), animationDuration: motion.screen }}
            >
              {({ navigation }) => {
                const nav: Nav = {
                  navigate: r => navigation.navigate(r as never),
                  goBack: () =>
                    navigation.canGoBack() ? navigation.goBack() : navigation.navigate('home' as never),
                };
                const Built = BUILT[id];
                return Built ? <Built nav={nav} /> : <ToBuild route={id} onBack={nav.goBack} />;
              }}
            </Screens.Screen>
          ))}
        </Screens.Navigator>
      </NavigationContainer>
      <ToastHost />
    </View>
  );
}
