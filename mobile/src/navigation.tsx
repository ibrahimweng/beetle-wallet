/* Every route in the product is registered, whether or not its screen has been
   drawn yet, so nothing is ever stranded. A route with no component falls to
   ToBuild, which names the frame it should be built from.

   There is no tab bar and no menu: you get around the app the way the design
   intends, by tapping through it and using the dock. */
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Route, routeList } from './routes';
import { ToBuild } from './screens/ToBuild';
import { Start } from './screens/Start';
import { Actions } from './screens/Actions';

export type Stack = { [K in Route]: undefined };
const Nav = createNativeStackNavigator<Stack>();

/* Screens that have been built. Everything else falls to ToBuild. */
const BUILT: Partial<Record<Route, React.ComponentType<{ nav: Nav }>>> = {
  start: ({ nav }) => <Start go={r => nav.navigate(r)} />,
  actions: ({ nav }) => <Actions go={r => nav.navigate(r)} close={() => nav.goBack()} />,
};

type Nav = { navigate: (r: Route) => void; goBack: () => void };

export function App() {
  return (
    <NavigationContainer>
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
