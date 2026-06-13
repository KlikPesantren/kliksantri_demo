import React from 'react';

import {

  View,

  ScrollView,

  RefreshControl,

  Image,

  Linking,

  StyleSheet,

} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import { useProfilPesantren } from '../../hooks/useProfilPesantren';

import { LoadingSpinner } from '../../components/common/LoadingSpinner';

import { ErrorView } from '../../components/common/ErrorView';

import { PesantrenHeroBanner } from '../../components/home/PesantrenHeroBanner';

import { resolveMediaUrl } from '../../utils/mediaUrl';

import { formatShortAddress } from '../../utils/formatAddress';

import { shouldShowPesantrenBanner } from '../../utils/pesantrenBanner';

import {

  ScreenContainer,

  AppCard,

  AppText,

  SectionHeading,

  EmptyState,

  MenuRow,

} from '../../components/ui';

import { colors } from '../../constants/colors';

import { radius, shadows, spacing } from '../../constants/theme';



const LOGO_SIZE = 80;



function PesantrenLogo({ logoUrl, nama }) {

  const uri = resolveMediaUrl(logoUrl);

  const initials = (nama ?? 'PP')

    .split(' ')

    .filter((w) => /^[A-Za-z]/.test(w))

    .slice(0, 2)

    .map((w) => w.charAt(0).toUpperCase())

    .join('');



  if (uri) {

    return (

      <Image source={{ uri }} style={styles.logo} resizeMode="contain" />

    );

  }



  return (

    <View style={styles.logoFallback}>

      <AppText variant="h2" color="brand">

        {initials}

      </AppText>

    </View>

  );

}



function TextSection({ body }) {

  if (!body) return null;

  return (

    <AppText variant="body" style={styles.bodyText}>

      {body}

    </AppText>

  );

}



function InstitutionHero({ profil }) {

  if (shouldShowPesantrenBanner(profil)) {

    return (

      <PesantrenHeroBanner

        bannerUrl={profil.banner_url}

        nama={profil.nama_pesantren}

        alamat={profil.alamat}

      />

    );

  }



  return (

    <View style={styles.heroBanner}>

      <View style={styles.heroGradient} />

      <View style={styles.heroContent}>

        <PesantrenLogo logoUrl={profil.logo_url} nama={profil.nama_pesantren} />

        <AppText variant="h1" color="inverse" style={styles.center} numberOfLines={2}>

          {profil.nama_pesantren}

        </AppText>

        {profil.alamat ? (

          <AppText variant="caption" color="inverse" style={styles.centerHero} numberOfLines={2}>

            {formatShortAddress(profil.alamat) ?? profil.alamat}

          </AppText>

        ) : null}

      </View>

    </View>

  );

}



export function ProfilPesantrenScreen() {

  const { data, isLoading, isRefreshing, error, refresh } = useProfilPesantren();



  if (isLoading && !data) {

    return (

      <ScreenContainer>

        <LoadingSpinner message="Memuat profil pesantren..." />

      </ScreenContainer>

    );

  }



  if (error && !data) {

    return (

      <ScreenContainer>

        <ErrorView message={error} onRetry={refresh} />

      </ScreenContainer>

    );

  }



  const p = data;



  return (

    <ScreenContainer>

      <ScrollView

        showsVerticalScrollIndicator={false}

        contentContainerStyle={styles.scroll}

        refreshControl={

          <RefreshControl

            refreshing={isRefreshing}

            onRefresh={refresh}

            colors={[colors.primary]}

            tintColor={colors.primary}

          />

        }

      >

        {!p ? (

          <EmptyState

            icon="business-outline"

            title="Profil Belum Tersedia"

            description="Admin pesantren belum mengisi data profil pesantren."

          />

        ) : (

          <>

            <InstitutionHero profil={p} />



            {p.visi ? (

              <>

                <SectionHeading title="Visi" />

                <AppCard padding="md" style={styles.sectionCard}>

                  <TextSection body={p.visi} />

                </AppCard>

              </>

            ) : null}



            {p.misi ? (

              <>

                <SectionHeading title="Misi" />

                <AppCard padding="md" style={styles.sectionCard}>

                  <TextSection body={p.misi} />

                </AppCard>

              </>

            ) : null}



            {(p.telepon || p.email) ? (

              <>

                <SectionHeading title="Kontak" />

                <AppCard padding="none" style={styles.sectionCard}>

                  {p.telepon ? (

                    <MenuRow

                      icon="call-outline"

                      title="Telepon"

                      subtitle={p.telepon}

                      onPress={() => Linking.openURL(`tel:${p.telepon.replace(/\D/g, '')}`)}

                    />

                  ) : null}

                  {p.email ? (

                    <MenuRow

                      icon="mail-outline"

                      title="Email"

                      subtitle={p.email}

                      onPress={() => Linking.openURL(`mailto:${p.email}`)}

                    />

                  ) : null}

                </AppCard>

              </>

            ) : null}



            {p.alamat ? (

              <>

                <SectionHeading title="Alamat" />

                <AppCard padding="md" style={styles.sectionCard}>

                  <View style={styles.inlineRow}>

                    <Ionicons name="location-outline" size={20} color={colors.primary} />

                    <AppText variant="body" style={styles.bodyText}>

                      {p.alamat}

                    </AppText>

                  </View>

                </AppCard>

              </>

            ) : null}



            {p.website ? (

              <>

                <SectionHeading title="Website" />

                <AppCard padding="none" style={styles.sectionCard}>

                  <MenuRow

                    icon="globe-outline"

                    title="Website Resmi"

                    subtitle={p.website}

                    onPress={() => Linking.openURL(p.website)}

                  />

                </AppCard>

              </>

            ) : null}



            {p.updated_at ? (

              <AppText variant="caption" color="muted" style={styles.updatedAt}>

                Terakhir diperbarui:{' '}

                {new Date(p.updated_at).toLocaleDateString('id-ID', {

                  day: '2-digit',

                  month: 'long',

                  year: 'numeric',

                })}

              </AppText>

            ) : null}

          </>

        )}

      </ScrollView>

    </ScreenContainer>

  );

}



const styles = StyleSheet.create({

  scroll: {

    paddingBottom: spacing['3xl'],

  },

  heroBanner: {

    marginHorizontal: spacing.lg,

    marginTop: spacing.lg,

    marginBottom: spacing.sm,

    borderRadius: radius.lg,

    overflow: 'hidden',

    ...shadows.md,

  },

  heroGradient: {

    ...StyleSheet.absoluteFillObject,

    backgroundColor: colors.primary,

  },

  heroContent: {

    alignItems: 'center',

    padding: spacing['2xl'],

    gap: spacing.md,

  },

  logo: {

    width: LOGO_SIZE,

    height: LOGO_SIZE,

    borderRadius: radius.lg,

    backgroundColor: colors.surface,

  },

  logoFallback: {

    width: LOGO_SIZE,

    height: LOGO_SIZE,

    borderRadius: radius.lg,

    backgroundColor: colors.surface,

    alignItems: 'center',

    justifyContent: 'center',

  },

  center: {

    textAlign: 'center',

  },

  centerHero: {

    textAlign: 'center',

    opacity: 0.9,

  },

  sectionCard: {

    marginHorizontal: spacing.lg,

    marginBottom: spacing.sm,

  },

  bodyText: {

    lineHeight: 22,

  },

  inlineRow: {

    flexDirection: 'row',

    alignItems: 'flex-start',

    gap: spacing.md,

  },

  updatedAt: {

    textAlign: 'center',

    marginTop: spacing.lg,

    marginHorizontal: spacing.lg,

  },

});


