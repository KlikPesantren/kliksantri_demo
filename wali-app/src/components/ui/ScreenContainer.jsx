import React from 'react';
import { SafeAreaView, StyleSheet, View } from 'react-native';
import { colors } from '../../constants/colors';

/**
 * Standard screen wrapper — surfaceSoft background, full flex.
 */
export function ScreenContainer({ children, style, edges = true, ...rest }) {
  const Wrapper = edges ? SafeAreaView : View;

  return (
    <Wrapper style={[styles.container, style]} {...rest}>
      {children}
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surfaceSoft,
  },
});
