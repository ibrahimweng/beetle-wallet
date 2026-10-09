/* A QR code, drawn as one path: dark squares on white with a quiet edge of
   four squares, as the standard asks, so any camera reads it. Round 33: a
   stablecoin address, which nobody types by hand. */
import React, { useMemo } from 'react';
import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import qrcode from 'qrcode-generator';

export function Qr({ value, size = 200, testID }: { value: string; size?: number; testID?: string }) {
  const { d, n } = useMemo(() => {
    const qr = qrcode(0, 'M');
    qr.addData(value);
    qr.make();
    const count = qr.getModuleCount();
    let path = '';
    for (let r = 0; r < count; r++) for (let c = 0; c < count; c++) if (qr.isDark(r, c)) path += `M${c + 4} ${r + 4}h1v1h-1z`;
    return { d: path, n: count + 8 };
  }, [value]);
  return (
    <View style={{ width: size, height: size, backgroundColor: '#ffffff', borderRadius: 12, overflow: 'hidden' }} testID={testID} accessibilityRole="image" accessibilityLabel={`QR code of ${value}`}>
      <Svg width={size} height={size} viewBox={`0 0 ${n} ${n}`}>
        <Path d={d} fill="#000000" />
      </Svg>
    </View>
  );
}
