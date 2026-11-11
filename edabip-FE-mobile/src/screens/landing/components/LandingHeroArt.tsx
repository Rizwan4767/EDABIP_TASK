import { Image, View } from 'react-native';

import {
  HeroCharacterImage,
  HeroDeskImage,
  HeroDeviceImage,
  HeroShadowImage,
} from '@/assets/landing';
import { landingHeroArtStyles as styles } from '@/screens/landing/components/landingHeroArtStyles';

/** Designed Figma frame is 245×245. Leaf boxes come from the exported layer insets. */
const FRAME = 245;

const LAYERS = [
  {
    id: 'shadow',
    source: HeroShadowImage,
    left: 0.1026,
    top: 0.8021,
    width: 0.7755,
    height: 0.0453,
  },
  {
    id: 'device',
    source: HeroDeviceImage,
    left: 0.3413,
    top: 0.3118,
    width: 0.3341,
    height: 0.2552,
  },
  {
    id: 'desk',
    source: HeroDeskImage,
    left: 0.2538,
    top: 0.5674,
    width: 0.5017,
    height: 0.2432,
  },
  {
    id: 'character',
    source: HeroCharacterImage,
    left: 0.3375,
    top: 0.3,
    width: 0.2292,
    height: 0.5328,
  },
] as const;

export function LandingHeroArt({ size }: Readonly<{ size: number }>) {
  const scale = size / FRAME;

  return (
    <View style={[styles.frame, { width: size, height: size }]} pointerEvents="none">
      {LAYERS.map((layer) => (
        <Image
          key={layer.id}
          source={layer.source}
          resizeMode="contain"
          style={{
            position: 'absolute',
            left: layer.left * FRAME * scale,
            top: layer.top * FRAME * scale,
            width: layer.width * FRAME * scale,
            height: layer.height * FRAME * scale,
          }}
        />
      ))}
    </View>
  );
}
