import type { ReactNode } from 'react';
import { Image, View, type StyleProp, type ViewStyle } from 'react-native';

import { authCurvedSheetStyles as styles } from './authCurvedSheetStyles';
import {
  CARD_ASSET_IMG_H,
  CARD_ASSET_IMG_W,
  CARD_ASSET_WHITE_W,
  CARD_ASSET_WHITE_X,
  CARD_ASSET_WHITE_Y,
} from './cardCurveSheetMetrics';
import { useAuthSignupLayout } from '@/screens/auth/useAuthSignupLayout';

const cardCurveSheet = require('@/assets/images/card-curve-sheet.png');

type AuthSheetLayout = ReturnType<typeof useAuthSignupLayout>;

function resolveSheetContentPad(
  isForgotStyleCard: boolean,
  isOtp: boolean,
  layout: AuthSheetLayout,
): number {
  if (isForgotStyleCard) return Math.round(12 * layout.scale);
  if (isOtp) return layout.otpSheetContentPadH;
  return layout.sheetContentPadH;
}

function resolveSheetBodyMinHeight(
  isOtp: boolean,
  isForgotStyleCard: boolean,
  layout: AuthSheetLayout,
): number | undefined {
  if (isOtp) return layout.otpBodyMinHeight;
  if (isForgotStyleCard) return layout.forgotBodyMinHeight;
  return undefined;
}

export interface AuthCurvedSheetProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  bodyStyle?: StyleProp<ViewStyle>;
  /** Signup/login card (334px) vs OTP/forgot/reset card (358×551 Figma frame). */
  variant?: 'signup' | 'otp' | 'forgotPassword' | 'resetPassword';
}

/**
 * Signup sheet: Figma curve cap (fixed aspect, never stretched) + white body that
 * grows with the form. Uses `card-curve-sheet.png` only for the top silhouette.
 */
export function AuthCurvedSheet({
  children,
  style,
  bodyStyle,
  variant = 'signup',
}: Readonly<AuthCurvedSheetProps>) {
  const layout = useAuthSignupLayout();
  const isOtp = variant === 'otp';
  const isForgotPassword = variant === 'forgotPassword';
  const isResetPassword = variant === 'resetPassword';
  const isForgotStyleCard = isForgotPassword || isResetPassword;
  const isWideCard = isOtp || isForgotStyleCard;

  const sheetWidth = isWideCard ? layout.otpSheetWidth : layout.sheetWidth;
  const sheetOverlap = isWideCard ? layout.otpSheetOverlap : layout.sheetOverlap;
  const sheetCapHeight = isWideCard ? layout.otpSheetCapHeight : layout.sheetCapHeight;
  const sheetContentPadH = resolveSheetContentPad(isForgotStyleCard, isOtp, layout);
  const sheetBottomRadius = layout.sheetBottomRadius;
  const bodyMinHeight = resolveSheetBodyMinHeight(isOtp, isForgotStyleCard, layout);

  const assetScale = sheetWidth / CARD_ASSET_WHITE_W;
  const imageWidth = CARD_ASSET_IMG_W * assetScale;
  const imageHeight = CARD_ASSET_IMG_H * assetScale;
  const imageOffsetX = -CARD_ASSET_WHITE_X * assetScale;
  const imageOffsetY = -CARD_ASSET_WHITE_Y * assetScale;

  return (
    <View
      style={[
        styles.container,
        isOtp && styles.containerFill,
        {
          width: sheetWidth,
          marginTop:
            -sheetOverlap +
            layout.authCardOffset +
            (isForgotStyleCard ? layout.forgotCardOffset : 0),
        },
        style,
      ]}
    >
      <View style={[styles.capClip, { height: sheetCapHeight }]}>
        <Image
          source={cardCurveSheet}
          style={[
            styles.capImage,
            {
              width: imageWidth,
              height: imageHeight,
              left: imageOffsetX,
              top: imageOffsetY,
            },
          ]}
          resizeMode="cover"
          accessibilityElementsHidden
        />
      </View>

      <View
        style={[
          styles.body,
          isOtp && styles.bodyOtp,
          isForgotStyleCard && styles.bodyForgotPassword,
          {
            marginTop: -1,
            paddingHorizontal: sheetContentPadH,
            borderBottomLeftRadius: sheetBottomRadius,
            borderBottomRightRadius: sheetBottomRadius,
            minHeight: bodyMinHeight,
            flexGrow: isOtp ? 1 : undefined,
          },
          bodyStyle,
        ]}
      >
        {children}
      </View>
    </View>
  );
}
