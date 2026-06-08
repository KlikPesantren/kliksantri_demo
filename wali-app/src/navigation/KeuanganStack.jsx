import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors } from '../constants/colors';

import { KeuanganHubScreen } from '../screens/keuangan/KeuanganHubScreen';
import { RFIDScreen } from '../screens/rfid/RFIDScreen';
import { SahriyahScreen } from '../screens/sahriyah/SahriyahScreen';
import { DetailTagihanScreen } from '../screens/sahriyah/DetailTagihanScreen';

const Stack = createNativeStackNavigator();

const headerDefaults = {
  headerStyle: { backgroundColor: colors.primary },
  headerTintColor: colors.white,
  headerTitleStyle: { fontWeight: '700' },
};

export function KeuanganStack() {
  return (
    <Stack.Navigator screenOptions={headerDefaults}>
      <Stack.Screen
        name="KeuanganHub"
        component={KeuanganHubScreen}
        options={{ title: 'Keuangan' }}
      />
      <Stack.Screen
        name="RFID"
        component={RFIDScreen}
        options={{ title: 'Saldo & Mutasi RFID' }}
      />
      <Stack.Screen
        name="Sahriyah"
        component={SahriyahScreen}
        options={{ title: 'Sahriyah' }}
      />
      <Stack.Screen
        name="DetailTagihan"
        component={DetailTagihanScreen}
        options={({ route }) => ({
          title: route.params?.title
            ? `Sahriyah ${route.params.title}`
            : 'Detail Tagihan',
        })}
      />
    </Stack.Navigator>
  );
}
